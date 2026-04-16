import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image,
  useWindowDimensions, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '@/components/ui/Logo';
import { BackButton } from '@/components/ui/BackButton';
import { analyticsApi, ShopAnalytics } from '@/api/analyticsApi';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';

export default function ShopEarningsScreen() {
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<ShopAnalytics | null>(null);
  const [period, setPeriod] = useState<string>('all');

  useEffect(() => {
    fetchEarnings();
  }, [period]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const earnings = await analyticsApi.getShopEarnings({ period });
      setData(earnings);
    } catch (error) {
      console.error('[Earnings] Fetch failed:', error);
      Toast.show({ type: 'error', text1: 'Failed to load earnings' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarnings();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#005d90" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

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
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} />}
      >
        <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
          <Text style={styles.pageTitle}>Earnings</Text>
          
          <LinearGradient
            colors={['#005d90', '#003a5c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View>
              <Text style={styles.balanceLabel}>Total Revenue (Net)</Text>
              <Text style={styles.balanceAmt}>₹{data?.revenue?.net?.toLocaleString() || '0'}</Text>
            </View>
            <View style={styles.balanceDeco}>
              <Ionicons name="wallet-outline" size={80} color="rgba(255,255,255,0.1)" />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.periodPicker}>
          {['7d', '30d', 'all'].map((p) => (
            <TouchableOpacity 
              key={p} 
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => {
                setPeriod(p);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p === '7d' ? 'Last 7 Days' : p === '30d' ? 'Last 30 Days' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.gridItem}>
             <View style={[styles.iconBox, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="cash-outline" size={20} color="#005d90" />
             </View>
             <Text style={styles.gridLabel}>Gross Revenue</Text>
             <Text style={styles.gridVal}>₹{data?.revenue?.gross || 0}</Text>
          </View>
          <View style={styles.gridItem}>
             <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="cut-outline" size={20} color="#ba1a1a" />
             </View>
             <Text style={styles.gridLabel}>Commission</Text>
             <Text style={styles.gridVal}>₹{data?.revenue?.commission || 0}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Breakdown</Text>
        </View>

        {(!data?.daily_revenue || data.daily_revenue.length === 0) ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No transaction history for this period</Text>
          </View>
        ) : (
          data.daily_revenue.map((day, idx) => (
            <View key={idx} style={styles.historyItem}>
              <View style={styles.historyInfo}>
                <Text style={styles.historyDate}>{moment(day.date).format('DD MMM, YYYY')}</Text>
                <Text style={styles.historySub}>{day.orders} Orders processed</Text>
              </View>
              <View style={styles.historySide}>
                <Text style={styles.historyAmt}>+₹{day.revenue}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Settled</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingHorizontal: 24, paddingVertical: 14, 
    backgroundColor: 'rgba(255,255,255,0.92)' 
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 22, fontWeight: '900', color: '#003a5c', letterSpacing: -0.5 },
  roleLabel: { fontSize: 9, fontWeight: '700', color: '#006878', letterSpacing: 1.5, marginTop: 3 },
  
  scrollContent: { paddingVertical: 10, paddingBottom: 120 },
  pageTitle: { fontSize: 32, fontWeight: '900', color: '#181c20', letterSpacing: -0.5, marginBottom: 20 },
  
  balanceCard: {
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#005d90',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  balanceAmt: { color: 'white', fontSize: 36, fontWeight: '900' },
  balanceDeco: { position: 'absolute', right: -10, bottom: -10 },

  periodPicker: { 
    flexDirection: 'row', 
    paddingHorizontal: 24, 
    gap: 8, 
    marginBottom: 20 
  },
  periodBtn: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 12, 
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  periodBtnActive: { backgroundColor: '#005d90', borderColor: '#005d90' },
  periodText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  periodTextActive: { color: '#fff' },

  statsGrid: { 
    flexDirection: 'row', 
    paddingHorizontal: 24, 
    gap: 16, 
    marginBottom: 24 
  },
  gridItem: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  gridLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  gridVal: { fontSize: 18, fontWeight: '800', color: '#1e293b' },

  sectionHeader: { paddingHorizontal: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },

  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
  },
  historyInfo: { flex: 1 },
  historyDate: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 2 },
  historySub: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  historySide: { alignItems: 'flex-end' },
  historyAmt: { fontSize: 16, fontWeight: '900', color: '#10b981', marginBottom: 4 },
  statusBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 9, fontWeight: '800', color: '#10b981', textTransform: 'uppercase' },

  emptyBox: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },
});
