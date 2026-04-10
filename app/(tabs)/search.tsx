import { ExpoMap } from "@/components/maps/ExpoMap";
import { useShopStore } from "@/stores/shopStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

export default function SearchScreen() {
  const router = useRouter();
  const { shops, filters, toggleFilter, setMaxPrice } = useShopStore();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"list" | "map">("list");

  const filtered = useMemo(() => {
    let items = shops.filter((shop) =>
      shop.name.toLowerCase().includes(query.toLowerCase()),
    );
    if (filters.openNow) items = items.filter((shop) => shop.isOpen);
    if (filters.topRated) items = items.filter((shop) => shop.rating >= 4.5);
    if (filters.maxPrice != null) {
      const maxPrice = filters.maxPrice;
      items = items.filter((shop) => shop.pricePerCan <= maxPrice);
    }
    return [...items].sort((a, b) =>
      filters.nearest ? a.distanceKm - b.distanceKm : b.rating - a.rating,
    );
  }, [filters, query, shops]);

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
          <Ionicons name="notifications-outline" size={22} color="#005d90" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search shops, areas, or water types"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* HORIZONTAL FILTERS */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          <FilterChip
            label="Open Now"
            active={filters.openNow}
            onPress={() => toggleFilter("openNow")}
          />
          <FilterChip
            label="Top Rated"
            active={filters.topRated}
            onPress={() => toggleFilter("topRated")}
          />
          <FilterChip
            label="Nearest"
            active={filters.nearest}
            onPress={() => toggleFilter("nearest")}
          />
          <FilterChip
            label="Price ≤ 45"
            active={filters.maxPrice === 45}
            onPress={() => setMaxPrice(filters.maxPrice === 45 ? null : 45)}
          />
          <View style={{ width: 40 }} />
        </ScrollView>

        <View style={styles.modeRow}>
          <ToggleButton
            label="List View"
            active={mode === "list"}
            onPress={() => setMode("list")}
          />
          <ToggleButton
            label="Map View"
            active={mode === "map"}
            onPress={() => setMode("map")}
          />
        </View>

        {mode === "map" ? (
          <View style={{ gap: 16 }}>
            <View
              style={[
                styles.mapStub,
                { padding: 0, overflow: "hidden", borderStyle: "solid" },
              ]}
            >
              <ExpoMap
                style={{ width: "100%", height: 300 }}
                initialRegion={{
                  latitude: 12.9716,
                  longitude: 80.221,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }}
                markers={filtered.map((s) => ({
                  latitude: s.lat,
                  longitude: s.lng,
                  title: s.name,
                  color: "#005d90",
                }))}
                hideControls={true}
              />
              <TouchableOpacity
                style={styles.mapOverlayBtn}
                onPress={() => router.push("/search-map" as any)}
              >
                <Text style={styles.mapOverlayBtnText}>Expand Map</Text>
                <Ionicons name="expand-outline" size={16} color="white" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.openFullBtn}
              onPress={() => router.push("/search-map" as any)}
            >
              <Text style={styles.openFullBtnText}>
                Browse in Full Screen Map
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#005d90" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color="#bfc7d1" />
                <Text style={styles.emptyTitle}>No shops found</Text>
                <Text style={styles.emptySubtitle}>
                  Try adjusting your filters or search query.
                </Text>
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
                      <Text style={styles.ratingRow}>
                        <Ionicons name="star" size={12} color="#f59e0b" />
                        <Text style={styles.ratingText}>{shop.rating}</Text>
                        <Text style={styles.ratingReviews}>(120+ reviews)</Text>
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: shop.isOpen ? "#e8f5e9" : "#ffdad6",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: shop.isOpen ? "#2e7d32" : "#ba1a1a" },
                        ]}
                      >
                        {shop.isOpen ? "OPEN" : "CLOSED"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color="#707881"
                      />
                      <Text style={styles.metaText}>
                        {shop.area} ({shop.distanceKm} km)
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={14} color="#707881" />
                      <Text style={styles.metaText}>{shop.eta}</Text>
                    </View>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Starting from</Text>
                    <Text style={styles.priceText}>₹{shop.pricePerCan}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
        <TouchableOpacity activeOpacity={0.9} style={styles.heroWrapper}>
          <LinearGradient
            colors={["#005d90", "#0077b6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroLeft}>
              <Text style={styles.heroTitle}>Search smart</Text>
              <Text style={styles.heroCopy}>
                Use filters for open shops, ratings, & price to find the best water near you.
              </Text>
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

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ToggleButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.toggle, active && styles.toggleActive]}
      onPress={onPress}
    >
      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9ff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f4f9",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#181c20",
    letterSpacing: -1,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#f1f4f9",
    alignItems: "center",
    justifyContent: "center",
  },

  heroWrapper: {
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#005d90",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
    gap: 16,
  },
  heroLeft: { flex: 1, gap: 4 },
  heroTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "white",
    letterSpacing: -0.5,
  },
  heroCopy: {
    color: "rgba(255,255,255,0.85)",
    lineHeight: 18,
    fontSize: 12,
    fontWeight: "600",
  },
  heroCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#e0e2e8",
    marginTop: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 4,
  },
  input: { flex: 1, fontSize: 15, fontWeight: "600", color: "#181c20" },

  filterScroll: {
    marginHorizontal: -24, // Allow bleed to edges
    marginBottom: 24,
  },
  filterContent: {
    paddingHorizontal: 24,
    gap: 10,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e0e2e8",
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#005d90", borderColor: "#005d90" },
  chipText: { color: "#707881", fontWeight: "700", fontSize: 13 },
  chipTextActive: { color: "#fff" },

  modeRow: {
    flexDirection: "row",
    backgroundColor: "#ebeef4",
    borderRadius: 18,
    padding: 4,
    marginBottom: 24,
  },
  toggle: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 14,
  },
  toggleActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleText: { fontWeight: "700", color: "#707881", fontSize: 14 },
  toggleTextActive: { color: "#005d90", fontWeight: "900" },

  mapStub: {
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f1f4f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  mapOverlayBtn: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(0, 93, 144, 0.95)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  mapOverlayBtnText: { color: "white", fontWeight: "800", fontSize: 13 },

  openFullBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    backgroundColor: "white",
    borderRadius: 18,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#f1f4f9",
  },
  openFullBtnText: { color: "#005d90", fontWeight: "900", fontSize: 15 },

  listWrap: { gap: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f4f9",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  shopName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#181c20",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 12, fontWeight: "900", color: "#181c20" },
  ratingReviews: { fontSize: 12, color: "#94a3b8", fontWeight: "600" },

  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f4f9",
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { color: "#707881", fontSize: 13, fontWeight: "700" },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: { fontSize: 13, color: "#94a3b8", fontWeight: "600" },
  priceText: { fontSize: 20, fontWeight: "900", color: "#005d90", letterSpacing: -0.5 },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#181c20",
    marginTop: 20,
    letterSpacing: -0.5,
  },
  emptySubtitle: { fontSize: 14, color: "#707881", marginTop: 6, textAlign: "center", maxWidth: "80%" },
});
