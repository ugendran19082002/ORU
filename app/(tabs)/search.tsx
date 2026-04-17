import { ExpoMap } from "@/components/maps/ExpoMap";
import { useShopStore } from "@/stores/shopStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { apiClient } from "@/api/client";
import { Shadow, thannigoPalette, roleAccent, roleSurface, roleGradients } from "@/constants/theme";

const CUSTOMER_ACCENT = roleAccent.customer;
const CUSTOMER_SURF = roleSurface.customer;
const CUSTOMER_GRAD: [string, string] = [roleGradients.customer.start, roleGradients.customer.end];

interface ApiShop {
  id: number;
  name: string;
  city: string;
  avg_rating: number;
  is_open: boolean;
  latitude: number;
  longitude: number;
  distance_km?: number;
  min_order_value?: number;
}

export default function SearchScreen() {
  const router = useRouter();
  const { shops: localShops, filters, toggleFilter, setMaxPrice } = useShopStore();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"list" | "map">("list");
  const [apiResults, setApiResults] = useState<ApiShop[] | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchShops = useCallback(async (q: string) => {
    if (!q.trim()) {
      setApiResults(null);
      return;
    }
    try {
      setSearching(true);
      const res = await apiClient.get('/shops/search', {
        params: { query: q.trim(), limit: 30 },
      });
      if (res.data.status === 1) {
        const data = res.data.data?.data ?? res.data.data ?? [];
        setApiResults(data);
      }
    } catch {
      // Fall back to local filter silently
      setApiResults(null);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setApiResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      searchShops(query);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchShops]);

  // Merge API results with local filters, or fall back to local store
  const filtered = useMemo(() => {
    if (apiResults !== null) {
      return apiResults
        .filter((s) => !filters.openNow || s.is_open)
        .filter((s) => !filters.topRated || s.avg_rating >= 4.5)
        .sort((a, b) => filters.nearest
          ? (a.distance_km ?? 0) - (b.distance_km ?? 0)
          : b.avg_rating - a.avg_rating
        )
        .map((s) => ({
          id: String(s.id),
          name: s.name,
          area: s.city,
          rating: s.avg_rating ?? 0,
          isOpen: s.is_open,
          lat: s.latitude,
          lng: s.longitude,
          distanceKm: s.distance_km ?? 0,
          eta: s.distance_km ? `${Math.round(s.distance_km * 3 + 5)} min` : '—',
          pricePerCan: s.min_order_value ?? 0,
          fromApi: true,
        }));
    }
    // Local store fallback
    let items = localShops.filter((shop) =>
      shop.name.toLowerCase().includes(query.toLowerCase())
    );
    if (filters.openNow) items = items.filter((s) => s.isOpen);
    if (filters.topRated) items = items.filter((s) => s.rating >= 4.5);
    if (filters.maxPrice != null) {
      const maxPrice = filters.maxPrice;
      items = items.filter((s) => s.pricePerCan <= maxPrice);
    }
    return [...items].sort((a, b) =>
      filters.nearest ? a.distanceKm - b.distanceKm : b.rating - a.rating
    );
  }, [apiResults, localShops, filters, query]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search Shops</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push("/notifications" as any)}
        >
          <Ionicons name="notifications-outline" size={22} color={CUSTOMER_ACCENT} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* SEARCH BOX */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search shops, areas, or water types"
            placeholderTextColor="#94a3b8"
            returnKeyType="search"
          />
          {searching && <ActivityIndicator size="small" color={CUSTOMER_ACCENT} style={{ marginRight: 8 }} />}
          {query.length > 0 && !searching && (
            <TouchableOpacity onPress={() => { setQuery(''); setApiResults(null); }}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* HORIZONTAL FILTERS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          <FilterChip label="Open Now" active={filters.openNow} onPress={() => toggleFilter("openNow")} />
          <FilterChip label="Top Rated" active={filters.topRated} onPress={() => toggleFilter("topRated")} />
          <FilterChip label="Nearest" active={filters.nearest} onPress={() => toggleFilter("nearest")} />
          <FilterChip label="Price ≤ 45" active={filters.maxPrice === 45} onPress={() => setMaxPrice(filters.maxPrice === 45 ? null : 45)} />
          <View style={{ width: 40 }} />
        </ScrollView>

        <View style={styles.modeRow}>
          <ToggleButton label="List View" active={mode === "list"} onPress={() => setMode("list")} />
          <ToggleButton label="Map View" active={mode === "map"} onPress={() => setMode("map")} />
        </View>

        {mode === "map" ? (
          <View style={{ gap: 16 }}>
            <View style={[styles.mapStub, { padding: 0, overflow: "hidden", borderStyle: "solid" }]}>
              <ExpoMap
                style={{ width: "100%", height: 300 }}
                initialRegion={{ latitude: 12.9716, longitude: 80.221, latitudeDelta: 0.1, longitudeDelta: 0.1 }}
                markers={filtered.map((s) => ({ latitude: s.lat, longitude: s.lng, title: s.name, color: CUSTOMER_ACCENT }))}
                hideControls={true}
              />
              <TouchableOpacity style={styles.mapOverlayBtn} onPress={() => router.push("/search-map" as any)}>
                <Text style={styles.mapOverlayBtnText}>Expand Map</Text>
                <Ionicons name="expand-outline" size={16} color="white" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.openFullBtn} onPress={() => router.push("/search-map" as any)}>
              <Text style={styles.openFullBtnText}>Browse in Full Screen Map</Text>
              <Ionicons name="arrow-forward" size={18} color={CUSTOMER_ACCENT} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {searching && apiResults === null ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color={CUSTOMER_ACCENT} />
                <Text style={styles.emptySubtitle}>Searching shops...</Text>
              </View>
            ) : filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color="#bfc7d1" />
                <Text style={styles.emptyTitle}>No shops found</Text>
                <Text style={styles.emptySubtitle}>Try adjusting your filters or search query.</Text>
              </View>
            ) : (
              filtered.map((shop) => (
                <TouchableOpacity
                  key={shop.id}
                  style={styles.card}
                  onPress={() => router.push(`/shop-detail/${shop.id}` as any)}
                >
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.shopName}>{shop.name}</Text>
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={12} color="#f59e0b" />
                        <Text style={styles.ratingText}>{shop.rating}</Text>
                      </View>
                    </View>
                    <View style={[styles.badge, { backgroundColor: shop.isOpen ? "#e8f5e9" : "#ffdad6" }]}>
                      <Text style={[styles.badgeText, { color: shop.isOpen ? "#2e7d32" : "#ba1a1a" }]}>
                        {shop.isOpen ? "OPEN" : "CLOSED"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={14} color="#707881" />
                      <Text style={styles.metaText}>{shop.area}{shop.distanceKm > 0 ? ` (${shop.distanceKm.toFixed(1)} km)` : ''}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={14} color="#707881" />
                      <Text style={styles.metaText}>{shop.eta}</Text>
                    </View>
                  </View>

                  {shop.pricePerCan > 0 && (
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Min. order</Text>
                      <Text style={styles.priceText}>₹{shop.pricePerCan}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <TouchableOpacity activeOpacity={0.9} style={styles.heroWrapper}>
          <LinearGradient colors={CUSTOMER_GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroTitle}>Search smart</Text>
              <Text style={styles.heroCopy}>Use filters for open shops, ratings, & price to find the best water near you.</Text>
            </View>
            <View style={styles.heroCircle}>
              <Ionicons name="options-outline" size={24} color="white" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ToggleButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.toggle, active && styles.toggleActive]} onPress={onPress}>
      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: thannigoPalette.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 14, backgroundColor: thannigoPalette.surface, borderBottomWidth: 1, borderBottomColor: thannigoPalette.borderSoft },
  headerTitle: { fontSize: 24, fontWeight: "900", color: thannigoPalette.darkText, letterSpacing: -1 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: thannigoPalette.background, alignItems: "center", justifyContent: "center", ...Shadow.xs },
  heroWrapper: { marginTop: 8, marginBottom: 24, borderRadius: 22, overflow: "hidden", shadowColor: CUSTOMER_ACCENT, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 6 },
  hero: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 24, gap: 16 },
  heroLeft: { flex: 1, gap: 4 },
  heroTitle: { fontSize: 20, fontWeight: "900", color: "white", letterSpacing: -0.5 },
  heroCopy: { color: "rgba(255,255,255,0.85)", lineHeight: 18, fontSize: 12, fontWeight: "600" },
  heroCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: thannigoPalette.surface, borderRadius: 20, paddingHorizontal: 16, height: 56, gap: 12, borderWidth: 1.5, borderColor: thannigoPalette.borderSoft, marginTop: 20, marginBottom: 20, ...Shadow.xs },
  input: { flex: 1, fontSize: 15, fontWeight: "600", color: thannigoPalette.darkText },
  filterScroll: { marginHorizontal: -24, marginBottom: 24 },
  filterContent: { paddingHorizontal: 24, gap: 10 },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, borderColor: thannigoPalette.borderSoft, backgroundColor: thannigoPalette.surface },
  chipActive: { backgroundColor: CUSTOMER_ACCENT, borderColor: CUSTOMER_ACCENT },
  chipText: { color: thannigoPalette.neutral, fontWeight: "700", fontSize: 13 },
  chipTextActive: { color: "#fff" },
  modeRow: { flexDirection: "row", backgroundColor: thannigoPalette.background, borderRadius: 18, padding: 4, marginBottom: 24 },
  toggle: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 14 },
  toggleActive: { backgroundColor: thannigoPalette.surface, ...Shadow.xs },
  toggleText: { fontWeight: "700", color: thannigoPalette.neutral, fontSize: 14 },
  toggleTextActive: { color: CUSTOMER_ACCENT, fontWeight: "900" },
  mapStub: { backgroundColor: thannigoPalette.surface, borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: thannigoPalette.borderSoft, ...Shadow.sm },
  mapOverlayBtn: { position: "absolute", bottom: 16, right: 16, backgroundColor: CUSTOMER_ACCENT, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 8, ...Shadow.sm },
  mapOverlayBtnText: { color: "white", fontWeight: "800", fontSize: 13 },
  openFullBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18, backgroundColor: thannigoPalette.surface, borderRadius: 18, marginTop: 8, borderWidth: 1, borderColor: thannigoPalette.borderSoft },
  openFullBtnText: { color: CUSTOMER_ACCENT, fontWeight: "900", fontSize: 15 },
  listWrap: { gap: 16 },
  card: { backgroundColor: thannigoPalette.surface, borderRadius: 24, padding: 20, ...Shadow.sm, borderWidth: 1, borderColor: thannigoPalette.borderSoft },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 },
  shopName: { fontSize: 18, fontWeight: "900", color: thannigoPalette.darkText, marginBottom: 4, letterSpacing: -0.3 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 12, fontWeight: "900", color: thannigoPalette.darkText },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: thannigoPalette.borderSoft },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { color: thannigoPalette.neutral, fontSize: 13, fontWeight: "700" },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceLabel: { fontSize: 13, color: thannigoPalette.neutral, fontWeight: "600" },
  priceText: { fontSize: 20, fontWeight: "900", color: CUSTOMER_ACCENT, letterSpacing: -0.5 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 19, fontWeight: "900", color: thannigoPalette.darkText, letterSpacing: -0.5 },
  emptySubtitle: { fontSize: 14, color: thannigoPalette.neutral, textAlign: "center", maxWidth: "80%" },
});
