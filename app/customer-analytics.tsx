import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const SPENDING_DATA = [450, 520, 480, 610, 590, 320]; // Mock spending in Rs
const CANS_DATA = [10, 12, 11, 14, 13, 8]; // Mock cans ordered

export default function CustomerAnalyticsScreen() {
  const { safeBack } = useAppNavigation();
  useAndroidBackHandler(() => { safeBack('/(tabs)/profile'); });
  const [activeTab, setActiveTab] = useState<'spending' | 'usage'>('spending');

  const maxVal = Math.max(...(activeTab === 'spending' ? SPENDING_DATA : CANS_DATA));
  const currentData = activeTab === 'spending' ? SPENDING_DATA : CANS_DATA;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <BackButton fallback="/(tabs)/profile" />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>My Analytics</Text>
          <Text style={styles.headerSub}>Track your water usage & spending</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* TOP STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#e0f0ff' }]}>
              <Ionicons name="stats-chart-outline" size={20} color="#005d90" />
            </View>
            <Text style={styles.statValue}>₹2,970</Text>
            <Text style={styles.statLabel}>Total Spent (YTD)</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#e8f5e9' }]}>
              <Ionicons name="water-outline" size={20} color="#2e7d32" />
            </View>
            <Text style={styles.statValue}>68</Text>
            <Text style={styles.statLabel}>Cans Ordered</Text>
          </View>
        </View>

        {/* SAVINGS TRACKER */}
        <LinearGradient colors={['#005d90', '#0077b6']} style={styles.savingsCard}>
          <View style={styles.savingsTop}>
             <Ionicons name="leaf" size={24} color="#4ade80" />
             <Text style={styles.savingsTitle}>Savings Tracker</Text>
          </View>
          <Text style={styles.savingsBigText}>₹450 Saved</Text>
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
            {currentData.map((val, i) => {
              const heightPct = (val / maxVal) * 100;
              return (
                <View key={i} style={styles.barCol}>
                  <Text style={styles.barValText}>{activeTab === 'spending' ? `₹${val}` : val}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: `${heightPct}%`, backgroundColor: activeTab === 'spending' ? '#005d90' : '#0ea5e9' }]} />
                  </View>
                  <Text style={styles.barLabel}>{MONTHS[i]}</Text>
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
             <Text style={styles.insightDesc}>You typically order a new can every <Text style={{fontWeight: 'bold', color: '#181c20'}}>4.5 days</Text>.</Text>
          </View>
        </View>
        <View style={styles.insightCard}>
          <Ionicons name="trending-up" size={24} color="#4338ca" />
          <View style={{ flex: 1 }}>
             <Text style={styles.insightTitle}>Summer Peak</Text>
             <Text style={styles.insightDesc}>Your usage increased by 25% in April compared to March.</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  headerSub: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  content: { padding: 20, gap: 16, paddingBottom: 60 },
  
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: 'white', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  statIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 22, fontWeight: '900', color: '#181c20' },
  statLabel: { fontSize: 12, color: '#707881', fontWeight: '600', marginTop: 4 },

  savingsCard: { borderRadius: 20, padding: 20 },
  savingsTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  savingsTitle: { color: 'white', fontWeight: '700', fontSize: 15 },
  savingsBigText: { color: 'white', fontSize: 32, fontWeight: '900' },
  savingsSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },

  chartContainer: { backgroundColor: 'white', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  chartTitle: { fontSize: 16, fontWeight: '800', color: '#181c20' },
  chartToggle: { flexDirection: 'row', backgroundColor: '#f1f4f9', borderRadius: 10, padding: 4 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  toggleText: { fontSize: 12, fontWeight: '700', color: '#707881' },
  toggleTextActive: { color: '#005d90' },

  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 180, paddingTop: 20 },
  barCol: { alignItems: 'center', width: (width - 80) / 6 },
  barValText: { fontSize: 10, fontWeight: '700', color: '#707881', marginBottom: 6 },
  barTrack: { width: 14, height: 120, backgroundColor: '#f1f4f9', borderRadius: 7, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 7 },
  barLabel: { fontSize: 11, fontWeight: '600', color: '#707881', marginTop: 8 },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#181c20', marginTop: 8 },
  insightCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'white', borderRadius: 16, padding: 16 },
  insightTitle: { fontSize: 14, fontWeight: '800', color: '#181c20', marginBottom: 2 },
  insightDesc: { fontSize: 12, color: '#707881', lineHeight: 18 },
});
