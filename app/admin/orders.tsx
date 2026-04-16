import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { adminApi } from '@/api/adminApi';
import Toast from 'react-native-toast-message';
import { Logo } from '@/components/ui/Logo';
import { BackButton } from '@/components/ui/BackButton';

export default function AdminOrdersListScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.listOrders();
      setOrders(res.data);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Fetch Failed', text2: 'Could not load orders.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      placed: '#005d90',
      accepted: '#006878',
      dispatched: '#006878',
      delivered: '#2e7d32',
      cancelled: '#ba1a1a',
      failed: '#ba1a1a',
    };
    return map[status] || '#707881';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <BackButton fallback="/admin/(tabs)" iconColor="#ba1a1a" />
        <View style={styles.headerTitleWrap}>
           <Text style={styles.headerTitle}>Global Orders</Text>
           <Text style={styles.headerSub}>Manage all platform transactions</Text>
        </View>
      </View>

      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ba1a1a']} />}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#ba1a1a" style={{ marginTop: 40 }} />
        ) : orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>No Orders Found</Text>
          </View>
        ) : (
          orders.map((order) => (
            <TouchableOpacity 
              key={order.id} 
              style={styles.orderCard}
              onPress={() => router.push(`/admin/order/${order.id}` as any)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.orderNumber}>#{order.order_number || order.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '15' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                 <Text style={styles.shopName}>{order.Shop?.name || 'Unknown Shop'}</Text>
                 <Text style={styles.customerName}>{order.User?.name || 'Guest'}</Text>
                 <View style={styles.metaRow}>
                    <Text style={styles.dateText}>{new Date(order.created_at).toLocaleDateString()}</Text>
                    <Text style={styles.amountText}>₹{order.payable_amount}</Text>
                 </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" style={styles.chevron} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitleWrap: { marginLeft: 16 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  headerSub: { fontSize: 12, color: '#64748b' },
  scrollContent: { padding: 16 },
  orderCard: { backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, position: 'relative' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderNumber: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '900' },
  shopName: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  customerName: { fontSize: 13, color: '#64748b', marginTop: 2 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  dateText: { fontSize: 12, color: '#94a3b8' },
  amountText: { fontSize: 14, fontWeight: '900', color: '#0f172a' },
  chevron: { position: 'absolute', right: 16, top: 40 },
  emptyState: { padding: 60, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#94a3b8', fontWeight: '600', marginTop: 12 },
});
