import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname, Href } from 'expo-router';
import { useAppSession } from '@/providers/AppSessionProvider';
import { Logo } from '@/components/ui/Logo';
import { adminApi, AdminShop } from '@/api/adminApi';
import { analyticsApi } from '@/api/analyticsApi';
import type { AdminDashboard } from '@/types/api';

/* ---- DATA (fallback skeleton while loading) ---- */
const STATS_CONFIG = [
  { label: 'Total Orders', icon: 'bag-handle-outline' as const, color: '#ba1a1a', bg: '#f0f4ff', grad: ['#ba1a1a', '#e32424'] },
  { label: 'Active Users', icon: 'people-outline' as const, color: '#006878', bg: '#e0f7fa', grad: ['#006878', '#008e9b'] },
  { label: 'Revenue', icon: 'cash-outline' as const, color: '#b45309', bg: '#fef3c7', grad: ['#b45309', '#d97706'] },
  { label: 'Active Shops', icon: 'water-outline' as const, color: '#1e293b', bg: '#f1f5f9', grad: ['#1e293b', '#475569'] },
];

/* ---- COMPONENTS ---- */
type StatCardData = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  bg: string;
  grad: string[];
  value: string;
  delta: string;
  deltaPos: boolean;
};

function StatCard({ stat, isDesktop }: { stat: StatCardData; isDesktop: boolean }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statCardTop}>
        <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
          <Ionicons name={stat.icon} size={isDesktop ? 22 : 18} color={stat.color} />
        </View>
        <View style={[styles.deltaBadge, { backgroundColor: stat.deltaPos ? '#ecfdf5' : '#fff1f2' }]}>
          <Text style={[styles.deltaText, { color: stat.deltaPos ? '#059669' : '#e11d48' }]}>{stat.delta}</Text>
        </View>
      </View>
      <View>
        <Text style={styles.statLabel}>{stat.label}</Text>
        <Text style={[styles.statValue, isDesktop && { fontSize: 24 }]}>{stat.value}</Text>
      </View>
    </View>
  );
}

/* ---- SCREEN ---- */
export default function AdminOverviewScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const router = useRouter();
  const pathname = usePathname();
  const { user, status } = useAppSession();
  
  const [refreshing, setRefreshing] = useState(false);
  const [pendingShops, setPendingShops] = useState<AdminShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<AdminDashboard | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const [shopsRes, analytics] = await Promise.allSettled([
        adminApi.listShops('pending_review'),
        analyticsApi.getAdminDashboard({ period: 'today' }),
      ]);

      if (shopsRes.status === 'fulfilled' && shopsRes.value.data) {
        setPendingShops(shopsRes.value.data);
      }
      if (analytics.status === 'fulfilled') {
        setDashboardData(analytics.value);
      }
    } catch (err: any) {
      console.error('[AdminDashboard] Fetch error:', err);
      Toast.show({ type: 'error', text1: 'Sync Error', text2: 'Failed to fetch the verification queue.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, [fetchDashboard]);

  // Loading indicator for authenticated users waiting for data
  if (status === 'loading' || (status === 'authenticated' && !user)) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ba1a1a" />
      </View>
    );
  }

  // Guard: Not logged in or not admin
  if (status === 'anonymous' || (user && user?.role !== 'admin')) {
     return (
       <View style={[styles.container, styles.centered]}>
         <Ionicons name="lock-closed-outline" size={64} color="#ba1a1a" />
         <Text style={styles.errorTitle}>Restricted Area</Text>
         <Text style={styles.errorMsg}>
            You do not have administrative privileges to access this dashboard.
         </Text>
         <TouchableOpacity 
           style={styles.switchBtn} 
           onPress={() => router.replace('/auth')}
         >
           <Text style={styles.switchBtnText}>Back to Login</Text>
         </TouchableOpacity>
       </View>
     );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <View style={styles.brandRow}>
            <Logo size="sm" />
            <Text style={styles.brandName}>ThanniGo</Text>
          </View>
          <Text style={styles.roleLabel}>ADMINISTRATOR PANEL</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/admin/settings" as any)}
          >
            <Ionicons name="settings-outline" size={20} color="#ba1a1a" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/notifications" as any)}
          >
            <Ionicons name="notifications-outline" size={22} color="#ba1a1a" />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ba1a1a']} tintColor="#ba1a1a" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
      >
        <Text style={styles.pageTitle}>Dashboard</Text>

        {/* HERO CARD - SYSTEM STATS (P0) */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/admin/master" as any)}
        >
          <LinearGradient
            colors={["#ba1a1a", "#e32424"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroLeft}>
              <View style={styles.heroIconBackground}>
                <Ionicons name="stats-chart" size={28} color="#ba1a1a" />
              </View>
              <View>
                <Text style={styles.heroTitle}>Master Controls</Text>
                <Text style={styles.heroSub}>Configure platform and global roles</Text>
              </View>
            </View>
            <View style={styles.heroAction}>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* QUICK STATS CLUSTER */}
        <View style={styles.statsGrid}>
          {(() => {
            const revenue = dashboardData?.orders?.total_revenue ?? 0;
            const revenueStr = '₹' + (revenue >= 100000 ? (revenue / 100000).toFixed(1) + 'L' : revenue >= 1000 ? (revenue / 1000).toFixed(1) + 'K' : revenue);
            
            const statsData: StatCardData[] = [
              { ...STATS_CONFIG[0], value: String(dashboardData?.orders?.total ?? 0), delta: '+12%', deltaPos: true },
              { ...STATS_CONFIG[1], value: String(dashboardData?.users?.total ?? 0), delta: '+5%', deltaPos: true },
              { ...STATS_CONFIG[2], value: revenueStr, delta: '+8%', deltaPos: true },
              { ...STATS_CONFIG[3], value: String(dashboardData?.shops?.active ?? 0), delta: String(dashboardData?.shops?.pending ?? 0) + ' req', deltaPos: false },
            ];

            return statsData.map((stat, i) => (
              <View key={i} style={styles.statCardWrapper}>
                <StatCard stat={stat} isDesktop={isDesktop} />
              </View>
            ));
          })()}
        </View>

        {/* VERIFICATION QUEUE */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Verification Queue</Text>
          <TouchableOpacity onPress={() => router.push("/admin/vendors" as Href)}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.verifCard}>
          {loading ? (
            <ActivityIndicator size="small" color="#ba1a1a" style={{ padding: 40 }} />
          ) : (pendingShops.length === 0) ? (
            <View style={styles.emptyCard}>
              <Ionicons name="shield-checkmark" size={48} color="#e2e8f0" />
              <Text style={styles.emptyText}>Queue Clear</Text>
              <Text style={styles.emptySub}>No vendors awaiting review</Text>
            </View>
          ) : (
            pendingShops.slice(0, 3).map((shop, i) => (
              <TouchableOpacity 
                key={shop.id} 
                style={[styles.verifItem, i === 0 && { borderTopWidth: 0 }]}
                onPress={() => router.push(`/admin/vendors/${shop.id}` as Href)}
              >
                <View style={styles.verifIconWrap}>
                   <Ionicons name="business" size={20} color="#ba1a1a" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.verifName}>{shop.name}</Text>
                  <Text style={styles.verifLocation}>{shop.city} • {shop.shop_type || 'General'}</Text>
                </View>
                <View style={styles.verifTag}>
                   <Text style={styles.verifTagText}>REVIEW</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* SYSTEM ALERTS & SHORTCUTS */}
        <Text style={[styles.sectionHeaderTitle, { marginTop: 24, marginBottom: 12 }]}>Platform Tools</Text>
        <View style={styles.toolsGrid}>
          <TouchableOpacity style={styles.toolItem} onPress={() => router.push("/admin/complaints")}>
             <View style={[styles.toolIcon, { backgroundColor: '#fff1f2' }]}>
                <Ionicons name="alert-circle" size={24} color="#e11d48" />
             </View>
             <Text style={styles.toolLabel}>Complaints</Text>
             {dashboardData?.complaints?.open ? (
               <View style={styles.badge}><Text style={styles.badgeText}>{dashboardData.complaints.open}</Text></View>
             ) : null}
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolItem} onPress={() => router.push("/admin/payouts")}>
             <View style={[styles.toolIcon, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="card" size={24} color="#16a34a" />
             </View>
             <Text style={styles.toolLabel}>Payouts</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolItem} onPress={() => router.push("/admin/growth")}>
             <View style={[styles.toolIcon, { backgroundColor: '#fdf4ff' }]}>
                <Ionicons name="rocket" size={24} color="#d946ef" />
             </View>
             <Text style={styles.toolLabel}>Growth</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolItem} onPress={() => router.push("/admin/coupons")}>
             <View style={[styles.toolIcon, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="pricetag" size={24} color="#2563eb" />
             </View>
             <Text style={styles.toolLabel}>Coupons</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* FLOAT ACTION (Emergency) */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => Toast.show({ type: 'info', text1: 'Admin Support', text2: 'Opening emergency console...' })}
      >
        <LinearGradient colors={['#ba1a1a', '#e32424']} style={styles.fabGrad}>
           <Ionicons name="headset" size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: "white",
    borderBottomWidth: 1.5,
    borderBottomColor: "#f1f4f9",
    paddingTop: Platform.OS === 'ios' ? 54 : 14,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandName: {
    fontSize: 20,
    fontWeight: "900",
    color: "#003a5c",
    letterSpacing: -0.5,
  },
  roleLabel: {
    fontSize: 8,
    fontWeight: "700",
    color: "#ba1a1a",
    letterSpacing: 1.2,
    marginTop: 2,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  notifDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    backgroundColor: "#ba1a1a",
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "white",
  },
  pageTitle: { fontSize: 32, fontWeight: "900", color: "#181c20", marginTop: 20, marginBottom: 16 },
  
  heroCard: {
    borderRadius: 24,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#ba1a1a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  heroLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 16 },
  heroIconBackground: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: { fontSize: 20, fontWeight: "900", color: "white" },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  heroAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCardWrapper: { width: '48.2%', flexGrow: 1 },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  deltaBadge: { borderRadius: 12, paddingHorizontal: 7, paddingVertical: 3 },
  deltaText: { fontSize: 10, fontWeight: '800' },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeaderTitle: { fontSize: 18, fontWeight: '900', color: '#181c20' },
  viewAllText: { fontSize: 14, fontWeight: '700', color: '#ba1a1a' },

  verifCard: { backgroundColor: 'white', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' },
  verifItem: { 
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' 
  },
  verifIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff5f5', alignItems: 'center', justifyContent: 'center' },
  verifName: { fontSize: 15, fontWeight: '800', color: '#181c20' },
  verifLocation: { fontSize: 12, color: '#64748b', marginTop: 1 },
  verifTag: { backgroundColor: '#ba1a1a', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  verifTagText: { color: 'white', fontSize: 10, fontWeight: '900' },

  emptyCard: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '800', color: '#64748b', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#94a3b8', marginTop: 2 },

  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  toolItem: { 
    width: '48.2%', flexGrow: 1, backgroundColor: 'white', borderRadius: 18, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#f1f5f9',
    position: 'relative',
  },
  toolIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toolLabel: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  badge: { 
    position: 'absolute', top: 12, right: 12, backgroundColor: '#ba1a1a', 
    minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '900' },

  fab: { position: 'absolute', bottom: 30, right: 24, borderRadius: 30, elevation: 8, shadowColor: '#ba1a1a', shadowOpacity: 0.3, shadowRadius: 12 },
  fabGrad: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },

  switchBtn: { backgroundColor: '#ba1a1a', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, marginTop: 12 },
  switchBtnText: { color: 'white', fontWeight: '800', fontSize: 15 },
  errorTitle: { fontSize: 24, fontWeight: '900', color: '#181c20', marginTop: 24, marginBottom: 12 },
  errorMsg: { fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 32, paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});




