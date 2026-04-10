import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { useDeliveryStore } from '@/stores/deliveryStore';

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  assigned: { bg: '#fef3c7', color: '#b45309', label: 'Assigned' },
  in_transit: { bg: '#e0f0ff', color: '#005d90', label: 'In Transit' },
  delivered: { bg: '#e8f5e9', color: '#2e7d32', label: 'Delivered' },
  failed: { bg: '#ffebee', color: '#c62828', label: 'Failed' },
};

const MOCK_TRIPS = [
  { id: 't1', orderId: '#9831', customer: 'Ananya Sharma', address: 'Flat 4B, Emerald Heights', rider: 'Ravi Kumar', status: 'in_transit', eta: '4 min', amount: '₹50', payment: 'UPI' },
  { id: 't2', orderId: '#9830', customer: 'Karthik Rajan', address: 'Plot 12, Green View Colony', rider: 'Ravi Kumar', status: 'assigned', eta: '18 min', amount: '₹90', payment: 'Cash' },
  { id: 't3', orderId: '#9829', customer: 'Meena Subramanian', address: '22/A, Brigade Road Ext.', rider: 'Suresh M', status: 'delivered', eta: 'Done', amount: '₹135', payment: 'Wallet' },
  { id: 't4', orderId: '#9828', customer: 'Prakash Nair', address: '10B, Lake View Apartments', rider: 'Suresh M', status: 'failed', eta: '—', amount: '₹50', payment: 'UPI' },
];

const FILTERS = ['All', 'Active', 'Delivered', 'Failed'];

export default function ShopDeliveryManagementScreen() {
  const router = useRouter();
  const { tasks } = useDeliveryStore();
  const [filter, setFilter] = useState('All');

  const filtered = MOCK_TRIPS.filter((t) => {
    if (filter === 'All') return true;
    if (filter === 'Active') return ['assigned', 'in_transit'].includes(t.status);
    if (filter === 'Delivered') return t.status === 'delivered';
    if (filter === 'Failed') return t.status === 'failed';
    return true;
  });

  const activeCount = MOCK_TRIPS.filter(t => ['assigned', 'in_transit'].includes(t.status)).length;
  const deliveredToday = MOCK_TRIPS.filter(t => t.status === 'delivered').length;
  const failedCount = MOCK_TRIPS.filter(t => t.status === 'failed').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <View style={styles.brandRow}>
            <Logo size="md" />
            <Text style={styles.brandName}>ThanniGo</Text>
          </View>
          <Text style={styles.roleLabel}>SHOP PANEL</Text>
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
            { label: 'Failed', value: failedCount, color: '#c62828', bg: '#ffebee', icon: 'close-circle-outline' },
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
          const status = STATUS_COLORS[trip.status];
          return (
            <View key={trip.id} style={styles.tripCard}>
              <View style={styles.tripTop}>
                <Text style={styles.tripId}>{trip.orderId}</Text>
                <View style={[styles.statusChip, { backgroundColor: status.bg }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>

              <Text style={styles.customerName}>{trip.customer}</Text>
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={13} color="#707881" />
                <Text style={styles.address}>{trip.address}</Text>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="person-outline" size={12} color="#005d90" />
                  <Text style={styles.metaText}>{trip.rider}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={12} color="#005d90" />
                  <Text style={styles.metaText}>{trip.eta}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="cash-outline" size={12} color="#2e7d32" />
                  <Text style={[styles.metaText, { color: '#2e7d32' }]}>{trip.amount} · {trip.payment}</Text>
                </View>
              </View>

              {['assigned', 'in_transit'].includes(trip.status) && (
                <TouchableOpacity
                  style={styles.trackBtn}
                  onPress={() => router.push('/order/tracking' as any)}
                >
                  <Ionicons name="navigate-outline" size={14} color="#005d90" />
                  <Text style={styles.trackBtnText}>Track Live</Text>
                </TouchableOpacity>
              )}

              {trip.status === 'failed' && (
                <TouchableOpacity
                  style={styles.rescheduleBtn}
                  onPress={() => Alert.alert('Reschedule', `Reschedule order ${trip.orderId}?`)}
                >
                  <Ionicons name="calendar-outline" size={14} color="#c62828" />
                  <Text style={styles.rescheduleBtnText}>Reschedule Delivery</Text>
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
