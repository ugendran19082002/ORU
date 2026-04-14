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
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname } from 'expo-router';
import { useAppSession } from '@/providers/AppSessionProvider';
import { Logo } from '@/components/ui/Logo';
import { adminApi, AdminShop } from '@/api/adminApi';

/* ---- DATA ---- */
const STATS = [
  { label: 'Total Orders', value: '1,284', icon: 'bag-handle-outline' as const, delta: '+12%', deltaPos: true, color: '#005d90', bg: '#e0f0ff' },
  { label: 'Active Users', value: '8,432', icon: 'people-outline' as const, delta: '+5%', deltaPos: true, color: '#006878', bg: '#e0f7fa' },
  { label: 'Revenue', value: '₹4,12,050', icon: 'cash-outline' as const, delta: '+24%', deltaPos: true, color: '#23616b', bg: '#e0f2f1' },
  { label: 'Active Shops', value: '42', icon: 'water-outline' as const, delta: '-2%', deltaPos: false, color: '#404850', bg: '#ebeef4' },
];

/* ---- COMPONENTS ---- */
function StatCard({ stat, isDesktop }: { stat: typeof STATS[0], isDesktop: boolean }) {
  return (
    <View style={[styles.statCard, { width: isDesktop ? '23.5%' : '48%' }]}>
      <View style={styles.statCardTop}>
        <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
          <Ionicons name={stat.icon} size={isDesktop ? 22 : 18} color={stat.color} />
        </View>
        <View style={[styles.deltaBadge, { backgroundColor: stat.deltaPos ? '#e0f7fa' : '#ffdad6' }]}>
          <Text style={[styles.deltaText, { color: stat.deltaPos ? '#006878' : '#ba1a1a' }]}>{stat.delta}</Text>
        </View>
      </View>
      <Text style={styles.statLabel}>{stat.label}</Text>
      <Text style={[styles.statValue, isDesktop && { fontSize: 24 }]}>{stat.value}</Text>
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

  if (__DEV__) {
    console.log(`📊 [AdminDashboard] Mounting. Status: ${status}, UID: ${user?.id || 'none'}, Path: ${pathname}`);
  }

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await adminApi.listShops('pending_review');
      if (res.data) {
        setPendingShops(res.data);
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

  // 0. Role Bouncer
  if (status === 'loading') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#005d90" />
      </View>
    );
  }

  if (status === 'anonymous' || (status === 'authenticated' && (!user || user?.role !== 'admin'))) {
     return (
       <View style={[styles.container, styles.centered]}>
         <Ionicons name="lock-closed-outline" size={64} color="#ba1a1a" />
         <Text style={styles.errorTitle}>{status === 'anonymous' ? 'Session Expired' : 'Restricted Area'}</Text>
         <Text style={styles.errorMsg}>
            {status === 'anonymous' 
              ? 'Your session has expired or you are not logged in. Please log in with an admin account.' 
              : 'You do not have administrative privileges to access this dashboard.'}
         </Text>
         <TouchableOpacity 
           style={styles.switchBtn} 
           onPress={() => router.replace(user?.role === 'shop_owner' ? '/onboarding/shop' : (status === 'anonymous' ? '/auth' : '/(tabs)'))}
         >
           <Text style={styles.switchBtnText}>{status === 'anonymous' ? 'Go to Login' : 'Back to My Dashboard'}</Text>
         </TouchableOpacity>
       </View>
     );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, padding: isDesktop ? 40 : 20, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, isDesktop && { fontSize: 40, marginBottom: 32 }]}>Dashboard Overview</Text>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {STATS.map((stat, i) => (
            <View key={i} style={[{ marginBottom: 10 }, i % 2 === 0 && !isDesktop && { marginRight: '4%' }]}>
                <StatCard stat={stat} isDesktop={isDesktop} />
            </View>
          ))}
        </View>

        <View style={{ flexDirection: isDesktop ? 'row' : 'column', marginTop: 12 }}>
            {/* Verification Queue (Primary Focus) */}
            <View style={{ flex: isDesktop ? 2 : 1, marginRight: isDesktop ? 32 : 0, marginBottom: isDesktop ? 0 : 32 }}>
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                        <View style={styles.liveDot} />
                        <Text style={styles.sectionTitle}>Verification Queue</Text>
                    </View>
                    <View style={styles.verifCountBadge}>
                        <Text style={styles.verifCountText}>{pendingShops?.length || 0} Pending</Text>
                    </View>
                </View>

                <View style={[styles.verifCard, { minHeight: 120 }]}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#005d90" style={{ padding: 40 }} />
                    ) : (!pendingShops || !Array.isArray(pendingShops) || pendingShops.length === 0) ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <Ionicons name="checkmark-circle-outline" size={48} color="#94a3b8" />
                            <Text style={{ marginTop: 12, color: '#64748b', fontWeight: '600', textAlign: 'center' }}>
                                {!pendingShops || !Array.isArray(pendingShops) ? 'Data error. Please try again later.' : 'All clear! No pending reviews.'}
                            </Text>
                        </View>
                    ) : (
                        pendingShops.slice(0, 5).map((item, index) => (
                            <View key={item?.id || index}>
                                <TouchableOpacity style={styles.verifRow} onPress={() => item?.id && router.push(`/admin/shops/${item.id}`)}>
                                    <View style={styles.verifIcon}>
                                        <Ionicons name="business" size={24} color="#005d90" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.verifShop}>{item?.name || 'Unknown Shop'}</Text>
                                        <Text style={styles.verifReason} numberOfLines={1}>{item?.shop_type || 'General'} • {item?.city || 'Location Pending'}</Text>
                                        <View style={styles.verifDoc}>
                                            <Ionicons name="document-text-outline" size={12} color="#005d90" />
                                            <Text style={styles.verifDocText}>View Evidence</Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                                </TouchableOpacity>
                                {index < Math.min(pendingShops?.length || 0, 5) - 1 && <View style={styles.verifDivider} />}
                            </View>
                        ))
                    )}
                </View>
            </View>

            {/* Side Alerts / Sub-Metrics */}
            <View style={{ flex: isDesktop ? 1 : 1 }}>
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                        <Ionicons name="notifications-outline" size={18} color="#ba1a1a" />
                        <Text style={styles.sectionTitle}>System Alerts</Text>
                    </View>
                </View>
                <View style={[styles.verifCard, { padding: 24 }]}>
                    <View style={{ alignItems: 'center' }}>
                        <Ionicons name="shield-checkmark" size={48} color="#006878" />
                        <Text style={{ marginTop: 16, fontSize: 15, fontWeight: '700', color: '#181c20', textAlign: 'center' }}>System Health: Optimal</Text>
                        <Text style={{ marginTop: 8, fontSize: 13, color: '#64748b', textAlign: 'center' }}>All services are running smoothly. Security protocols active.</Text>
                    </View>
                </View>
            </View>
        </View>
      </ScrollView>

      {/* EMERGENCY FAB */}
      <TouchableOpacity style={styles.emergencyFab} onPress={() => Toast.show({
        type: 'info',
        text1: 'Emergency',
        text2: 'Contacting admin support team...'
      })}>
        <LinearGradient colors={['#005d90', '#0077b6']} style={styles.emergencyFabGrad}>
          <Ionicons name="headset-outline" size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  pageTitle: { fontSize: 32, fontWeight: '900', color: '#181c20', letterSpacing: -0.5, marginBottom: 24 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  statCard: {
    backgroundColor: 'white', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    borderLeftWidth: 3, borderLeftColor: '#005d90',
  },
  statCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  deltaBadge: { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  deltaText: { fontSize: 10, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#707881', fontWeight: '500', marginBottom: 3 },
  statValue: { fontSize: 20, fontWeight: '900', color: '#181c20', letterSpacing: -0.5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#181c20', letterSpacing: -0.3 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#006878' },
  viewAllBtn: { backgroundColor: '#e0f0ff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  viewAllText: { color: '#005d90', fontWeight: '700', fontSize: 12 },
  verifCountBadge: { backgroundColor: '#005d90', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  verifCountText: { color: 'white', fontWeight: '700', fontSize: 12 },
  verifCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  verifRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14, paddingHorizontal: 8 },
  verifIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center',
  },
  verifShop: { fontSize: 15, fontWeight: '800', color: '#181c20', marginBottom: 2 },
  verifReason: { fontSize: 12, color: '#707881', marginBottom: 6 },
  verifDoc: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifDocText: { fontSize: 11, color: '#005d90', fontWeight: '700' },
  verifDivider: { height: 1, backgroundColor: '#f1f4f9', marginLeft: 56 },
  viewAllVerifBtn: {
    borderWidth: 1.5, borderColor: '#e0f0ff', borderRadius: 14,
    paddingVertical: 12, alignItems: 'center', marginTop: 8,
  },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorTitle: { fontSize: 24, fontWeight: '900', color: '#181c20', marginTop: 24, marginBottom: 12 },
  errorMsg: { fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  switchBtn: { backgroundColor: '#005d90', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  switchBtnText: { color: 'white', fontWeight: '800', fontSize: 15 },

  emergencyFab: {
    position: 'absolute', bottom: 24, right: 20,
    borderRadius: 30, overflow: 'hidden',
    shadowColor: '#005d90', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  emergencyFabGrad: {
    width: 56, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 28,
  },
});
