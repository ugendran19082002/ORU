import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { adminApi } from '@/api/adminApi';
import { orderApi } from '@/api/orderApi';
import Toast from 'react-native-toast-message';
import { BackButton } from '@/components/ui/BackButton';

export default function AdminOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [isOverrideModalOpen, setOverrideModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [isOverriding, setIsOverriding] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await orderApi.getOrderById(id);
      setOrder(data);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Load Failed', text2: 'Could not fetch order details.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetail();
  };

  const handleOverride = async () => {
    if (!newStatus || !overrideReason) {
      Toast.show({ type: 'error', text1: 'Required', text2: 'Status and reason are mandatory.' });
      return;
    }
    setIsOverriding(true);
    try {
      await adminApi.overrideOrderStatus(String(id), newStatus, overrideReason);
      Toast.show({ type: 'success', text1: 'Status Overridden', text2: 'The order state has been force-changed.' });
      setOverrideModalOpen(false);
      fetchDetail();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Override Failed', text2: 'Could not update order status.' });
    } finally {
      setIsOverriding(false);
    }
  };

  if (loading && !refreshing) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#ba1a1a" /></View>;
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Order not found</Text>
        <BackButton fallback="/admin/orders" />
      </View>
    );
  }

  const STATUSES = ['placed', 'accepted', 'dispatched', 'delivered', 'cancelled', 'failed'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <BackButton fallback="/admin/orders" iconColor="#ba1a1a" />
        <View style={styles.headerTitleWrap}>
           <Text style={styles.headerTitle}>Order Details</Text>
           <Text style={styles.headerSub}>Admin Oversight: #{order.id}</Text>
        </View>
      </View>

      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ba1a1a']} />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
           <Text style={styles.sectionLabel}>ORDER STATUS</Text>
           <View style={styles.statusRow}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusValue}>{order.status.toUpperCase()}</Text>
              </View>
              <TouchableOpacity style={styles.overrideBtn} onPress={() => setOverrideModalOpen(true)}>
                 <Ionicons name="shield-half-outline" size={18} color="white" />
                 <Text style={styles.overrideBtnText}>Force Change</Text>
              </TouchableOpacity>
           </View>
        </View>

        <View style={styles.card}>
           <Text style={styles.sectionLabel}>SHOP & CUSTOMER</Text>
           <View style={styles.infoRow}>
              <Ionicons name="business" size={20} color="#64748b" />
              <View>
                 <Text style={styles.infoLabel}>Shop</Text>
                 <Text style={styles.infoVal}>{order.shop_name}</Text>
              </View>
           </View>
           <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color="#64748b" />
              <View>
                 <Text style={styles.infoLabel}>Customer</Text>
                 <Text style={styles.infoVal}>{order.customer_name} ({order.customer_phone})</Text>
              </View>
           </View>
        </View>

        <View style={styles.card}>
           <Text style={styles.sectionLabel}>BILLING</Text>
           <View style={styles.billRow}>
              <Text style={styles.billLabel}>Total Payable</Text>
              <Text style={styles.billVal}>₹{order.payable_amount}</Text>
           </View>
           <View style={styles.billRow}>
              <Text style={styles.billLabel}>Payment Method</Text>
              <Text style={styles.billVal}>{order.payment_method.toUpperCase()}</Text>
           </View>
           <View style={styles.billRow}>
              <Text style={styles.billLabel}>Payment Status</Text>
              <Text style={styles.billVal}>{order.payment_status.toUpperCase()}</Text>
           </View>
        </View>

        {order.status_history && (
           <View style={styles.card}>
              <Text style={styles.sectionLabel}>STATUS HISTORY</Text>
              {order.status_history.map((h: any, i: number) => (
                <View key={i} style={styles.timelineItem}>
                   <Text style={styles.timelineStatus}>{h.status.toUpperCase()}</Text>
                   <Text style={styles.timelineTime}>{new Date(h.created_at).toLocaleString()}</Text>
                </View>
              ))}
           </View>
        )}
      </ScrollView>

      {/* OVERRIDE MODAL */}
      <Modal visible={isOverrideModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                 <Text style={styles.modalTitle}>Status Override</Text>
                 <TouchableOpacity onPress={() => setOverrideModalOpen(false)}>
                    <Ionicons name="close" size={24} color="#64748b" />
                 </TouchableOpacity>
              </View>

              <Text style={styles.modalSub}>Select a new status to force upon this order. Use this tool only for emergency resolutions.</Text>

              <Text style={styles.fieldLabel}>Select Target Status</Text>
              <View style={styles.statusGrid}>
                 {STATUSES.map((s) => (
                   <TouchableOpacity 
                     key={s} 
                     style={[styles.statusOption, newStatus === s && styles.statusOptionActive]}
                     onPress={() => setNewStatus(s)}
                   >
                     <Text style={[styles.statusOptionText, newStatus === s && styles.statusOptionTextActive]}>{s.toUpperCase()}</Text>
                   </TouchableOpacity>
                 ))}
              </View>

              <Text style={styles.fieldLabel}>Reason for Override</Text>
              <TextInput 
                style={styles.input}
                value={overrideReason}
                onChangeText={setOverrideReason}
                placeholder="e.g. Payment verified manually / Accidental cancellation"
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity 
                style={[styles.confirmBtn, isOverriding && { opacity: 0.7 }]} 
                onPress={handleOverride}
                disabled={isOverriding}
              >
                 {isOverriding ? <ActivityIndicator color="white" /> : <Text style={styles.confirmBtnText}>Confirm Status Change</Text>}
              </TouchableOpacity>
           </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#64748b', marginBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitleWrap: { marginLeft: 16 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  headerSub: { fontSize: 11, color: '#64748b', marginTop: 1 },
  scrollContent: { padding: 16 },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  statusValue: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  overrideBtn: { backgroundColor: '#ba1a1a', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  overrideBtnText: { color: 'white', fontWeight: '800', fontSize: 13 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  infoLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  infoVal: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginTop: 1 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  billLabel: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  billVal: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  timelineItem: { borderLeftWidth: 2, borderLeftColor: '#f1f5f9', paddingLeft: 16, paddingBottom: 16, marginLeft: 8 },
  timelineStatus: { fontSize: 13, fontWeight: '800', color: '#1e293b' },
  timelineTime: { fontSize: 11, color: '#94a3b8', marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  modalSub: { fontSize: 13, color: '#64748b', lineHeight: 18, marginBottom: 24 },
  fieldLabel: { fontSize: 13, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  statusOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  statusOptionActive: { backgroundColor: '#ba1a1a', borderColor: '#ba1a1a' },
  statusOptionText: { fontSize: 11, fontWeight: '800', color: '#64748b' },
  statusOptionTextActive: { color: 'white' },
  input: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, fontSize: 14, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0', textAlignVertical: 'top' },
  confirmBtn: { backgroundColor: '#0f172a', borderRadius: 18, paddingVertical: 18, alignItems: 'center', marginTop: 24, marginBottom: 12 },
  confirmBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
});
