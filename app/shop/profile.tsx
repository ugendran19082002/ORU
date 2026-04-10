import { ExpoMap, ExpoMarker } from "@/components/maps/ExpoMap";
import { Logo } from "@/components/ui/Logo";
import {
  clearGlobalLocationListener,
  setGlobalLocationListener,
} from "@/utils/locationEvents";
import { safeNavigate } from "@/utils/safeNavigation";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StitchScreenNote } from "@/components/stitch/StitchScreenNote";

/**
 * PRODUCTION DEBUG HELPER: Validate coordinates before use
 */
const isValidCoordinate = (lat: number, lng: number): boolean => {
  const valid =
    lat !== undefined &&
    lat !== null &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;
  console.log("📍 [SHOP COORD VALIDATION]:", { lat, lng, valid });
  return valid;
};

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export default function ShopProfileScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const [shopName, setShopName] = useState("Blue Spring Aquatics");
  const [ownerName, setOwnerName] = useState("Rajesh Kumar");
  const [mobile, setMobile] = useState("+91 98765 43210");
  const [fssai, setFssai] = useState("11223344556677");

  // Multi-Field Address (Reference: addresses.tsx)
  const [shopNo, setShopNo] = useState("Plot 42");
  const [addressArea, setAddressArea] = useState(
    "Industrial Area, Koramangala, Bangalore",
  );
  const [landmark, setLandmark] = useState("Near BDA Complex");

  // Payment Details
  const [bankName, setBankName] = useState("State Bank of India");
  const [bankBranch, setBankBranch] = useState("Koramangala Main");
  const [ifscCode, setIfscCode] = useState("SBIN0001234");
  const [holderName, setHolderName] = useState("Rajesh Kumar");
  const [upiId, setUpiId] = useState("rajesh@oksbi");

  // Company & Contact Details
  const [gstNo, setGstNo] = useState("29ABCDE1234F1Z5");
  const [panNo, setPanNo] = useState("ABCDE1234F");
  const [aadharNo, setAadharNo] = useState("1234 5678 9012");
  const [secondaryMobile, setSecondaryMobile] = useState("");
  const [email, setEmail] = useState("rajesh.kumar@example.com");

  // Location Details
  const [currentLat, setCurrentLat] = useState<number>(12.9716);
  const [currentLng, setCurrentLng] = useState<number>(80.221);
  const [region, setRegion] = useState<Region>({
    latitude: 12.9716,
    longitude: 80.221,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = async (query: string) => {
    console.log("=== [SHOP WAY 1: SEARCH START] ===");
    console.log("Query:", query);
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
      console.log("Photon results:", photonData.features?.length || 0);
      let results: any[] = [];
      if (photonData.features && photonData.features.length > 0) {
        results = photonData.features.map((f: any) => ({
          title: f.properties.name || f.properties.street || "Location",
          subtitle: [f.properties.city, f.properties.state]
            .filter(Boolean)
            .join(", "),
          address: f.properties.name
            ? f.properties.name + ", " + (f.properties.city || "")
            : f.properties.street,
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
        }));
      }

      if (results.length < 2) {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3`,
          {
            headers: { "User-Agent": "ThanniGoApp/1.0" },
          },
        );
        const nomData = await nomRes.json();
        const nomResults = nomData.map((item: any) => ({
          title: item.display_name.split(",")[0],
          subtitle: item.display_name.split(",").slice(1, 3).join(",").trim(),
          address: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));
        results = [...results, ...nomResults];
      }
      setSuggestions(results);
    } catch (error) {
      console.log("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = (item: any) => {
    console.log("=== [SHOP WAY 1: SUGGESTION SELECTED] ===");
    console.log("Item:", item.title);
    setAddressArea(item.address || item.title);
    setCurrentLat(item.lat);
    setCurrentLng(item.lng);
    setRegion({
      ...region,
      latitude: item.lat,
      longitude: item.lng,
    });
    setSuggestions([]);
  };

  const handleUseCurrentLocation = async () => {
    console.log("=== [SHOP WAY 3: PIN MAP - GPS START] ===");
    setIsFetchingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      console.log("Permission status:", status);
      if (status !== "granted") {
        console.warn("⛔ [SHOP GPS] Permission denied");
        Alert.alert(
          "Permission denied",
          "Allow location access to pin your shop.",
        );
        setIsFetchingLocation(false);
        return;
      }

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
          const currentAcc = loc.coords.accuracy || 100;
          if (!best || currentAcc < (best.coords.accuracy || 100)) {
            best = loc;
            const newRegion = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            };
            setRegion(newRegion);
            setCurrentLat(loc.coords.latitude);
            setCurrentLng(loc.coords.longitude);
          }

          if (count > 8 || currentAcc < 15) {
            watcher.remove();
            finalizeLocation(best!);
          }
        },
      );

      setTimeout(() => {
        watcher.remove();
        if (best) finalizeLocation(best);
        setIsFetchingLocation(false);
      }, 5000);
    } catch {
      setIsFetchingLocation(false);
    }
  };

  const finalizeLocation = async (loc: Location.LocationObject) => {
    const { latitude, longitude } = loc.coords;
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
        console.log("✅ [SHOP GPS] Nominatim reverse:", parts.join(", "));
      } else if (data?.display_name) {
        setAddressArea(data.display_name);
      }
    } catch {
      console.warn("[SHOP GPS] Nominatim failed, fallback");
      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (geocode.length > 0) {
          const g = geocode[0];
          const parts = [g.street, g.district || g.subregion, g.city].filter(
            Boolean,
          );
          setAddressArea(parts.join(", "));
        }
      } catch {}
    }
    setIsFetchingLocation(false);
  };

  /**
   * Unified drag handler — called by LeafletMap via postMessage bridge.
   * Uses Nominatim reverse geocode (free, more accurate for Indian addresses).
   */
  const handleMarkerDragEnd = async (coords: {
    latitude: number;
    longitude: number;
  }) => {
    console.log("=== [SHOP WAY 3: PIN MAP - DRAG/TAP] ===");
    const { latitude, longitude } = coords;
    console.log("Pinned Coords:", { latitude, longitude });
    setCurrentLat(latitude);
    setCurrentLng(longitude);
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
        console.log("✅ [SHOP] Nominatim reverse:", parts.join(", "));
      } else if (data?.display_name) {
        setAddressArea(data.display_name);
      }
    } catch (fetchErr) {
      console.warn("[SHOP DRAG] Nominatim failed, fallback:", fetchErr);
      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (geocode.length > 0) {
          const g = geocode[0];
          const parts = [g.street, g.district || g.subregion, g.city].filter(
            Boolean,
          );
          setAddressArea(parts.join(", "));
        }
      } catch {}
    }
  };

  /** Shim: native ExpoMarker sends e.nativeEvent.coordinate */
  const handleNativeMarkerDragEnd = (e: any) => {
    handleMarkerDragEnd(e.nativeEvent.coordinate);
  };

  useEffect(() => {
    setGlobalLocationListener((coords) => {
      console.log("=== [GLOBAL LISTENER] Map Preview Selected ===", coords);
      handleMarkerDragEnd({ latitude: coords.lat, longitude: coords.lng });
    });
    return () => clearGlobalLocationListener();
  }, []);

  const shareShopLocation = async () => {
    try {
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLng}`;
      await Share.share({
        message: `📍 Visit ${shopName} at:\n${shopNo}, ${addressArea}\n\nLocation Link: ${mapUrl}`,
        title: `ThanniGo - ${shopName}`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <View style={styles.brandRow}>
            <Logo size="md" />
            <Text style={styles.brandName}>ThanniGo</Text>
          </View>
          <Text style={styles.roleLabel}>SHOP PANEL</Text>
        </View>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => {
            console.log("=== [SHOP] Edit Click ===");
            Alert.alert(
              "Profile Update",
              "Are you sure you want to save changes?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Save",
                  onPress: () => console.log("✅ [SHOP] Profile Saved (Mock)"),
                },
              ],
            );
          }}
        >
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      >
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#005d90"]}
              tintColor="#005d90"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <Text style={styles.pageTitle}>Shop Profile</Text>
          <StitchScreenNote screen="shop_settings_profile" />

          {/* PROFILE BANNER */}
          <View style={styles.bannerContainer}>
            <Image
              source={{ uri: "https://picsum.photos/seed/shopbanner/800/400" }}
              style={styles.bannerImg}
            />
            <View style={styles.bannerOverlay} />
            <View style={styles.avatarWrap}>
              <Ionicons name="storefront" size={32} color="#005d90" />
            </View>
            <TouchableOpacity style={styles.uploadBtn}>
              <Ionicons name="camera" size={16} color="white" />
            </TouchableOpacity>
          </View>

          {/* SHOP INFO */}
          <Text style={styles.sectionTitle}>Business Details</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Shop Name</Text>
              <TextInput
                style={styles.input}
                value={shopName}
                onChangeText={setShopName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>FSSAI License Number</Text>
              <View style={styles.fssaiRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  value={fssai}
                  onChangeText={setFssai}
                />
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="white" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>
            </View>
          </View>

          {/* LOCATION SECTION */}
          <Text style={styles.sectionTitle}>Store Location</Text>
          <View style={styles.card}>
            <Text style={[styles.label, { marginBottom: 6 }]}>
              Pin Location on Map
            </Text>
            <View style={[styles.mapContainer, { marginBottom: 16 }]}>
              <ExpoMap
                style={styles.map}
                region={region}
                onRegionChangeComplete={setRegion}
                showsUserLocation
                draggable
                markerTitle={shopName}
                onMarkerDragEnd={handleMarkerDragEnd}
              >
                <ExpoMarker
                  coordinate={{ latitude: currentLat, longitude: currentLng }}
                  draggable
                  onDragEnd={handleNativeMarkerDragEnd}
                  title={shopName}
                />
              </ExpoMap>
              <View style={styles.mapOverlay}>
                <TouchableOpacity
                  style={styles.mapActionBtn}
                  onPress={() => {
                    if (isValidCoordinate(currentLat, currentLng)) {
                      safeNavigate("/map-preview", {
                        lat: currentLat.toString(),
                        lng: currentLng.toString(),
                        title: shopName,
                        target: "select",
                      });
                    } else {
                      Alert.alert(
                        "Error",
                        "Invalid shop coordinates. Please pin on map again.",
                      );
                    }
                  }}
                >
                  <Ionicons name="eye-outline" size={20} color="#005d90" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.mapActionBtn, { marginTop: 8 }]}
                  onPress={shareShopLocation}
                >
                  <Ionicons
                    name="share-social-outline"
                    size={20}
                    color="#005d90"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.gpsBtn, { marginBottom: 16 }]}
              onPress={handleUseCurrentLocation}
            >
              {isFetchingLocation ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="locate" size={20} color="#ffffff" />
              )}
              <Text style={styles.gpsBtnText}>Use current location</Text>
            </TouchableOpacity>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Shop / Building / Floor No.</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Plot 42, 2nd Floor"
                value={shopNo}
                onChangeText={setShopNo}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Landmark (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Near BDA Complex"
                value={landmark}
                onChangeText={setLandmark}
              />
            </View>
            <View style={styles.inputGroup}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <Text style={[styles.label, { marginBottom: 0 }]}>
                  Search Street / Area / Road
                </Text>
                {isSearching && (
                  <ActivityIndicator size="small" color="#005d90" />
                )}
              </View>
              <TextInput
                style={[
                  styles.input,
                  { minHeight: 60, textAlignVertical: "top" },
                ]}
                value={addressArea}
                onChangeText={(text) => {
                  setAddressArea(text);
                  performSearch(text);
                }}
                multiline
                placeholder="Search or enter area..."
              />

              {suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {suggestions.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.suggestionItem,
                        index === suggestions.length - 1 && {
                          borderBottomWidth: 0,
                        },
                      ]}
                      onPress={() => handleSelectSuggestion(item)}
                    >
                      <Ionicons
                        name="location-outline"
                        size={18}
                        color="#005d90"
                        style={{ marginTop: 2 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.suggestionTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text
                          style={styles.suggestionSubtitle}
                          numberOfLines={1}
                        >
                          {item.subtitle}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* OWNER INFO */}
          <Text style={styles.sectionTitle}>Owner Information</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={ownerName}
                onChangeText={setOwnerName}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Registered Mobile</Text>
                <TextInput
                  style={styles.input}
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Secondary Mobile</Text>
                <TextInput
                  style={styles.input}
                  value={secondaryMobile}
                  onChangeText={setSecondaryMobile}
                  keyboardType="phone-pad"
                  placeholder="Optional"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter email"
              />
            </View>
          </View>

          {/* COMPANY VERIFICATION */}
          <Text style={styles.sectionTitle}>Company Verification</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>GST Number</Text>
              <TextInput
                style={[styles.input, { textTransform: "uppercase" }]}
                value={gstNo}
                onChangeText={setGstNo}
                autoCapitalize="characters"
                placeholder="15-digit GSTIN"
              />
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>PAN Card Number</Text>
                <TextInput
                  style={[styles.input, { textTransform: "uppercase" }]}
                  value={panNo}
                  onChangeText={setPanNo}
                  autoCapitalize="characters"
                  placeholder="10-digit PAN"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1.2 }]}>
                <Text style={styles.label}>Aadhar Number</Text>
                <TextInput
                  style={styles.input}
                  value={aadharNo}
                  onChangeText={setAadharNo}
                  keyboardType="numeric"
                  placeholder="12-digit Aadhar"
                />
              </View>
            </View>
          </View>

          {/* PAYMENT DETAILS */}
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Holder Name</Text>
              <TextInput
                style={styles.input}
                value={holderName}
                onChangeText={setHolderName}
                placeholder="As per bank records"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bank Name</Text>
              <TextInput
                style={styles.input}
                value={bankName}
                onChangeText={setBankName}
                placeholder="Enter bank name"
              />
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={[styles.inputGroup, { flex: 1.2 }]}>
                <Text style={styles.label}>Bank Branch</Text>
                <TextInput
                  style={styles.input}
                  value={bankBranch}
                  onChangeText={setBankBranch}
                  placeholder="Branch"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>IFSC Code</Text>
                <TextInput
                  style={[styles.input, { textTransform: "uppercase" }]}
                  value={ifscCode}
                  onChangeText={setIfscCode}
                  placeholder="IFSC"
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { marginBottom: 0 }]}>
              <Text style={styles.label}>UPI ID (Optional)</Text>
              <TextInput
                style={styles.input}
                value={upiId}
                onChangeText={setUpiId}
                placeholder="e.g. name@upi"
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => Alert.alert("Profile Saved", "Shop profile details have been updated in this mock flow.")}
          >
            <Text style={styles.saveBtnText}>Save Profile Changes</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9ff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#003a5c",
    letterSpacing: -0.5,
  },
  roleLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#006878",
    letterSpacing: 1.5,
    marginTop: 3,
  },
  editBtn: {
    backgroundColor: "#e0f0ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  editBtnText: { color: "#005d90", fontWeight: "800", fontSize: 13 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  pageTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#181c20",
    letterSpacing: -0.5,
    marginTop: 10,
    marginBottom: 20,
  },

  bannerContainer: {
    width: "100%",
    height: 160,
    borderRadius: 24,
    marginBottom: 40,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  bannerImg: { width: "100%", height: "100%" },
  bannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,30,50,0.2)",
  },
  avatarWrap: {
    position: "absolute",
    bottom: -20,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#f7f9ff",
  },
  uploadBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#181c20",
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },

  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#707881",
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#f1f4f9",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "600",
    color: "#181c20",
    borderWidth: 1,
    borderColor: "#e0e2e8",
  },

  fssaiRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2e7d32",
    paddingHorizontal: 12,
    height: 50,
    borderRadius: 12,
  },
  verifiedText: { color: "white", fontWeight: "800", fontSize: 12 },

  gpsBtn: {
    backgroundColor: "#005d90",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 14,
    gap: 10,
    marginBottom: 20,
    shadowColor: "#005d90",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  gpsBtnText: { color: "#ffffff", fontWeight: "800", fontSize: 15 },

  saveBtn: {
    backgroundColor: "#005d90",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#005d90",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnText: { color: "white", fontSize: 16, fontWeight: "800" },

  // MAP STYLES
  mapContainer: {
    borderRadius: 16,
    overflow: "hidden",
    height: 180,
    backgroundColor: "#f1f4f9",
    borderWidth: 1,
    borderColor: "#e0e2e8",
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  map: { width: "100%", height: "100%" },
  mapOverlay: { position: "absolute", bottom: 12, right: 12 },
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
  liveMapText: {
    position: "absolute",
    bottom: 12,
    left: 12,
    color: "#005d90", // More visible color for shop profile
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  mapActionText: { color: "#005d90", fontWeight: "800", fontSize: 12 },

  // SUGGESTIONS STYLES
  suggestionsContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e0e2e8",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f4f9",
  },
  suggestionTitle: { fontSize: 14, fontWeight: "700", color: "#181c20" },
  suggestionSubtitle: { fontSize: 12, color: "#707881", marginTop: 2 },
});
