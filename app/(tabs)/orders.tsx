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
import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { SkeletonCard, SkeletonLine } from '@/components/ui/Skeleton';
import { useCartStore } from '@/stores/cartStore';
import { useOrderStore } from '@/stores/orderStore';
import { useShopStore } from '@/stores/shopStore';
import { useRoleTheme } from '@/hooks/use-role-theme';
import { Shadow, Typography, roleSurface, roleAccent, Radius } from '@/constants/theme';
import { useAppTheme } from '@/providers/ThemeContext';

const CUSTOMER_ACCENT = roleAccent.customer;
const SHOP_ACCENT = roleAccent.shop_owner;
import { orderApi } from '@/api/orderApi';
import Toast from 'react-native-toast-message';


function OrderCard({ order, onTrack, onReorder, onSupport, onPress, accent }: {
  order: any;
  onTrack: () => void;
  onReorder: () => void;
  onSupport: () => void;
  onPress: () => void;
  accent: string;
}) {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.orderCard, Shadow.sm]}>
      {/* Top Row */}
      <View style={styles.orderTop}>
        <View style={[styles.orderIconWrap, { backgroundColor: roleSurface.customer }]}>
          <Ionicons name="water" size={20} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.orderId, { color: accent }]}>#{order.id}</Text>
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
          <Ionicons name="time-outline" size={12} color={colors.muted} />
          <Text style={styles.orderDate}>{order.date}</Text>
          <Text style={styles.orderAmount}>{order.amount}</Text>
        </View>
      </View>

      {/* Progress bar for active */}
      {order.progress > 0 && order.progress < 1 && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${order.progress * 100}%` as any, backgroundColor: accent }]} />
        </View>
      )}

      {/* Actions */}
      <View style={styles.orderActions}>
        {order.isActive ? (
          <TouchableOpacity style={[styles.trackBtn, { backgroundColor: roleSurface.customer }]} onPress={(e) => { e.stopPropagation(); onTrack(); }}>
            <Ionicons name="navigate-outline" size={15} color={accent} />
            <Text style={[styles.trackBtnText, { color: accent }]}>Track Order</Text>
          </TouchableOpacity>
        ) : order.status === 'Delivered' ? (
          <TouchableOpacity style={[styles.trackBtn, { backgroundColor: roleSurface.customer }]} onPress={(e) => { e.stopPropagation(); onReorder(); }}>
            <Ionicons name="refresh-outline" size={15} color={accent} />
            <Text style={[styles.trackBtnText, { color: accent }]}>Reorder</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.supportBtn} onPress={(e) => { e.stopPropagation(); onSupport(); }}>
          <Ionicons name="chatbubble-outline" size={15} color={colors.muted} />
          <Text style={styles.supportBtnText}>Support</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { accent } = useRoleTheme();
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
      pending:    { label: 'Pending',    color: CUSTOMER_ACCENT,          bg: colors.inputBg,            progress: 0.1 },
      assigned:   { label: 'Assigned',   color: colors.primary,   bg: colors.inputBg,            progress: 0.3 },
      accepted:   { label: 'Accepted',   color: SHOP_ACCENT,               bg: colors.deliverySoft,  progress: 0.5 },
      picked:     { label: 'Picked',     color: CUSTOMER_ACCENT,          bg: colors.inputBg,            progress: 0.75 },
      delivered:  { label: 'Delivered',  color: CUSTOMER_ACCENT,          bg: colors.inputBg,            progress: 0.9 },
      completed:  { label: 'Completed',  color: colors.success,  bg: colors.successSoft,         progress: 1 },
      cancelled:  { label: 'Cancelled',  color: colors.error,    bg: colors.adminSoft,          progress: 0 },
      placed:     { label: 'Placed',     color: CUSTOMER_ACCENT,          bg: colors.inputBg,            progress: 0.1 },
      preparing:  { label: 'Preparing',  color: colors.primary,  bg: colors.inputBg,            progress: 0.4 },
      dispatched: { label: 'Dispatched', color: SHOP_ACCENT,               bg: colors.deliverySoft,  progress: 0.75 },
      failed:     { label: 'Failed',     color: colors.error,    bg: colors.adminSoft,          progress: 0 },
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.brandRow}>
          <Logo size="md" />
          <Text style={[styles.brandName, { color: colors.text }]}>ThanniGo</Text>
        </View>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.background }, Shadow.xs]} onPress={() => router.push('/notifications' as any)}>
          <Ionicons name="notifications-outline" size={22} color={accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.titleRow}>
        <Text style={[styles.screenTitle, { color: accent }]}>My Orders</Text>
        <Text style={[styles.screenSubtitle, { color: colors.muted }]}>{normalizedOrders.length} total orders</Text>
      </View>

      {/* TOGGLE */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, tab === 'active' && [styles.toggleBtnActive, Shadow.xs]]}
          onPress={() => setTab('active')}
        >
          <Text style={[styles.toggleText, tab === 'active' && { color: accent, fontWeight: '800' }]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, tab === 'past' && [styles.toggleBtnActive, Shadow.xs]]}
          onPress={() => setTab('past')}
        >
          <Text style={[styles.toggleText, tab === 'past' && { color: accent, fontWeight: '800' }]}>
            Past Orders
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[accent]} tintColor={accent} />}
      >
        {isFetching ? (
          <View style={{ gap: 16, paddingTop: 8 }}>
            {[1, 2, 3].map((k) => (
              <View key={k} style={[styles.orderCard, Shadow.sm, { gap: 12 }]}>
                <SkeletonLine width="50%" height={14} />
                <SkeletonLine width="80%" height={12} />
                <SkeletonLine width="60%" height={10} />
              </View>
            ))}
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={56} color={colors.border} />
            <Text style={styles.emptyTitle}>No orders here</Text>
            <Text style={styles.emptySubtitle}>Your {tab} orders will appear here</Text>
          </View>
        ) : (
          filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              accent={accent}
              onPress={() => router.push(`/order/${order.id}` as any)}
              onTrack={() => {
                setActiveOrder(order.id);
                router.push('/order/tracking');
              }}
              onReorder={async () => {
                try {
                  const res = await orderApi.reorder(order.id);
                  Toast.show({ type: 'success', text1: 'Order Placed', text2: 'Reorder successful!' });
                  setActiveOrder(res.data.id || res.data.orderId);
                  router.push('/order/tracking');
                } catch (err) {
                  Toast.show({ type: 'error', text1: 'Reorder Failed', text2: 'Please try again.' });
                }
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

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { ...Typography.h4, color: colors.text, letterSpacing: -0.5 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  titleRow: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
  screenTitle: { ...Typography.h1, letterSpacing: -0.5 },
  screenSubtitle: { ...Typography.caption, color: colors.muted, marginTop: 4 },

  toggle: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: colors.border,
    borderRadius: Radius.lg,
    padding: 4,
  },
  toggleBtn: {
    flex: 1, borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: colors.surface },
  toggleText: { ...Typography.label, color: colors.muted },

  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: Radius.xl,
    padding: 20,
    marginBottom: 16,
  },
  orderTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  orderIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  orderId: { ...Typography.overline, textTransform: 'uppercase' },
  orderShop: { ...Typography.bodyMedium, color: colors.text, marginTop: 1 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  statusText: { ...Typography.overline },

  orderDetails: { marginBottom: 12 },
  orderItems: { ...Typography.label, color: colors.muted, marginBottom: 6 },
  orderMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderDate: { ...Typography.caption, color: colors.muted, flex: 1 },
  orderAmount: { ...Typography.bodyMedium, fontWeight: '900', color: colors.text },

  progressTrack: {
    height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 14,
  },
  progressFill: { height: '100%', borderRadius: 3 },

  orderActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 },
  trackBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 12, paddingVertical: 11,
  },
  trackBtnText: { ...Typography.label },
  supportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.border, borderRadius: Radius.md, paddingVertical: 11, paddingHorizontal: 16,
  },
  supportBtnText: { ...Typography.label, color: colors.muted },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { ...Typography.h4, color: colors.text },
  emptySubtitle: { ...Typography.caption, color: colors.muted },
});


