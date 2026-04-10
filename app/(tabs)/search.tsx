import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useShopStore } from '@/stores/shopStore';

export default function SearchScreen() {
  const router = useRouter();
  const { shops, filters, toggleFilter, setMaxPrice } = useShopStore();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'list' | 'map'>('list');

  const filtered = useMemo(() => {
    let items = shops.filter((shop) => shop.name.toLowerCase().includes(query.toLowerCase()));
    if (filters.openNow) items = items.filter((shop) => shop.isOpen);
    if (filters.topRated) items = items.filter((shop) => shop.rating >= 4.5);
    if (filters.maxPrice != null) {
      const maxPrice = filters.maxPrice;
      items = items.filter((shop) => shop.pricePerCan <= maxPrice);
    }
    return [...items].sort((a, b) => (filters.nearest ? a.distanceKm - b.distanceKm : b.rating - a.rating));
  }, [filters, query, shops]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search Shops</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications' as any)}>
          <Ionicons name="notifications-outline" size={22} color="#005d90" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Search smart</Text>
          <Text style={styles.heroCopy}>Use filters for open shops, ratings, distance, and price so the results stay easy to scan.</Text>
        </View>

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

        <View style={styles.filterRow}>
          <FilterChip label="Open Now" active={filters.openNow} onPress={() => toggleFilter('openNow')} />
          <FilterChip label="Top Rated" active={filters.topRated} onPress={() => toggleFilter('topRated')} />
          <FilterChip label="Nearest" active={filters.nearest} onPress={() => toggleFilter('nearest')} />
          <FilterChip label="Price ≤ 45" active={filters.maxPrice === 45} onPress={() => setMaxPrice(filters.maxPrice === 45 ? null : 45)} />
        </View>

        <View style={styles.modeRow}>
          <ToggleButton label="List View" active={mode === 'list'} onPress={() => setMode('list')} />
          <ToggleButton label="Map View" active={mode === 'map'} onPress={() => setMode('map')} />
        </View>

        {mode === 'map' ? (
          <TouchableOpacity 
            style={styles.mapStub} 
            activeOpacity={0.8}
            onPress={() => router.push('/search-map' as any)}
          >
            <View style={styles.mapIconWrap}>
              <Ionicons name="map-outline" size={36} color="#005d90" />
            </View>
            <Text style={styles.mapTitle}>Interactive Map Ready</Text>
            <Text style={styles.mapCopy}>Open the full screen map to browse shops around your specific location.</Text>
            <View style={styles.mapBtn}>
              <Text style={styles.mapBtnText}>Open Full Map</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.listWrap}>
            {filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color="#bfc7d1" />
                <Text style={styles.emptyTitle}>No shops found</Text>
                <Text style={styles.emptySubtitle}>Try adjusting your filters or search query.</Text>
              </View>
            ) : (
              filtered.map((shop) => (
                <TouchableOpacity key={shop.id} style={styles.card} onPress={() => router.push(`/order/${shop.id}` as any)}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.shopName}>{shop.name}</Text>
                        <Text style={styles.ratingRow}>
                          <Ionicons name="star" size={12} color="#f59e0b" />
                          <Text style={styles.ratingText}>{shop.rating}</Text>
                          <Text style={styles.ratingReviews}>(120+ reviews)</Text>
                        </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: shop.isOpen ? '#e8f5e9' : '#ffdad6' }]}>
                      <Text style={[styles.badgeText, { color: shop.isOpen ? '#2e7d32' : '#ba1a1a' }]}>{shop.isOpen ? 'OPEN' : 'CLOSED'}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={14} color="#707881" />
                      <Text style={styles.metaText}>{shop.area} ({shop.distanceKm} km)</Text>
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
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.92)',
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#181c20', letterSpacing: -0.5 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f4f9',
    alignItems: 'center', justifyContent: 'center',
  },

  hero: { backgroundColor: '#e0f0ff', borderRadius: 22, padding: 20, gap: 6, marginTop: 16, marginBottom: 20 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#005d90', letterSpacing: -0.5 },
  heroCopy: { color: '#004a73', lineHeight: 20, fontSize: 13, fontWeight: '500' },
  
  searchBox: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    borderRadius: 18, paddingHorizontal: 16, height: 56, gap: 12, 
    borderWidth: 1.5, borderColor: '#e0e2e8', marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '600', color: '#181c20' },
  
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1.5, borderColor: '#e0e2e8', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#005d90', borderColor: '#005d90' },
  chipText: { color: '#707881', fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  
  modeRow: { flexDirection: 'row', backgroundColor: '#ebeef4', borderRadius: 16, padding: 4, marginBottom: 20 },
  toggle: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  toggleActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  toggleText: { fontWeight: '700', color: '#707881', fontSize: 14 },
  toggleTextActive: { color: '#005d90', fontWeight: '900' },
  
  mapStub: { 
    backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', 
    borderWidth: 1.5, borderColor: '#e0f0ff', borderStyle: 'dashed',
  },
  mapIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f0f7ff', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  mapTitle: { fontSize: 20, fontWeight: '900', color: '#181c20', marginBottom: 8, textAlign: 'center' },
  mapCopy: { textAlign: 'center', color: '#707881', lineHeight: 22, fontSize: 14, marginBottom: 24, paddingHorizontal: 10 },
  mapBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#005d90', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16 },
  mapBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },

  listWrap: { gap: 16 },
  card: { 
    backgroundColor: '#fff', borderRadius: 22, padding: 20, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: '#f1f4f9'
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 16 },
  shopName: { fontSize: 18, fontWeight: '900', color: '#181c20', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, fontWeight: '800', color: '#181c20' },
  ratingReviews: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f4f9' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#707881', fontSize: 13, fontWeight: '600' },
  
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 13, color: '#707881', fontWeight: '500' },
  priceText: { fontSize: 18, fontWeight: '900', color: '#005d90' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#181c20', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#707881', marginTop: 4 },
});
