import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/providers/ThemeContext';
import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { apiClient } from '@/api/client';
import { Shadow, roleAccent, roleSurface, roleGradients } from '@/constants/theme';

const SHOP_ACCENT = roleAccent.shop_owner;
const SHOP_SURF = roleSurface.shop_owner;
const SHOP_GRAD: [string, string] = [roleGradients.shop_owner.start, roleGradients.shop_owner.end];

const FILTERS = ['All', 'Active', 'Delivered', 'Failed'];

export default function ShopDeliveryManagementScreen() {
  const { colors, isDark } = useAppTheme();

  const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: colors.border, color: colors.muted, label: 'Pending' },
    assigned: { bg: '#fef3c7', color: '#b45309', label: 'Assigned' },
    accepted: { bg: '#fef3c7', color: '#b45309', label: 'Accepted' },
    picked: { bg: '#e0f0ff', color: SHOP_ACCENT, label: 'Picked up' },
    delivered: { bg: '#e8f5e9', color: colors.success, label: 'Delivered' },
    completed: { bg: '#e8f5e9', color: colors.success, label: 'Completed' },
    cancelled: { bg: '#ffebee', color: '#ba1a1a', label: 'Cancelled' },
  };

  const styles = makeStyles(colors);
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const [filter, setFilter] = useState('All');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await apiClient.get('/shop-owner/orders', {
        params: { limit: 100 },
      });
      if (res.data?.status === 1) {
        const raw: any[] = res.data.data?.data ?? res.data.data ?? [];
        setOrders(raw.map((o: any) => ({
          id: String(o.id),
          status: o.status,
          customerName: o.User?.name ?? o.customer_name ?? 'Customer',
          address: o.delivery_address ?? o.address ?? '—',
          deliveryAgentName: o.DeliveryPerson?.name ?? o.delivery_agent_name ?? null,
          eta: o.eta ?? '—',
          total: o.total_amount ?? o.total ?? 0,
          paymentMethod: o.payment_method ?? 'cod',
        })));
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load delivery orders.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useAndroidBackHandler(() => {
    safeBack('/shop/settings');
  });

  const filtered = orders.filter((t) => {
    if (filter === 'All') return true;
    if (filter === 'Active') return ['assigned', 'accepted', 'picked'].includes(t.status);
    if (filter === 'Delivered') return ['delivered', 'completed'].includes(t.status);
    if (filter === 'Failed') return t.status === 'cancelled';
    return true;
  });

  const activeCount = orders.filter(t => ['assigned', 'accepted', 'picked'].includes(t.status)).length;
  const deliveredToday = orders.filter(t => ['delivered', 'completed'].includes(t.status)).length;
  const cancelledCount = orders.filter(t => t.status === 'cancelled').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <BackButton fallback="/shop/settings" />
          <View>
            <View style={styles.brandRow}>
              <Logo size="md" />
              <Text style={styles.brandName}>ThanniGo</Text>
            </View>
            <Text style={styles.roleLabel}>SHOP PANEL</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            style={[styles.dispatchBtn, { backgroundColor: SHOP_SURF }]}
            onPress={() => router.push('/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={18} color={SHOP_ACCENT} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dispatchBtn}
            onPress={() => Toast.show({
              type: 'info',
              text1: 'Dispatch Center',
              text2: 'Call the dispatch team for urgent redirects.'
            })}
          >
            <Ionicons name="radio-outline" size={16} color={SHOP_ACCENT} />
            <Text style={styles.dispatchBtnText}>Dispatch</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />}
      >
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Delivery Management</Text>
          <TouchableOpacity style={styles.manageBtn} onPress={() => router.push('/shop/delivery-fleet' as any)}>
            <Ionicons name="people-circle" size={18} color="white" />
            <Text style={styles.manageBtnText}>Fleet</Text>
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          {[
            { label: 'Active', value: activeCount, color: SHOP_ACCENT, bg: '#e0f0ff', icon: 'bicycle-outline' },
            { label: 'Delivered', value: deliveredToday, color: colors.success, bg: '#e8f5e9', icon: 'checkmark-circle-outline' },
            { label: 'Cancelled', value: cancelledCount, color: '#ba1a1a', bg: '#ffebee', icon: 'close-circle-outline' },
          ].map((s) => (
            <View key={s.label} style={styles.statBox}>
              <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon as any} size={18} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* FILTERS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* TRIP LIST */}
        <Text style={styles.sectionTitle}>{loading ? '…' : `${filtered.length} trips`}</Text>
        {loading && <ActivityIndicator color={SHOP_ACCENT} style={{ marginVertical: 32 }} />}
        {!loading && filtered.map((trip) => {
          const status = STATUS_COLORS[trip.status] || STATUS_COLORS.pending;
          return (
            <View key={trip.id} style={styles.tripCard}>
              <View style={styles.tripTop}>
                <Text style={styles.tripId}>#{trip.id.split('-').pop()}</Text>
                <View style={[styles.statusChip, { backgroundColor: status.bg }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>

              <Text style={styles.customerName}>{trip.customerName}</Text>
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={13} color={colors.muted} />
                <Text style={styles.address} numberOfLines={1}>{trip.address}</Text>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="person-outline" size={12} color={SHOP_ACCENT} />
                  <Text style={styles.metaText}>{trip.deliveryAgentName || 'Unassigned'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={12} color={SHOP_ACCENT} />
                  <Text style={styles.metaText}>{trip.eta}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="cash-outline" size={12} color="#2e7d32" />
                  <Text style={[styles.metaText, { color: colors.success }]}>₹{trip.total} · {trip.paymentMethod.toUpperCase()}</Text>
                </View>
              </View>

              {['assigned', 'accepted', 'picked'].includes(trip.status) && (
                <TouchableOpacity
                  style={styles.trackBtn}
                  onPress={() => router.push('/order/tracking' as any)}
                >
                  <Ionicons name="navigate-outline" size={14} color={SHOP_ACCENT} />
                  <Text style={styles.trackBtnText}>Track Live</Text>
                </TouchableOpacity>
              )}

              {trip.status === 'cancelled' && (
                <TouchableOpacity
                  style={styles.rescheduleBtn}
                  onPress={() => Toast.show({
                    type: 'info',
                    text1: 'History',
                    text2: `Order ${trip.id} was cancelled.`
                  })}
                >
                  <Ionicons name="close-circle-outline" size={14} color="#c62828" />
                  <Text style={styles.rescheduleBtnText}>Cancelled</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.92)' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  roleLabel: { fontSize: 9, fontWeight: '700', color: SHOP_ACCENT, letterSpacing: 1.5, marginTop: 3 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  dispatchBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#e0f0ff', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  dispatchBtnText: { fontSize: 13, fontWeight: '700', color: SHOP_ACCENT },
  content: { paddingHorizontal: 24, paddingBottom: 120 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 18 },
  pageTitle: { fontSize: 32, fontWeight: '900', color: colors.text, letterSpacing: -0.5, flex: 1 },
  manageBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: SHOP_ACCENT, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  manageBtnText: { color: 'white', fontSize: 13, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: colors.surface, borderRadius: 18, padding: 14, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 10, color: colors.muted, fontWeight: '600' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterPillActive: { backgroundColor: SHOP_ACCENT, borderColor: SHOP_ACCENT },
  filterText: { fontSize: 13, fontWeight: '700', color: colors.muted },
  filterTextActive: { color: 'white' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#94a3b8', marginBottom: 12, letterSpacing: 0.5 },
  tripCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  tripTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tripId: { fontSize: 12, fontWeight: '800', color: SHOP_ACCENT },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  customerName: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 5 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  address: { fontSize: 12, color: colors.muted, fontWeight: '500', flex: 1 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: SHOP_ACCENT, fontWeight: '700' },
  trackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbf7', backgroundColor: '#f0f7ff' },
  trackBtnText: { fontSize: 13, fontWeight: '700', color: SHOP_ACCENT },
  rescheduleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fff5f5' },
  rescheduleBtnText: { fontSize: 13, fontWeight: '700', color: '#ba1a1a' },
});


