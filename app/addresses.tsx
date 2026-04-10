import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BackButton } from "@/components/ui/BackButton";
import React, { useState, useRef, useEffect } from "react";
import { setGlobalLocationListener, clearGlobalLocationListener } from "@/utils/locationEvents";
import {
  ActivityIndicator,
  Alert,
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
import { SafeAreaView } from "react-native-safe-area-context";
import { ExpoMap, ExpoMarker } from "@/components/maps/ExpoMap";
import { safeNavigate } from "@/utils/safeNavigation";

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

type AddressType = "Home" | "Office" | "Recent" | "Other";

type Address = {
  id: string;
  type: AddressType;
  title: string;
  fullAddress: string;
  isFavorite: boolean;
  isDefault: boolean;
  lat: number;
  lng: number;
};

const INITIAL_ADDRESSES: Address[] = [
  {
    id: "1",
    type: "Home",
    title: "Home",
    fullAddress: "82nd Floor, Azure Heights, Cyber City, Sector 56...",
    isFavorite: true,
    isDefault: true,
    lat: 28.4595,
    lng: 77.0266,
  },
  {
    id: "2",
    type: "Office",
    title: "Office",
    fullAddress: "Floor 12, Tech Park Central, Sector 44...",
    isFavorite: false,
    isDefault: false,
    lat: 28.4411,
    lng: 77.0526,
  },
  {
    id: "3",
    type: "Recent",
    title: "Grand Hotel Lobby",
    fullAddress: "Main St, Near City Square fountain...",
    isFavorite: false,
    isDefault: false,
    lat: 28.468,
    lng: 77.063,
  },
];

export default function AddressesScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>(INITIAL_ADDRESSES);

  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Add / Edit Address State
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [newType, setNewType] = useState<AddressType>("Home");
  const [newTitle, setNewTitle] = useState("");

  const [formFlat, setFormFlat] = useState("");
  const [formLandmark, setFormLandmark] = useState("");
  
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
      // Optionally trigger reverse geocode here if needed
    });
    return () => clearGlobalLocationListener();
  }, []);

  const clearForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setSearchQuery("");
    setFormFlat("");
    setDeliveryInstructions("");
    setFormLandmark("");
    setNewType("Home");
    setNewTitle("");
    setIsNewDefault(false);
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
        Alert.alert("Permission", "Need location to provide 15-min delivery.");
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

  const saveAddress = () => {
    console.log('=== [WAY 2: MANUAL/CONFIRM SAVE] ===');
    console.log('Form State:', { newType, currentLat, currentLng });
    
    if (!searchQuery.trim()) {
      console.warn('⛔ Save blocked: Missing address text');
      Alert.alert("Error", "Please enter a valid area / street address.");
      return;
    }

    if (!isValidCoordinate(currentLat, currentLng)) {
      console.error('❌ Save blocked: Invalid coords');
      Alert.alert("Error", "Internal location error. Please reset pin.");
      return;
    }

    const constructedAddress = [formFlat, searchQuery, formLandmark]
      .filter(Boolean)
      .join(", ");

    if (editingId) {
      console.log('Updating existing address:', editingId);
      setAddresses(
        addresses.map((a) =>
          a.id === editingId
            ? {
                ...a,
                type: newType,
                title: newType === "Other" ? newTitle || "Custom" : newType,
                fullAddress: constructedAddress,
                lat: currentLat,
                lng: currentLng,
              }
            : a,
        ),
      );
      setEditingId(null);
    } else {
      console.log('Creating new address');
      const newAddr: Address = {
        id: Date.now().toString(),
        type: newType,
        title: newType === "Other" ? newTitle || "Custom" : newType,
        fullAddress: constructedAddress,
        isFavorite: false,
        isDefault: isNewDefault,
        lat: currentLat,
        lng: currentLng,
      };
      
      if (isNewDefault) {
        // If this becomes default, unset others first
        setAddresses([newAddr, ...addresses.map(a => ({ ...a, isDefault: false }))]);
      } else {
        setAddresses([newAddr, ...addresses]);
      }
    }

    clearForm();
  };

  const removeAddress = (id: string) => {
    setAddresses(addresses.filter((a) => a.id !== id));
  };

  const toggleFavorite = (id: string) => {
    setAddresses(
      addresses.map((a) =>
        a.id === id ? { ...a, isFavorite: !a.isFavorite } : a,
      ),
    );
  };

  const toggleDefault = (id: string) => {
    setAddresses(
      addresses.map((a) =>
        a.id === id ? { ...a, isDefault: true } : { ...a, isDefault: false },
      ),
    );
  };



  const shareAddress = async (item: Address) => {
    try {
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`;
      const message = `📍 ThanniGo Delivery Address (${item.title}):\n${item.fullAddress}\n\nView on Maps: ${mapUrl}`;
      
      await Share.share({
        message,
        title: `Share Location - ${item.title}`,
      });
    } catch (error) {
      console.log("Sharing error:", error);
    }
  };

  const getIconForType = (type: AddressType) => {
    switch (type) {
      case "Home":
        return { icon: "home-sharp" as const, color: "#10b981", bg: "#f0fdf4" };
      case "Office":
        return { icon: "business-sharp" as const, color: "#0ea5e9", bg: "#f0f9ff" };
      default:
        return { icon: "location-sharp" as const, color: "#6366f1", bg: "#f5f3ff" };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <BackButton fallback="/(tabs)/profile" style={{ marginRight: 12 }} />
          <Ionicons name="location" size={24} color="#008db9" />

          <Text style={styles.brandName}>ThanniGo</Text>
        </View>
        <Image
          source={{ uri: "https://i.pravatar.cc/150?img=32" }}
          style={styles.avatar}
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
        >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Location</Text>

          {/* 1. SEARCH */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search area, landmark..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={(t) => {
                setSearchQuery(t);
                if (searchTimeout.current) clearTimeout(searchTimeout.current);
                searchTimeout.current = setTimeout(() => performSearch(t), 500) as any;
              }}
            />
            {isSearching && <ActivityIndicator size="small" color="#008db9" style={{ marginRight: 8 }} />}
          </View>

          {/* SUGGESTIONS LIST */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {suggestions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item)}
                >
                  <Ionicons name="location-outline" size={18} color="#64748b" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestionTitle}>{item.title}</Text>
                    <Text style={styles.suggestionSub} numberOfLines={1}>{item.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 2. MAP PREVIEW INSIDE CARD */}
          <View style={[styles.mapContainer, { borderRadius: 16, marginTop: 12, marginBottom: 16 }]}>
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
                    backgroundColor: accuracy < 15 ? '#10b981' : '#f59e0b'
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
              }} style={styles.mapActionBtnMini}>
                <Ionicons 
                  name={mapType === 'satellite' ? 'images' : mapType === 'terrain' ? 'earth' : 'map'} 
                  size={18} 
                  color="#005d90" 
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
                <Ionicons name="expand-outline" size={20} color="#005d90" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. QUICK ACTIONS ROW (OUTSIDE MAP) */}
          <View style={styles.mapUtilityRow}>
            <TouchableOpacity
              style={styles.utilityBtn}
              onPress={handleUseCurrentLocation}
              disabled={isFetchingLocation}
            >
              {isFetchingLocation ? (
                <ActivityIndicator size="small" color="#005d90" />
              ) : (
                <Ionicons name="location-sharp" size={18} color="#005d90" />
              )}
              <Text style={styles.utilityBtnText}>Locate Me</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.utilityBtn} onPress={shareAddress as any}>
              <Ionicons name="share-social-outline" size={18} color="#005d90" />
              <Text style={styles.utilityBtnText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* 4. FORM */}
          {isAdding && (
            <View style={styles.addFormWrapper}>
              <Text style={styles.formInputLabel}>House / Flat / Block No.</Text>
              <TextInput
                style={styles.detailInput}
                placeholder="e.g. Flat 4B, Emerald Heights"
                value={formFlat}
                onChangeText={setFormFlat}
              />

              <Text style={styles.formInputLabel}>Apartment / Road / Area</Text>
              <TextInput
                style={[styles.detailInput, { height: 60, textAlignVertical: "top" }]}
                placeholder="e.g. 5th Main Road, Sector 3"
                value={searchQuery}
                onChangeText={setSearchQuery}
                multiline
              />

              <Text style={styles.formInputLabel}>Delivery Instructions (Optional)</Text>
              <TextInput
                style={[styles.detailInput, { height: 60, textAlignVertical: "top" }]}
                placeholder="e.g. Please leave at the gate or ring the bell"
                value={deliveryInstructions}
                onChangeText={setDeliveryInstructions}
                multiline
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formInputLabel}>Latitude</Text>
                  <TextInput
                    style={[styles.detailInput, { backgroundColor: '#f1f5f9', color: '#64748b' }]}
                    value={currentLat.toFixed(6)}
                    editable={false}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formInputLabel}>Longitude</Text>
                  <TextInput
                    style={[styles.detailInput, { backgroundColor: '#f1f5f9', color: '#64748b' }]}
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
                <Text style={styles.cancelActionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* SAVED & RECENT */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listSectionTitle}>SAVED & RECENT</Text>
          <TouchableOpacity onPress={() => {
            clearForm();
            setIsAdding(true);
          }}>
            <Text style={styles.manageText}>+ Add New</Text>
          </TouchableOpacity>
        </View>

        {/* DYNAMIC LIST MAPPING */}
        {addresses.map((item) => {
          const uiOpts = getIconForType(item.type);
          return (
            <View
              key={item.id}
              style={[styles.listItem, item.isDefault && styles.listItemDefault]}
            >
              <View style={[styles.iconWrap, { backgroundColor: uiOpts.bg }]}>
                <Ionicons name={uiOpts.icon} size={22} color={uiOpts.color} />
              </View>
              
              <TouchableOpacity 
                style={styles.listContent}
                activeOpacity={0.6}
                onPress={() => {
                  console.log('=== ADDRESS LIST ITEM CLICK ===');
                  if (isValidCoordinate(item.lat, item.lng)) {
                    safeNavigate("/map-preview", {
                      lat: item.lat.toString(),
                      lng: item.lng.toString(),
                      title: item.title 
                    });
                  } else {
                    Alert.alert("Error", "Address has invalid coordinates. Please edit and re-save.");
                  }
                }}
              >
                <View style={styles.listTitleRow}>
                  <Text style={styles.listTitle}>{item.title}</Text>
                </View>
                <Text style={styles.listSub} numberOfLines={2}>
                  {item.fullAddress}
                </Text>
              </TouchableOpacity>
              <View
                style={{ flexDirection: "row", gap: 14, paddingVertical: 4 }}
              >
                <TouchableOpacity onPress={() => {
                  console.log('=== VIEW MAP BUTTON CLICK ===');
                  safeNavigate("/map-preview", {
                    lat: item.lat.toString(),
                    lng: item.lng.toString(),
                    title: item.title 
                  });
                }}>
                  <Ionicons name="map-outline" size={20} color="#008db9" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => shareAddress(item)}>
                  <Ionicons name="share-social-outline" size={20} color="#6366f1" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                  <Ionicons
                    name={item.isFavorite ? "heart" : "heart-outline"}
                    size={20}
                    color={item.isFavorite ? "#10b981" : "#94a3b8"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setEditingId(item.id);
                    // For logic simplicity, drop entire address back into SearchQuery block
                    setSearchQuery(item.fullAddress);
                    setFormFlat("");
                    setFormLandmark("");
                    setNewType(item.type);
                    setNewTitle(item.title);
                    setIsAdding(true);
                  }}
                >
                  <Ionicons name="pencil" size={20} color="#94a3b8" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeAddress(item.id)}>
                  <Ionicons name="trash" size={20} color="#f87171" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* INFO BOX */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#008db9" />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  brandName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#005d90",
    letterSpacing: -0.3,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },

  scrollContent: { padding: 20 },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#0f172a", fontWeight: "500" },
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#00647a",
    borderRadius: 16,
    height: 56,
    shadowColor: "#00647a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  gpsBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },

  addFormWrapper: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  formInputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
    marginLeft: 2,
  },
  detailInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0f172a",
    marginBottom: 16,
  },

  formLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 10,
    marginTop: 4,
  },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  typePill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "transparent",
  },
  typePillActive: { backgroundColor: "#e0f2fe", borderColor: "#bae6fd" },
  typePillText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  typePillTextActive: { color: "#0284c7" },
  saveActionBtn: {
    backgroundColor: "#0d9488",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },
  saveActionText: { color: "white", fontSize: 15, fontWeight: "700" },
  cancelActionBtn: { paddingVertical: 14, alignItems: "center", marginTop: 4 },
  cancelActionText: { color: "#64748b", fontSize: 14, fontWeight: "600" },

  mapContainer: {
    height: 240,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    marginBottom: 28,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  mapView: { flex: 1 },
  accuracyOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
  },
  typeSelectorOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  mapOverlayActions: {
    position: "absolute",
    bottom: 12,
    right: 12,
    gap: 8,
  },
  mapActionBtn: {
    backgroundColor: "white",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  mapActionBtnMini: {
    backgroundColor: "rgba(255,255,255,0.95)",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  accuracyTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  accuracyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  accuracyLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.5,
  },
  mapPinContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  deliverHerePill: {
    backgroundColor: "#00647a",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 60, // Lift above the marker center a bit
  },
  deliverHereText: { color: "white", fontSize: 12, fontWeight: "800" },
  liveMapText: {
    position: "absolute",
    bottom: 16,
    left: 16,
    color: "#475569",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  miniTypeSelector: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
  },
  miniTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  miniTypeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#005d90',
    letterSpacing: 0.5,
  },

  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  listSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    letterSpacing: 1,
  },
  manageText: { fontSize: 13, fontWeight: "700", color: "#00647a" },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: { flex: 1 },
  listTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  listTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  favBadge: {
    backgroundColor: "#4ade80",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  favBadgeText: { color: "white", fontSize: 9, fontWeight: "800" },
  defaultBadge: {
    backgroundColor: "#0ea5e9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultBadgeText: { color: "white", fontSize: 9, fontWeight: "800" },
  selectionIndicator: {
    paddingRight: 4,
  },
  listItemDefault: {
    borderColor: "#0ea5e9",
    borderWidth: 1,
    backgroundColor: "#f0f9ff",
  },
  listSub: { fontSize: 13, color: "#64748b", fontWeight: "500" },

  infoBox: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#f0fdfa",
    borderRadius: 20,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#ccfbf1",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#115e59",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: "#0f766e",
    lineHeight: 20,
    fontWeight: "500",
  },
  mapUtilityRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  utilityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'white',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  utilityBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#005d90',
  },

  // SUGGESTIONS STYLES
  suggestionsContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 12,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  suggestionSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "500",
  },
});
