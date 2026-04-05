import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Logo } from '@/components/ui/Logo';

/* ---- DATA ---- */
const STATS = [
  { label: 'Total Orders', value: '1,284', icon: 'bag-handle-outline' as const, delta: '+12%', deltaPos: true, color: '#005d90', bg: '#e0f0ff' },
  { label: 'Active Users', value: '8,432', icon: 'people-outline' as const, delta: '+5%', deltaPos: true, color: '#006878', bg: '#e0f7fa' },
  { label: 'Revenue', value: '₹4,12,050', icon: 'cash-outline' as const, delta: '+24%', deltaPos: true, color: '#23616b', bg: '#e0f2f1' },
  { label: 'Active Shops', value: '42', icon: 'water-outline' as const, delta: '-2%', deltaPos: false, color: '#404850', bg: '#ebeef4' },
];

const LIVE_ORDERS = [
  {
    id: 'TN-9402',
    title: 'Order #TN-9402 — Delayed Delivery',
    sub: 'Assigned to: PureDrop Waters (5.2 km away)',
    status: 'FLAGGED',
    statusColor: '#ba1a1a',
    statusBg: 'rgba(186,26,26,0.08)',
    borderColor: '#ba1a1a',
    progress: 0.3,
    isFlagged: true,
  },
  {
    id: 'TN-9408',
    title: 'Order #TN-9408 — 5x 20L Cans',
    sub: 'Customer: Rohan Sharma • Hub: AquaPrime',
    status: 'Out for Delivery',
    statusColor: '#006878',
    statusBg: '#e0f7fa',
    borderColor: '#e0e2e8',
    progress: 0.8,
    isFlagged: false,
  },
  {
    id: 'TN-9412',
    title: 'Order #TN-9412 — 12x 1L Bottles',
    sub: 'Customer: Meera Nair • Hub: BlueSpring',
    status: 'Processing',
    statusColor: '#005d90',
    statusBg: '#e0f0ff',
    borderColor: '#e0e2e8',
    progress: 0.33,
    isFlagged: false,
  },
  {
    id: 'TN-9415',
    title: 'Order #TN-9415 — Bulk Corporate',
    sub: 'Customer: TechHub Office • Hub: AquaPrime',
    status: 'Pending Pickup',
    statusColor: '#707881',
    statusBg: '#ebeef4',
    borderColor: '#e0e2e8',
    progress: 0.05,
    isFlagged: false,
  },
];

const VERIF_QUEUE = [
  { shop: 'Oceania Fresh', reason: 'Pending FSSAI Documents', doc: 'FSSAI_VER_2023.pdf' },
  { shop: 'Himalayan Mist', reason: 'Tax ID Verification', doc: 'GSTIN_74021.pdf' },
  { shop: "Nature's Sip", reason: 'Address Proof Audit', doc: 'LEASE_AGMT.pdf' },
];

const NAV_ITEMS = [
  { icon: 'grid-outline' as const, label: 'Overview', active: true },
  { icon: 'storefront-outline' as const, label: 'Shops', active: false },
  { icon: 'people-outline' as const, label: 'Customers', active: false },
  { icon: 'receipt-outline' as const, label: 'Orders', active: false },
  { icon: 'cash-outline' as const, label: 'Finance', active: false },
  { icon: 'settings-outline' as const, label: 'Settings', active: false },
];

/* ---- COMPONENTS ---- */
function StatCard({ stat }: { stat: typeof STATS[0] }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statCardTop}>
        <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
          <Ionicons name={stat.icon} size={20} color={stat.color} />
        </View>
        <View style={[styles.deltaBadge, { backgroundColor: stat.deltaPos ? '#e0f7fa' : '#ffdad6' }]}>
          <Text style={[styles.deltaText, { color: stat.deltaPos ? '#006878' : '#ba1a1a' }]}>{stat.delta}</Text>
        </View>
      </View>
      <Text style={styles.statLabel}>{stat.label}</Text>
      <Text style={styles.statValue}>{stat.value}</Text>
    </View>
  );
}

function LiveOrderRow({ order }: { order: typeof LIVE_ORDERS[0] }) {
  return (
    <View style={[
      styles.liveOrderCard,
      { borderLeftColor: order.isFlagged ? '#ba1a1a' : '#e0e2e8' },
      order.isFlagged && styles.liveOrderCardFlagged,
    ]}>
      <View style={styles.liveOrderTop}>
        <View style={{ flex: 1, gap: 2 }}>
          {order.isFlagged && (
            <View style={styles.flaggedRow}>
              <Ionicons name="warning" size={14} color="#ba1a1a" />
              <Text style={styles.flaggedText}>Delayed — Action Required</Text>
            </View>
          )}
          <Text style={styles.liveOrderTitle} numberOfLines={1}>{order.title}</Text>
          <Text style={styles.liveOrderSub}>{order.sub}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: order.statusBg }]}>
          <Text style={[styles.statusText, { color: order.statusColor }]}>{order.status}</Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, {
          width: `${order.progress * 100}%` as any,
          backgroundColor: order.isFlagged ? '#ba1a1a' : order.statusColor,
        }]} />
      </View>
      {order.isFlagged && (
        <TouchableOpacity style={styles.interveneBtn}>
          <Text style={styles.interveneBtnText}>Intervene Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ---- SCREEN ---- */
export default function AdminOverviewScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24, paddingBottom: 80 }}
      >
        <Text style={styles.pageTitle}>Dashboard</Text>
        
        {/* STATS GRID */}
        <View style={styles.statsGrid}>
          {STATS.map((stat) => <StatCard key={stat.label} stat={stat} />)}
        </View>

          {/* LIVE FEED */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Live Flow</Text>
              <View style={styles.liveDot} />
            </View>
            <TouchableOpacity style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {LIVE_ORDERS.map((order) => (
            <LiveOrderRow key={order.id} order={order} />
          ))}

          {/* VERIFICATION QUEUE */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Verification</Text>
              <View style={styles.verifCountBadge}>
                <Text style={styles.verifCountText}>3</Text>
              </View>
            </View>
          </View>

          <View style={styles.verifCard}>
            {VERIF_QUEUE.map((item, index) => (
              <View key={item.shop}>
                <View style={styles.verifRow}>
                  <View style={styles.verifIcon}>
                    <Ionicons name="storefront-outline" size={18} color="#005d90" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.verifShop}>{item.shop}</Text>
                    <Text style={styles.verifReason}>{item.reason}</Text>
                    <View style={styles.verifDoc}>
                      <Ionicons name="document-text-outline" size={12} color="#005d90" />
                      <Text style={styles.verifDocText}>{item.doc}</Text>
                    </View>
                  </View>
                  <View style={styles.verifActions}>
                    <TouchableOpacity style={styles.rejectBtn}>
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.approveBtn}>
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {index < VERIF_QUEUE.length - 1 && <View style={styles.verifDivider} />}
              </View>
            ))}
            <TouchableOpacity style={styles.viewAllVerifBtn}>
              <Text style={styles.viewAllText}>View All Requests</Text>
            </TouchableOpacity>
          </View>

          {/* SYSTEM HEALTH FOOTER */}
          <View style={styles.sysFooter}>
            <View style={styles.sysIndicator}>
              <View style={styles.sysDot} />
              <Text style={styles.sysText}>Server: Mumbai-West-1 (Stable)</Text>
            </View>
            <View style={styles.sysIndicator}>
              <View style={styles.sysDot} />
              <Text style={styles.sysText}>API Latency: 42ms</Text>
            </View>
            <Text style={styles.sysFooterBrand}>© 2024 ThanniGo Platform · v2.4.1</Text>
          </View>
        </ScrollView>
      {/* EMERGENCY FAB */}
      <TouchableOpacity style={styles.emergencyFab}>
        <LinearGradient colors={['#005d90', '#0077b6']} style={styles.emergencyFabGrad}>
          <Ionicons name="headset-outline" size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

/* ---- STYLES ---- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },

  pageTitle: { fontSize: 32, fontWeight: '900', color: '#181c20', letterSpacing: -0.5, marginBottom: 24 },
  
  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    width: '47%', backgroundColor: 'white', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    borderLeftWidth: 3, borderLeftColor: '#005d90',
  },
  statCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  deltaBadge: { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  deltaText: { fontSize: 10, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#707881', fontWeight: '500', marginBottom: 3 },
  statValue: { fontSize: 20, fontWeight: '900', color: '#181c20', letterSpacing: -0.5 },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#181c20', letterSpacing: -0.3 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#006878' },
  viewAllBtn: { backgroundColor: '#e0f0ff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  viewAllText: { color: '#005d90', fontWeight: '700', fontSize: 12 },
  verifCountBadge: { backgroundColor: '#005d90', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  verifCountText: { color: 'white', fontWeight: '700', fontSize: 12 },

  // Live Orders
  liveOrderCard: {
    backgroundColor: 'white', borderRadius: 18, padding: 16, marginBottom: 10,
    borderLeftWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  liveOrderCardFlagged: { backgroundColor: 'rgba(186,26,26,0.04)' },
  liveOrderTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  flaggedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  flaggedText: { fontSize: 11, color: '#ba1a1a', fontWeight: '700' },
  liveOrderTitle: { fontSize: 13, fontWeight: '800', color: '#181c20', marginBottom: 2 },
  liveOrderSub: { fontSize: 11, color: '#707881' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: '700' },
  progressTrack: { height: 5, backgroundColor: '#ebeef4', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  interveneBtn: {
    marginTop: 10, backgroundColor: '#ba1a1a', borderRadius: 12,
    paddingVertical: 9, alignItems: 'center',
  },
  interveneBtnText: { color: 'white', fontWeight: '800', fontSize: 13 },

  // Verification
  verifCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  verifRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14 },
  verifIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#ebeef4', alignItems: 'center', justifyContent: 'center',
  },
  verifShop: { fontSize: 14, fontWeight: '800', color: '#181c20', marginBottom: 2 },
  verifReason: { fontSize: 12, color: '#707881', fontStyle: 'italic', marginBottom: 4 },
  verifDoc: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifDocText: { fontSize: 11, color: '#005d90', fontWeight: '700' },
  verifActions: { gap: 6 },
  rejectBtn: {
    backgroundColor: '#ffdad6', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12,
  },
  rejectBtnText: { fontSize: 11, fontWeight: '700', color: '#ba1a1a' },
  approveBtn: {
    backgroundColor: '#005d90', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12,
  },
  approveBtnText: { fontSize: 11, fontWeight: '700', color: 'white' },
  verifDivider: { height: 1, backgroundColor: '#f1f4f9', marginLeft: 52 },
  viewAllVerifBtn: {
    borderWidth: 1.5, borderColor: '#e0f0ff', borderRadius: 14,
    paddingVertical: 12, alignItems: 'center', marginTop: 8,
  },

  // System footer
  sysFooter: { marginTop: 20, gap: 6, alignItems: 'center' },
  sysIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sysDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#006878' },
  sysText: { fontSize: 11, color: '#707881' },
  sysFooterBrand: { fontSize: 11, color: '#bfc7d1', marginTop: 4 },

  // Emergency FAB
  emergencyFab: {
    position: 'absolute', bottom: 24, right: 20,
    borderRadius: 30, overflow: 'hidden',
    shadowColor: '#005d90', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  emergencyFabGrad: {
    width: 56, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 28,
  },
});
