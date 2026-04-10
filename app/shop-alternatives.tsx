import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { useShopStore } from '@/stores/shopStore';

const SHOPS = [
  { id: '1', name: 'Blue Spring Aquatics', price: 45, eta: '8 min', rating: 4.8, distance: 0.8, available: true },
  { id: '2', name: 'Aqua Pure Water',       price: 42, eta: '12 min', rating: 4.5, distance: 1.4, available: true },
  { id: '3', name: 'H2O Express',            price: 48, eta: '18 min', rating: 4.7, distance: 2.1, available: true },
  { id: '4', name: 'Crystal Clear Waters',   price: 50, eta: 'Closed', rating: 4.9, distance: 2.8, available: false },
];

type SortKey = 'price' | 'rating' | 'distance';

export default function ShopAlternativesScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const { setSelectedShop } = useShopStore();
  const [sort, setSort] = useState<SortKey>('price');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useAndroidBackHandler(() => { safeBack('/(tabs)'); });

  const sorted = [...SHOPS].sort((a, b) => {
    if (sort === 'price') return a.price - b.price;
    if (sort === 'rating') return b.rating - a.rating;
    return a.distance - b.distance;
  });

  const toggleCompare = (id: string) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : prev.length < 2 ? [...prev, id] : prev
    );
  };

  const compareShops = compareIds.map(id => SHOPS.find(s => s.id === id)!).filter(Boolean);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <BackButton fallback="/(tabs)" />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Compare Shops</Text>
          <Text style={styles.headerSub}>Find the best water delivery near you</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* SORT CHIPS */}
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          {(['price', 'rating', 'distance'] as SortKey[]).map(key => (
            <TouchableOpacity
              key={key}
              style={[styles.sortChip, sort === key && styles.sortChipActive]}
              onPress={() => setSort(key)}
            >
              <Text style={[styles.sortChipText, sort === key && { color: 'white' }]}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* COMPARE PANEL */}
        {compareIds.length === 2 && (
          <View style={styles.comparePanel}>
            <Text style={styles.comparePanelTitle}>📊 Comparison</Text>
            <View style={styles.compareTable}>
              <View style={styles.compareCol}>
                <Text style={styles.compareHeader}>Feature</Text>
                {['Price', 'Rating', 'ETA', 'Distance'].map(f => (
                  <Text key={f} style={styles.compareKey}>{f}</Text>
                ))}
              </View>
              {compareShops.map(s => (
                <View key={s.id} style={styles.compareCol}>
                  <Text style={styles.compareHeader} numberOfLines={1}>{s.name.split(' ')[0]}</Text>
                  <Text style={styles.compareVal}>₹{s.price}</Text>
                  <Text style={styles.compareVal}>⭐ {s.rating}</Text>
                  <Text style={styles.compareVal}>{s.eta}</Text>
                  <Text style={styles.compareVal}>{s.distance} km</Text>
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

        {/* SHOP LIST */}
        {sorted.map((shop) => (
          <View key={shop.id} style={[styles.shopCard, !shop.available && { opacity: 0.65 }]}>
            <View style={styles.shopTop}>
              <View style={[styles.shopIcon, { backgroundColor: compareIds.includes(shop.id) ? '#e0f0ff' : '#f0f7ff' }]}>
                <Ionicons name="storefront" size={22} color={shop.available ? '#005d90' : '#94a3b8'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.shopName}>{shop.name}</Text>
                <View style={styles.shopMeta}>
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text style={styles.shopRating}>{shop.rating}</Text>
                  <Text style={styles.shopDot}>·</Text>
                  <Text style={styles.shopDist}>{shop.distance} km</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.shopPrice}>₹{shop.price}</Text>
                <Text style={styles.shopEta}>{shop.eta}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.compareBtn, compareIds.includes(shop.id) && styles.compareBtnActive]}
                onPress={() => toggleCompare(shop.id)}
              >
                <Ionicons name="git-compare-outline" size={14} color={compareIds.includes(shop.id) ? '#005d90' : '#707881'} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: compareIds.includes(shop.id) ? '#005d90' : '#707881' }}>
                  {compareIds.includes(shop.id) ? 'Selected' : 'Compare'}
                </Text>
              </TouchableOpacity>

              {shop.available ? (
                <TouchableOpacity
                  style={styles.selectBtn}
                  onPress={() => {
                    setSelectedShop(shop.id);
                    router.push(`/shop-detail/${shop.id}` as any);
                  }}
                >
                  <LinearGradient colors={['#005d90', '#0077b6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.selectBtnGrad}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  headerSub: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 1 },
  content: { padding: 20, gap: 14, paddingBottom: 40 },

  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sortLabel: { fontSize: 13, fontWeight: '600', color: '#707881' },
  sortChip: { backgroundColor: '#f1f4f9', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
  sortChipActive: { backgroundColor: '#005d90' },
  sortChipText: { fontSize: 12, fontWeight: '700', color: '#707881' },

  comparePanel: { backgroundColor: 'white', borderRadius: 20, padding: 16, borderWidth: 1.5, borderColor: '#005d90' },
  comparePanelTitle: { fontSize: 14, fontWeight: '800', color: '#181c20', marginBottom: 12 },
  compareTable: { flexDirection: 'row', gap: 8 },
  compareCol: { flex: 1, gap: 8 },
  compareHeader: { fontSize: 12, fontWeight: '800', color: '#005d90', borderBottomWidth: 1, borderBottomColor: '#f1f4f9', paddingBottom: 6 },
  compareKey: { fontSize: 12, color: '#707881', fontWeight: '600' },
  compareVal: { fontSize: 13, color: '#181c20', fontWeight: '700' },

  compareTip: { flexDirection: 'row', gap: 8, backgroundColor: '#e0f0ff', borderRadius: 14, padding: 12, alignItems: 'center' },

  shopCard: { backgroundColor: 'white', borderRadius: 20, padding: 18, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  shopTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shopIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  shopName: { fontSize: 15, fontWeight: '800', color: '#181c20', marginBottom: 4 },
  shopMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shopRating: { fontSize: 12, fontWeight: '700', color: '#181c20' },
  shopDot: { fontSize: 12, color: '#94a3b8' },
  shopDist: { fontSize: 12, color: '#707881', fontWeight: '500' },
  shopPrice: { fontSize: 18, fontWeight: '900', color: '#005d90' },
  shopEta: { fontSize: 11, color: '#707881', fontWeight: '600', marginTop: 2 },

  compareBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#e0e2e8' },
  compareBtnActive: { borderColor: '#005d90', backgroundColor: '#e0f0ff' },

  selectBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  selectBtnGrad: { paddingVertical: 13, alignItems: 'center' },
  selectBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
});
