import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useEffect, useState, useCallback, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/providers/ThemeContext';
import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { StatCard } from '@/components/ui/StatCard';
import { SkeletonCard, SkeletonStatRow, SkeletonLine } from '@/components/ui/Skeleton';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { analyticsApi, ShopAnalytics } from '@/api/analyticsApi';
import Toast from 'react-native-toast-message';

import { Shadow, roleAccent, roleSurface, roleGradients } from '@/constants/theme';

const SHOP_ACCENT = roleAccent.shop_owner;
const SHOP_SURF = roleSurface.shop_owner;
const SHOP_GRAD: [string, string] = [roleGradients.shop_owner.start, roleGradients.shop_owner.end];

const { width } = Dimensions.get('window');
const PERIODS: Array<{ label: string; key: string }> = [
  { label: 'Today', key: 'today' },
  { label: 'Week', key: 'week' },
  { label: 'Month', key: 'month' },
  { label: 'Year', key: 'year' },
];

const fmt = (n: number) =>
  n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`;

export default function ShopAnalyticsScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const [period, setPeriod] = useState('week');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ShopAnalytics | null>(null);
  const chartAnim = useRef(new Animated.Value(0)).current;
  const [activeBar, setActiveBar] = useState<number | null>(null);

  useAndroidBackHandler(() => { safeBack('/shop/settings'); });

  const animateCharts = useCallback(() => {
    chartAnim.setValue(0);
    Animated.timing(chartAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [chartAnim]);

  const fetchData = useCallback(async () => {
    try {
      const result = await analyticsApi.getShopAnalytics({ period });
      setData(result);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load analytics' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { 
    setLoading(true); 
    fetchData().then(() => animateCharts()); 
  }, [fetchData, animateCharts]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const maxHourly = data?.peak_hours?.length
    ? Math.max(...data.peak_hours.map((h) => h.orders), 1)
    : 1;

  const topProducts = data?.top_products ?? [];
  const maxProductRevenue = topProducts.length
    ? Math.max(...topProducts.map((p) => p.revenue), 1)
    : 1;

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
            style={styles.notifBtnSub} 
            onPress={() => router.push('/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={22} color={SHOP_ACCENT} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterBtn} onPress={() => Toast.show({ type: 'info', text1: 'Custom range coming soon' })}>
            <Ionicons name="options-outline" size={20} color={SHOP_ACCENT} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[SHOP_ACCENT]} tintColor={SHOP_ACCENT} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
      >
        <Text style={styles.pageTitle}>Analytics</Text>

        {/* PERIOD SELECTOR */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodPill, period === p.key && styles.periodPillActive]}
              onPress={() => setPeriod(p.key)}
            >
              <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={{ gap: 24, marginTop: 10 }}>
            <SkeletonCard height={180} style={{ borderRadius: 28 }} />
            <View style={{ gap: 16 }}>
              <SkeletonLine width={100} height={20} />
              <SkeletonStatRow />
            </View>
            <View style={{ gap: 16 }}>
              <SkeletonLine width={120} height={20} />
              <SkeletonCard height={140} style={{ borderRadius: 24 }} />
            </View>
          </View>
        ) : (
          <>
            {/* HERO REVENUE CARD */}
            <LinearGradient
              colors={[SHOP_ACCENT, '#0ea5e9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.glassOverlay} />
              <Ionicons name="analytics" size={140} color="rgba(255,255,255,0.06)" style={styles.heroDecor} />
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={styles.heroLabel}>GROSS REVENUE • {PERIODS.find((p) => p.key === period)?.label.toUpperCase()}</Text>
                <Text style={styles.heroValue}>{fmt(data?.revenue?.gross ?? 0)}</Text>
                <View style={styles.heroRow}>
                  <View style={styles.heroChip}>
                    <Ionicons name="trending-up" size={12} color="#4ade80" />
                    <Text style={styles.heroChipText}>Net: {fmt(data?.revenue?.net ?? 0)}</Text>
                  </View>
                  <View style={styles.heroBadge}>
                     <Text style={styles.heroBadgeText}>{data?.orders?.total ?? 0} Orders</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>

            {/* METRICS GRID */}
            <Text style={styles.sectionTitle}>Key Metrics</Text>
            <View style={styles.metricsGrid}>
              <StatCard 
                label="Gross Revenue" 
                value={fmt(data?.revenue?.gross ?? 0)} 
                icon="trending-up" 
                iconColor="success" 
                tinted
                style={{ width: (width - 60) / 2 }}
              />
              <StatCard 
                label="Orders" 
                value={String(data?.orders?.total ?? 0)} 
                icon="receipt" 
                iconColor="primary" 
                tinted
                style={{ width: (width - 60) / 2 }}
              />
              <StatCard 
                label="Delivered" 
                value={String(data?.orders?.delivered ?? 0)} 
                icon="checkmark-done" 
                iconColor="success" 
                style={{ width: (width - 60) / 2 }}
              />
              <StatCard 
                label="Avg Order" 
                value={`₹${Math.round(data?.orders?.avg_order_value ?? 0)}`} 
                icon="calculator" 
                iconColor="warning" 
                style={{ width: (width - 60) / 2 }}
              />
            </View>

            {/* DELIVERY PERFORMANCE */}
            <Text style={styles.sectionTitle}>Business Health</Text>
            <View style={[styles.perfCard, Shadow.xs]}>
              <View style={styles.perfRow}>
                <View style={[styles.perfIcon, { backgroundColor: '#e0f7fa' }]}>
                  <Ionicons name="time" size={20} color={SHOP_ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.perfLabel}>Avg Fulfillment</Text>
                  <Text style={styles.perfValue}>{Math.round(data?.delivery?.avg_delivery_time_mins ?? 0)} mins</Text>
                </View>
                <View style={styles.perfDivider} />
                <View style={[styles.perfIcon, { backgroundColor: '#fff7ed' }]}>
                  <Ionicons name="star" size={20} color="#f97316" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.perfLabel}>Shop Rating</Text>
                  <Text style={styles.perfValue}>{(data?.rating?.avg ?? 0).toFixed(1)} <Text style={{ fontSize: 13, color: colors.muted }}>({data?.rating?.count})</Text></Text>
                </View>
              </View>
              <View style={styles.perfProgressSection}>
                <View style={styles.perfProgressHeader}>
                  <Text style={styles.perfProgressLabel}>On-Time Delivery Rate</Text>
                  <Text style={styles.perfProgressVal}>{(data?.delivery?.on_time_rate ?? 0).toFixed(0)}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${data?.delivery?.on_time_rate ?? 0}%`, backgroundColor: '#10b981' }]} />
                </View>
              </View>
            </View>

            {/* HOURLY ORDERS CHART */}
            <Text style={styles.sectionTitle}>Orders by Hour</Text>
            <View style={styles.chartCard}>
              {(data?.peak_hours ?? []).length > 0 ? (
                <>
                  <View style={styles.chartBars}>
                    {(data?.peak_hours ?? []).map((h, i) => {
                      const barHeight = chartAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, (h.orders / maxHourly) * 100],
                      });
                      const isActive = activeBar === i;
                      return (
                        <TouchableOpacity 
                          key={i} 
                          style={styles.barCol} 
                          onPress={() => setActiveBar(isActive ? null : i)}
                          activeOpacity={0.7}
                        >
                          {isActive && (
                            <View style={styles.barTooltip}>
                              <Text style={styles.barTooltipText}>{h.orders}</Text>
                            </View>
                          )}
                          <Animated.View
                            style={[
                              styles.bar,
                              {
                                height: barHeight,
                                backgroundColor: h.orders === maxHourly ? SHOP_ACCENT : (isActive ? '#60a5fa' : '#bfdbf7'),
                              },
                            ]}
                          />
                          <Text style={[styles.barLabel, isActive && { color: SHOP_ACCENT, fontWeight: '900' }]}>{h.hour}h</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <View style={styles.chartLegend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: SHOP_ACCENT }]} />
                      <Text style={styles.legendText}>Peak hour</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#bfdbf7' }]} />
                      <Text style={styles.legendText}>Regular</Text>
                    </View>
                  </View>
                </>
              ) : (
                <Text style={{ textAlign: 'center', color: '#94a3b8', padding: 20, fontWeight: '600' }}>No hourly data for this period</Text>
              )}
            </View>

            {/* TOP PRODUCTS */}
            <Text style={styles.sectionTitle}>Top Products</Text>
            <View style={styles.listCard}>
              {topProducts.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>No products data</Text>
              ) : topProducts.map((p, i) => (
                <View key={p.product_id} style={[styles.productRow, i < topProducts.length - 1 && styles.rowDivider]}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.productMeta}>
                      <Text style={styles.productName}>{p.product_name}</Text>
                      <Text style={styles.productRevenue}>{fmt(p.revenue)}</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <Animated.View style={[styles.progressFill, { width: chartAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', `${(p.revenue / maxProductRevenue) * 100}%`],
                      }) }]} />
                    </View>
                    <Text style={styles.productOrders}>{p.total_qty} units sold</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* DAILY REVENUE TREND */}
            {(data?.daily_revenue ?? []).length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Daily Revenue</Text>
                <View style={styles.chartCard}>
                  <View style={styles.chartBars}>
                    {(data?.daily_revenue ?? []).slice(-12).map((d, i, arr) => {
                      const maxRev = Math.max(...arr.map((x) => x.revenue), 1);
                      const barHeight = chartAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, (d.revenue / maxRev) * 100],
                      });
                      return (
                        <View key={i} style={styles.barCol}>
                          <Animated.View
                            style={[styles.bar, {
                              height: barHeight,
                              backgroundColor: SHOP_ACCENT,
                            }]}
                          />
                          <Text style={styles.barLabel}>
                            {new Date(d.date).getDate()}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: -0.8 },
  roleLabel: { fontSize: 9, fontWeight: '800', color: SHOP_ACCENT, letterSpacing: 1.5, marginTop: 3 },
  notifBtnSub: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  filterBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  
  pageTitle: { fontSize: 36, fontWeight: '900', color: colors.text, letterSpacing: -1.2, marginTop: 12, marginBottom: 20 },
  
  periodRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  periodPill: { flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', borderWidth: 1.5, borderColor: colors.border },
  periodPillActive: { backgroundColor: SHOP_ACCENT, borderColor: SHOP_ACCENT },
  periodText: { fontSize: 13, fontWeight: '800', color: colors.muted },
  periodTextActive: { color: 'white' },

  heroCard: {
    borderRadius: 28, padding: 24, marginBottom: 30, overflow: 'hidden', position: 'relative',
    shadowColor: SHOP_ACCENT, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 12,
  },
  glassOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.05)' },
  heroDecor: { position: 'absolute', bottom: -30, right: -30 },
  heroLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5, marginBottom: 8 },
  heroValue: { fontSize: 48, fontWeight: '900', color: 'white', letterSpacing: -2, marginBottom: 20 },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  heroChipText: { fontSize: 13, color: 'white', fontWeight: '800' },
  heroBadge: { backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  heroBadgeText: { fontSize: 12, fontWeight: '900', color: SHOP_ACCENT },

  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: 16, letterSpacing: -0.5 },
  
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  metricCard: {
    width: (width - 60) / 2, backgroundColor: colors.surface, borderRadius: 22, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    borderWidth: 1.5, borderColor: colors.border,
  },
  metricIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  metricValue: { fontSize: 24, fontWeight: '900', color: colors.text, marginBottom: 4 },
  metricLabel: { fontSize: 12, color: colors.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  perfCard: {
    backgroundColor: colors.surface, borderRadius: 24, padding: 22, marginBottom: 32,
    borderWidth: 1.5, borderColor: colors.border,
  },
  perfRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  perfIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  perfLabel: { fontSize: 12, color: colors.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  perfValue: { fontSize: 20, fontWeight: '900', color: colors.text },
  perfDivider: { width: 1.5, height: 40, backgroundColor: colors.border },
  perfProgressSection: { marginTop: 20, gap: 10 },
  perfProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  perfProgressLabel: { fontSize: 13, fontWeight: '800', color: colors.muted },
  perfProgressVal: { fontSize: 15, fontWeight: '900', color: '#10b981' },

  chartCard: {
    backgroundColor: colors.surface, borderRadius: 24, padding: 22, marginBottom: 32,
    borderWidth: 1.5, borderColor: colors.border,
  },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 6 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  bar: { width: '100%', borderRadius: 6, minHeight: 6 },
  barLabel: { fontSize: 10, color: colors.muted, fontWeight: '800' },
  chartLegend: { flexDirection: 'row', gap: 20, marginTop: 18, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: colors.muted, fontWeight: '700' },

  listCard: {
    backgroundColor: colors.surface, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 10, marginBottom: 40,
    borderWidth: 1.5, borderColor: colors.border,
  },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 18 },
  rowDivider: { borderBottomWidth: 1.5, borderBottomColor: colors.border },
  rankBadge: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  rankText: { fontSize: 14, fontWeight: '900', color: colors.text },
  productMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  productName: { fontSize: 15, fontWeight: '800', color: colors.text, flex: 1 },
  productRevenue: { fontSize: 15, fontWeight: '900', color: SHOP_ACCENT },
  progressTrack: { height: 6, backgroundColor: colors.background, borderRadius: 3, marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: SHOP_ACCENT, borderRadius: 3 },
  productOrders: { fontSize: 12, color: colors.muted, fontWeight: '700' },
  barTooltip: {
    position: 'absolute', top: -30, backgroundColor: colors.text,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, zIndex: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  barTooltipText: { color: 'white', fontSize: 10, fontWeight: '900' },
});
