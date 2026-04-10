import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useDeliveryStore } from '@/stores/deliveryStore';

const TRIPS = [
  { id: 't1', orderId: '#9831', customer: 'Ananya Sharma', address: 'Flat 4B, Emerald Heights, Sector 42', distance: '1.2 km', eta: '8 min', priority: 'Urgent', cans: 1, amount: '₹50', status: 'assigned' },
  { id: 't2', orderId: '#9830', customer: 'Karthik Rajan', address: 'Plot 12, Green View Colony', distance: '2.8 km', eta: '15 min', priority: 'Normal', cans: 2, amount: '₹90', status: 'assigned' },
  { id: 't3', orderId: '#9829', customer: 'Meena Subramanian', address: '22/A, Brigade Road Extension', distance: '4.1 km', eta: '22 min', priority: 'Normal', cans: 3, amount: '₹135', status: 'assigned' },
];

export default function DeliveryDashboardScreen() {
  const router = useRouter();
  const { tasks, online, toggleOnline, assignCurrentTask } = useDeliveryStore();
  const [trips] = useState(TRIPS);

  const totalEarnings = 284;
  const completedToday = 6;
  const activeTrips = trips.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* HEADER — Gradient */}
      <LinearGradient
        colors={online ? ['#005d90', '#0077b6'] : ['#475569', '#334155']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good morning, Ravi 👋</Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: online ? '#4ade80' : '#f87171' }]} />
              <Text style={styles.onlineStatus}>{online ? 'Online — ready for trips' : 'Offline'}</Text>
            </View>
          </View>
          <View style={styles.toggleWrap}>
            <Text style={styles.toggleLabel}>{online ? 'GO\nOFFLINE' : 'GO\nONLINE'}</Text>
            <Switch
              value={online}
              onValueChange={toggleOnline}
              trackColor={{ false: '#94a3b8', true: '#bfdbf7' }}
              thumbColor={online ? 'white' : '#94a3b8'}
            />
          </View>
        </View>

        {/* TODAY'S STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>₹{totalEarnings}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{completedToday}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{activeTrips}</Text>
            <Text style={styles.statLabel}>In Queue</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* QUICK ACTIONS */}
        <View style={styles.quickRow}>
          {[
            { label: 'My Earnings', icon: 'cash-outline', color: '#2e7d32', bg: '#e8f5e9' },
            { label: 'Trip History', icon: 'time-outline', color: '#b45309', bg: '#fef3c7' },
            { label: 'Emergency', icon: 'warning-outline', color: '#c62828', bg: '#ffebee' },
          ].map((q) => (
            <TouchableOpacity key={q.label} style={styles.quickBtn}>
              <View style={[styles.quickIcon, { backgroundColor: q.bg }]}>
                <Ionicons name={q.icon as any} size={20} color={q.color} />
              </View>
              <Text style={styles.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ACTIVE TRIPS */}
        <Text style={styles.sectionTitle}>
          {online ? `Assigned Trips (${trips.length})` : 'Go online to receive trips'}
        </Text>

        {!online && (
          <View style={styles.offlineCard}>
            <Ionicons name="moon-outline" size={40} color="#94a3b8" />
            <Text style={styles.offlineTitle}>You are offline</Text>
            <Text style={styles.offlineSub}>Toggle the switch above to start receiving delivery assignments.</Text>
          </View>
        )}

        {online && trips.map((trip) => (
          <View key={trip.id} style={styles.tripCard}>
            {/* TRIP TOP */}
            <View style={styles.tripTop}>
              <Text style={styles.tripOrderId}>{trip.orderId}</Text>
              <View style={[styles.priorityChip, trip.priority === 'Urgent' && styles.urgentChip]}>
                {trip.priority === 'Urgent' && <Ionicons name="flash" size={11} color="#c62828" />}
                <Text style={[styles.priorityText, trip.priority === 'Urgent' && styles.urgentText]}>
                  {trip.priority}
                </Text>
              </View>
            </View>

            {/* CUSTOMER & ADDRESS */}
            <Text style={styles.tripCustomer}>{trip.customer}</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={14} color="#707881" />
              <Text style={styles.tripAddress} numberOfLines={1}>{trip.address}</Text>
            </View>

            {/* TRIP META */}
            <View style={styles.tripMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="speedometer-outline" size={13} color="#005d90" />
                <Text style={styles.metaText}>{trip.distance}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={13} color="#005d90" />
                <Text style={styles.metaText}>ETA {trip.eta}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="water-outline" size={13} color="#005d90" />
                <Text style={styles.metaText}>{trip.cans} can{trip.cans > 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="cash-outline" size={13} color="#2e7d32" />
                <Text style={[styles.metaText, { color: '#2e7d32' }]}>{trip.amount}</Text>
              </View>
            </View>

            {/* ACTIONS */}
            <View style={styles.tripActions}>
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => {
                  assignCurrentTask(trip.id);
                  router.push('/delivery/navigation' as any);
                }}
              >
                <LinearGradient
                  colors={['#005d90', '#0077b6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startBtnGrad}
                >
                  <Ionicons name="navigate" size={16} color="white" />
                  <Text style={styles.startBtnText}>Start Trip</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.callBtn}>
                <Ionicons name="call-outline" size={18} color="#005d90" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* SHIFT SUMMARY */}
        {online && (
          <View style={styles.shiftCard}>
            <View style={styles.shiftRow}>
              <Ionicons name="time-outline" size={20} color="#005d90" />
              <View style={{ flex: 1 }}>
                <Text style={styles.shiftTitle}>Shift Active</Text>
                <Text style={styles.shiftSub}>Started at 9:00 AM · 4h 22m elapsed</Text>
              </View>
              <TouchableOpacity style={styles.endShiftBtn}>
                <Text style={styles.endShiftText}>End Shift</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },

  header: { paddingTop: 8, paddingBottom: 24, paddingHorizontal: 24 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 20, fontWeight: '900', color: 'white', marginBottom: 6 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  onlineStatus: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  toggleWrap: { alignItems: 'center', gap: 4 },
  toggleLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '800', letterSpacing: 0.5, textAlign: 'center' },

  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 18, padding: 16 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '900', color: 'white', marginBottom: 2 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

  content: { padding: 20, gap: 16, paddingBottom: 120 },

  quickRow: { flexDirection: 'row', gap: 10 },
  quickBtn: { flex: 1, backgroundColor: 'white', borderRadius: 18, padding: 14, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  quickIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 11, fontWeight: '700', color: '#181c20', textAlign: 'center' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#181c20', letterSpacing: -0.3 },

  offlineCard: { backgroundColor: 'white', borderRadius: 20, padding: 32, alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  offlineTitle: { fontSize: 18, fontWeight: '800', color: '#181c20' },
  offlineSub: { fontSize: 13, color: '#707881', textAlign: 'center', lineHeight: 18 },

  tripCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  tripTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tripOrderId: { fontSize: 13, fontWeight: '800', color: '#005d90' },
  priorityChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  urgentChip: { backgroundColor: '#ffebee' },
  priorityText: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  urgentText: { color: '#c62828' },
  tripCustomer: { fontSize: 17, fontWeight: '800', color: '#181c20', marginBottom: 5 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 14 },
  tripAddress: { flex: 1, fontSize: 12, color: '#707881', fontWeight: '500' },
  tripMeta: { flexDirection: 'row', gap: 12, marginBottom: 14, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#005d90', fontWeight: '700' },
  tripActions: { flexDirection: 'row', gap: 10 },
  startBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  startBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 },
  startBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
  callBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },

  shiftCard: { backgroundColor: 'white', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  shiftRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shiftTitle: { fontSize: 14, fontWeight: '800', color: '#181c20', marginBottom: 2 },
  shiftSub: { fontSize: 11, color: '#707881', fontWeight: '500' },
  endShiftBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#ffebee' },
  endShiftText: { color: '#c62828', fontWeight: '800', fontSize: 12 },
});
