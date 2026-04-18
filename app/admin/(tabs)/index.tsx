import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSession } from '@/providers/AppSessionProvider';
import { SkeletonLine, SkeletonCard, SkeletonStatRow } from '@/components/ui/Skeleton';
import { RoleHeader } from '@/components/ui/RoleHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Shadow, roleAccent, roleGradients, thannigoPalette, Radius, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/providers/ThemeContext';
import { adminApi, AdminShop } from '@/api/adminApi';
import { analyticsApi } from '@/api/analyticsApi';
import type { AdminDashboard } from '@/types/api';

const ADMIN_ACCENT = roleAccent.admin;
const ADMIN_GRAD: [string, string] = [roleGradients.admin.start, roleGradients.admin.end];

/* ---- DATA (fallback skeleton while loading) ---- */
const STATS_CONFIG = [
  { label: 'Total Orders',  icon: 'bag-handle-outline' as const, color: ADMIN_ACCENT,               bg: '#FFF5F5' },
  { label: 'Active Users',  icon: 'people-outline' as const,     color: thannigoPalette.shopTeal,   bg: thannigoPalette.deliveryGreenLight },
  { label: 'Revenue',       icon: 'cash-outline' as const,       color: '#B45309',                  bg: '#FEF3C7' },
  { label: 'Active Shops',  icon: 'water-outline' as const,      color: thannigoPalette.neutral,    bg: thannigoPalette.borderSoft },
];

/* ---- COMPONENTS ---- */
type StatCardData = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  bg: string;
  value: string;
  delta: string;
  deltaPos: boolean;
};

function AdminStatCard({ stat, colors }: { stat: StatCardData; colors: any }) {
  return (
    <View style={[styles.statCard, Shadow.sm, { backgroundColor: colors.surface }]}>
      <View style={styles.statCardTop}>
        <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
          <Ionicons name={stat.icon} size={20} color={stat.color} />
        </View>
        <View style={[styles.deltaBadge, { backgroundColor: stat.deltaPos ? '#ECFDF5' : thannigoPalette.dangerSoft }]}>
          <Text style={[styles.deltaText, { color: stat.deltaPos ? '#059669' : thannigoPalette.error }]}>
            {stat.delta}
          </Text>
        </View>
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{stat.label}</Text>
    </View>
  );
}

/* ---- SCREEN ---- */
export default function AdminOverviewScreen() {
  const router = useRouter();
  const { user, status } = useAppSession();
  const { colors, isDark } = useAppTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [pendingShops, setPendingShops] = useState<AdminShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<AdminDashboard | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const [shopsRes, analytics] = await Promise.allSettled([
        adminApi.listShops('pending_review,under_review,in_progress'),
        analyticsApi.getAdminDashboard({ period: 'today' }),
      ]);

      if (shopsRes.status === 'fulfilled' && shopsRes.value.data) {
        const queue = shopsRes.value.data.filter(s =>
          s.status === 'pending_review' ||
          s.status === 'under_review' ||
          s.onboarding_status === 'partially_rejected'
        );
        setPendingShops(queue);
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

  if (status === 'loading' || (status === 'authenticated' && !user)) {
    return (
      <SafeAreaView style={[styles.container, { paddingHorizontal: 24, paddingTop: 20, gap: 16, backgroundColor: colors.background }]} edges={['top']}>
        <SkeletonLine width="50%" height={32} />
        <SkeletonStatRow />
        <SkeletonCard height={200} />
      </SafeAreaView>
    );
  }

  if (status === 'anonymous' || (user && user?.role !== 'admin')) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={64} color={ADMIN_ACCENT} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Restricted Area</Text>
        <Text style={[styles.errorMsg, { color: colors.muted }]}>
          You do not have administrative privileges to access this dashboard.
        </Text>
        <TouchableOpacity style={styles.switchBtn} onPress={() => router.replace('/auth')}>
          <Text style={styles.switchBtnText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ROLE HEADER */}
      <RoleHeader
        role="admin"
        title="Administrator Panel"
        hasNotif
        onNotif={() => router.push('/notifications' as any)}
        onSettings={() => router.push('/admin/settings' as any)}
      />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ADMIN_ACCENT]} tintColor={ADMIN_ACCENT} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
      >
        <Text style={[styles.pageTitle, { color: colors.text }]}>Dashboard</Text>

        {/* HERO CARD - SYSTEM STATS */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/admin/master' as any)}>
          <LinearGradient
            colors={ADMIN_GRAD}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroCard, { shadowColor: ADMIN_ACCENT }]}
          >
            <View style={styles.heroLeft}>
              <View style={styles.heroIconBackground}>
                <Ionicons name="stats-chart" size={28} color={ADMIN_ACCENT} />
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
        {loading ? (
          <SkeletonStatRow />
        ) : (
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
                  <AdminStatCard stat={stat} colors={colors} />
                </View>
              ));
            })()}
          </View>
        )}

        {/* VERIFICATION QUEUE */}
        <SectionHeader
          title="Verification Queue"
          actionLabel="View All"
          onAction={() => router.push('/admin/vendors' as Href)}
          accentColor={ADMIN_ACCENT}
        />

        <View style={[styles.verifCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {loading ? (
            <View style={{ padding: 24, gap: 16 }}>
              {[1, 2, 3].map(k => (
                <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <SkeletonCard height={44} style={{ width: 44, borderRadius: 12 }} />
                  <View style={{ flex: 1, gap: 8 }}>
                    <SkeletonLine width="60%" height={14} />
                    <SkeletonLine width="40%" height={11} />
                  </View>
                </View>
              ))}
            </View>
          ) : pendingShops.length === 0 ? (
            <EmptyState
              icon="shield-checkmark-outline"
              title="Queue Clear"
              subtitle="No vendors awaiting review"
            />
          ) : (
            pendingShops.slice(0, 5).map((shop, i) => {
              const isReady = shop.onboarding_status === 'ready_for_activation';
              const isPartial = shop.onboarding_status === 'partially_rejected';

              const statusTag = isReady ? 'READY' : isPartial ? 'FIX' : 'REVIEW';
              const tagColor = isReady ? '#059669' : isPartial ? '#d97706' : ADMIN_ACCENT;
              const tagBg = isReady ? '#ecfdf5' : isPartial ? '#fff7ed' : thannigoPalette.adminRedLight;

              return (
                <TouchableOpacity
                  key={shop.id}
                  style={[styles.verifItem, i === 0 && { borderTopWidth: 0 }, { borderTopColor: colors.border }]}
                  onPress={() => router.push(`/admin/vendors/${shop.id}` as Href)}
                >
                  <View style={[styles.verifIconWrap, { backgroundColor: tagBg }]}>
                    <Ionicons name="business" size={20} color={tagColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.verifName, { color: colors.text }]}>{shop.name}</Text>
                      {isReady && <Ionicons name="checkmark-circle" size={14} color="#059669" />}
                    </View>
                    <Text style={[styles.verifLocation, { color: colors.muted }]}>
                      {shop.city || 'Location Pending'} • {shop.shop_type || 'General'}
                    </Text>
                  </View>
                  <View style={[styles.verifTag, { backgroundColor: tagColor }]}>
                    <Text style={styles.verifTagText}>{statusTag}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* PLATFORM TOOLS */}
        <SectionHeader title="Platform Tools" style={{ marginTop: 24 }} accentColor={ADMIN_ACCENT} />
        <View style={styles.toolsGrid}>
          {[
            { label: 'Complaints', icon: 'alert-circle', color: thannigoPalette.error, bg: thannigoPalette.dangerSoft, path: '/admin/complaints', badge: dashboardData?.complaints?.open },
            { label: 'Bank Audit', icon: 'business',     color: '#6366f1',              bg: '#eef2ff',               path: '/admin/bank-requests' },
            { label: 'Payouts',    icon: 'card',        color: thannigoPalette.success, bg: thannigoPalette.successSoft, path: '/admin/payouts' },
            { label: 'Growth',    icon: 'rocket',      color: '#d946ef',              bg: '#fdf4ff',               path: '/admin/growth' },
            { label: 'Coupons',   icon: 'pricetag',    color: thannigoPalette.primary, bg: thannigoPalette.infoSoft,    path: '/admin/coupons' },
          ].map((tool) => (
            <TouchableOpacity
              key={tool.label}
              style={[styles.toolItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(tool.path as any)}
            >
              <View style={[styles.toolIcon, { backgroundColor: tool.bg }]}>
                <Ionicons name={tool.icon as any} size={24} color={tool.color} />
              </View>
              <Text style={[styles.toolLabel, { color: colors.text }]}>{tool.label}</Text>
              {tool.badge ? (
                <View style={[styles.badge, { backgroundColor: ADMIN_ACCENT }]}>
                  <Text style={styles.badgeText}>{tool.badge}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => Toast.show({ type: 'info', text1: 'Admin Support', text2: 'Opening emergency console...' })}
      >
        <LinearGradient colors={ADMIN_GRAD} style={styles.fabGrad}>
          <Ionicons name="headset" size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  pageTitle: { ...Typography.h1, marginTop: Spacing.lg, marginBottom: Spacing.md },

  heroCard: {
    borderRadius: Radius.xl,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    ...Shadow.hero,
  },
  heroLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroIconBackground: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontSize: 20, fontWeight: '900', color: 'white' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  heroAction: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCardWrapper: { width: '48.2%', flexGrow: 1 },
  statCard: { borderRadius: Radius.xl, padding: 16 },
  statCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statLabel: { ...Typography.caption, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  statValue: { fontSize: 22, fontWeight: '900' },
  deltaBadge: { borderRadius: 12, paddingHorizontal: 7, paddingVertical: 3 },
  deltaText: { fontSize: 10, fontWeight: '800' },

  verifCard: { borderRadius: Radius.xl, overflow: 'hidden', borderWidth: 1, marginBottom: 8 },
  verifItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderTopWidth: 1 },
  verifIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  verifName: { fontSize: 15, fontWeight: '800' },
  verifLocation: { fontSize: 12, marginTop: 1 },
  verifTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  verifTagText: { color: 'white', fontSize: 10, fontWeight: '900' },

  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  toolItem: {
    width: '48.2%', flexGrow: 1, borderRadius: Radius.xl, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, position: 'relative',
  },
  toolIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toolLabel: { fontSize: 14, fontWeight: '800' },
  badge: {
    position: 'absolute', top: 12, right: 12,
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '900' },

  fab: { position: 'absolute', bottom: 30, right: 24, borderRadius: 30, elevation: 6, shadowColor: ADMIN_ACCENT, shadowOpacity: 0.3, shadowRadius: 12 },
  fabGrad: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },

  switchBtn: { backgroundColor: ADMIN_ACCENT, paddingHorizontal: 24, paddingVertical: 14, borderRadius: Radius.xl, marginTop: 12 },
  switchBtnText: { color: 'white', fontWeight: '800', fontSize: 15 },
  errorTitle: { ...Typography.h2, marginTop: 24, marginBottom: 12 },
  errorMsg: { ...Typography.body, textAlign: 'center', lineHeight: 24, marginBottom: 32, paddingHorizontal: 20 },
});
