import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { useCartStore } from '@/stores/cartStore';
import { useOrderStore } from '@/stores/orderStore';
import { useShopStore } from '@/stores/shopStore';


function OrderCard({ order, onTrack, onReorder, onSupport }: {
  order: any;
  onTrack: () => void;
  onReorder: () => void;
  onSupport: () => void;
}) {
  return (
    <View style={styles.orderCard}>
      {/* Top Row */}
      <View style={styles.orderTop}>
        <View style={styles.orderIconWrap}>
          <Ionicons name="water" size={20} color="#005d90" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderId}>#{order.id}</Text>
          <Text style={styles.orderShop}>{order.shop}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: order.statusBg }]}>
          <Text style={[styles.statusText, { color: order.statusColor }]}>{order.status}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.orderDetails}>
        <Text style={styles.orderItems}>{order.items}</Text>
        <View style={styles.orderMeta}>
          <Ionicons name="time-outline" size={12} color="#707881" />
          <Text style={styles.orderDate}>{order.date}</Text>
          <Text style={styles.orderAmount}>{order.amount}</Text>
        </View>
      </View>

      {/* Progress bar for active */}
      {order.progress > 0 && order.progress < 1 && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${order.progress * 100}%` as any }]} />
        </View>
      )}

      {/* Actions */}
      <View style={styles.orderActions}>
        {order.isActive ? (
          <TouchableOpacity style={styles.trackBtn} onPress={onTrack}>
            <Ionicons name="navigate-outline" size={15} color="#005d90" />
            <Text style={styles.trackBtnText}>Track Order</Text>
          </TouchableOpacity>
        ) : order.status === 'Delivered' ? (
          <TouchableOpacity style={styles.trackBtn} onPress={onReorder}>
            <Ionicons name="refresh-outline" size={15} color="#005d90" />
            <Text style={styles.trackBtnText}>Reorder</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.supportBtn} onPress={onSupport}>
          <Ionicons name="chatbubble-outline" size={15} color="#707881" />
          <Text style={styles.supportBtnText}>Support</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function OrdersScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [refreshing, setRefreshing] = useState(false);
  const { orders, setActiveOrder, fetchOrders, isFetching } = useOrderStore();
  const { shops, setSelectedShop } = useShopStore();
  const { setShop, setQuantity } = useCartStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const normalizedOrders = orders.map((order) => {
    const shop = shops.find((item) => item.id === order.shopId);
    const quantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const isActive = !['delivered', 'completed', 'cancelled'].includes(order.status);
    const statusMap = {
      pending: { label: 'Pending', color: '#005D90', bg: '#E3F2FD', progress: 0.1 },
      assigned: { label: 'Assigned', color: '#0077B6', bg: '#E0F0FF', progress: 0.3 },
      accepted: { label: 'Accepted', color: '#006878', bg: '#E0F7FA', progress: 0.5 },
      picked: { label: 'Picked', color: '#005D90', bg: '#E3F2FD', progress: 0.75 },
      delivered: { label: 'Delivered', color: '#005D90', bg: '#E3F2FD', progress: 0.9 },
      completed: { label: 'Completed', color: '#2e7d32', bg: '#e8f5e9', progress: 1 },
      cancelled: { label: 'Cancelled', color: '#ba1a1a', bg: '#ffdad6', progress: 0 },
      placed: { label: 'Placed', color: '#005D90', bg: '#E3F2FD', progress: 0.1 },
      preparing: { label: 'Preparing', color: '#0077B6', bg: '#E0F0FF', progress: 0.4 },
      dispatched: { label: 'Dispatched', color: '#006878', bg: '#E0F7FA', progress: 0.75 },
      failed: { label: 'Failed', color: '#ba1a1a', bg: '#ffdad6', progress: 0 },
    } as const;
    const statusInfo = statusMap[order.status];

    return {
      id: order.id,
      shopId: order.shopId,
      shop: order.shopName ?? shop?.name ?? 'Water Shop',
      items: `${quantity}x Water Can`,
      date: order.createdAtLabel,
      amount: `Rs. ${order.total}`,
      status: statusInfo.label,
      statusColor: statusInfo.color,
      statusBg: statusInfo.bg,
      progress: statusInfo.progress,
      isActive,
    };
  });

  const filtered = tab === 'active'
    ? normalizedOrders.filter((order) => order.isActive)
    : normalizedOrders.filter((order) => !order.isActive);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Logo size="md" />
          <Text style={styles.brandName}>ThanniGo</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications' as any)}>
          <Ionicons name="notifications-outline" size={22} color="#005d90" />
        </TouchableOpacity>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.screenTitle}>My Orders</Text>
        <Text style={styles.screenSubtitle}>{normalizedOrders.length} total orders</Text>
      </View>

      {/* TOGGLE */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, tab === 'active' && styles.toggleBtnActive]}
          onPress={() => setTab('active')}
        >
          <Text style={[styles.toggleText, tab === 'active' && styles.toggleTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, tab === 'past' && styles.toggleBtnActive]}
          onPress={() => setTab('past')}
        >
          <Text style={[styles.toggleText, tab === 'past' && styles.toggleTextActive]}>
            Past Orders
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={56} color="#bfc7d1" />
            <Text style={styles.emptyTitle}>No orders here</Text>
            <Text style={styles.emptySubtitle}>Your {tab} orders will appear here</Text>
          </View>
        ) : (
          filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onTrack={() => {
                setActiveOrder(order.id);
                router.push('/order/tracking');
              }}
              onReorder={() => {
                const sourceOrder = orders.find((item) => item.id === order.id);
                setSelectedShop(order.shopId);
                setShop(order.shopId);
                let totalQty = 0;
                sourceOrder?.items.forEach((item) => {
                  setQuantity(item.productId, item.quantity, order.shopId);
                  totalQty += item.quantity;
                });
                router.push(`/order/checkout?shopId=${order.shopId}&qty=${totalQty}` as any);
              }}
              onSupport={() => {
                setActiveOrder(order.id);
                router.push('/report-issue');
              }}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 22, fontWeight: '900', color: '#003a5c', letterSpacing: -0.5 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#f1f4f9',
    alignItems: 'center', justifyContent: 'center',
  },
  titleRow: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
  screenTitle: { fontSize: 30, fontWeight: '900', color: '#005d90', letterSpacing: -0.5 },
  screenSubtitle: { fontSize: 13, color: '#707881', marginTop: 3 },

  toggle: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#ebeef4',
    borderRadius: 16,
    padding: 4,
  },
  toggleBtn: {
    flex: 1, borderRadius: 13,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#707881' },
  toggleTextActive: { color: '#005d90', fontWeight: '800' },

  // Order Card
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#003a5c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  orderTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  orderIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#e0f0ff',
    alignItems: 'center', justifyContent: 'center',
  },
  orderId: { fontSize: 12, fontWeight: '700', color: '#005d90', textTransform: 'uppercase', letterSpacing: 1 },
  orderShop: { fontSize: 16, fontWeight: '800', color: '#181c20', marginTop: 1 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '700' },

  orderDetails: { marginBottom: 12 },
  orderItems: { fontSize: 14, color: '#404850', fontWeight: '500', marginBottom: 6 },
  orderMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderDate: { fontSize: 12, color: '#707881', flex: 1 },
  orderAmount: { fontSize: 15, fontWeight: '900', color: '#181c20' },

  progressTrack: {
    height: 6, backgroundColor: '#e0e2e8', borderRadius: 3, overflow: 'hidden', marginBottom: 14,
  },
  progressFill: { height: '100%', backgroundColor: '#006878', borderRadius: 3 },

  orderActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#f1f4f9', paddingTop: 14 },
  trackBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#e0f0ff', borderRadius: 14, paddingVertical: 11,
  },
  trackBtnText: { color: '#005d90', fontWeight: '700', fontSize: 13 },
  supportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#f1f4f9', borderRadius: 14, paddingVertical: 11, paddingHorizontal: 16,
  },
  supportBtnText: { color: '#707881', fontWeight: '600', fontSize: 13 },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#404850' },
  emptySubtitle: { fontSize: 13, color: '#707881' },
});


