import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { useShopStore } from '@/stores/shopStore';
import { shopApi } from '@/api/shopApi';
import type { Shop } from '@/types/domain';
import { Shadow, roleAccent, Radius } from '@/constants/theme';
import { useAppTheme } from '@/providers/ThemeContext';

const ACCENT = roleAccent.customer;
const GRAD: [string, string] = [ACCENT, '#0077b6'];

type SortKey = 'price' | 'rating' | 'distance';

export default function ShopAlternativesScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const { setSelectedShop, userLat, userLng } = useShopStore() as any;
  const [sort, setSort]         = useState<SortKey>('price');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [shops, setShops]       = useState<Shop[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useAndroidBackHandler(() => { safeBack('/(tabs)'); });

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const list = await shopApi.getShops({ lat: userLat, lng: userLng });
      setShops(list);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load shops');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userLat, userLng]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(true); }, [load]);

  const sorted = [...shops].sort((a, b) => {
    if (sort === 'price')    return (a.pricePerCan ?? 0) - (b.pricePerCan ?? 0);
    if (sort === 'rating')   return (b.rating ?? 0) - (a.rating ?? 0);
    return (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
  });

  const toggleCompare = (id: string) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : prev.length < 2 ? [...prev, id] : prev,
    );
  };

  const compareShops = compareIds.map(id => shops.find(s => s.id === id)!).filter(Boolean);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <BackButton fallback="/(tabs)" />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Compare Shops</Text>
          <Text style={styles.headerSub}>Find the best water delivery near you</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={ACCENT} style={{ marginTop: 80 }} />
      ) : error ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="cloud-offline-outline" size={56} color={colors.muted} />
          <Text style={styles.emptyTitle}>Failed to Load</Text>
          <Text style={styles.emptySub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ACCENT]} tintColor={ACCENT} />}
        >
          <View style={styles.sortRow}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            {(['price', 'rating', 'distance'] as SortKey[]).map(key => (
              <TouchableOpacity key={key} style={[styles.sortChip, sort === key && styles.sortChipActive]} onPress={() => setSort(key)}>
                <Text style={[styles.sortChipText, sort === key && { color: 'white' }]}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {compareIds.length === 2 && (
            <View style={styles.comparePanel}>
              <Text style={styles.comparePanelTitle}>📊 Comparison</Text>
              <View style={styles.compareTable}>
                <View style={styles.compareCol}>
                  <Text style={styles.compareHeader}>Feature</Text>
                  {['Price', 'Rating', 'Distance'].map(f => <Text key={f} style={styles.compareKey}>{f}</Text>)}
                </View>
                {compareShops.map(s => (
                  <View key={s.id} style={styles.compareCol}>
                    <Text style={styles.compareHeader} numberOfLines={1}>{s.name.split(' ')[0]}</Text>
                    <Text style={styles.compareVal}>₹{s.pricePerCan ?? '—'}</Text>
                    <Text style={styles.compareVal}>⭐ {s.rating?.toFixed(1) ?? '—'}</Text>
                    <Text style={styles.compareVal}>{s.distanceKm?.toFixed(1) ?? '—'} km</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity onPress={() => setCompareIds([])}>
                <Text style={{ color: '#ba1a1a', fontWeight: '700', fontSize: 13, marginTop: 8, textAlign: 'center' }}>Clear Comparison</Text>
              </TouchableOpacity>
            </View>
          )}

          {compareIds.length === 1 && (
            <View style={styles.compareTip}>
              <Ionicons name="information-circle-outline" size={16} color="#005d90" />
              <Text style={{ color: '#005d90', fontSize: 13, fontWeight: '600', flex: 1 }}>Select one more shop to compare</Text>
            </View>
          )}

          {sorted.length === 0 && (
            <View style={styles.emptyWrap}>
              <Ionicons name="storefront-outline" size={56} color={colors.muted} />
              <Text style={styles.emptyTitle}>No Shops Found</Text>
              <Text style={styles.emptySub}>No water delivery shops available near you.</Text>
            </View>
          )}

          {sorted.map(shop => (
            <View key={shop.id} style={[styles.shopCard, !shop.isOpen && { opacity: 0.65 }]}>
              <View style={styles.shopTop}>
                <View style={[styles.shopIcon, { backgroundColor: compareIds.includes(shop.id) ? '#e0f0ff' : '#f0f7ff' }]}>
                  <Ionicons name="storefront" size={22} color={shop.isOpen ? ACCENT : colors.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shopName}>{shop.name}</Text>
                  <View style={styles.shopMeta}>
                    <Ionicons name="star" size={12} color={colors.warning} />
                    <Text style={styles.shopRating}>{shop.rating?.toFixed(1) ?? '—'}</Text>
                    <Text style={styles.shopDot}>·</Text>
                    <Text style={styles.shopDist}>{shop.distanceKm?.toFixed(1) ?? '—'} km</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.shopPrice}>₹{shop.pricePerCan ?? '—'}</Text>
                  <Text style={styles.shopEta}>{shop.eta ?? '—'}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={[styles.compareBtn, compareIds.includes(shop.id) && styles.compareBtnActive]} onPress={() => toggleCompare(shop.id)}>
                  <Ionicons name="git-compare-outline" size={14} color={compareIds.includes(shop.id) ? ACCENT : colors.muted} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: compareIds.includes(shop.id) ? ACCENT : colors.muted }}>
                    {compareIds.includes(shop.id) ? 'Selected' : 'Compare'}
                  </Text>
                </TouchableOpacity>

                {shop.isOpen ? (
                  <TouchableOpacity style={styles.selectBtn} onPress={() => { setSelectedShop?.(shop.id); router.push(`/shop-detail/${shop.id}` as any); }}>
                    <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.selectBtnGrad}>
                      <Text style={styles.selectBtnText}>Order Now</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.selectBtn, { backgroundColor: '#f1f4f9', borderRadius: 14, justifyContent: 'center', alignItems: 'center', paddingVertical: 12 }]}>
                    <Text style={{ color: '#94a3b8', fontWeight: '700', fontSize: 13 }}>Closed</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: colors.text },
  headerSub: { fontSize: 12, color: colors.muted, fontWeight: '600', marginTop: 1 },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  emptySub: { fontSize: 13, color: colors.muted, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { backgroundColor: ACCENT, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  retryBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sortLabel: { fontSize: 13, fontWeight: '600', color: colors.muted },
  sortChip: { backgroundColor: colors.border, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
  sortChipActive: { backgroundColor: ACCENT },
  sortChipText: { fontSize: 12, fontWeight: '700', color: colors.muted },
  comparePanel: { backgroundColor: colors.surface, borderRadius: Radius.xl, padding: 16, borderWidth: 1.5, borderColor: ACCENT },
  comparePanelTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 12 },
  compareTable: { flexDirection: 'row', gap: 8 },
  compareCol: { flex: 1, gap: 8 },
  compareHeader: { fontSize: 12, fontWeight: '800', color: ACCENT, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 6 },
  compareKey: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  compareVal: { fontSize: 13, color: colors.text, fontWeight: '700' },
  compareTip: { flexDirection: 'row', gap: 8, backgroundColor: colors.inputBg, borderRadius: 14, padding: 12, alignItems: 'center' },
  shopCard: { backgroundColor: colors.surface, borderRadius: Radius.xl, padding: 18, gap: 12, ...Shadow.xs },
  shopTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shopIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  shopName: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 4 },
  shopMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shopRating: { fontSize: 12, fontWeight: '700', color: colors.text },
  shopDot: { fontSize: 12, color: colors.muted },
  shopDist: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  shopPrice: { fontSize: 18, fontWeight: '900', color: ACCENT },
  shopEta: { fontSize: 11, color: colors.muted, fontWeight: '600', marginTop: 2 },
  compareBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border },
  compareBtnActive: { borderColor: ACCENT, backgroundColor: colors.inputBg },
  selectBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  selectBtnGrad: { paddingVertical: 13, alignItems: 'center' },
  selectBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
});
