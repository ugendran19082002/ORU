import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppNavigation } from '@/hooks/use-app-navigation';

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { StitchScreenShell } from '@/components/stitch/StitchScreenShell';

const KPI_CARDS = [
  { label: 'Total Orders', value: '324', note: '+12% vs last month', tone: '#27AE60', icon: 'trending-up' as const },
  { label: 'Revenue', value: 'Rs 28,450', note: 'Growing trend', tone: '#0077BE', icon: 'cash-outline' as const },
  { label: 'Avg Order Value', value: 'Rs 87.8', note: 'Stable performance', tone: '#1A2340', icon: 'stats-chart-outline' as const },
  { label: 'Cancellation Rate', value: '4.2%', note: 'Healthy range', tone: '#F39C12', icon: 'alert-circle-outline' as const },
];

const DAY_BARS = [
  { day: 'M', height: 44, active: false },
  { day: 'T', height: 96, active: true },
  { day: 'W', height: 66, active: false },
  { day: 'T', height: 58, active: false },
  { day: 'F', height: 80, active: false },
  { day: 'S', height: 92, active: false },
  { day: 'S', height: 50, active: false },
];

export default function ShopAnalyticsScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();


  return (
    <StitchScreenShell
      title="Shop Analytics"
      subtitle="Match the stitched dashboard with quick KPIs, trend cues, and daily performance insight."
      accent="#0077BE"
      screen="shopAnalytics"
      onBack={() => safeBack()}

      rightAction={
        <TouchableOpacity style={styles.headerAction} onPress={() => router.push('/shop/earnings' as any)}>
          <Ionicons name="calendar-outline" size={18} color="#0077BE" />
        </TouchableOpacity>
      }
    >
      <View style={styles.periodRow}>
        <Text style={styles.pageTitle}>Analytics</Text>
        <TouchableOpacity style={styles.periodChip}>
          <Text style={styles.periodText}>Apr 2026</Text>
          <Ionicons name="chevron-down" size={16} color="#707882" />
        </TouchableOpacity>
      </View>

      <View style={styles.metricGrid}>
        {KPI_CARDS.map((card) => (
          <View key={card.label} style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: `${card.tone}15` }]}>
              <Ionicons name={card.icon} size={18} color={card.tone} />
            </View>
            <Text style={styles.metricLabel}>{card.label}</Text>
            <Text style={[styles.metricValue, { color: card.tone }]}>{card.value}</Text>
            <Text style={[styles.metricNote, { color: card.tone }]}>{card.note}</Text>
          </View>
        ))}
      </View>

      <View style={styles.chartCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Revenue Trend</Text>
          <Text style={styles.sectionMeta}>30 days</Text>
        </View>
        <View style={styles.chartArea}>
          <View style={[styles.gridLine, { top: 12 }]} />
          <View style={[styles.gridLine, { top: 56 }]} />
          <View style={[styles.gridLine, { top: 100 }]} />
          <View style={styles.trendTrack}>
            <View style={[styles.trendPoint, { left: '6%', top: 92 }]} />
            <View style={[styles.trendPoint, { left: '24%', top: 68 }]} />
            <View style={[styles.trendPoint, { left: '42%', top: 44 }]} />
            <View style={[styles.trendPoint, { left: '62%', top: 60 }]} />
            <View style={[styles.trendPointActive, { left: '80%', top: 28 }]} />
            <View style={[styles.trendLine, { width: '80%' }]} />
          </View>
        </View>
        <View style={styles.axisRow}>
          <Text style={styles.axisText}>01 APR</Text>
          <Text style={styles.axisText}>15 APR</Text>
          <Text style={styles.axisText}>30 APR</Text>
        </View>
      </View>

      <View style={styles.insightCard}>
        <Ionicons name="bulb-outline" size={20} color="#006A61" />
        <Text style={styles.insightText}>
          Tuesday 7-9 AM is your peak slot. Increase ready stock the previous evening to reduce delivery wait time.
        </Text>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Orders by Day</Text>
        <View style={styles.barRow}>
          {DAY_BARS.map((bar) => (
            <View key={`${bar.day}-${bar.height}`} style={styles.barItem}>
              <View
                style={[
                  styles.bar,
                  {
                    height: bar.height,
                    backgroundColor: bar.active ? '#0077BE' : '#83F2E3',
                  },
                ]}
              />
              <Text style={[styles.barLabel, bar.active && styles.barLabelActive]}>{bar.day}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.paymentCard}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.donutWrap}>
          <View style={styles.donutOuter}>
            <View style={styles.donutInner}>
              <Text style={styles.donutValue}>324</Text>
              <Text style={styles.donutCaption}>total</Text>
            </View>
          </View>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#0077BE' }]} />
            <Text style={styles.legendText}>UPI (68%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#83F2E3' }]} />
            <Text style={styles.legendText}>Cash (32%)</Text>
          </View>
        </View>
      </View>
    </StitchScreenShell>
  );
}

const styles = StyleSheet.create({
  headerAction: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  periodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: '#181C20' },
  periodChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E6E8EE', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  periodText: { fontSize: 13, fontWeight: '800', color: '#707882' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricCard: { width: '48%', backgroundColor: '#fff', borderRadius: 22, padding: 16, gap: 8, shadowColor: '#005E97', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  metricIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  metricLabel: { fontSize: 12, fontWeight: '700', color: '#707882' },
  metricValue: { fontSize: 24, fontWeight: '900' },
  metricNote: { fontSize: 11, fontWeight: '700' },
  chartCard: { backgroundColor: '#fff', borderRadius: 24, padding: 18, gap: 16, shadowColor: '#005E97', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#181C20' },
  sectionMeta: { fontSize: 11, fontWeight: '800', color: '#707882', textTransform: 'uppercase' },
  chartArea: { height: 140, borderRadius: 18, backgroundColor: '#F7F9FF', position: 'relative', overflow: 'hidden' },
  gridLine: { position: 'absolute', left: 12, right: 12, borderTopWidth: 1, borderTopColor: '#E6E8EE', borderStyle: 'dashed' },
  trendTrack: { flex: 1, position: 'relative' },
  trendLine: { position: 'absolute', left: '8%', top: 72, height: 3, backgroundColor: '#0077BE55', borderRadius: 999, transform: [{ rotate: '-18deg' }] },
  trendPoint: { position: 'absolute', width: 10, height: 10, borderRadius: 999, backgroundColor: '#0077BE' },
  trendPointActive: { position: 'absolute', width: 16, height: 16, borderRadius: 999, backgroundColor: '#fff', borderWidth: 4, borderColor: '#0077BE' },
  axisRow: { flexDirection: 'row', justifyContent: 'space-between' },
  axisText: { fontSize: 10, fontWeight: '800', color: '#707882' },
  insightCard: { flexDirection: 'row', gap: 12, backgroundColor: '#EEF9F7', borderColor: '#BEEADE', borderWidth: 1, borderRadius: 18, padding: 16, alignItems: 'flex-start' },
  insightText: { flex: 1, color: '#105139', lineHeight: 20, fontWeight: '600' },
  barRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 132 },
  barItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 10 },
  bar: { width: '100%', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  barLabel: { fontSize: 10, fontWeight: '800', color: '#707882' },
  barLabelActive: { color: '#0077BE' },
  paymentCard: { backgroundColor: '#fff', borderRadius: 24, padding: 18, gap: 16, alignItems: 'center' },
  donutWrap: { paddingVertical: 8 },
  donutOuter: { width: 156, height: 156, borderRadius: 999, borderWidth: 14, borderTopColor: '#0077BE', borderRightColor: '#0077BE', borderBottomColor: '#83F2E3', borderLeftColor: '#83F2E3', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '25deg' }] },
  donutInner: { width: 104, height: 104, borderRadius: 999, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-25deg' }] },
  donutValue: { fontSize: 28, fontWeight: '900', color: '#181C20' },
  donutCaption: { fontSize: 11, fontWeight: '800', color: '#707882' },
  legendRow: { flexDirection: 'row', gap: 20, flexWrap: 'wrap', justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 999 },
  legendText: { fontSize: 12, fontWeight: '800', color: '#707882' },
});
