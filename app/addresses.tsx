import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BackButton } from "@/components/ui/BackButton";
import React, { useState, useRef, useEffect } from "react";
import { setGlobalLocationListener, clearGlobalLocationListener } from "@/utils/locationEvents";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
  Platform,
  Share,
  KeyboardAvoidingView,
} from "react-native";
import Toast from 'react-native-toast-message';
import { SafeAreaView } from "react-native-safe-area-context";
import { ExpoMap, ExpoMarker } from "@/components/maps/ExpoMap";
import { safeNavigate } from "@/utils/safeNavigation";
import { addressApi } from "@/api/addressApi";
import { Shadow, roleAccent, Radius } from "@/constants/theme";
import { useAppTheme } from "@/providers/ThemeContext";

const ACCENT = roleAccent.customer;
const SHOP_TEAL = '#006878';

/**
 * PRODUCTION DEBUG HELPER: Validate coordinates before use
 */
const isValidCoordinate = (lat: number, lng: number): boolean => {
  const valid = (
    lat !== undefined &&
    lat !== null &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
  console.log('📍 [COORD VALIDATION]:', { lat, lng, valid });
  return valid;
};

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type Address = {
  id: string | number;
  label: string;
  recipient_name?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
  delivery_instructions?: string;
  is_floor: boolean;
  no_of_floor: number;
};

export default function AddressesScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Add / Edit Address State
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [newType, setNewType] = useState<string>("Home");
  const [newTitle, setNewTitle] = useState("");

  const [formFlat, setFormFlat] = useState("");
  const [formLandmark, setFormLandmark] = useState("");
  const [isFloor, setIsFloor] = useState(false);
  const [noOfFloor, setNoOfFloor] = useState(0);

  // Coordinate storage
  const [currentLat, setCurrentLat] = useState<number>(28.4595);
  const [currentLng, setCurrentLng] = useState<number>(77.0266);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid' | 'terrain' | 'none'>('terrain');
  const [isNewDefault, setIsNewDefault] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 28.4595,
    longitude: 77.0266,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const mapRef = useRef<any>(null);

  useEffect(() => {
    fetchAddresses();
    setGlobalLocationListener((coords) => {
      console.log('=== [ADDRESSES GLOBAL LISTENER] Map Selected ===', coords);
      setCurrentLat(coords.lat);
      setCurrentLng(coords.lng);
      setRegion({
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    });
    return () => clearGlobalLocationListener();
  }, []);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const res = await addressApi.getAddresses();
      if (res.data?.status === 1) {
        const fetchedAddresses = res.data.data || [];
        // Stable sort by ID to prevent list reordering when default status changes
        const stableList = [...fetchedAddresses].sort((a, b) => Number(a.id) - Number(b.id));
        setAddresses(stableList);

        // REQUIREMENT: Centering map on default address
        const defaultAddr = fetchedAddresses.find((a: Address) => a.is_default);
        if (defaultAddr) {
          const lat = Number(defaultAddr.latitude);
          const lng = Number(defaultAddr.longitude);
          setCurrentLat(lat);
          setCurrentLng(lng);
          const newRegion = {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          };
          setRegion(newRegion);
          // If mapRef is ready, animate to it
          if (mapRef.current?.animateToRegion) {
            mapRef.current.animateToRegion(newRegion, 1000);
          }
        }
      }
    } catch (err) {
      console.error("[Addresses] Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setSearchQuery("");
    setFormFlat("");
    setDeliveryInstructions("");
    setFormLandmark("");
    setRecipientName("");
    setNewType("Home");
    setNewTitle("");
    setIsNewDefault(false);
    setIsFloor(false);
    setNoOfFloor(0);
    setSuggestions([]);
  };

  const handleUseCurrentLocation = async () => {
    console.log('=== [WAY 3: PIN MAP - GPS START] ===');
    setIsFetchingLocation(true);
    setAccuracy(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Permission status:', status);
      if (status !== "granted") {
        console.warn('⛔ [GPS] Permission denied');
        Toast.show({
          type: 'info',
          text1: 'Permission',
          text2: 'Need location to provide 15-min delivery.'
        });
        setIsFetchingLocation(false);
        return;
      }

      await Location.enableNetworkProviderAsync().catch(() => {});

      let best: Location.LocationObject | null = null;
      let count = 0;

      const watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 500,
          distanceInterval: 0,
        },
        (loc) => {
          count++;
          const currentAcc = loc.coords.accuracy ?? 1000;
          const bestAcc = best?.coords.accuracy ?? 1000;
          console.log(`📡 [GPS SCAN ${count}] Accuracy: ${currentAcc.toFixed(1)}m`);

          if (!best || currentAcc < bestAcc) {
            best = loc;
            setCurrentLat(loc.coords.latitude);
            setCurrentLng(loc.coords.longitude);
            setAccuracy(loc.coords.accuracy);

            // Move map to the new "best" spot
            const newRegion = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            };
            setRegion(newRegion);
            mapRef.current?.animateToRegion(newRegion, 500);
          }

          // Close burst after 3.5 seconds or if we hit < 15m accuracy
          if (count > 8 || currentAcc < 15) {
             watcher.remove();
             finalizeLocation(best!);
          }
        }
      );

      // Safety timeout
      setTimeout(() => {
        watcher.remove();
        if (best) finalizeLocation(best);
        setIsFetchingLocation(false);
      }, 5000);

    } catch (err) {
      setIsFetchingLocation(false);
    }
  };

  const finalizeLocation = async (loc: Location.LocationObject) => {
    const { latitude, longitude } = loc.coords;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { "User-Agent": "ThanniGoApp/1.0" } }
      );
      const data = await res.json();
      if (data && data.display_name) {
        setSearchQuery(data.display_name);
      } else {
        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocode.length > 0) {
          const a = geocode[0];
          setSearchQuery(`${a.street || ""}, ${a.city || ""}`);
        }
      }
      setIsNewDefault(true); // GPS detected addresses should be default
      setIsAdding(true);
    } catch (e) {}
    setIsFetchingLocation(false);
  };

  /**
   * Unified drag handler — accepts {latitude, longitude} directly.
   * • Leaflet: called via postMessage bridge
   * • Native maps: called via shim below
   *
   * Uses Nominatim reverse geocode (free, accurate for India) instead of
   * expo-location's device geocoder which is often generic.
   */
  const handleMarkerDragEnd = async (coords: { latitude: number; longitude: number }) => {
    console.log('=== [WAY 3: PIN MAP - DRAG/TAP] ===');
    const { latitude, longitude } = coords;
    console.log('Pinned Coords:', { latitude, longitude });
    setCurrentLat(latitude);
    setCurrentLng(longitude);

    // Auto-open confirm form so user can verify + save
    if (!isAdding) setIsAdding(true);

    // Use Nominatim for accurate reverse geocoding (free, no API key needed)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'ThanniGoApp/1.0' } }
      );
      const data = await res.json();
      if (data?.address) {
        const a = data.address;
        // Build a clean, short address (road + suburb + city)
        const parts = [
          a.road || a.pedestrian || a.neighbourhood,
          a.suburb || a.quarter,
          a.city || a.town || a.village || a.county,
        ].filter(Boolean);
        setSearchQuery(parts.join(', ') || data.display_name || '');
        console.log('✅ Nominatim reverse geocode:', parts.join(', '));
      } else if (data?.display_name) {
        setSearchQuery(data.display_name);
      }
    } catch (fetchErr) {
      console.warn('[DRAG] Nominatim failed, trying expo-location fallback:', fetchErr);
      // Fallback to device geocoder if offline
      try {
        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocode.length > 0) {
          const g = geocode[0];
          const parts = [g.street, g.district || g.subregion, g.city].filter(Boolean);
          setSearchQuery(parts.join(', '));
        }
      } catch (geoErr) {
        console.warn('[DRAG] Fallback geocode also failed:', geoErr);
      }
    }
  };

  /** Shim for native ExpoMarker onDragEnd which sends e.nativeEvent.coordinate */
  const handleNativeMarkerDragEnd = (e: any) => {
    handleMarkerDragEnd(e.nativeEvent.coordinate);
  };

  useEffect(() => {
    setGlobalLocationListener((coords) => {
      console.log('=== [GLOBAL LISTENER] Map Preview Selected ===', coords);
      handleMarkerDragEnd({ latitude: coords.lat, longitude: coords.lng });
    });
    return () => clearGlobalLocationListener();
  }, []);

  const shareCurrentLocation = async () => {
    try {
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLng}`;
      await Share.share({ message: mapUrl });
    } catch (e) {}
  };

  const performSearch = async (query: string) => {
    console.log('=== [WAY 1: SEARCH START] ===');
    console.log('Query:', query);
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      // 1. Try Photon API (Fast & Autocomplete optimized)
      const photonRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
      const photonData = await photonRes.json();
      console.log('Photon source results:', photonData.features?.length || 0);

      let results = [];
      if (photonData.features && photonData.features.length > 0) {
        results = photonData.features.map((f: any) => ({
          title: f.properties.name || f.properties.street || "Location",
          subtitle: [f.properties.city, f.properties.state, f.properties.country].filter(Boolean).join(", "),
          address: f.properties.name ? (f.properties.name + ", " + (f.properties.city || "")) : f.properties.street,
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
          source: 'photon'
        }));
      }

      // 2. Hybrid Fallback: If Photon results are low, hit Nominatim
      if (results.length < 2) {
        const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3`, {
          headers: { "User-Agent": "ThanniGoApp/1.0" }
        });
        const nomData = await nomRes.json();
        const nomResults = nomData.map((item: any) => ({
          title: item.display_name.split(',')[0],
          subtitle: item.display_name.split(',').slice(1).join(',').trim(),
          address: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          source: 'nominatim'
        }));

        // Simple deduplication
        const titles = results.map((r: any) => r.title.toLowerCase());
        results = [...results, ...nomResults.filter((r: any) => !titles.includes(r.title.toLowerCase()))];
      }

      setSuggestions(results);
    } catch (error) {
      console.log("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = (item: any) => {
    console.log('=== [WAY 1: SUGGESTION SELECTED] ===');
    console.log('Item:', item.title);
    setSearchQuery(item.address || item.title);
    setCurrentLat(item.lat);
    setCurrentLng(item.lng);
    setSuggestions([]);
    if (!isAdding) {
      console.log('Opening Edit Form side-effect');
      setIsAdding(true);
    }
  };

  const saveAddress = async () => {
    if (!searchQuery.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter a valid area / street address.' });
      return;
    }

    try {
      const payload = {
        label: newType === "Other" ? newTitle || "Other" : newType,
        recipient_name: recipientName,
        address_line1: searchQuery,
        city: "Default",
        pincode: "000000",
        latitude: currentLat,
        longitude: currentLng,
        delivery_instructions: deliveryInstructions,
        is_default: isNewDefault,
        is_floor: isFloor,
        no_of_floor: noOfFloor,
      };

      if (editingId) {
        await addressApi.updateAddress(editingId, payload);
        Toast.show({ type: 'success', text1: 'Updated', text2: 'Address updated successfully' });
      } else {
        await addressApi.addAddress(payload);
        Toast.show({ type: 'success', text1: 'Saved', text2: 'New address added' });
      }

      clearForm();
      fetchAddresses();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: err.response?.data?.message || 'Could not save address. Try again.'
      });
    }
  };

  const removeAddress = async (id: string | number) => {
    try {
      await addressApi.deleteAddress(id);
      fetchAddresses();
    } catch (e) {}
  };

  const toggleFavorite = (id: string | number) => {
    // Backend doesn't support favorites yet, staying as visual only if we decide to add local state
  };

  const toggleDefault = async (id: string | number) => {
    try {
      await addressApi.setDefault(id);
      fetchAddresses();
    } catch (e) {}
  };



  const shareAddress = async (item: Address) => {
    try {
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;
      const message = `📍 ThanniGo Delivery Address (${item.label}):\n${item.address_line1}\n\nView on Maps: ${mapUrl}`;

      await Share.share({
        message,
        title: `Share Location - ${item.label}`,
      });
    } catch (error) {
      console.log("Sharing error:", error);
    }
  };

  const getIconForType = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('home')) return { icon: "home-sharp" as const, color: "#10b981", bg: "#f0fdf4" };
    if (t.includes('office') || t.includes('work')) return { icon: "business-sharp" as const, color: "#0ea5e9", bg: "#f0f9ff" };
    return { icon: "location-sharp" as const, color: "#6366f1", bg: "#f5f3ff" };
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.brandRow}>
          <BackButton fallback="/(tabs)/profile" style={{ marginRight: 12 }} />
          <Ionicons name="location" size={24} color={SHOP_TEAL} />

          <Text style={styles.brandName}>ThanniGo</Text>
        </View>
        <Image
          source={{ uri: "https://i.pravatar.cc/150?img=32" }}
          style={[styles.avatar, { borderColor: colors.border }]}
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Delivery Location</Text>

          {/* 1. SEARCH */}
          <View style={[styles.searchBox, { backgroundColor: colors.inputBg }]}>
            <Ionicons name="search" size={20} color={colors.muted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search area, landmark..."
              placeholderTextColor={colors.placeholder}
              value={searchQuery}
              onChangeText={(t) => {
                setSearchQuery(t);
                if (searchTimeout.current) clearTimeout(searchTimeout.current);
                searchTimeout.current = setTimeout(() => performSearch(t), 500) as any;
              }}
            />
            {isSearching && <ActivityIndicator size="small" color={SHOP_TEAL} style={{ marginRight: 8 }} />}
          </View>

          {/* SUGGESTIONS LIST */}
          {suggestions.length > 0 && (
            <View style={[styles.suggestionsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {suggestions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleSelectSuggestion(item)}
                >
                  <Ionicons name="location-outline" size={18} color={colors.muted} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.suggestionTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.suggestionSub, { color: colors.muted }]} numberOfLines={1}>{item.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 2. MAP PREVIEW INSIDE CARD */}
          <View style={[styles.mapContainer, { borderRadius: 16, marginTop: 12, marginBottom: 16, borderColor: colors.border }]}>
            <ExpoMap
              ref={mapRef}
              style={styles.mapView}
              initialRegion={region}
              onRegionChangeComplete={setRegion}
              showsUserLocation
              draggable
              markerTitle="Deliver Here"
              onMarkerDragEnd={handleMarkerDragEnd}
              mapType={mapType}
              showsTraffic={true}
              showsBuildings={true}
              hideControls={true}
            >
              <ExpoMarker
                coordinate={{ latitude: currentLat, longitude: currentLng }}
                draggable
                onDragEnd={handleNativeMarkerDragEnd}
                pinColor="#00647a"
                title="Deliver Here"
              />
            </ExpoMap>

            {Platform.OS !== 'web' && accuracy !== null && (
              <View style={styles.accuracyOverlay}>
                <View style={styles.accuracyTag}>
                  <View style={[styles.accuracyDot, {
                  backgroundColor: accuracy < 15 ? colors.success : colors.warning
                  }]} />
                  <Text style={styles.accuracyLabel}>
                    {accuracy < 15 ? `High Precision` : `GPS: ±${Math.round(accuracy)}m`}
                  </Text>
                </View>
              </View>
            )}
            <Text style={styles.liveMapText}>TAP MAP OR DRAG PIN TO PINPOINT</Text>

            {/* TOP RIGHT: MAP TYPE INDICATOR */}
            <View style={styles.typeSelectorOverlay}>
              <TouchableOpacity onPress={() => {
                const types: any[] = ['standard', 'satellite', 'terrain'];
                const nextIdx = (types.indexOf(mapType) + 1) % 3;
                setMapType(types[nextIdx]);
              }} style={[styles.mapActionBtnMini, { borderColor: colors.border }]}>
                <Ionicons
                  name={mapType === 'satellite' ? 'images' : mapType === 'terrain' ? 'earth' : 'map'}
                  size={18}
                  color={ACCENT}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.mapOverlayActions}>
              <TouchableOpacity
                style={styles.mapActionBtn}
                onPress={() => {
                  safeNavigate("/map-preview", {
                    lat: currentLat.toString(),
                    lng: currentLng.toString(),
                    title: searchQuery || "Location",
                    target: "select",
                  });
                }}
              >
                <Ionicons name="expand-outline" size={20} color={ACCENT} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. QUICK ACTIONS ROW (OUTSIDE MAP) */}
          <View style={styles.mapUtilityRow}>
            <TouchableOpacity
              style={[styles.utilityBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleUseCurrentLocation}
              disabled={isFetchingLocation}
            >
              {isFetchingLocation ? (
                <ActivityIndicator size="small" color={ACCENT} />
              ) : (
                <Ionicons name="location-sharp" size={18} color={ACCENT} />
              )}
              <Text style={styles.utilityBtnText}>Locate Me</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.utilityBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={shareAddress as any}>
              <Ionicons name="share-social-outline" size={18} color={ACCENT} />
              <Text style={styles.utilityBtnText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* 4. FORM */}
          {isAdding && (
            <View style={[styles.addFormWrapper, { borderTopColor: colors.border }]}>
              <Text style={[styles.formLabel, { color: colors.muted }]}>Save address as</Text>
              <View style={styles.typeRow}>
                {["Home", "Office", "Other"].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typePill, { backgroundColor: colors.inputBg, borderColor: 'transparent' }, newType === t && { backgroundColor: colors.inputBg, borderColor: ACCENT }]}
                    onPress={() => setNewType(t)}
                  >
                    <Text style={[styles.typePillText, { color: colors.muted }, newType === t && { color: ACCENT }]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {newType === "Other" && (
                <>
                  <Text style={[styles.formInputLabel, { color: colors.muted }]}>Custom Label Name</Text>
                  <TextInput
                    style={[styles.detailInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="e.g. Grandma's Place, Gym"
                    placeholderTextColor={colors.placeholder}
                    value={newTitle}
                    onChangeText={setNewTitle}
                  />
                </>
              )}

              <Text style={[styles.formInputLabel, { color: colors.muted }]}>Recipient Name</Text>
              <TextInput
                style={[styles.detailInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={colors.placeholder}
                value={recipientName}
                onChangeText={setRecipientName}
              />

              <Text style={[styles.formInputLabel, { color: colors.muted }]}>House / Flat / Block No.</Text>
              <TextInput
                style={[styles.detailInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. Flat 4B, Emerald Heights"
                placeholderTextColor={colors.placeholder}
                value={formFlat}
                onChangeText={setFormFlat}
              />

              <Text style={[styles.formInputLabel, { color: colors.muted }]}>Apartment / Road / Area</Text>
              <TextInput
                style={[styles.detailInput, { height: 60, textAlignVertical: "top", backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. 5th Main Road, Sector 3"
                placeholderTextColor={colors.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                multiline
              />

              <Text style={[styles.formInputLabel, { color: colors.muted }]}>Delivery Instructions (Optional)</Text>
              <TextInput
                style={[styles.detailInput, { height: 60, textAlignVertical: "top", backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. Please leave at the gate or ring the bell"
                placeholderTextColor={colors.placeholder}
                value={deliveryInstructions}
                onChangeText={setDeliveryInstructions}
                multiline
              />
              
              <View style={[styles.hybridRow, { paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 10 }]}>
                 <View style={{ flex: 1 }}>
                    <Text style={[styles.formInputLabel, { color: colors.text, marginBottom: 2 }]}>Deliver to a floor?</Text>
                    <Text style={{ fontSize: 12, color: colors.muted }}>Turn on if you live in a multi-story building</Text>
                 </View>
                 <Switch 
                   value={isFloor} 
                   onValueChange={setIsFloor}
                   trackColor={{ false: colors.border, true: ACCENT }}
                   thumbColor={Platform.OS === 'ios' ? undefined : '#f4f3f4'}
                 />
              </View>

              {isFloor && (
                <View style={{ marginTop: 8, padding: 12, backgroundColor: colors.inputBg, borderRadius: 12 }}>
                  <Text style={[styles.formInputLabel, { color: colors.muted, marginBottom: 12 }]}>Which floor are you on?</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <TouchableOpacity 
                      onPress={() => setNoOfFloor(Math.max(0, noOfFloor - 1))}
                      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
                    >
                      <Ionicons name="remove" size={24} color={ACCENT} />
                    </TouchableOpacity>
                    
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 28, fontWeight: '900', color: ACCENT }}>{noOfFloor}</Text>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.muted }}>FLOOR</Text>
                    </View>

                    <TouchableOpacity 
                      onPress={() => setNoOfFloor(noOfFloor + 1)}
                      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
                    >
                      <Ionicons name="add" size={24} color={ACCENT} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.formInputLabel, { color: colors.muted }]}>Latitude</Text>
                  <TextInput
                    style={[styles.detailInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.muted }]}
                    value={currentLat.toFixed(6)}
                    editable={false}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.formInputLabel, { color: colors.muted }]}>Longitude</Text>
                  <TextInput
                    style={[styles.detailInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.muted }]}
                    value={currentLng.toFixed(6)}
                    editable={false}
                  />
                </View>
              </View>

              {/* 5. CONFIRM & CANCEL */}
              <TouchableOpacity style={styles.saveActionBtn} onPress={saveAddress}>
                <Text style={styles.saveActionText}>Confirm & Save Address</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelActionBtn} onPress={clearForm}>
                <Text style={[styles.cancelActionText, { color: colors.muted }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* SAVED & RECENT */}
        <View style={styles.listHeaderRow}>
          <Text style={[styles.listSectionTitle, { color: colors.muted }]}>SAVED & RECENT</Text>
          <TouchableOpacity onPress={() => {
            clearForm();
            setIsAdding(true);
          }}>
            <Text style={styles.manageText}>+ Add New</Text>
          </TouchableOpacity>
        </View>

        {/* DYNAMIC LIST MAPPING */}
        {isLoading ? (
          <ActivityIndicator color="#005d90" style={{ marginVertical: 40 }} />
        ) : addresses.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Ionicons name="location-outline" size={48} color={colors.muted} />
            <Text style={{ color: colors.muted, marginTop: 12 }}>No saved addresses found.</Text>
          </View>
        ) : addresses.map((item) => {
          const uiOpts = getIconForType(item.label);
          return (
            <View
              key={item.id}
              style={[styles.listItem, { backgroundColor: colors.surface }, item.is_default && { borderColor: ACCENT, borderWidth: 1, backgroundColor: colors.inputBg }]}
            >
              <TouchableOpacity onPress={() => toggleDefault(item.id)} style={{ marginRight: 8, justifyContent: 'center' }}>
                <Ionicons
                  name={item.is_default ? "radio-button-on" : "radio-button-off"}
                  size={24}
                  color={item.is_default ? ACCENT : colors.muted}
                />
              </TouchableOpacity>

              <View style={[styles.iconWrap, { backgroundColor: uiOpts.bg }]}>
                <Ionicons name={uiOpts.icon} size={22} color={uiOpts.color} />
              </View>

              <TouchableOpacity
                style={styles.listContent}
                activeOpacity={0.6}
                onPress={() => toggleDefault(item.id)}
              >
                <View style={styles.listTitleRow}>
                  <Text style={[styles.listTitle, { color: colors.text }]}>{item.label}</Text>
                  {item.is_default && <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>DEFAULT</Text></View>}
                </View>
                <Text style={[styles.listSub, { color: colors.muted }]} numberOfLines={2}>
                  {item.address_line1}
                </Text>
              </TouchableOpacity>
              <View
                style={{ flexDirection: "row", gap: 14, paddingVertical: 4 }}
              >
                <TouchableOpacity onPress={() => {
                  safeNavigate("/map-preview", {
                    lat: item.latitude.toString(),
                    lng: item.longitude.toString(),
                    title: item.label
                  });
                }}>
                  <Ionicons name="map-outline" size={20} color={SHOP_TEAL} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => shareAddress(item)}>
                  <Ionicons name="share-social-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setEditingId(item.id);
                    setSearchQuery(item.address_line1);
                    setDeliveryInstructions(item.delivery_instructions || "");
                    setRecipientName(item.recipient_name || "");
                    setNewType(["Home", "Office"].includes(item.label) ? item.label : "Other");
                    setNewTitle(item.label);
                    setCurrentLat(Number(item.latitude));
                    setCurrentLng(Number(item.longitude));
                    setIsAdding(true);
                  }}
                >
                  <Ionicons name="pencil" size={20} color={colors.muted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeAddress(item.id)}>
                  <Ionicons name="trash" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* INFO BOX */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={SHOP_TEAL} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Precision Delivery</Text>
            <Text style={styles.infoText}>
              Selecting a specific pin location helps our drivers reach you
              faster. ThanniGo offers 15-minute guaranteed delivery for most
              urban areas.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  brandName: { fontSize: 20, fontWeight: "800", color: ACCENT, letterSpacing: -0.3 },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2 },

  scrollContent: { padding: 20 },

  card: {
    borderRadius: Radius.xl, padding: 20, marginBottom: 20, ...Shadow.sm,
  },
  cardTitle: { fontSize: 18, fontWeight: "800", marginBottom: 16 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: Radius.lg, paddingHorizontal: 16, height: 56, marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: "500" },
  gpsBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: SHOP_TEAL, borderRadius: Radius.lg, height: 56,
    ...Shadow.sm,
  },
  gpsBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },

  addFormWrapper: { marginTop: 24, paddingTop: 16, borderTopWidth: 1 },
  formInputLabel: { fontSize: 12, fontWeight: "700", marginBottom: 6, marginLeft: 2 },
  detailInput: {
    borderWidth: 1,
    borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, marginBottom: 16,
  },

  formLabel: { fontSize: 13, fontWeight: "700", marginBottom: 10, marginTop: 4 },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  typePill: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  typePillText: { fontSize: 14, fontWeight: "600" },
  saveActionBtn: { backgroundColor: SHOP_TEAL, paddingVertical: 14, borderRadius: Radius.lg, alignItems: "center", marginTop: 10 },
  saveActionText: { color: "white", fontSize: 15, fontWeight: "700" },
  cancelActionBtn: { paddingVertical: 14, alignItems: "center", marginTop: 4 },
  cancelActionText: { fontSize: 14, fontWeight: "600" },

  mapContainer: {
    height: 240, borderRadius: Radius.xl, overflow: "hidden", position: "relative",
    marginBottom: 28, backgroundColor: "#1e293b", borderWidth: 1,
  },
  mapView: { flex: 1 },
  accuracyOverlay: { position: "absolute", top: 12, left: 12 },
  typeSelectorOverlay: { position: "absolute", top: 12, right: 12 },
  mapOverlayActions: { position: "absolute", bottom: 12, right: 12, gap: 8 },
  mapActionBtn: {
    backgroundColor: colors.surface, width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center", ...Shadow.sm,
  },
  mapActionBtnMini: {
    backgroundColor: "rgba(255,255,255,0.95)", width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center", ...Shadow.xs,
    borderWidth: 1,
  },
  accuracyTag: {
    flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 6, ...Shadow.xs,
  },
  accuracyDot: { width: 6, height: 6, borderRadius: 3 },
  accuracyLabel: { fontSize: 10, fontWeight: "800", color: colors.muted, letterSpacing: 0.5 },
  mapPinContainer: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  deliverHerePill: { backgroundColor: SHOP_TEAL, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, marginBottom: 60 },
  deliverHereText: { color: "white", fontSize: 12, fontWeight: "800" },
  liveMapText: { position: "absolute", bottom: 16, left: 16, color: colors.muted, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  miniTypeSelector: { position: 'absolute', top: 12, left: 12, zIndex: 10 },
  miniTypeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, ...Shadow.xs, borderWidth: 1,
  },
  miniTypeText: { fontSize: 9, fontWeight: '900', color: ACCENT, letterSpacing: 0.5 },

  listHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingHorizontal: 4 },
  listSectionTitle: { fontSize: 13, fontWeight: "700", letterSpacing: 1 },
  manageText: { fontSize: 13, fontWeight: "700", color: SHOP_TEAL },

  listItem: {
    flexDirection: "row", alignItems: "center",
    borderRadius: Radius.xl, padding: 16, marginBottom: 12, gap: 16, ...Shadow.xs,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  listContent: { flex: 1 },
  listTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  listTitle: { fontSize: 16, fontWeight: "800" },
  favBadge: { backgroundColor: colors.success, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  favBadgeText: { color: "white", fontSize: 9, fontWeight: "800" },
  defaultBadge: { backgroundColor: ACCENT, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  defaultBadgeText: { color: "white", fontSize: 9, fontWeight: "800" },
  selectionIndicator: { paddingRight: 4 },
  listSub: { fontSize: 13, fontWeight: "500" },

  infoBox: {
    flexDirection: "row", gap: 12, backgroundColor: colors.successSoft,
    borderRadius: Radius.xl, padding: 18, marginTop: 12,
    borderWidth: 1, borderColor: colors.success + '30',
  },
  infoTitle: { fontSize: 14, fontWeight: "800", color: '#006878', marginBottom: 4 },
  infoText: { fontSize: 13, color: '#006878', lineHeight: 20, fontWeight: "500" },
  mapUtilityRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  utilityBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 14, borderRadius: Radius.lg,
    borderWidth: 1.5, ...Shadow.xs,
  },
  utilityBtnText: { fontSize: 14, fontWeight: '800', color: ACCENT },

  suggestionsContainer: {
    borderRadius: Radius.lg, marginTop: 8, marginBottom: 16,
    padding: 4, borderWidth: 1, ...Shadow.sm,
  },
  suggestionItem: {
    flexDirection: "row", alignItems: "center", padding: 14,
    borderBottomWidth: 1, gap: 12,
  },
  suggestionTitle: { fontSize: 14, fontWeight: "700" },
  suggestionSub: { fontSize: 12, marginTop: 2, fontWeight: "500" },
});
