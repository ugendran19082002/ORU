import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { StitchScreenShell } from '@/components/stitch/StitchScreenShell';
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
    <StitchScreenShell
      title="Search & Filters"
      subtitle="Find nearby water shops quickly with the stitched list and map search flow."
      accent="#005d90"
      screen="search"
      onBack={() => router.back()}
      rightAction={
        <TouchableOpacity style={styles.headerAction} onPress={() => router.push('/notifications' as any)}>
          <Ionicons name="notifications-outline" size={18} color="#005d90" />
        </TouchableOpacity>
      }
    >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Search smart</Text>
          <Text style={styles.heroCopy}>Use filters for open shops, ratings, distance, and price so the results stay easy to scan.</Text>
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#64748b" />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search shops, water types, or areas"
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
          <ToggleButton label="List" active={mode === 'list'} onPress={() => setMode('list')} />
          <ToggleButton label="Map" active={mode === 'map'} onPress={() => setMode('map')} />
        </View>

        {mode === 'map' ? (
          <View style={styles.mapStub}>
            <Ionicons name="map-outline" size={32} color="#005d90" />
            <Text style={styles.mapTitle}>Map view ready</Text>
            <Text style={styles.mapCopy}>The search workflow now supports list and map modes from the OpenSpec.</Text>
          </View>
        ) : (
          filtered.map((shop) => (
            <TouchableOpacity key={shop.id} style={styles.card} onPress={() => router.push(`/order/${shop.id}` as any)}>
              <View style={styles.cardTop}>
                <Text style={styles.shopName}>{shop.name}</Text>
                <View style={[styles.badge, { backgroundColor: shop.isOpen ? '#E8F5E9' : '#FFEBEE' }]}>
                  <Text style={[styles.badgeText, { color: shop.isOpen ? '#27AE60' : '#C0392B' }]}>{shop.isOpen ? 'OPEN' : 'CLOSED'}</Text>
                </View>
              </View>
              <Text style={styles.meta}>{shop.area} • {shop.distanceKm.toFixed(1)} km • {shop.eta}</Text>
              <Text style={styles.meta}>Rating {shop.rating} • ₹{shop.pricePerCan}/can</Text>
            </TouchableOpacity>
          ))
        )}
    </StitchScreenShell>
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
  headerAction: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  hero: { backgroundColor: '#E8F4FD', borderRadius: 22, padding: 18, gap: 6 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#005d90' },
  heroCopy: { color: '#4B5563', lineHeight: 20 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, paddingHorizontal: 16, gap: 10, borderWidth: 1, borderColor: '#E0EAF5' },
  input: { flex: 1, paddingVertical: 14, color: '#1A1A2E' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: '#ADEBF4', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#0077B6', borderColor: '#0077B6' },
  chipText: { color: '#74777C', fontWeight: '700', fontSize: 12 },
  chipTextActive: { color: '#fff' },
  modeRow: { flexDirection: 'row', gap: 10 },
  toggle: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 16, backgroundColor: '#fff' },
  toggleActive: { backgroundColor: '#005d90' },
  toggleText: { fontWeight: '800', color: '#005d90' },
  toggleTextActive: { color: '#fff' },
  mapStub: { backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', gap: 8 },
  mapTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  mapCopy: { textAlign: 'center', color: '#74777C', lineHeight: 20 },
  card: { backgroundColor: '#fff', borderRadius: 22, padding: 18, gap: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  shopName: { fontSize: 17, fontWeight: '800', color: '#1A1A2E', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  meta: { color: '#74777C', fontSize: 13 },
});
