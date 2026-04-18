import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { ExpoMap } from '@/components/maps/ExpoMap';
import { useShopStore } from '@/stores/shopStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/providers/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '@/api/client';
import { Shadow, roleAccent, roleSurface, roleGradients } from '@/constants/theme';

const ACCENT = roleAccent.customer;
const SURF = roleSurface.customer;
const GRAD: [string, string] = [roleGradients.customer.start, roleGradients.customer.end];

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

const FILTER_OPTIONS = [
  { key: 'openNow',  label: 'Open Now',  icon: 'time-outline' },
  { key: 'topRated', label: 'Top Rated', icon: 'star-outline' },
  { key: 'nearest',  label: 'Nearest',   icon: 'navigate-outline' },
  { key: 'cheap',    label: 'Under ₹50', icon: 'pricetag-outline' },
];

export default function SearchScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { shops: localShops, filters, toggleFilter, setMaxPrice } = useShopStore();

  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'list' | 'map'>('list');
  const [apiResults, setApiResults] = useState<ApiShop[] | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setApiResults(null); return; }
    try {
      setSearching(true);
      const res = await apiClient.get('/shops/search', { params: { query: q.trim(), limit: 30 } });
      if (res.data.status === 1) {
        setApiResults(res.data.data?.data ?? res.data.data ?? []);
      }
    } catch { setApiResults(null); }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setApiResults(null); setSearching(false); return; }
    setSearching(true);
    debounceRef.current = setTimeout(() => doSearch(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  const filtered = useMemo(() => {
    if (apiResults !== null) {
      return apiResults
        .filter(s => !filters.openNow  || s.is_open)
        .filter(s => !filters.topRated || s.avg_rating >= 4.5)
        .sort((a, b) => filters.nearest
          ? (a.distance_km ?? 0) - (b.distance_km ?? 0)
          : b.avg_rating - a.avg_rating
        )
        .map(s => ({
          id: String(s.id),
          name: s.name,
          area: s.city,
          rating: parseFloat(String(s.avg_rating ?? 0)) || 0,
          isOpen: s.is_open,
          lat: s.latitude,
          lng: s.longitude,
          distanceKm: parseFloat(String(s.distance_km ?? 0)) || 0,
          eta: s.distance_km ? `${Math.round(s.distance_km * 3 + 5)} min` : '—',
          pricePerCan: s.min_order_value ?? 0,
        }));
    }
    let items = localShops.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
    if (filters.openNow)  items = items.filter(s => s.isOpen);
    if (filters.topRated) items = items.filter(s => s.rating >= 4.5);
    if (filters.maxPrice != null) items = items.filter(s => s.pricePerCan <= filters.maxPrice!);
    return [...items].sort((a, b) => filters.nearest ? a.distanceKm - b.distanceKm : b.rating - a.rating);
  }, [apiResults, localShops, filters, query]);

  const activeFilterCount = [filters.openNow, filters.topRated, filters.nearest, filters.maxPrice != null].filter(Boolean).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ── HEADER ── */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Find Shops</Text>
          <Text style={[styles.headerSub, { color: colors.muted }]}>
            {filtered.length > 0 ? `${filtered.length} shops available` : 'Search water shops near you'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.notifBtn, { backgroundColor: `${ACCENT}12` }]}
          onPress={() => router.push('/notifications' as any)}
        >
          <Ionicons name="notifications-outline" size={20} color={ACCENT} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── SEARCH BOX ── */}
        <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: query.length > 0 ? ACCENT : colors.border }]}>
          <Ionicons name="search" size={20} color={query.length > 0 ? ACCENT : colors.muted} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.text }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Search shops, areas, or products..."
            placeholderTextColor={colors.muted}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {searching && <ActivityIndicator size="small" color={ACCENT} />}
          {query.length > 0 && !searching && (
            <TouchableOpacity onPress={() => { setQuery(''); setApiResults(null); }}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── FILTER ROW ── */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {FILTER_OPTIONS.map(f => {
              const active = f.key === 'cheap'
                ? filters.maxPrice === 50
                : filters[f.key as keyof typeof filters] as boolean;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.chip, { backgroundColor: active ? ACCENT : colors.surface, borderColor: active ? ACCENT : colors.border }]}
                  onPress={() => {
                    if (f.key === 'cheap') setMaxPrice(filters.maxPrice === 50 ? null : 50);
                    else toggleFilter(f.key as any);
                  }}
                >
                  <Ionicons name={f.icon as any} size={13} color={active ? 'white' : ACCENT} />
                  <Text style={[styles.chipText, { color: active ? 'white' : colors.text }]}>{f.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {activeFilterCount > 0 && (
            <TouchableOpacity
              style={[styles.clearBtn, { backgroundColor: `${ACCENT}15` }]}
              onPress={() => { ['openNow','topRated','nearest'].forEach(k => { if (filters[k as keyof typeof filters]) toggleFilter(k as any); }); setMaxPrice(null); }}
            >
              <Text style={[styles.clearBtnText, { color: ACCENT }]}>Clear {activeFilterCount}</Text>
              <Ionicons name="close" size={12} color={ACCENT} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── VIEW TOGGLE ── */}
        <View style={[styles.modeRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {(['list', 'map'] as const).map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.modeBtn, mode === m && { backgroundColor: ACCENT }]}
              onPress={() => setMode(m)}
            >
              <Ionicons name={m === 'list' ? 'list-outline' : 'map-outline'} size={15} color={mode === m ? 'white' : colors.muted} />
              <Text style={[styles.modeBtnText, { color: mode === m ? 'white' : colors.muted }]}>
                {m === 'list' ? 'List View' : 'Map View'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── MAP VIEW ── */}
        {mode === 'map' && (
          <View style={[styles.mapWrap, { borderColor: colors.border }]}>
            <ExpoMap
              style={{ width: '100%', height: 280 }}
              initialRegion={{ latitude: 12.9716, longitude: 80.221, latitudeDelta: 0.1, longitudeDelta: 0.1 }}
              markers={filtered.map(s => ({ id: s.id, latitude: s.lat, longitude: s.lng, title: s.name, color: s.isOpen ? '#16a34a' : ACCENT, iconType: 'shop' as const }))}
              hideControls={true}
              onMarkerPress={m => m.id && router.push(`/shop-detail/${m.id}` as any)}
            />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.mapGrad} />
            <TouchableOpacity style={[styles.expandBtn, { backgroundColor: ACCENT }]} onPress={() => router.push('/search-map' as any)}>
              <Ionicons name="expand-outline" size={14} color="white" />
              <Text style={styles.expandBtnText}>Full Screen Map</Text>
            </TouchableOpacity>
            <View style={[styles.mapCount, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <Text style={styles.mapCountText}>{filtered.length} shops</Text>
            </View>
          </View>
        )}

        {/* ── LIST VIEW ── */}
        {mode === 'list' && (
          searching && apiResults === null ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={ACCENT} />
              <Text style={[styles.loaderText, { color: colors.muted }]}>Searching shops...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: SURF }]}>
                <Ionicons name="search-outline" size={32} color={ACCENT} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No shops found</Text>
              <Text style={[styles.emptySub, { color: colors.muted }]}>
                {query ? 'Try different keywords.' : 'Adjust filters to see more shops.'}
              </Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity
                  style={[styles.emptyAction, { backgroundColor: ACCENT }]}
                  onPress={() => { ['openNow','topRated','nearest'].forEach(k => { if (filters[k as keyof typeof filters]) toggleFilter(k as any); }); setMaxPrice(null); }}
                >
                  <Text style={styles.emptyActionText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.list}>
              {filtered.map((shop, idx) => (
                <TouchableOpacity
                  key={shop.id}
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => router.push(`/shop-detail/${shop.id}` as any)}
                  activeOpacity={0.88}
                >
                  {/* Rank */}
                  <View style={[styles.rank, { backgroundColor: idx < 3 ? ACCENT : `${ACCENT}20` }]}>
                    <Text style={[styles.rankText, { color: idx < 3 ? 'white' : ACCENT }]}>#{idx + 1}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.cardTop}>
                      <Text style={[styles.shopName, { color: colors.text }]} numberOfLines={1}>{shop.name}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: shop.isOpen ? '#dcfce7' : '#fee2e2' }]}>
                        <View style={[styles.statusDot, { backgroundColor: shop.isOpen ? '#16a34a' : '#dc2626' }]} />
                        <Text style={[styles.statusText, { color: shop.isOpen ? '#16a34a' : '#dc2626' }]}>
                          {shop.isOpen ? 'Open' : 'Closed'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={13} color={colors.muted} />
                        <Text style={[styles.metaText, { color: colors.muted }]}>{shop.area}{shop.distanceKm > 0 ? ` · ${shop.distanceKm.toFixed(1)} km` : ''}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={13} color={colors.muted} />
                        <Text style={[styles.metaText, { color: colors.muted }]}>{shop.eta}</Text>
                      </View>
                    </View>

                    <View style={styles.cardBottom}>
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={13} color="#f59e0b" />
                        <Text style={[styles.ratingText, { color: colors.text }]}>{shop.rating.toFixed(1)}</Text>
                      </View>
                      {shop.pricePerCan > 0 && (
                        <Text style={[styles.price, { color: ACCENT }]}>₹{shop.pricePerCan}/can</Text>
                      )}
                      <View style={[styles.viewBtn, { backgroundColor: ACCENT }]}>
                        <Text style={styles.viewBtnText}>View</Text>
                        <Ionicons name="arrow-forward" size={12} color="white" />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        )}

        {/* ── PROMO BANNER ── */}
        {!searching && (
          <TouchableOpacity activeOpacity={0.9} style={styles.promoWrap} onPress={() => router.push('/search-map' as any)}>
            <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promo}>
              <View style={{ flex: 1 }}>
                <Text style={styles.promoTitle}>Browse on Map</Text>
                <Text style={styles.promoCopy}>See all shops around you visually and explore new areas.</Text>
              </View>
              <View style={[styles.promoIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="map" size={28} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1 },

  header: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -0.8 },
  headerSub: { fontSize: 13, marginTop: 2 },
  notifBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },

  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, paddingHorizontal: 16, height: 54, borderWidth: 1.5, marginBottom: 16, ...Shadow.xs },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600' },

  filterSection: { marginBottom: 16, gap: 8 },
  filterRow: { gap: 8, paddingVertical: 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontSize: 12, fontWeight: '700' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  clearBtnText: { fontSize: 12, fontWeight: '700' },

  modeRow: { flexDirection: 'row', borderRadius: 16, padding: 4, marginBottom: 20, borderWidth: 1 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
  modeBtnText: { fontSize: 13, fontWeight: '700' },

  mapWrap: { borderRadius: 20, overflow: 'hidden', marginBottom: 20, borderWidth: 1, position: 'relative', height: 280 },
  mapGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  expandBtn: { position: 'absolute', bottom: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  expandBtnText: { color: 'white', fontWeight: '800', fontSize: 12 },
  mapCount: { position: 'absolute', bottom: 14, left: 14, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  mapCountText: { color: 'white', fontWeight: '700', fontSize: 12 },

  loader: { alignItems: 'center', paddingVertical: 60, gap: 16 },
  loaderText: { fontSize: 14, fontWeight: '600' },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  emptySub: { fontSize: 14, textAlign: 'center', maxWidth: '75%' },
  emptyAction: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  emptyActionText: { color: 'white', fontWeight: '800', fontSize: 14 },

  list: { gap: 12 },
  card: { flexDirection: 'row', gap: 14, padding: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', ...Shadow.xs },
  rank: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rankText: { fontSize: 11, fontWeight: '900' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 },
  shopName: { flex: 1, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800' },
  cardMeta: { flexDirection: 'row', gap: 14, marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontWeight: '600' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, fontWeight: '800' },
  price: { flex: 1, fontSize: 14, fontWeight: '800' },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  viewBtnText: { color: 'white', fontSize: 12, fontWeight: '800' },

  promoWrap: { marginTop: 8, borderRadius: 20, overflow: 'hidden', ...Shadow.sm },
  promo: { flexDirection: 'row', alignItems: 'center', padding: 22, gap: 16 },
  promoTitle: { color: 'white', fontSize: 18, fontWeight: '900', marginBottom: 4 },
  promoCopy: { color: 'rgba(255,255,255,0.8)', fontSize: 12, lineHeight: 18 },
  promoIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
