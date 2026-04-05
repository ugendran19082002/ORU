import React, { useState } from 'react';
import { View, Text, ScrollView,
  RefreshControl, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MOCK_SHOPS = [
  { id: '1', name: 'Oceania Fresh', owner: 'Rahul Sharma', address: 'Plot 4, Indiranagar', verified: false, available: true },
  { id: '2', name: 'AquaPrime Distributors', owner: 'Kishore B', address: 'Block C, Whitefield', verified: true, available: true },
  { id: '3', name: 'BlueSpring Waters', owner: 'Priya Iyer', address: 'Main Road, Koramangala', verified: true, available: false },
];

export default function AdminShopsScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const [shops, setShops] = useState(MOCK_SHOPS);

  const toggleAvailability = (id: string) => {
    setShops(shops.map(s => s.id === id ? { ...s, available: !s.available } : s));
  };

  const verifyShop = (id: string) => {
    setShops(shops.map(s => s.id === id ? { ...s, verified: true } : s));
  };

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Shops Management</Text>
          <TouchableOpacity style={styles.addBtn}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addBtnText}>Add Shop</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {shops.map((shop, index) => (
            <View key={shop.id}>
              <View style={styles.shopRow}>
                <View style={styles.iconWrap}>
                  <Ionicons name="storefront" size={24} color="#005d90" />
                </View>
                <View style={styles.shopInfo}>
                  <Text style={styles.shopName}>{shop.name}</Text>
                  <Text style={styles.shopSub}>{shop.owner} • {shop.address}</Text>
                  
                  {/* Status Pills */}
                  <View style={styles.pillRow}>
                    {shop.verified ? (
                      <View style={[styles.pill, { backgroundColor: '#e8f5e9' }]}>
                         <Ionicons name="checkmark-circle" size={12} color="#2e7d32" />
                         <Text style={[styles.pillText, { color: '#2e7d32' }]}>Verified</Text>
                      </View>
                    ) : (
                      <TouchableOpacity style={[styles.pill, { backgroundColor: '#fff3e0' }]} onPress={() => verifyShop(shop.id)}>
                         <Ionicons name="alert-circle" size={12} color="#e65100" />
                         <Text style={[styles.pillText, { color: '#e65100' }]}>Verify Now</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.actionWrap}>
                  <Text style={styles.toggleLabel}>{shop.available ? 'Active' : 'Disabled'}</Text>
                  <Switch
                    value={shop.available}
                    onValueChange={() => toggleAvailability(shop.id)}
                    trackColor={{ false: '#e0e2e8', true: '#a7edff' }}
                    thumbColor={shop.available ? '#006878' : '#707881'}
                  />
                </View>
              </View>
              {index < shops.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  pageTitle: { fontSize: 32, fontWeight: '900', color: '#181c20', letterSpacing: -0.5 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#005d90', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: 'white', fontWeight: '800', fontSize: 13 },
  
  listContainer: { backgroundColor: 'white', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  shopRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 16 },
  iconWrap: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center' },
  shopInfo: { flex: 1 },
  shopName: { fontSize: 16, fontWeight: '800', color: '#181c20', marginBottom: 2 },
  shopSub: { fontSize: 12, color: '#707881', marginBottom: 8 },
  
  pillRow: { flexDirection: 'row' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  pillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },

  actionWrap: { alignItems: 'center', gap: 4 },
  toggleLabel: { fontSize: 10, fontWeight: '600', color: '#707881' },
  divider: { height: 1, backgroundColor: '#f1f4f9', marginLeft: 64 },
});
