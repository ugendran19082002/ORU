import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { deliveryApi, type DeliveryTripEntry } from '@/api/deliveryApi';
import { Shadow, thannigoPalette, roleAccent, roleSurface } from '@/constants/theme';

const DELIVERY_ACCENT = roleAccent.delivery;
const DELIVERY_SURF = roleSurface.delivery;

type Period = 'today' | 'week' | 'month' | undefined;

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  delivered: { label: 'Delivered', color: thannigoPalette.deliveryGreen, bg: thannigoPalette.deliveryGreenLight },
  failed:    { label: 'Failed',    color: thannigoPalette.error, bg: thannigoPalette.dangerSoft },
  picked_up: { label: 'Picked Up', color: thannigoPalette.warning, bg: '#FFF8E1' },
  assigned:  { label: 'Assigned',  color: DELIVERY_ACCENT, bg: DELIVERY_SURF },
};

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

export default function DeliveryHistoryScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Period>(undefined);
  const [trips, setTrips] = useState<DeliveryTripEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (p: number, period: Period, append = false) => {
    try {
      const res = await deliveryApi.getTripHistory({ page: p, limit: 20, period });
      if (res.status === 1 && res.data) {
        setTotal(res.data.total);
        setTrips((prev) => append ? [...prev, ...res.data.data] : res.data.data);
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed to load history', text2: err?.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    load(1, filter, false);
  }, [filter, load]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    load(1, filter, false);
  };

  const onEndReached = () => {
    if (trips.length >= total || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    load(nextPage, filter, true);
  };

  const renderItem = ({ item }: { item: DeliveryTripEntry }) => {
    const meta = STATUS_META[item.status] ?? STATUS_META.assigned;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIdBadge}>
            <Ionicons name="bicycle" size={14} color={DELIVERY_ACCENT} />
            <Text style={styles.cardId}>{item.order_number}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
            <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>

        <Text style={styles.shopName}>{item.shop_name}</Text>
        <Text style={styles.dateText}>{formatDateTime(item.assigned_at)}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.metaBadge}>
            <Ionicons name="cash" size={14} color={thannigoPalette.deliveryGreen} />
            <Text style={[styles.metaText, { color: thannigoPalette.deliveryGreen }]}>₹{item.earnings.toFixed(2)}</Text>
          </View>
          {item.delivery_time_min != null && (
            <View style={styles.metaBadge}>
              <Ionicons name="time-outline" size={14} color={thannigoPalette.neutral} />
              <Text style={styles.metaText}>{item.delivery_time_min} min</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={DELIVERY_ACCENT} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Trip History</Text>
          {!loading && <Text style={styles.headerSubtitle}>{total} trips total</Text>}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* FILTER TABS */}
      <View style={styles.filterWrap}>
        {([undefined, 'today', 'week', 'month'] as Period[]).map((p) => (
          <TouchableOpacity
            key={String(p)}
            style={[styles.filterBtn, filter === p && styles.filterBtnActive]}
            onPress={() => setFilter(p)}
          >
            <Text style={[styles.filterText, filter === p && styles.filterTextActive]}>
              {p === undefined ? 'All' : p === 'today' ? 'Today' : p === 'week' ? 'Week' : 'Month'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={DELIVERY_ACCENT} style={{ marginTop: 80 }} />
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DELIVERY_ACCENT]} tintColor={DELIVERY_ACCENT} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color={DELIVERY_ACCENT} style={{ marginVertical: 16 }} /> : null
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Ionicons name="bicycle-outline" size={40} color={thannigoPalette.borderSoft} />
              <Text style={styles.emptyText}>No trips found for this period</Text>
            </View>
          }
        />
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
  headerSubtitle: { fontSize: 12, color: thannigoPalette.neutral, fontWeight: '500' },

  filterWrap: { flexDirection: 'row', padding: 14, gap: 8, backgroundColor: thannigoPalette.surface, borderBottomWidth: 1, borderBottomColor: thannigoPalette.borderSoft },
  filterBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: thannigoPalette.background },
  filterBtnActive: { backgroundColor: DELIVERY_ACCENT },
  filterText: { fontSize: 12, fontWeight: '700', color: thannigoPalette.neutral },
  filterTextActive: { color: 'white' },

  listContent: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: thannigoPalette.surface, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: thannigoPalette.borderSoft, ...Shadow.xs },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardIdBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: DELIVERY_SURF, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  cardId: { fontSize: 13, fontWeight: '800', color: DELIVERY_ACCENT },
  shopName: { fontSize: 16, fontWeight: '800', color: thannigoPalette.darkText, marginBottom: 4 },
  dateText: { fontSize: 12, color: thannigoPalette.neutral, fontWeight: '500', marginBottom: 14 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: thannigoPalette.borderSoft, paddingTop: 12 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: thannigoPalette.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  metaText: { fontSize: 12, fontWeight: '700', color: thannigoPalette.neutral },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700' },
  emptyCard: { backgroundColor: thannigoPalette.surface, borderRadius: 20, padding: 40, alignItems: 'center', gap: 10, margin: 16 },
  emptyText: { fontSize: 14, color: thannigoPalette.neutral, fontWeight: '600' },
});
