import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { deliveryApi, type DeliveryEarnings } from '@/api/deliveryApi';
import { Shadow, thannigoPalette, roleAccent, roleSurface, roleGradients } from '@/constants/theme';

const DELIVERY_ACCENT = roleAccent.delivery;
const DELIVERY_SURF = roleSurface.delivery;
const DELIVERY_GRAD: [string, string] = [roleGradients.delivery.start, roleGradients.delivery.end];

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
          <Ionicons name="chevron-back" size={20} color={DELIVERY_ACCENT} />
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
        <ActivityIndicator size="large" color={DELIVERY_ACCENT} style={{ marginTop: 80 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(period); }}
              colors={[DELIVERY_ACCENT]}
              tintColor={DELIVERY_ACCENT}
            />
          }
        >
          {/* HERO CARD */}
          <LinearGradient
            colors={DELIVERY_GRAD}
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
  container: { flex: 1, backgroundColor: thannigoPalette.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: thannigoPalette.surface,
    borderBottomWidth: 1, borderBottomColor: thannigoPalette.borderSoft,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: thannigoPalette.background, alignItems: 'center', justifyContent: 'center', ...Shadow.xs },
  headerTitle: { fontSize: 18, fontWeight: '800', color: thannigoPalette.darkText },

  periodRow: { flexDirection: 'row', padding: 16, gap: 8, backgroundColor: thannigoPalette.surface, borderBottomWidth: 1, borderBottomColor: thannigoPalette.borderSoft },
  periodBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: thannigoPalette.background },
  periodBtnActive: { backgroundColor: DELIVERY_ACCENT },
  periodText: { fontSize: 12, fontWeight: '700', color: thannigoPalette.neutral },
  periodTextActive: { color: 'white' },

  content: { padding: 20, paddingBottom: 100 },
  heroCard: { borderRadius: 24, padding: 24, marginBottom: 20, ...Shadow.md },
  heroLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginBottom: 4 },
  heroBalance: { fontSize: 36, fontWeight: '900', color: 'white', letterSpacing: -1, marginBottom: 20 },
  cashoutBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  cashoutBtnText: { color: DELIVERY_ACCENT, fontWeight: '800', fontSize: 14 },

  statsRow: { flexDirection: 'row', backgroundColor: thannigoPalette.surface, borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: thannigoPalette.borderSoft },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '900', color: thannigoPalette.darkText, marginBottom: 4 },
  statLabel: { fontSize: 12, color: thannigoPalette.neutral, fontWeight: '700', marginBottom: 2 },
  statSub: { fontSize: 11, color: thannigoPalette.neutral, fontWeight: '500', textTransform: 'capitalize' },
  statDivider: { width: 1, backgroundColor: thannigoPalette.borderSoft },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: thannigoPalette.darkText, marginBottom: 12 },
  emptyCard: { backgroundColor: thannigoPalette.surface, borderRadius: 20, padding: 32, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 14, color: thannigoPalette.neutral, fontWeight: '600' },

  tripCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: thannigoPalette.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: thannigoPalette.borderSoft },
  tripIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: DELIVERY_SURF, alignItems: 'center', justifyContent: 'center' },
  tripId: { fontSize: 15, fontWeight: '800', color: thannigoPalette.darkText, marginBottom: 2 },
  tripTime: { fontSize: 12, color: thannigoPalette.neutral, fontWeight: '500' },
  tripAmount: { fontSize: 16, fontWeight: '900', color: DELIVERY_ACCENT },
  tripTip: { fontSize: 11, color: '#e65100', fontWeight: '700', marginTop: 2 },
});
