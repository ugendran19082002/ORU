import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { analyticsApi, CustomerAnalytics } from '@/api/analyticsApi';
import { log } from '@/utils/logger';
import { ActivityIndicator } from 'react-native';
import { Shadow, thannigoPalette, roleAccent, Radius } from '@/constants/theme';
import { useAppTheme } from '@/providers/ThemeContext';

const ACCENT = roleAccent.customer;

const { width } = Dimensions.get('window');

export default function CustomerAnalyticsScreen() {
  const { safeBack } = useAppNavigation();
  const { colors, isDark } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'spending' | 'usage'>('spending');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CustomerAnalytics | null>(null);

  useAndroidBackHandler(() => { safeBack('/(tabs)/profile'); });

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await analyticsApi.getCustomerAnalytics();
      setData(result);
    } catch (e) {
      log.error('[CustomerAnalytics] Fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  const currentData = data?.monthly_data || [];
  const maxVal = Math.max(...currentData.map(m => activeTab === 'spending' ? m.spending : m.usage), 1);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <BackButton fallback="/(tabs)/profile" />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>My Analytics</Text>
          <Text style={styles.headerSub}>Track your water usage & spending</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={{ marginTop: 12, color: colors.muted, fontWeight: '600' }}>Loading your stats...</Text>
          </View>
        ) : (
          <>
            {/* TOP STATS */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: '#e0f0ff' }]}>
                  <Ionicons name="stats-chart-outline" size={20} color="#005d90" />
                </View>
                <Text style={styles.statValue}>₹{(data?.total_spent ?? 0).toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Spent (YTD)</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: '#e8f5e9' }]}>
                  <Ionicons name="water-outline" size={20} color="#2e7d32" />
                </View>
                <Text style={styles.statValue}>{data?.total_cans ?? 0}</Text>
                <Text style={styles.statLabel}>Cans Ordered</Text>
              </View>
            </View>

            {/* SAVINGS TRACKER */}
            <LinearGradient colors={['#005d90', '#0077b6']} style={styles.savingsCard}>
              <View style={styles.savingsTop}>
                 <Ionicons name="leaf" size={24} color="#4ade80" />
                 <Text style={styles.savingsTitle}>Savings Tracker</Text>
              </View>
              <Text style={styles.savingsBigText}>₹{(data?.total_saved ?? 0).toLocaleString()} Saved</Text>
              <Text style={styles.savingsSub}>By using subscriptions & coupons this year.</Text>
            </LinearGradient>

            {/* CHART SECTION */}
            <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Monthly {activeTab === 'spending' ? 'Spending' : 'Consumption'}</Text>
                <View style={styles.chartToggle}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, activeTab === 'spending' && styles.toggleBtnActive]}
                    onPress={() => setActiveTab('spending')}
                  >
                    <Text style={[styles.toggleText, activeTab === 'spending' && styles.toggleTextActive]}>₹ Spent</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleBtn, activeTab === 'usage' && styles.toggleBtnActive]}
                    onPress={() => setActiveTab('usage')}
                  >
                    <Text style={[styles.toggleText, activeTab === 'usage' && styles.toggleTextActive]}>💧 Cans</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.barChart}>
                {currentData.length === 0 ? (
                  <Text style={{ width: '100%', textAlign: 'center', color: colors.muted }}>Insufficient data for chart</Text>
                ) : currentData.map((item, i) => {
                  const val = activeTab === 'spending' ? item.spending : item.usage;
                  const heightPct = (val / maxVal) * 100;
                  return (
                    <View key={i} style={styles.barCol}>
                      <Text style={styles.barValText}>{activeTab === 'spending' ? `₹${val}` : val}</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { height: `${heightPct}%`, backgroundColor: activeTab === 'spending' ? ACCENT : thannigoPalette.primary }]} />
                      </View>
                      <Text style={styles.barLabel}>{item.month}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* INSIGHTS */}
            <Text style={styles.sectionTitle}>Insights & Frequency</Text>
            <View style={styles.insightCard}>
              <Ionicons name="calendar-outline" size={24} color="#b45309" />
              <View style={{ flex: 1 }}>
                 <Text style={styles.insightTitle}>Order Frequency</Text>
                 <Text style={styles.insightDesc}>You typically order a new can every <Text style={{fontWeight: 'bold', color: '#181c20'}}>{data?.insights?.avg_frequency_days ?? 4.5} days</Text>.</Text>
              </View>
            </View>
            <View style={styles.insightCard}>
              <Ionicons name="trending-up" size={24} color="#4338ca" />
              <View style={{ flex: 1 }}>
                 <Text style={styles.insightTitle}>Usage Trend</Text>
                 <Text style={styles.insightDesc}>Your water consumption is {data?.insights?.summer_peak_flag ? 'at a seasonal peak' : 'stable'} based on last month's data.</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: thannigoPalette.darkText },
  headerSub: { fontSize: 12, color: thannigoPalette.neutral, fontWeight: '500' },
  content: { padding: 20, gap: 16, paddingBottom: 60 },

  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: thannigoPalette.surface, borderRadius: Radius.xl, padding: 16, ...Shadow.xs },
  statIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 22, fontWeight: '900', color: thannigoPalette.darkText },
  statLabel: { fontSize: 12, color: thannigoPalette.neutral, fontWeight: '600', marginTop: 4 },

  savingsCard: { borderRadius: Radius.xl, padding: 20 },
  savingsTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  savingsTitle: { color: 'white', fontWeight: '700', fontSize: 15 },
  savingsBigText: { color: 'white', fontSize: 32, fontWeight: '900' },
  savingsSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },

  chartContainer: { backgroundColor: thannigoPalette.surface, borderRadius: Radius.xl, padding: 20, ...Shadow.xs },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  chartTitle: { fontSize: 16, fontWeight: '800', color: thannigoPalette.darkText },
  chartToggle: { flexDirection: 'row', backgroundColor: thannigoPalette.borderSoft, borderRadius: 10, padding: 4 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: thannigoPalette.surface, ...Shadow.xs },
  toggleText: { fontSize: 12, fontWeight: '700', color: thannigoPalette.neutral },
  toggleTextActive: { color: ACCENT },

  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 180, paddingTop: 20 },
  barCol: { alignItems: 'center', width: (width - 80) / 6 },
  barValText: { fontSize: 10, fontWeight: '700', color: thannigoPalette.neutral, marginBottom: 6 },
  barTrack: { width: 14, height: 120, backgroundColor: thannigoPalette.borderSoft, borderRadius: 7, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 7 },
  barLabel: { fontSize: 11, fontWeight: '600', color: thannigoPalette.neutral, marginTop: 8 },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: thannigoPalette.darkText, marginTop: 8 },
  insightCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: thannigoPalette.surface, borderRadius: Radius.lg, padding: 16 },
  insightTitle: { fontSize: 14, fontWeight: '800', color: thannigoPalette.darkText, marginBottom: 2 },
  insightDesc: { fontSize: 12, color: thannigoPalette.neutral, lineHeight: 18 },
});





