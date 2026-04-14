import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
  BackHandler,
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


const { width } = Dimensions.get('window');

const PERIODS = ['Today', 'Week', 'Month', 'Year'];

const METRICS = [
  { label: 'Revenue', value: '₹1,24,800', change: '+12.4%', up: true, icon: 'trending-up-outline', color: '#005d90', bg: '#e0f0ff' },
  { label: 'Orders', value: '1,840', change: '+8.2%', up: true, icon: 'receipt-outline', color: '#2e7d32', bg: '#e8f5e9' },
  { label: 'New Customers', value: '142', change: '+22.1%', up: true, icon: 'people-outline', color: '#006878', bg: '#e0f7fa' },
  { label: 'Avg Order', value: '₹91', change: '-1.3%', up: false, icon: 'calculator-outline', color: '#b45309', bg: '#fef3c7' },
  { label: 'Cans Delivered', value: '3,620', change: '+5.8%', up: true, icon: 'water-outline', color: '#7c3aed', bg: '#ede9fe' },
  { label: 'Cancelled', value: '34', change: '-2.1%', up: false, icon: 'close-circle-outline', color: '#c62828', bg: '#ffebee' },
];

const TOP_PRODUCTS = [
  { name: '20L Can — Regular', orders: 912, revenue: '₹45,600', pct: 78 },
  { name: '10L Jar — Purified', orders: 453, revenue: '₹22,650', pct: 55 },
  { name: 'Bulk 50L — Commercial', orders: 210, revenue: '₹31,500', pct: 38 },
  { name: '5L Bottle — Daily', orders: 265, revenue: '₹9,275', pct: 30 },
];

const HOURLY = [2, 5, 8, 14, 22, 28, 35, 41, 38, 30, 20, 12];
const HOURS = ['8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p'];

export default function ShopAnalyticsScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();

  const [period, setPeriod] = useState('Week');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  useAndroidBackHandler(() => {
    safeBack('/shop/settings');
  });


  const maxHourly = Math.max(...HOURLY);

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
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="download-outline" size={18} color="#005d90" />
          <Text style={styles.filterBtnText}>Export</Text>
        </TouchableOpacity>
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
              key={p}
              style={[styles.periodPill, period === p && styles.periodPillActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* HERO REVENUE CARD */}
        <LinearGradient
          colors={['#005d90', '#0077b6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Ionicons name="bar-chart" size={120} color="rgba(255,255,255,0.05)" style={styles.heroDecor} />
          <Text style={styles.heroLabel}>TOTAL REVENUE — {period.toUpperCase()}</Text>
          <Text style={styles.heroValue}>₹1,24,800</Text>
          <View style={styles.heroRow}>
            <View style={styles.heroChip}>
              <Ionicons name="trending-up" size={14} color="#4ade80" />
              <Text style={styles.heroChipText}>+12.4% vs last {period.toLowerCase()}</Text>
            </View>
            <Text style={styles.heroSub}>1,840 orders</Text>
          </View>
        </LinearGradient>

        {/* METRICS GRID */}
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          {METRICS.map((m) => (
            <View key={m.label} style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: m.bg }]}>
                <Ionicons name={m.icon as any} size={20} color={m.color} />
              </View>
              <Text style={styles.metricValue}>{m.value}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
              <View style={styles.changeRow}>
                <Ionicons
                  name={m.up ? 'trending-up' : 'trending-down'}
                  size={12}
                  color={m.up ? '#2e7d32' : '#c62828'}
                />
                <Text style={[styles.changeText, { color: m.up ? '#2e7d32' : '#c62828' }]}>
                  {m.change}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* HOURLY ORDERS CHART (Bar — no external library) */}
        <Text style={styles.sectionTitle}>Orders by Hour</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartBars}>
            {HOURLY.map((val, i) => (
              <View key={i} style={styles.barCol}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: (val / maxHourly) * 100,
                      backgroundColor: val === maxHourly ? '#005d90' : '#bfdbf7',
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{HOURS[i]}</Text>
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
        </View>

        {/* TOP PRODUCTS */}
        <Text style={styles.sectionTitle}>Top Products</Text>
        <View style={styles.listCard}>
          {TOP_PRODUCTS.map((p, i) => (
            <View key={p.name} style={[styles.productRow, i < TOP_PRODUCTS.length - 1 && styles.rowDivider]}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.productMeta}>
                  <Text style={styles.productName}>{p.name}</Text>
                  <Text style={styles.productRevenue}>{p.revenue}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${p.pct}%` }]} />
                </View>
                <Text style={styles.productOrders}>{p.orders} orders</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CONVERSION SNAPSHOT */}
        <Text style={styles.sectionTitle}>Conversion Snapshot</Text>
        <View style={styles.conversionCard}>
          {[
            { label: 'Viewed Shop', count: 4200, icon: 'eye-outline', color: '#006878' },
            { label: 'Added to Cart', count: 2100, icon: 'cart-outline', color: '#005d90' },
            { label: 'Checked Out', count: 1970, icon: 'card-outline', color: '#7c3aed' },
            { label: 'Delivered', count: 1840, icon: 'checkmark-circle-outline', color: '#2e7d32' },
          ].map((step, i, arr) => (
            <View key={step.label} style={styles.funnelRow}>
              <View style={[styles.funnelIcon, { backgroundColor: step.color + '15' }]}>
                <Ionicons name={step.icon as any} size={18} color={step.color} />
              </View>
              <Text style={styles.funnelLabel}>{step.label}</Text>
              <Text style={styles.funnelCount}>{step.count.toLocaleString()}</Text>
              {i < arr.length - 1 && (
                <Ionicons name="chevron-down" size={16} color="#cbd5e1" style={styles.funnelArrow} />
              )}
            </View>
          ))}
        </View>
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
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#e0f0ff', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
  },
  filterBtnText: { fontSize: 13, fontWeight: '700', color: '#005d90' },
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
  metricLabel: { fontSize: 12, color: '#707881', fontWeight: '600', marginBottom: 8 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  changeText: { fontSize: 12, fontWeight: '700' },

  chartCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 6 },
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

  conversionCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  funnelRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  funnelIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  funnelLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: '#181c20' },
  funnelCount: { fontSize: 15, fontWeight: '900', color: '#181c20' },
  funnelArrow: { position: 'absolute', left: 10, bottom: -8 },
});


