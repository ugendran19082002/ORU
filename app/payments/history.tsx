import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

import { BackButton } from '@/components/ui/BackButton';
import { paymentApi, PaymentItem } from '@/api/paymentApi';
import { useAppTheme } from '@/providers/ThemeContext';
import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { Shadow } from '@/constants/theme';

const CUSTOMER_ACCENT = '#005d90';

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitleContainer: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  headerSubtitle: { fontSize: 12, color: colors.muted, fontWeight: '500' },

  scrollContent: { padding: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.muted, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: colors.muted, marginTop: 8, opacity: 0.7 },

  paymentCard: {
    backgroundColor: colors.surface, borderRadius: 20, marginBottom: 16, overflow: 'hidden',
    ...Shadow.sm,
  },
  cardMain: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  iconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center' },
  infoContainer: { flex: 1, marginLeft: 14 },
  orderNumber: { fontSize: 15, fontWeight: '700', color: colors.text },
  date: { fontSize: 12, color: colors.muted, marginTop: 2 },
  amountContainer: { alignItems: 'flex-end' },
  amount: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800' },
  cardFooter: { backgroundColor: colors.background, paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  txnId: { fontSize: 10, color: colors.muted, fontStyle: 'italic' },
});

export default function PaymentHistoryScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const result = await paymentApi.getPaymentHistory();
      setPayments(result.data);
    } catch (error) {
      console.error('[PaymentHistory] fetch failed:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load payments' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#2e7d32';
      case 'pending': return '#b45309';
      case 'failed': return '#ba1a1a';
      default: return colors.muted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'failed': return 'close-circle';
      default: return 'ellipse';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={CUSTOMER_ACCENT} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <BackButton iconColor={CUSTOMER_ACCENT} />
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Payment History</Text>
          <Text style={styles.headerSubtitle}>Transaction records & status</Text>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[CUSTOMER_ACCENT]} />}
        contentContainerStyle={styles.scrollContent}
      >
        {payments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={64} color={colors.border} />
            <Text style={styles.emptyTitle}>No Transactions Yet</Text>
            <Text style={styles.emptySubtitle}>Your recent payments will appear here.</Text>
          </View>
        ) : (
          payments.map((payment) => (
            <TouchableOpacity
              key={payment.id}
              style={styles.paymentCard}
              onPress={() => router.push(`/order/${payment.order_id}` as any)}
            >
              <View style={styles.cardMain}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={payment.method === 'cod' ? 'cash-outline' : 'globe-outline'}
                    size={24}
                    color={CUSTOMER_ACCENT}
                  />
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.orderNumber}>Order {payment.Order?.order_number}</Text>
                  <Text style={styles.date}>
                    {new Date(payment.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <View style={styles.amountContainer}>
                  <Text style={styles.amount}>₹{payment.amount}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) + '15' }]}>
                    <Ionicons name={getStatusIcon(payment.status) as any} size={12} color={getStatusColor(payment.status)} />
                    <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
                      {payment.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {(payment.razorpay_payment_id || payment.upi_txn_id) && (
                <View style={styles.cardFooter}>
                  <Text style={styles.txnId}>
                    ID: {payment.razorpay_payment_id || payment.upi_txn_id}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
