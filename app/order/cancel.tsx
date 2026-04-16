import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { useOrderStore } from '@/stores/orderStore';
import { apiClient } from '@/api/client';

const REASONS = [
  { id: 'ordered_by_mistake', label: 'Ordered by mistake', icon: 'hand-left-outline' },
  { id: 'wrong_item_quantity', label: 'Wrong item / quantity', icon: 'swap-horizontal-outline' },
  { id: 'delivery_time_too_long', label: 'Delivery time too long', icon: 'time-outline' },
  { id: 'found_better_price', label: 'Found a better price', icon: 'pricetag-outline' },
  { id: 'changed_mind', label: 'Changed my mind', icon: 'refresh-outline' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

export default function CancelOrderScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const { orderId: paramOrderId } = useLocalSearchParams<{ orderId: string }>();
  const { activeOrderId, orders } = useOrderStore();

  useAndroidBackHandler(() => {
    safeBack('/(tabs)/orders');
  });

  const orderId = paramOrderId ?? activeOrderId;
  const order = orders.find((o) => o.id === orderId);

  const [selected, setSelected] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!selected) {
      Toast.show({ type: 'error', text1: 'Select Reason', text2: 'Please select a reason for cancellation.' });
      return;
    }
    if (!orderId) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Order not found.' });
      return;
    }

    require('react-native').Alert.alert(
      'Cancel Order?',
      'This action cannot be undone.',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              const reasonLabel = REASONS.find((r) => r.id === selected)?.label ?? selected;
              const res = await apiClient.post(`/orders/${orderId}/cancel`, { reason: reasonLabel });
              if (res.data.status === 1) {
                Toast.show({ type: 'success', text1: 'Order Cancelled', text2: 'Your refund will be processed shortly.' });
                router.replace('/(tabs)/orders' as any);
              } else {
                throw new Error(res.data.message ?? 'Cancellation failed');
              }
            } catch (e: any) {
              Toast.show({ type: 'error', text1: 'Cancellation Failed', text2: e?.response?.data?.message ?? e?.message ?? 'Could not cancel order.' });
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const orderTotal = order ? `₹${order.total}` : '₹—';
  const orderNumber = order?.id ?? orderId ?? '—';
  const refundNote = order
    ? `Full refund of ₹${order.total} will be credited to your original payment method within 5–7 business days.`
    : 'Refund will be processed to your original payment method.';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <BackButton fallback="/(tabs)/orders" />
        <Text style={styles.headerTitle}>Cancel Order</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* ORDER SUMMARY */}
        <View style={styles.orderCard}>
          <View style={styles.orderRow}>
            <View style={styles.orderIcon}>
              <Ionicons name="receipt-outline" size={20} color="#c62828" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderTitle}>Order #{orderNumber}</Text>
              <Text style={styles.orderMeta}>{order?.shopName ?? 'Your Order'}</Text>
            </View>
            <Text style={styles.orderTotal}>{orderTotal}</Text>
          </View>
        </View>

        {/* REFUND INFO */}
        <View style={styles.refundCard}>
          <Ionicons name="card-outline" size={22} color="#2e7d32" />
          <View style={{ flex: 1 }}>
            <Text style={styles.refundTitle}>Refund Details</Text>
            <Text style={styles.refundText}>{refundNote}</Text>
          </View>
        </View>

        {/* REASON LIST */}
        <Text style={styles.sectionTitle}>Why are you cancelling?</Text>
        {REASONS.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={[styles.reasonCard, selected === r.id && styles.reasonCardActive]}
            onPress={() => setSelected(r.id)}
          >
            <View style={[styles.reasonIcon, selected === r.id && styles.reasonIconActive]}>
              <Ionicons name={r.icon as any} size={18} color={selected === r.id ? '#c62828' : '#707881'} />
            </View>
            <Text style={[styles.reasonText, selected === r.id && styles.reasonTextActive]}>{r.label}</Text>
            <View style={[styles.radio, selected === r.id && styles.radioActive]}>
              {selected === r.id && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}

        {/* WARNING NOTE */}
        <View style={styles.warningCard}>
          <Ionicons name="alert-circle-outline" size={18} color="#b45309" />
          <Text style={styles.warningText}>
            Cancellations after the shop starts preparing may not be eligible for a refund.
          </Text>
        </View>

        {/* CANCEL BUTTON */}
        <TouchableOpacity style={[styles.cancelBtn, cancelling && { opacity: 0.7 }]} onPress={handleCancel} disabled={cancelling}>
          <LinearGradient colors={['#c62828', '#ef4444']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cancelBtnGrad}>
            {cancelling ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="close-circle" size={20} color="white" />
                <Text style={styles.cancelBtnText}>Confirm Cancellation</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.keepBtn} onPress={() => safeBack('/(tabs)/orders')} disabled={cancelling}>
          <Text style={styles.keepBtnText}>Keep My Order</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  orderCard: { backgroundColor: 'white', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orderIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#ffebee', alignItems: 'center', justifyContent: 'center' },
  orderTitle: { fontSize: 16, fontWeight: '800', color: '#181c20' },
  orderMeta: { fontSize: 12, color: '#707881', fontWeight: '500', marginTop: 2 },
  orderTotal: { fontSize: 18, fontWeight: '900', color: '#181c20' },
  refundCard: { flexDirection: 'row', gap: 12, backgroundColor: '#f0fdf4', borderRadius: 16, padding: 16, alignItems: 'flex-start', borderWidth: 1, borderColor: '#bbf7d0' },
  refundTitle: { fontSize: 14, fontWeight: '800', color: '#2e7d32', marginBottom: 3 },
  refundText: { fontSize: 12, color: '#166534', lineHeight: 17, fontWeight: '500' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#181c20', letterSpacing: -0.3 },
  reasonCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: '#e0e2e8' },
  reasonCardActive: { borderColor: '#f87171', backgroundColor: '#fff5f5' },
  reasonIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center' },
  reasonIconActive: { backgroundColor: '#ffebee' },
  reasonText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#181c20' },
  reasonTextActive: { color: '#c62828' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#e0e2e8', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#c62828' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#c62828' },
  warningCard: { flexDirection: 'row', gap: 10, backgroundColor: '#fef3c7', borderRadius: 14, padding: 14, alignItems: 'flex-start' },
  warningText: { flex: 1, fontSize: 12, color: '#b45309', lineHeight: 17, fontWeight: '600' },
  cancelBtn: { borderRadius: 18, overflow: 'hidden' },
  cancelBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  cancelBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
  keepBtn: { paddingVertical: 14, alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: '#e0e2e8', backgroundColor: 'white' },
  keepBtnText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
});
