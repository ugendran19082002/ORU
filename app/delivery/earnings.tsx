import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { deliveryApi, type DeliveryEarnings } from '@/api/deliveryApi';

type Period = 'today' | 'week' | 'month';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

export default function DeliveryEarningsScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('today');
  const [data, setData] = useState<DeliveryEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (p: Period) => {
    try {
      const res = await deliveryApi.getEarnings(p);
      if (res.status === 1) setData(res.data);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed to load earnings', text2: err?.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load(period);
  }, [period, load]);

  const handleCashout = () => {
    Toast.show({
      type: 'success',
      text1: 'Cashout Requested',
      text2: 'Funds will be transferred to your registered bank account within 24 hours.',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#005d90" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Earnings</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* PERIOD TOGGLE */}
      <View style={styles.periodRow}>
        {(['today', 'week', 'month'] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#005d90" style={{ marginTop: 80 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(period); }}
              colors={['#005d90']}
              tintColor="#005d90"
            />
          }
        >
          {/* HERO CARD */}
          <LinearGradient
            colors={['#2e7d32', '#1b5e20']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <Text style={styles.heroLabel}>
              {period === 'today' ? "Today's Balance" : period === 'week' ? "Week's Balance" : "Month's Balance"}
            </Text>
            <Text style={styles.heroBalance}>₹{(data?.total_earnings ?? 0).toFixed(2)}</Text>

            <TouchableOpacity style={styles.cashoutBtn} onPress={handleCashout}>
              <Text style={styles.cashoutBtnText}>Cash Out Now</Text>
              <Ionicons name="arrow-forward" size={16} color="#1b5e20" />
            </TouchableOpacity>
          </LinearGradient>

          {/* STATS ROW */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>₹{(data?.total_earnings ?? 0).toFixed(0)}</Text>
              <Text style={styles.statLabel}>Total Earned</Text>
              <Text style={styles.statSub}>{data?.period}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{data?.total_deliveries ?? 0}</Text>
              <Text style={styles.statLabel}>Trips Completed</Text>
            </View>
          </View>

          {/* RECENT */}
          <Text style={styles.sectionTitle}>Recent Trips</Text>

          {(data?.recent ?? []).length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="bicycle-outline" size={40} color="#c8d6e0" />
              <Text style={styles.emptyText}>No deliveries in this period</Text>
            </View>
          ) : (
            (data?.recent ?? []).map((trip) => (
              <View key={trip.id} style={styles.tripCard}>
                <View style={styles.tripIconBox}>
                  <Ionicons name="bicycle" size={20} color="#2e7d32" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tripId}>{trip.order_number}</Text>
                  <Text style={styles.tripTime}>{formatDate(trip.delivered_at)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.tripAmount}>₹{trip.amount.toFixed(2)}</Text>
                  {trip.tip > 0 && <Text style={styles.tripTip}>+ ₹{trip.tip} tip</Text>}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'white',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#181c20' },

  periodRow: { flexDirection: 'row', padding: 16, gap: 8, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  periodBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: '#f1f5f9' },
  periodBtnActive: { backgroundColor: '#1b5e20' },
  periodText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  periodTextActive: { color: 'white' },

  content: { padding: 20, paddingBottom: 100 },
  heroCard: { borderRadius: 24, padding: 24, marginBottom: 20, shadowColor: '#2e7d32', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  heroLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginBottom: 4 },
  heroBalance: { fontSize: 36, fontWeight: '900', color: 'white', letterSpacing: -1, marginBottom: 20 },
  cashoutBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  cashoutBtnText: { color: '#1b5e20', fontWeight: '800', fontSize: 14 },

  statsRow: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '900', color: '#181c20', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#707881', fontWeight: '700', marginBottom: 2 },
  statSub: { fontSize: 11, color: '#94a3b8', fontWeight: '500', textTransform: 'capitalize' },
  statDivider: { width: 1, backgroundColor: '#f1f5f9' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#181c20', marginBottom: 12 },
  emptyCard: { backgroundColor: 'white', borderRadius: 20, padding: 32, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 14, color: '#94a3b8', fontWeight: '600' },

  tripCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  tripIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center' },
  tripId: { fontSize: 15, fontWeight: '800', color: '#181c20', marginBottom: 2 },
  tripTime: { fontSize: 12, color: '#707881', fontWeight: '500' },
  tripAmount: { fontSize: 16, fontWeight: '900', color: '#1b5e20' },
  tripTip: { fontSize: 11, color: '#e65100', fontWeight: '700', marginTop: 2 },
});
