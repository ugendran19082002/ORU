import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Logo } from '@/components/ui/Logo';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { analyticsApi, ShopAnalytics } from '@/api/analyticsApi';
import Toast from 'react-native-toast-message';

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
  const { safeBack } = useAppNavigation();
  const [period, setPeriod] = useState('week');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ShopAnalytics | null>(null);

  useAndroidBackHandler(() => { safeBack('/shop/settings'); });

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

  useEffect(() => { setLoading(true); fetchData(); }, [fetchData]);

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
      <StatusBar style="dark" />

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
        <View style={styles.filterBtn}>
          <Ionicons name="bar-chart-outline" size={18} color="#005d90" />
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />}
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
          <View style={{ paddingTop: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#005d90" />
            <Text style={{ marginTop: 16, color: '#707881', fontWeight: '600' }}>Loading analytics…</Text>
          </View>
        ) : (
          <>
            {/* HERO REVENUE CARD */}
            <LinearGradient
              colors={['#005d90', '#0077b6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <Ionicons name="bar-chart" size={120} color="rgba(255,255,255,0.05)" style={styles.heroDecor} />
              <Text style={styles.heroLabel}>GROSS REVENUE — {PERIODS.find((p) => p.key === period)?.label.toUpperCase()}</Text>
              <Text style={styles.heroValue}>{fmt(data?.revenue.gross ?? 0)}</Text>
              <View style={styles.heroRow}>
                <View style={styles.heroChip}>
                  <Ionicons name="trending-up" size={14} color="#4ade80" />
                  <Text style={styles.heroChipText}>Net: {fmt(data?.revenue.net ?? 0)}</Text>
                </View>
                <Text style={styles.heroSub}>{data?.orders.total ?? 0} orders</Text>
              </View>
            </LinearGradient>

            {/* METRICS GRID */}
            <Text style={styles.sectionTitle}>Key Metrics</Text>
            <View style={styles.metricsGrid}>
              {[
                {
                  label: 'Revenue', value: fmt(data?.revenue.gross ?? 0),
                  icon: 'trending-up-outline', color: '#005d90', bg: '#e0f0ff',
                },
                {
                  label: 'Orders', value: String(data?.orders.total ?? 0),
                  icon: 'receipt-outline', color: '#2e7d32', bg: '#e8f5e9',
                },
                {
                  label: 'Delivered', value: String(data?.orders.delivered ?? 0),
                  icon: 'checkmark-circle-outline', color: '#006878', bg: '#e0f7fa',
                },
                {
                  label: 'Avg Order', value: `₹${Math.round(data?.orders.avg_order_value ?? 0)}`,
                  icon: 'calculator-outline', color: '#b45309', bg: '#fef3c7',
                },
                {
                  label: 'Commission', value: fmt(data?.revenue.commission ?? 0),
                  icon: 'cash-outline', color: '#7c3aed', bg: '#ede9fe',
                },
                {
                  label: 'Cancelled', value: String(data?.orders.cancelled ?? 0),
                  icon: 'close-circle-outline', color: '#c62828', bg: '#ffebee',
                },
              ].map((m) => (
                <View key={m.label} style={styles.metricCard}>
                  <View style={[styles.metricIcon, { backgroundColor: m.bg }]}>
                    <Ionicons name={m.icon as any} size={20} color={m.color} />
                  </View>
                  <Text style={styles.metricValue}>{m.value}</Text>
                  <Text style={styles.metricLabel}>{m.label}</Text>
                </View>
              ))}
            </View>

            {/* DELIVERY PERFORMANCE */}
            <Text style={styles.sectionTitle}>Delivery Performance</Text>
            <View style={styles.perfCard}>
              <View style={styles.perfRow}>
                <View style={[styles.perfIcon, { backgroundColor: '#e0f7fa' }]}>
                  <Ionicons name="time-outline" size={20} color="#006878" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.perfLabel}>Avg Delivery Time</Text>
                  <Text style={styles.perfValue}>{Math.round(data?.delivery.avg_delivery_time_mins ?? 0)} min</Text>
                </View>
                <View style={[styles.perfIcon, { backgroundColor: '#e8f5e9' }]}>
                  <Ionicons name="star-outline" size={20} color="#2e7d32" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.perfLabel}>Rating</Text>
                  <Text style={styles.perfValue}>{(data?.rating.avg ?? 0).toFixed(1)} ★ ({data?.rating.count ?? 0})</Text>
                </View>
              </View>
              <View style={[styles.perfRow, { marginTop: 16 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.perfLabel}>On-Time Rate</Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${data?.delivery.on_time_rate ?? 0}%`, backgroundColor: '#006878' }]} />
                  </View>
                  <Text style={[styles.perfValue, { fontSize: 13 }]}>{(data?.delivery.on_time_rate ?? 0).toFixed(0)}%</Text>
                </View>
              </View>
            </View>

            {/* HOURLY ORDERS CHART */}
            <Text style={styles.sectionTitle}>Orders by Hour</Text>
            <View style={styles.chartCard}>
              {(data?.peak_hours ?? []).length > 0 ? (
                <>
                  <View style={styles.chartBars}>
                    {(data?.peak_hours ?? []).map((h, i) => (
                      <View key={i} style={styles.barCol}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: (h.orders / maxHourly) * 100,
                              backgroundColor: h.orders === maxHourly ? '#005d90' : '#bfdbf7',
                            },
                          ]}
                        />
                        <Text style={styles.barLabel}>{h.hour}h</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.chartLegend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#005d90' }]} />
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
                      <View style={[styles.progressFill, { width: `${(p.revenue / maxProductRevenue) * 100}%` }]} />
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
                      return (
                        <View key={i} style={styles.barCol}>
                          <View
                            style={[styles.bar, {
                              height: (d.revenue / maxRev) * 100,
                              backgroundColor: '#006878',
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.92)',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 22, fontWeight: '900', color: '#003a5c', letterSpacing: -0.5 },
  roleLabel: { fontSize: 9, fontWeight: '700', color: '#006878', letterSpacing: 1.5, marginTop: 3 },
  filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 32, fontWeight: '900', color: '#181c20', letterSpacing: -0.5, marginTop: 10, marginBottom: 18 },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  periodPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#e0e2e8' },
  periodPillActive: { backgroundColor: '#005d90', borderColor: '#005d90' },
  periodText: { fontSize: 13, fontWeight: '700', color: '#707881' },
  periodTextActive: { color: 'white' },
  heroCard: {
    borderRadius: 24, padding: 24, marginBottom: 28, overflow: 'hidden',
    shadowColor: '#005d90', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 8,
  },
  heroDecor: { position: 'absolute', bottom: -20, right: -20 },
  heroLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5, marginBottom: 6 },
  heroValue: { fontSize: 42, fontWeight: '900', color: 'white', letterSpacing: -1, marginBottom: 16 },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  heroChipText: { fontSize: 12, color: 'white', fontWeight: '700' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#181c20', marginBottom: 14, letterSpacing: -0.3 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  metricCard: {
    width: (width - 60) / 2, backgroundColor: 'white', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  metricIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  metricValue: { fontSize: 22, fontWeight: '900', color: '#181c20', marginBottom: 2 },
  metricLabel: { fontSize: 12, color: '#707881', fontWeight: '600' },
  perfCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  perfRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  perfIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  perfLabel: { fontSize: 11, color: '#707881', fontWeight: '600', marginBottom: 2 },
  perfValue: { fontSize: 18, fontWeight: '900', color: '#181c20' },
  chartCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 4 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 9, color: '#94a3b8', fontWeight: '600' },
  chartLegend: { flexDirection: 'row', gap: 16, marginTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#707881', fontWeight: '600' },
  listCard: {
    backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#f1f4f9' },
  rankBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontWeight: '800', color: '#181c20' },
  productMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  productName: { fontSize: 13, fontWeight: '700', color: '#181c20', flex: 1 },
  productRevenue: { fontSize: 13, fontWeight: '800', color: '#005d90' },
  progressTrack: { height: 4, backgroundColor: '#f1f4f9', borderRadius: 2, marginBottom: 4 },
  progressFill: { height: '100%', backgroundColor: '#005d90', borderRadius: 2 },
  productOrders: { fontSize: 11, color: '#707881', fontWeight: '600' },
});
