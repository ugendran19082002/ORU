import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { ExpoMap, ExpoMarker } from "@/components/maps/ExpoMap";
import { BackButton } from "@/components/ui/BackButton";
import { Logo } from "@/components/ui/Logo";
import { useAppNavigation } from "@/hooks/use-app-navigation";
import { useAndroidBackHandler } from "@/hooks/use-back-handler";
import {
  clearGlobalLocationListener,
  setGlobalLocationListener,
} from "@/utils/locationEvents";
import { safeNavigate } from "@/utils/safeNavigation";
import { shopApi } from "@/api/shopApi";
import { Ionicons } from "@expo/vector-icons";
import { Shadow, roleAccent, roleSurface } from "@/constants/theme";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAppTheme } from '@/providers/ThemeContext';
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  RefreshControl,
  Share,
  Platform,
  KeyboardAvoidingView,
  Animated,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SHOP_ACCENT = roleAccent.shop_owner;
const SHOP_SURF = roleSurface.shop_owner;

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type Suggestion = {
  title: string;
  subtitle: string;
  address: string;
  lat: number;
  lng: number;
};

// Sub-components moved inside Main Screen

// Sub-components moved inside Main Screen

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ShopProfileScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);

  // ─── Inner Components ───────────────────────────────────────────────────────

  const Section = ({ title, icon, children, defaultOpen = true }: {
    title: string;
    icon: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
  }) => {
    const [open, setOpen] = useState(defaultOpen);
    const toggle = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setOpen((v) => !v);
    };
    return (
      <View style={styles.sectionWrap}>
        <TouchableOpacity style={styles.sectionHeader} onPress={toggle} activeOpacity={0.7}>
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name={icon as any} size={18} color={SHOP_ACCENT} />
            </View>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.muted} />
        </TouchableOpacity>
        {open && <View style={styles.card}>{children}</View>}
      </View>
    );
  };

  const Field = ({
    label, value, onChangeText, placeholder, keyboardType, autoCapitalize, multiline, editable = true, suffix, flex
  }: {
    label: string; value: string; onChangeText?: (t: string) => void; placeholder?: string;
    keyboardType?: any; autoCapitalize?: any; multiline?: boolean; editable?: boolean;
    suffix?: React.ReactNode; flex?: number;
  }) => {
    return (
      <View style={[styles.fieldWrap, flex !== undefined && { flex }]}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              !editable && styles.inputDisabled,
              multiline && { minHeight: 56, textAlignVertical: "top" },
              suffix ? { flex: 1, marginBottom: 0 } : {},
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            multiline={multiline}
            editable={editable}
          />
          {suffix}
        </View>
      </View>
    );
  };
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  useAndroidBackHandler(() => safeBack("/shop/settings"));

  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Business
  const [shopName, setShopName] = useState("");
  const [fssai, setFssai] = useState("");

  // Location
  const [shopNo, setShopNo] = useState("");
  const [addressArea, setAddressArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [currentLat, setCurrentLat] = useState(12.9716);
  const [currentLng, setCurrentLng] = useState(80.221);
  const [region, setRegion] = useState<Region>({
    latitude: 12.9716,
    longitude: 80.221,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Owner
  const [ownerName, setOwnerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [secondaryMobile, setSecondaryMobile] = useState("");
  const [email, setEmail] = useState("");

  // Verification
  const [gstNo, setGstNo] = useState("");
  const [panNo, setPanNo] = useState("");
  const [aadharNo, setAadharNo] = useState("");


  const fetchProfile = async () => {
    try {
      setIsFetching(true);
      const data = await shopApi.getMyShop();
      if (data) {
        setShopName(data.name || "");
        setOwnerName(data.owner_name || "");
        setMobile(data.phone || "");
        setFssai(data.fssai_no || "");
        setShopNo(data.address_line1 || "");
        setAddressArea(data.address_line2 || "");
        setGstNo(data.gstin || "");
        setPanNo(data.pan_no || "");
        setAadharNo(data.aadhar_no || "");
        setSecondaryMobile(data.alternate_phone || "");
        setEmail(data.email || "");
        if (data.latitude && data.longitude) {
          const lat = parseFloat(data.latitude);
          const lng = parseFloat(data.longitude);
          setCurrentLat(lat);
          setCurrentLng(lng);
          setRegion((r) => ({ ...r, latitude: lat, longitude: lng }));
        }
      }
    } catch {
      Toast.show({ type: "error", text1: "Load failed", text2: "Could not load profile." });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile().finally(() => setRefreshing(false));
  }, []);

  const handleSave = async () => {
    if (!shopName.trim()) {
      Toast.show({ type: "error", text1: "Required", text2: "Shop name cannot be empty." });
      return;
    }
    try {
      setIsSaving(true);
      await shopApi.updateMyShop({
        name: shopName,
        owner_name: ownerName,
        phone: mobile,
        fssai_no: fssai,
        address_line1: shopNo,
        address_line2: addressArea,
        gstin: gstNo,
        pan_no: panNo,
        aadhar_no: aadharNo,
        alternate_phone: secondaryMobile,
        email,
        latitude: currentLat,
        longitude: currentLng,
      });
      Toast.show({ type: "success", text1: "Saved", text2: "Profile updated successfully." });
    } catch {
      Toast.show({ type: "error", text1: "Save failed", text2: "Could not update profile." });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Location search with debounce ─────────────────────────────────────────
  const runSearch = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const photonRes = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`,
      );
      const photonData = await photonRes.json();
      let results: Suggestion[] = [];
      if (photonData.features?.length > 0) {
        results = photonData.features.map((f: any) => ({
          title: f.properties.name || f.properties.street || "Location",
          subtitle: [f.properties.city, f.properties.state].filter(Boolean).join(", "),
          address: [f.properties.name, f.properties.city].filter(Boolean).join(", "),
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
        }));
      }
      if (results.length < 2) {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3`,
          { headers: { "User-Agent": "ThanniGoApp/1.0" } },
        );
        const nomData = await nomRes.json();
        const nomResults: Suggestion[] = nomData.map((item: any) => ({
          title: item.display_name.split(",")[0],
          subtitle: item.display_name.split(",").slice(1, 3).join(",").trim(),
          address: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));
        results = [...results, ...nomResults];
      }
      setSuggestions(results);
    } catch {
      /* silent */
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => runSearch(text), 400);
  };

  const handleSelectSuggestion = (item: Suggestion) => {
    setSearchQuery("");
    setSuggestions([]);
    setAddressArea(item.address || item.title);
    setCurrentLat(item.lat);
    setCurrentLng(item.lng);
    setRegion({ latitude: item.lat, longitude: item.lng, latitudeDelta: 0.005, longitudeDelta: 0.005 });
  };

  // ── Reverse geocode helper ────────────────────────────────────────────────
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=18&addressdetails=1`,
        { headers: { "User-Agent": "ThanniGoApp/1.0" } },
      );
      const data = await res.json();
      if (data?.address) {
        const a = data.address;
        const parts = [
          a.road || a.pedestrian || a.neighbourhood,
          a.suburb || a.quarter,
          a.city || a.town || a.village || a.county,
          a.state,
        ].filter(Boolean);
        setAddressArea(parts.join(", ") || data.display_name || "");
        return;
      }
      if (data?.display_name) setAddressArea(data.display_name);
    } catch {
      try {
        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocode.length > 0) {
          const g = geocode[0];
          const parts = [g.street, g.district || g.subregion, g.city].filter(Boolean);
          setAddressArea(parts.join(", "));
        }
      } catch { /* silent */ }
    }
  };

  // ── GPS locate ────────────────────────────────────────────────────────────
  const handleUseCurrentLocation = async () => {
    setIsFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Toast.show({ type: "error", text1: "Permission denied", text2: "Allow location access to pin your shop." });
        return;
      }

      let best: Location.LocationObject | null = null;
      let count = 0;

      const watcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 500, distanceInterval: 0 },
        (loc) => {
          count++;
          const acc = loc.coords.accuracy || 100;
          if (!best || acc < (best.coords.accuracy || 100)) {
            best = loc;
            setRegion({ latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 });
            setCurrentLat(loc.coords.latitude);
            setCurrentLng(loc.coords.longitude);
          }
          if (count > 8 || acc < 15) {
            watcher.remove();
            if (best) reverseGeocode(best.coords.latitude, best.coords.longitude);
            setIsFetchingLocation(false);
          }
        },
      );

      setTimeout(() => {
        watcher.remove();
        if (best) {
          reverseGeocode((best as Location.LocationObject).coords.latitude, (best as Location.LocationObject).coords.longitude);
        }
        setIsFetchingLocation(false);
      }, 5000);
    } catch {
      setIsFetchingLocation(false);
    }
  };

  // ── Map drag / tap ────────────────────────────────────────────────────────
  const handleMarkerDragEnd = async (coords: { latitude: number; longitude: number }) => {
    setCurrentLat(coords.latitude);
    setCurrentLng(coords.longitude);
    await reverseGeocode(coords.latitude, coords.longitude);
  };

  const handleNativeMarkerDragEnd = (e: any) => handleMarkerDragEnd(e.nativeEvent.coordinate);

  useEffect(() => {
    setGlobalLocationListener((coords) => {
      handleMarkerDragEnd({ latitude: coords.lat, longitude: coords.lng });
    });
    return () => clearGlobalLocationListener();
  }, []);

  const shareShopLocation = async () => {
    try {
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLng}`;
      await Share.share({
        message: `📍 Visit ${shopName} at:\n${shopNo}, ${addressArea}\n\nLocation: ${mapUrl}`,
        title: `ThanniGo - ${shopName}`,
      });
    } catch { /* silent */ }
  };

  if (isFetching) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={SHOP_ACCENT} />
        <Text style={{ marginTop: 12, color: colors.muted, fontWeight: "600" }}>
          Loading profile…
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <BackButton fallback="/shop/settings" />
          <View>
            <View style={styles.brandRow}>
              <Logo size="md" />
              <Text style={styles.brandName}>ThanniGo</Text>
            </View>
            <Text style={styles.roleLabel}>SHOP PANEL</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity 
            style={styles.notifBtnSub} 
            onPress={() => router.push('/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={22} color={SHOP_ACCENT} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color={SHOP_ACCENT} />
            ) : (
              <Text style={styles.saveHeaderBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      >
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[SHOP_ACCENT]} tintColor={SHOP_ACCENT} />
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.pageTitle}>Shop Profile</Text>

          {/* ── Business Details ── */}
          <Section title="Business Details" icon="storefront-outline">
            <Field label="Shop Name *" value={shopName} onChangeText={setShopName} placeholder="Enter shop name" />
            <Field
              label="FSSAI License Number"
              value={fssai}
              onChangeText={setFssai}
              placeholder="14-digit FSSAI number"
              keyboardType="numeric"
              suffix={
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="white" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              }
            />
          </Section>

          {/* ── Store Location ── */}
          <Section title="Store Location" icon="location-outline">
            {/* Step 1: Search */}
            <View style={styles.locationStepRow}>
              <View style={styles.locationStepBadge}><Text style={styles.locationStepNum}>1</Text></View>
              <Text style={styles.locationStepLabel}>Search your area or locality</Text>
            </View>
            <View style={styles.searchInputWrap}>
              <Ionicons name="search-outline" size={18} color={colors.muted} style={{ marginLeft: 14 }} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder="Search street, area, landmark…"
                placeholderTextColor={colors.muted}
                returnKeyType="search"
              />
              {isSearching && <ActivityIndicator size="small" color={SHOP_ACCENT} style={{ marginRight: 14 }} />}
              {searchQuery.length > 0 && !isSearching && (
                <TouchableOpacity onPress={() => { setSearchQuery(""); setSuggestions([]); }} style={{ marginRight: 14 }}>
                  <Ionicons name="close-circle" size={18} color={colors.muted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {suggestions.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.suggestionItem, i === suggestions.length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => handleSelectSuggestion(item)}
                  >
                    <Ionicons name="location-outline" size={18} color={SHOP_ACCENT} style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.suggestionTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.suggestionSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Step 2: Pin on map */}
            <View style={[styles.locationStepRow, { marginTop: 16 }]}>
              <View style={styles.locationStepBadge}><Text style={styles.locationStepNum}>2</Text></View>
              <Text style={styles.locationStepLabel}>Drag the pin to your exact shop location</Text>
            </View>
            <View style={styles.mapContainer}>
              <ExpoMap
                style={styles.map}
                region={region}
                onRegionChangeComplete={setRegion}
                showsUserLocation
                draggable
                markerTitle={shopName}
                onMarkerDragEnd={handleMarkerDragEnd}
                hideControls
              >
                <ExpoMarker
                  coordinate={{ latitude: currentLat, longitude: currentLng }}
                  draggable
                  onDragEnd={handleNativeMarkerDragEnd}
                  title={shopName}
                />
              </ExpoMap>
              <TouchableOpacity
                style={styles.expandMapBtn}
                onPress={() =>
                  safeNavigate("/map-preview", {
                    lat: currentLat.toString(),
                    lng: currentLng.toString(),
                    title: shopName,
                    target: "select",
                  })
                }
              >
                <Ionicons name="expand-outline" size={20} color={SHOP_ACCENT} />
              </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <View style={styles.mapActionsRow}>
              <TouchableOpacity style={styles.mapActionBtn} onPress={handleUseCurrentLocation} disabled={isFetchingLocation}>
                {isFetchingLocation ? (
                  <ActivityIndicator size="small" color={SHOP_ACCENT} />
                ) : (
                  <Ionicons name="locate-outline" size={18} color={SHOP_ACCENT} />
                )}
                <Text style={styles.mapActionText}>Use My Location</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mapActionBtn} onPress={shareShopLocation}>
                <Ionicons name="share-social-outline" size={18} color={SHOP_ACCENT} />
                <Text style={styles.mapActionText}>Share Location</Text>
              </TouchableOpacity>
            </View>

            {/* Step 3: Confirm address */}
            <View style={[styles.locationStepRow, { marginTop: 4 }]}>
              <View style={styles.locationStepBadge}><Text style={styles.locationStepNum}>3</Text></View>
              <Text style={styles.locationStepLabel}>Confirm your address details</Text>
            </View>

            {addressArea.length > 0 && (
              <View style={styles.addressPreviewCard}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.addressPreviewText} numberOfLines={2}>{addressArea}</Text>
              </View>
            )}

            <Field
              label="Shop / Building / Floor No."
              value={shopNo}
              onChangeText={setShopNo}
              placeholder="e.g. Plot 42, 2nd Floor"
            />
            <Field
              label="Street / Area / Locality"
              value={addressArea}
              onChangeText={setAddressArea}
              placeholder="Auto-filled from map pin"
              multiline
            />
            <Field
              label="Landmark (Optional)"
              value={landmark}
              onChangeText={setLandmark}
              placeholder="e.g. Near BDA Complex"
            />
          </Section>

          {/* ── Owner Information ── */}
          <Section title="Owner Information" icon="person-outline">
            <Field label="Full Name" value={ownerName} onChangeText={setOwnerName} placeholder="Owner full name" />
            <View style={styles.row}>
              <Field label="Registered Mobile" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" flex={1} />
              <Field label="Secondary Mobile" value={secondaryMobile} onChangeText={setSecondaryMobile} keyboardType="phone-pad" placeholder="Optional" flex={1} />
            </View>
            <Field label="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="Enter email" />
          </Section>

          {/* ── Company Verification ── */}
          <Section title="Company Verification" icon="shield-checkmark-outline" defaultOpen={false}>
            <Field label="GST Number" value={gstNo} onChangeText={setGstNo} autoCapitalize="characters" placeholder="15-digit GSTIN" />
            <View style={styles.row}>
              <Field label="PAN Card" value={panNo} onChangeText={setPanNo} autoCapitalize="characters" placeholder="10-digit PAN" flex={1} />
              <Field label="Aadhar Number" value={aadharNo} onChangeText={setAadharNo} keyboardType="numeric" placeholder="12-digit" flex={1} />
            </View>
          </Section>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                <Text style={styles.saveBtnText}>Save Profile Changes</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandName: { fontSize: 22, fontWeight: "900", color: colors.text, letterSpacing: -0.5 },
  roleLabel: { fontSize: 9, fontWeight: "700", color: SHOP_ACCENT, letterSpacing: 1.5, marginTop: 3 },

  saveHeaderBtn: {
    backgroundColor: SHOP_SURF,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 64,
    alignItems: "center",
  },
  saveHeaderBtnText: { color: SHOP_ACCENT, fontWeight: "800", fontSize: 14 },
  notifBtnSub: { width: 44, height: 44, borderRadius: 12, backgroundColor: SHOP_SURF, alignItems: "center", justifyContent: "center" },

  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  pageTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
    marginTop: 10,
    marginBottom: 20,
    marginLeft: 4,
  },

  // Section
  sectionWrap: { marginBottom: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginBottom: 4,
  },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: SHOP_SURF,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    ...Shadow.sm,
  },

  // Field
  fieldWrap: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: "700", color: colors.muted, marginBottom: 6, marginLeft: 2 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: {
    flex: 1,
    backgroundColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputDisabled: { color: colors.muted },
  row: { flexDirection: "row", gap: 12 },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
  },
  verifiedText: { color: "white", fontWeight: "800", fontSize: 12 },

  // Location steps
  locationStepRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  locationStepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: SHOP_ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  locationStepNum: { color: "white", fontSize: 12, fontWeight: "800" },
  locationStepLabel: { fontSize: 13, fontWeight: "600", color: colors.text, flex: 1 },

  // Search
  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },

  suggestionsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...Shadow.md,
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: "flex-start",
  },
  suggestionTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  suggestionSubtitle: { fontSize: 12, color: colors.muted, marginTop: 2 },

  // Map
  mapContainer: {
    borderRadius: 18,
    overflow: "hidden",
    height: 240,
    backgroundColor: colors.border,
    marginBottom: 12,
    ...Shadow.sm,
  },
  map: { width: "100%", height: "100%" },
  expandMapBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: colors.surface,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.sm,
  },

  mapActionsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  mapActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: SHOP_SURF,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  mapActionText: { fontSize: 13, fontWeight: "700", color: SHOP_ACCENT },

  addressPreviewCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  addressPreviewText: { flex: 1, fontSize: 13, fontWeight: "600", color: colors.text },

  // Save button
  saveBtn: {
    backgroundColor: SHOP_ACCENT,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    ...Shadow.md,
    shadowColor: SHOP_ACCENT,
  },
  saveBtnText: { color: "white", fontSize: 16, fontWeight: "800" },
});
