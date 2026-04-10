import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, BackHandler
} from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';

import { useDeliveryStore } from '@/stores/deliveryStore';
import { useOrderStore } from '@/stores/orderStore';

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: '#f1f5f9', color: '#64748b', label: 'Pending' },
  assigned: { bg: '#fef3c7', color: '#b45309', label: 'Assigned' },
  accepted: { bg: '#fef3c7', color: '#b45309', label: 'Accepted' },
  picked: { bg: '#e0f0ff', color: '#005d90', label: 'Picked up' },
  delivered: { bg: '#e8f5e9', color: '#2e7d32', label: 'Delivered' },
  completed: { bg: '#e8f5e9', color: '#2e7d32', label: 'Completed' },
  cancelled: { bg: '#ffebee', color: '#c62828', label: 'Cancelled' },
};

const FILTERS = ['All', 'Active', 'Delivered', 'Failed'];

export default function ShopDeliveryManagementScreen() {
  const { orders } = useOrderStore();
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const [filter, setFilter] = useState('All');


  const filtered = orders.filter((t) => {
    if (filter === 'All') return true;
    if (filter === 'Active') return ['assigned', 'accepted', 'picked'].includes(t.status);
    if (filter === 'Delivered') return ['delivered', 'completed'].includes(t.status);
    if (filter === 'Failed') return t.status === 'cancelled';
    return true;
  });

  useAndroidBackHandler(() => {
    safeBack('/shop/settings');
  });


  const activeCount = orders.filter(t => ['assigned', 'accepted', 'picked'].includes(t.status)).length;
  const deliveredToday = orders.filter(t => ['delivered', 'completed'].includes(t.status)).length;
  const cancelledCount = orders.filter(t => t.status === 'cancelled').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
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
        <TouchableOpacity
          style={styles.dispatchBtn}
          onPress={() => Alert.alert('Dispatch Center', 'Call the dispatch team for urgent redirects.')}
        >
          <Ionicons name="radio-outline" size={16} color="#005d90" />
          <Text style={styles.dispatchBtnText}>Dispatch</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
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
            { label: 'Active', value: activeCount, color: '#005d90', bg: '#e0f0ff', icon: 'bicycle-outline' },
            { label: 'Delivered', value: deliveredToday, color: '#2e7d32', bg: '#e8f5e9', icon: 'checkmark-circle-outline' },
            { label: 'Cancelled', value: cancelledCount, color: '#c62828', bg: '#ffebee', icon: 'close-circle-outline' },
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
        <Text style={styles.sectionTitle}>{filtered.length} trips</Text>
        {filtered.map((trip) => {
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
                <Ionicons name="location-outline" size={13} color="#707881" />
                <Text style={styles.address} numberOfLines={1}>{trip.address}</Text>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="person-outline" size={12} color="#005d90" />
                  <Text style={styles.metaText}>{trip.deliveryAgentName || 'Unassigned'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={12} color="#005d90" />
                  <Text style={styles.metaText}>{trip.eta}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="cash-outline" size={12} color="#2e7d32" />
                  <Text style={[styles.metaText, { color: '#2e7d32' }]}>₹{trip.total} · {trip.paymentMethod.toUpperCase()}</Text>
                </View>
              </View>

              {['assigned', 'accepted', 'picked'].includes(trip.status) && (
                <TouchableOpacity
                  style={styles.trackBtn}
                  onPress={() => router.push('/order/tracking' as any)}
                >
                  <Ionicons name="navigate-outline" size={14} color="#005d90" />
                  <Text style={styles.trackBtnText}>Track Live</Text>
                </TouchableOpacity>
              )}

              {trip.status === 'cancelled' && (
                <TouchableOpacity
                  style={styles.rescheduleBtn}
                  onPress={() => Alert.alert('History', `Order ${trip.id} was cancelled.`)}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.92)' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 22, fontWeight: '900', color: '#003a5c', letterSpacing: -0.5 },
  roleLabel: { fontSize: 9, fontWeight: '700', color: '#006878', letterSpacing: 1.5, marginTop: 3 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  dispatchBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#e0f0ff', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  dispatchBtnText: { fontSize: 13, fontWeight: '700', color: '#005d90' },
  content: { paddingHorizontal: 24, paddingBottom: 120 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 18 },
  pageTitle: { fontSize: 32, fontWeight: '900', color: '#181c20', letterSpacing: -0.5, flex: 1 },
  manageBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#005d90', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  manageBtnText: { color: 'white', fontSize: 13, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: 'white', borderRadius: 18, padding: 14, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 10, color: '#707881', fontWeight: '600' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#e0e2e8' },
  filterPillActive: { backgroundColor: '#005d90', borderColor: '#005d90' },
  filterText: { fontSize: 13, fontWeight: '700', color: '#707881' },
  filterTextActive: { color: 'white' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#94a3b8', marginBottom: 12, letterSpacing: 0.5 },
  tripCard: { backgroundColor: 'white', borderRadius: 20, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  tripTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tripId: { fontSize: 12, fontWeight: '800', color: '#005d90' },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  customerName: { fontSize: 16, fontWeight: '800', color: '#181c20', marginBottom: 5 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  address: { fontSize: 12, color: '#707881', fontWeight: '500', flex: 1 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#005d90', fontWeight: '700' },
  trackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbf7', backgroundColor: '#f0f7ff' },
  trackBtnText: { fontSize: 13, fontWeight: '700', color: '#005d90' },
  rescheduleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fff5f5' },
  rescheduleBtnText: { fontSize: 13, fontWeight: '700', color: '#c62828' },
});
