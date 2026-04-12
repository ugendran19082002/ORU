import React, { useState } from 'react';
import { View, Text, ScrollView,
  RefreshControl, TouchableOpacity, Switch, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';



import { adminApi, AdminShop } from '@/api/adminApi';
import { useRouter } from 'expo-router';

export default function AdminShopsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_review' | 'active'>('all');

  const fetchShops = async () => {
    try {
      setLoading(true);
      const filter = statusFilter === 'all' ? undefined : statusFilter;
      const res = await adminApi.listShops(filter);
      if (res.status === 1) {
        setShops(res.data);
      }
    } catch (error) {
      console.error('[Admin Shops] Load Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchShops();
  }, [statusFilter]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchShops();
  }, [statusFilter]);

  const handleShopPress = (id: number) => {
    router.push(`/admin/shops/${id}` as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />} 
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>Shops</Text>
            <Text style={styles.subtitle}>{shops.length} total partners</Text>
          </View>
          
          <View style={styles.filterTabs}>
            <TouchableOpacity 
              style={[styles.filterTab, statusFilter === 'all' && styles.filterTabActive]}
              onPress={() => setStatusFilter('all')}
            >
              <Text style={[styles.filterText, statusFilter === 'all' && styles.filterTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterTab, statusFilter === 'pending_review' && styles.filterTabActive]}
              onPress={() => setStatusFilter('pending_review')}
            >
              <Text style={[styles.filterText, statusFilter === 'pending_review' && styles.filterTextActive]}>Pending</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#005d90" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.listContainer}>
            {shops.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="storefront-outline" size={48} color="#e2e8f0" />
                <Text style={styles.emptyText}>No shops found in this category.</Text>
              </View>
            ) : shops.map((shop, index) => (
              <TouchableOpacity key={shop.id} onPress={() => handleShopPress(shop.id)}>
                <View style={styles.shopRow}>
                  <View style={styles.iconWrap}>
                    <Ionicons name="business" size={24} color="#005d90" />
                  </View>
                  <View style={styles.shopInfo}>
                    <Text style={styles.shopName}>{shop.name}</Text>
                    <Text style={styles.shopSub}>{shop.owner?.name || 'No Owner'} • {shop.shop_type}</Text>
                    
                    <View style={styles.pillRow}>
                      <View style={[
                        styles.pill, 
                        { backgroundColor: shop.status === 'active' ? '#e8f5e9' : shop.status === 'pending_review' ? '#fff3e0' : '#f1f5f9' }
                      ]}>
                        <Ionicons 
                          name={shop.status === 'active' ? "checkmark-circle" : "time"} 
                          size={12} 
                          color={shop.status === 'active' ? "#2e7d32" : "#e65100"} 
                        />
                        <Text style={[
                          styles.pillText, 
                          { color: shop.status === 'active' ? "#2e7d32" : "#e65100" }
                        ]}>
                          {(shop.status || 'pending').replace('_', ' ')}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                </View>
                {index < shops.length - 1 && <View style={styles.divider} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfdfd' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
  pageTitle: { fontSize: 32, fontWeight: '900', color: '#134e4a', letterSpacing: -1 },
  subtitle: { fontSize: 13, color: '#64748b', fontWeight: '600', marginTop: 4 },
  
  filterTabs: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, gap: 4 },
  filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  filterTabActive: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  filterText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  filterTextActive: { color: '#134e4a' },

  listContainer: { backgroundColor: 'white', borderRadius: 24, padding: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  shopRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, gap: 16 },
  iconWrap: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#f0f9ff', alignItems: 'center', justifyContent: 'center' },
  shopInfo: { flex: 1 },
  shopName: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 2 },
  shopSub: { fontSize: 12, color: '#64748b', marginBottom: 8 },
  
  pillRow: { flexDirection: 'row' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  pillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3, textTransform: 'uppercase' },

  emptyWrap: { alignItems: 'center', paddingVertical: 60, gap: 16 },
  emptyText: { fontSize: 14, color: '#94a3b8', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 4 },
});
