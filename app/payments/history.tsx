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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

import { BackButton } from '@/components/ui/BackButton';
import { paymentApi, PaymentItem } from '@/api/paymentApi';

export default function PaymentHistoryScreen() {
  const router = useRouter();
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
      default: return '#707881';
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
        <ActivityIndicator size="large" color="#005d90" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <BackButton iconColor="#005d90" />
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Payment History</Text>
          <Text style={styles.headerSubtitle}>Transaction records & status</Text>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} />}
        contentContainerStyle={styles.scrollContent}
      >
        {payments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={64} color="#e2e8f0" />
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
                    color="#005d90" 
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { 
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, 
    backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' 
  },
  headerTitleContainer: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  headerSubtitle: { fontSize: 12, color: '#64748b' },

  scrollContent: { padding: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#64748b', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 8 },

  paymentCard: { 
    backgroundColor: 'white', borderRadius: 20, marginBottom: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 
  },
  cardMain: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  iconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  infoContainer: { flex: 1, marginLeft: 14 },
  orderNumber: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  date: { fontSize: 12, color: '#64748b', marginTop: 2 },
  amountContainer: { alignItems: 'flex-end' },
  amount: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800' },
  cardFooter: { backgroundColor: '#f8fafc', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  txnId: { fontSize: 10, color: '#94a3b8', fontStyle: 'italic' },
});
