import React, { useState } from 'react';
import { View, Text, ScrollView,
  RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GLOBAL_ORDERS = [
  { id: 'TN-9402', shop: 'AquaPrime', customer: 'Rahul S.', status: 'delivered', amount: '₹150' },
  { id: 'TN-9408', shop: 'Oceania Fresh', customer: 'Meera N.', status: 'active', amount: '₹50' },
  { id: 'TN-9412', shop: 'BlueSpring', customer: 'Vikas G.', status: 'active', amount: '₹200' },
  { id: 'TN-9415', shop: 'AquaPrime', customer: 'TechHub', status: 'rejected', amount: '₹500' },
];

export default function AdminOrdersScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const [filter, setFilter] = useState('all');

  const filteredOrders = GLOBAL_ORDERS.filter(o => filter === 'all' || o.status === filter);

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Global Orders</Text>

        <View style={styles.filterRow}>
          {['all', 'active', 'delivered', 'rejected'].map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.listContainer}>
          {filteredOrders.map((order, index) => (
            <View key={order.id}>
              <View style={styles.orderRow}>
                <View style={styles.iconWrap}>
                  <Ionicons name="receipt-outline" size={20} color="#005d90" />
                </View>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <Text style={styles.orderSub}>{order.shop} • {order.customer}</Text>
                </View>
                <View style={styles.rightCol}>
                  <Text style={styles.amount}>{order.amount}</Text>
                  <View style={[
                    styles.statusPill,
                    order.status === 'delivered' ? styles.statusDelivered :
                    order.status === 'active' ? styles.statusActive : styles.statusRejected
                  ]}>
                    <Text style={[
                      styles.statusText,
                      order.status === 'delivered' ? styles.statusTextDelivered :
                      order.status === 'active' ? styles.statusTextActive : styles.statusTextRejected
                    ]}>{ (order.status || 'pending').toUpperCase()}</Text>
                  </View>
                </View>
              </View>
              {index < filteredOrders.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
          {filteredOrders.length === 0 && (
            <Text style={styles.emptyText}>No orders found for this filter.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  pageTitle: { fontSize: 32, fontWeight: '900', color: '#181c20', letterSpacing: -0.5, marginBottom: 20 },
  
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  filterBtn: { backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e0e2e8' },
  filterBtnActive: { backgroundColor: '#005d90', borderColor: '#005d90' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#707881' },
  filterTextActive: { color: 'white' },

  listContainer: { backgroundColor: 'white', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  orderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 14 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  
  orderInfo: { flex: 1 },
  orderId: { fontSize: 15, fontWeight: '800', color: '#181c20', marginBottom: 2 },
  orderSub: { fontSize: 12, color: '#707881' },
  
  rightCol: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 15, fontWeight: '900', color: '#006878' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  
  statusDelivered: { backgroundColor: '#e8f5e9' },
  statusTextDelivered: { color: '#2e7d32' },
  statusActive: { backgroundColor: '#e0f7fa' },
  statusTextActive: { color: '#006878' },
  statusRejected: { backgroundColor: '#ffdad6' },
  statusTextRejected: { color: '#ba1a1a' },

  divider: { height: 1, backgroundColor: '#f1f4f9', marginLeft: 58 },
  emptyText: { textAlign: 'center', color: '#707881', paddingVertical: 20, fontStyle: 'italic' }
});
