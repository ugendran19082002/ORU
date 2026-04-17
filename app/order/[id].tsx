import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

import { Logo } from '@/components/ui/Logo';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { orderApi } from '@/api/orderApi';
import { useCartStore } from '@/stores/cartStore';
import { useShopStore } from '@/stores/shopStore';
import { Shadow, thannigoPalette, roleAccent, roleSurface, roleGradients } from '@/constants/theme';

const CUSTOMER_ACCENT = roleAccent.customer;
const CUSTOMER_SURF = roleSurface.customer;
const CUSTOMER_GRAD: [string, string] = [roleGradients.customer.start, roleGradients.customer.end];

const WARNING_BG     = '#FFF8E1';
const WARNING_BORDER = '#FFE082';
const WARNING_TEXT   = thannigoPalette.warning;
const WARNING_DARK   = thannigoPalette.warning;

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  image_url: string | null;
}

interface OrderDetail {
  id: number;
  status: string;
  total_amount: number;
  delivery_charge: number;
  platform_fee: number;
  discount_amount: number;
  payable_amount: number;
  payment_method: string;
  payment_status: string;
  delivery_address: string;
  customer_name: string;
  customer_phone: string;
  shop_name: string;
  shop_phone: string;
  created_at: string;
  estimated_delivery?: string;
  delivery_otp?: string;
  items: OrderItem[];
  status_history: Array<{ status: string; created_at: string }>;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const { setSelectedShop } = useShopStore();
  const { setShop, setQuantity, clearCart } = useCartStore();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useAndroidBackHandler(() => {
    safeBack('/(tabs)/orders');
  });

  const fetchOrderDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await orderApi.getOrderById(id);
      setOrder(data);
    } catch (error) {
      console.error('[OrderDetailScreen] fetch failed:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load order details.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderDetails();
  };

  const handleReorder = () => {
    if (!order) return;
    const shopId = (order as any).shop_id;
    if (!shopId) return;

    setSelectedShop(shopId);
    setShop(shopId);
    clearCart();
    order.items.forEach((item) => {
      const pid = (item as any).product_id;
      if (pid) {
        setQuantity(String(pid), item.quantity, String(shopId), { name: item.product_name, price: item.price });
      }
    });
    router.push(`/order/checkout?shopId=${shopId}` as any);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={CUSTOMER_ACCENT} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Ionicons name="receipt-outline" size={64} color={thannigoPalette.neutral} />
        <Text style={styles.errorText}>Order not found</Text>
        <BackButton fallback="/(tabs)/orders" />
      </View>
    );
  }

  const isActive = !['delivered', 'completed', 'cancelled'].includes(order.status);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <BackButton fallback="/(tabs)/orders" iconColor={CUSTOMER_ACCENT} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Order #{order.id}</Text>
          <Text style={styles.headerSubtitle}>{new Date(order.created_at).toLocaleDateString()}</Text>
        </View>
        <TouchableOpacity style={styles.supportIcon} onPress={() => router.push('/report-issue' as any)}>
          <Ionicons name="help-buoy-outline" size={22} color={CUSTOMER_ACCENT} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[CUSTOMER_ACCENT]} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* STATUS CARD */}
        <LinearGradient colors={CUSTOMER_GRAD} style={styles.statusCard}>
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>Current Status</Text>
            <Text style={styles.statusValue}>{order.status.toUpperCase()}</Text>
          </View>
          {isActive && (
            <TouchableOpacity
              style={styles.trackBtn}
              onPress={() => router.push('/order/tracking' as any)}
            >
              <Text style={styles.trackBtnText}>Track Live</Text>
              <Ionicons name="navigate-outline" size={16} color={CUSTOMER_ACCENT} />
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* DELIVERY PIN IF ACTIVE */}
        {isActive && order.delivery_otp && (
          <View style={styles.otpCard}>
            <Ionicons name="key-outline" size={24} color={WARNING_TEXT} />
            <View style={{ flex: 1 }}>
              <Text style={styles.otpLabel}>Delivery Verification PIN</Text>
              <Text style={styles.otpValue}>{order.delivery_otp}</Text>
            </View>
            <Text style={styles.otpHint}>Share this with rider only at delivery</Text>
          </View>
        )}

        {/* SHOP INFO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop Details</Text>
          <View style={styles.infoRow}>
            <View style={styles.shopIcon}>
              <Ionicons name="water" size={20} color={CUSTOMER_ACCENT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoName}>{order.shop_name}</Text>
              <Text style={styles.infoDetail}>Shop Contact: {order.shop_phone}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={() => {/* Linking.openURL(`tel:${order.shop_phone}`) */}}>
              <Ionicons name="call-outline" size={20} color={CUSTOMER_ACCENT} />
            </TouchableOpacity>
          </View>
        </View>

        {/* DELIVERY ADDRESS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.infoRow}>
            <View style={styles.addressIcon}>
              <Ionicons name="location-outline" size={20} color={thannigoPalette.adminRed} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoDetail}>{order.delivery_address}</Text>
            </View>
          </View>
        </View>

        {/* ITEMS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items Ordered</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemQty}>
                <Text style={styles.itemQtyText}>{item.quantity}x</Text>
              </View>
              <Text style={styles.itemName}>{item.product_name}</Text>
              <Text style={styles.itemPrice}>Rs. {item.price * item.quantity}</Text>
            </View>
          ))}
        </View>

        {/* BILLING SUMMARY */}
        <View style={styles.billingSection}>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>Rs. {order.total_amount}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Can Deposits</Text>
            <Text style={styles.billValue}>Rs. {((order?.items[0]?.quantity || 1) * 150)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Charge</Text>
            <Text style={styles.billValue}>Rs. {order.delivery_charge}</Text>
          </View>
          {order.platform_fee > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Platform Fee</Text>
              <Text style={styles.billValue}>Rs. {order.platform_fee}</Text>
            </View>
          )}
          {order.discount_amount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: thannigoPalette.success }]}>Discount</Text>
              <Text style={[styles.billValue, { color: thannigoPalette.success }]}>-Rs. {order.discount_amount}</Text>
            </View>
          )}
          <View style={[styles.billRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>Rs. {order.payable_amount}</Text>
          </View>
          <View style={styles.paymentBadge}>
            <Text style={styles.paymentText}>
              Paid via {order.payment_method.toUpperCase()} • {order.payment_status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* STATUS HISTORY TIMELINE */}
        {order.status_history && order.status_history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Timeline</Text>
            <View style={styles.timelineCard}>
              {order.status_history.map((log, idx) => (
                <View key={idx} style={styles.timelineRow}>
                  <View style={styles.timelineDotCol}>
                    <View style={[styles.timelineDot, idx === 0 && styles.timelineDotActive]} />
                    {idx < order.status_history.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineStatus, idx === 0 && styles.timelineStatusActive]}>
                      {log.status.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.timelineDate}>
                      {new Date(log.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {isActive && (
          <TouchableOpacity
            style={styles.cancelLink}
            onPress={() => router.push(`/order/cancel?id=${order.id}` as any)}
          >
            <Text style={styles.cancelLinkText}>Need to cancel this order?</Text>
          </TouchableOpacity>
        )}

        {!isActive && order.status === 'delivered' && (
          <TouchableOpacity style={styles.reorderBtn} onPress={handleReorder}>
            <Text style={styles.reorderBtnText}>Repeat Order</Text>
            <Ionicons name="refresh-outline" size={20} color="white" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: thannigoPalette.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontSize: 18, color: thannigoPalette.neutral, fontWeight: '600' },
  scrollContent: { paddingBottom: 60 },

  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: thannigoPalette.surface, borderBottomWidth: 1, borderBottomColor: thannigoPalette.borderSoft,
  },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 12, color: thannigoPalette.neutral, fontWeight: '500' },
  supportIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: thannigoPalette.borderSoft, alignItems: 'center', justifyContent: 'center' },

  statusCard: {
    margin: 20, borderRadius: 24, padding: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    ...Shadow.lg,
    shadowColor: CUSTOMER_ACCENT,
  },
  statusInfo: { gap: 4 },
  statusLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  statusValue: { fontSize: 24, color: 'white', fontWeight: '900', letterSpacing: -0.5 },
  trackBtn: {
    backgroundColor: 'white', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  trackBtnText: { color: CUSTOMER_ACCENT, fontWeight: '800', fontSize: 13 },

  otpCard: {
    marginHorizontal: 20, marginBottom: 20, backgroundColor: WARNING_BG, borderRadius: 20,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: WARNING_BORDER,
  },
  otpLabel: { fontSize: 12, color: WARNING_DARK, fontWeight: '600' },
  otpValue: { fontSize: 28, color: WARNING_TEXT, fontWeight: '900', letterSpacing: 4 },
  otpHint: { fontSize: 10, color: WARNING_DARK, opacity: 0.7, position: 'absolute', bottom: 8, right: 16 },

  section: { marginHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: thannigoPalette.darkText, marginBottom: 12, letterSpacing: -0.3 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: thannigoPalette.surface,
    borderRadius: 20, padding: 16, ...Shadow.xs,
  },
  shopIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: CUSTOMER_SURF, alignItems: 'center', justifyContent: 'center' },
  addressIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: thannigoPalette.adminRedLight, alignItems: 'center', justifyContent: 'center' },
  infoName: { fontSize: 16, fontWeight: '800', color: thannigoPalette.darkText },
  infoDetail: { fontSize: 13, color: thannigoPalette.neutral, lineHeight: 18, marginTop: 2 },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: thannigoPalette.borderSoft, alignItems: 'center', justifyContent: 'center' },

  itemRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: thannigoPalette.borderSoft,
  },
  itemQty: { width: 32, height: 32, borderRadius: 8, backgroundColor: thannigoPalette.borderSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itemQtyText: { fontSize: 12, fontWeight: '800', color: CUSTOMER_ACCENT },
  itemName: { flex: 1, fontSize: 14, fontWeight: '600', color: thannigoPalette.neutral },
  itemPrice: { fontSize: 14, fontWeight: '800', color: thannigoPalette.darkText },

  billingSection: {
    marginHorizontal: 20, padding: 20, backgroundColor: thannigoPalette.surface, borderRadius: 24, gap: 12,
    marginBottom: 24, ...Shadow.sm,
  },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billLabel: { fontSize: 14, color: thannigoPalette.neutral, fontWeight: '500' },
  billValue: { fontSize: 14, color: thannigoPalette.darkText, fontWeight: '700' },
  totalRow: { borderTopWidth: 1, borderTopColor: thannigoPalette.borderSoft, paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 18, fontWeight: '900', color: thannigoPalette.darkText },
  totalValue: { fontSize: 18, fontWeight: '900', color: CUSTOMER_ACCENT },
  paymentBadge: { alignSelf: 'center', backgroundColor: thannigoPalette.borderSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginTop: 8 },
  paymentText: { fontSize: 11, fontWeight: '700', color: thannigoPalette.neutral, textTransform: 'uppercase', letterSpacing: 0.5 },

  timelineCard: { backgroundColor: thannigoPalette.surface, borderRadius: 20, padding: 16, ...Shadow.xs },
  timelineRow: { flexDirection: 'row', gap: 12, minHeight: 44 },
  timelineDotCol: { alignItems: 'center', width: 16 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: thannigoPalette.borderSoft, marginTop: 4 },
  timelineDotActive: { backgroundColor: CUSTOMER_ACCENT, width: 14, height: 14, borderRadius: 7 },
  timelineLine: { flex: 1, width: 2, backgroundColor: thannigoPalette.borderSoft, marginVertical: 2 },
  timelineContent: { flex: 1, paddingBottom: 12 },
  timelineStatus: { fontSize: 12, fontWeight: '700', color: thannigoPalette.neutral, letterSpacing: 0.3 },
  timelineStatusActive: { color: CUSTOMER_ACCENT, fontSize: 13 },
  timelineDate: { fontSize: 11, color: thannigoPalette.neutral, marginTop: 2 },

  cancelLink: { alignSelf: 'center', padding: 12 },
  cancelLinkText: { color: thannigoPalette.adminRed, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },

  reorderBtn: {
    marginHorizontal: 20, marginBottom: 40, backgroundColor: CUSTOMER_ACCENT, borderRadius: 20,
    height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    ...Shadow.lg, shadowColor: CUSTOMER_ACCENT,
  },
  reorderBtnText: { color: 'white', fontSize: 17, fontWeight: '900' },
});
