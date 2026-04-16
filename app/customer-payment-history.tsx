import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { BackButton } from '@/components/ui/BackButton';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { apiClient } from '@/api/client';

interface Payment {
  id: number;
  order_id: number;
  amount: number;
  method: string;
  status: string;
  paid_at: string | null;
  created_at: string;
  order?: {
    id: number;
    shop_name?: string;
    total_amount?: number;
  };
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  paid:     { bg: '#e8f5e9', color: '#2e7d32' },
  pending:  { bg: '#fff3e0', color: '#e65100' },
  failed:   { bg: '#ffebee', color: '#c62828' },
  refunded: { bg: '#e0f0ff', color: '#005d90' },
};

const METHOD_ICON: Record<string, string> = {
  cod: 'cash-outline',
  upi: 'phone-portrait-outline',
  razorpay: 'card-outline',
  online: 'card-outline',
  credit: 'card-outline',
};

export default function CustomerPaymentHistoryScreen() {
  const { safeBack } = useAppNavigation();

  useAndroidBackHandler(() => {
    safeBack('/(tabs)/profile');
  });

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPayments = useCallback(async (pageNum = 1, append = false) => {
    try {
      const res = await apiClient.get('/payments/history', {
        params: { page: pageNum, limit: 20 },
      });
      if (res.data?.status === 1) {
        const items: Payment[] = res.data.data?.data ?? res.data.data ?? [];
        const total = res.data.data?.total ?? items.length;
        if (append) {
          setPayments((prev) => [...prev, ...items]);
        } else {
          setPayments(items);
        }
        setHasMore(pageNum * 20 < total);
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load payment history.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchPayments(1); }, [fetchPayments]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    setLoadingMore(true);
    fetchPayments(next, true);
  };

  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + p.amount, 0);

  const totalRefunded = payments
    .filter((p) => p.status === 'refunded')
    .reduce((s, p) => s + p.amount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <BackButton fallback="/(tabs)/profile" />
        <Text style={styles.headerTitle}>Payment History</Text>
      </View>

      {/* SUMMARY */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Total Paid</Text>
          <Text style={[styles.summaryValue, { color: '#2e7d32' }]}>₹{totalPaid.toFixed(0)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Transactions</Text>
          <Text style={[styles.summaryValue, { color: '#005d90' }]}>{payments.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Refunded</Text>
          <Text style={[styles.summaryValue, { color: '#b45309' }]}>₹{totalRefunded.toFixed(0)}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setPage(1); fetchPayments(1); }} />}
        onScrollEndDrag={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 80) loadMore();
        }}
      >
        {loading && <ActivityIndicator color="#005d90" style={{ marginTop: 40 }} />}

        {!loading && payments.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#c8d0da" />
            <Text style={styles.emptyTitle}>No Payments Yet</Text>
            <Text style={styles.emptySub}>Your payment records will appear here.</Text>
          </View>
        )}

        {!loading && payments.map((payment) => {
          const statusStyle = STATUS_STYLE[payment.status] ?? STATUS_STYLE.pending;
          const iconName = METHOD_ICON[payment.method] ?? 'card-outline';
          const date = payment.paid_at ?? payment.created_at;

          return (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentTop}>
                <View style={styles.paymentIconWrap}>
                  <Ionicons name={iconName as any} size={22} color="#005d90" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentMethod}>{payment.method.toUpperCase()}</Text>
                  <Text style={styles.paymentOrderId}>Order #{payment.order_id}</Text>
                </View>
                <View>
                  <Text style={styles.paymentAmount}>₹{payment.amount}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusStyle.color }]}>
                      {payment.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {payment.order?.shop_name && (
                <View style={styles.shopRow}>
                  <Ionicons name="storefront-outline" size={13} color="#707881" />
                  <Text style={styles.shopName}>{payment.order.shop_name}</Text>
                </View>
              )}

              <View style={styles.dateRow}>
                <Ionicons name="time-outline" size={12} color="#94a3b8" />
                <Text style={styles.dateText}>
                  {new Date(date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          );
        })}

        {loadingMore && <ActivityIndicator color="#005d90" style={{ marginVertical: 16 }} />}
        {!loadingMore && !hasMore && payments.length > 0 && (
          <Text style={styles.endText}>All transactions loaded</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },

  summaryRow: { flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 16 },
  summaryBox: { flex: 1, alignItems: 'center', gap: 4 },
  summaryDivider: { width: 1, backgroundColor: '#e0e2e8' },
  summaryLabel: { fontSize: 11, color: '#707881', fontWeight: '600' },
  summaryValue: { fontSize: 20, fontWeight: '900' },

  content: { padding: 20, gap: 12, paddingBottom: 40 },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#64748b' },
  emptySub: { fontSize: 13, color: '#94a3b8', textAlign: 'center' },

  paymentCard: { backgroundColor: 'white', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  paymentTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  paymentIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  paymentMethod: { fontSize: 14, fontWeight: '900', color: '#181c20' },
  paymentOrderId: { fontSize: 11, color: '#707881', marginTop: 1 },
  paymentAmount: { fontSize: 18, fontWeight: '900', color: '#181c20', textAlign: 'right', marginBottom: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-end' },
  statusBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  shopName: { fontSize: 12, color: '#707881', fontWeight: '500' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateText: { fontSize: 11, color: '#94a3b8' },

  endText: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginVertical: 12 },
});
