import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';

import { useDeliveryStore } from '@/stores/deliveryStore';
import { useOrderStore } from '@/stores/orderStore';

type FailReason = 'not_home' | 'wrong_address' | 'refused' | 'cant_carry' | 'other';

const FAIL_REASONS: { id: FailReason; label: string; icon: string }[] = [
  { id: 'not_home', label: 'Customer not at home', icon: 'home-outline' },
  { id: 'wrong_address', label: 'Wrong / unclear address', icon: 'location-outline' },
  { id: 'refused', label: 'Customer refused delivery', icon: 'close-circle-outline' },
  { id: 'cant_carry', label: 'Unable to carry to floor', icon: 'barbell-outline' },
  { id: 'other', label: 'Other reason', icon: 'ellipsis-horizontal-outline' },
];

export default function DeliveryCompleteScreen() {
  const router = useRouter();
  const { tasks, currentTaskId, updateTaskStatus } = useDeliveryStore();
  const { updateStatus: updateOrderStatus } = useOrderStore();
  const task = tasks.find((item) => item.id === currentTaskId) ?? tasks[0];
  
  const [mode, setMode] = useState<'success' | 'failed'>('success');
  const [selectedReason, setSelectedReason] = useState<FailReason | null>(null);
  const [otherText, setOtherText] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');

  const orderId = '#9831';
  const customerName = 'Ananya Sharma';
  const earnings = '₹48';

  const handleSubmit = () => {
    if (mode === 'failed' && !selectedReason) {
      Alert.alert('Select Reason', 'Please choose a reason for the failed delivery.');
      return;
    }
    if (mode === 'failed' && !rescheduleSlot.trim()) {
      Alert.alert('Reschedule Required', 'Please suggest a next delivery slot.');
      return;
    }
    if (task) {
      const finalStatus = mode === 'success' ? 'completed' : 'cancelled';
      updateTaskStatus(task.id, finalStatus);
      // Sync with orderStore (In real app, backend handles this sync)
      updateOrderStatus(task.orderId, finalStatus);
    }

    Alert.alert(
      mode === 'success' ? '✅ Trip Complete!' : '⚠️ Delivery Reported',
      mode === 'success'
        ? `Order ${task?.orderId ?? orderId} marked delivered. Earnings ${earnings} added to your wallet.`
        : `Failed delivery reported. Rescheduled for: ${rescheduleSlot}`,
      [{ text: 'OK', onPress: () => router.replace('/delivery' as any) }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <BackButton fallback="/delivery" />
        <Text style={styles.headerTitle}>Trip Summary</Text>
      </View>


      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ORDER CARD */}
        <View style={styles.orderCard}>
          <View style={styles.orderRow}>
            <Text style={styles.orderId}>{task?.orderId ?? orderId}</Text>
            <Text style={styles.customerName}>{task?.customerName ?? customerName}</Text>
          </View>
          <Text style={styles.orderAddress}>{task?.address ?? 'Customer Hub Address'}</Text>
        </View>

        {/* MODE TOGGLE */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'success' && styles.modeBtnSuccess]}
            onPress={() => setMode('success')}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={mode === 'success' ? '#2e7d32' : '#707881'} />
            <Text style={[styles.modeBtnText, mode === 'success' && { color: '#2e7d32' }]}>Delivered</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'failed' && styles.modeBtnFailed]}
            onPress={() => setMode('failed')}
          >
            <Ionicons name="close-circle-outline" size={20} color={mode === 'failed' ? '#c62828' : '#707881'} />
            <Text style={[styles.modeBtnText, mode === 'failed' && { color: '#c62828' }]}>Failed / Reschedule</Text>
          </TouchableOpacity>
        </View>

        {/* SUCCESS VIEW */}
        {mode === 'success' && (
          <View style={styles.successCard}>
            <LinearGradient colors={['#2e7d32', '#388e3c']} style={styles.successGrad}>
              <Ionicons name="checkmark-circle" size={64} color="rgba(255,255,255,0.2)" style={styles.successDecor} />
              <Ionicons name="checkmark-circle" size={52} color="white" />
              <Text style={styles.successTitle}>Delivery Successful</Text>
              <Text style={styles.successSub}>OTP verified · Payment captured</Text>
            </LinearGradient>

            <View style={styles.earningRow}>
              <View style={styles.earningItem}>
                <Text style={styles.earningLabel}>Trip Earning</Text>
                <Text style={styles.earningValue}>{earnings}</Text>
              </View>
              <View style={styles.earningDivider} />
              <View style={styles.earningItem}>
                <Text style={styles.earningLabel}>Delivery Time</Text>
                <Text style={styles.earningValue}>11 min</Text>
              </View>
              <View style={styles.earningDivider} />
              <View style={styles.earningItem}>
                <Text style={styles.earningLabel}>Distance</Text>
                <Text style={styles.earningValue}>1.2 km</Text>
              </View>
            </View>
          </View>
        )}

        {/* FAILED VIEW */}
        {mode === 'failed' && (
          <>
            <Text style={styles.sectionTitle}>Failure Reason</Text>
            {FAIL_REASONS.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[styles.reasonRow, selectedReason === r.id && styles.reasonRowActive]}
                onPress={() => setSelectedReason(r.id)}
              >
                <View style={[styles.reasonIcon, selectedReason === r.id && styles.reasonIconActive]}>
                  <Ionicons name={r.icon as any} size={18} color={selectedReason === r.id ? '#c62828' : '#707881'} />
                </View>
                <Text style={[styles.reasonText, selectedReason === r.id && styles.reasonTextActive]}>{r.label}</Text>
                <View style={[styles.radioOuter, selectedReason === r.id && styles.radioOuterActive]}>
                  {selectedReason === r.id && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}

            {selectedReason === 'other' && (
              <TextInput
                style={styles.otherInput}
                placeholder="Describe the issue..."
                value={otherText}
                onChangeText={setOtherText}
                multiline
                numberOfLines={3}
              />
            )}

            <Text style={styles.sectionTitle}>Suggest Reschedule Slot</Text>
            <TextInput
              style={styles.rescheduleInput}
              placeholder="e.g. Tomorrow 10 AM, or Apr 11 evening"
              value={rescheduleSlot}
              onChangeText={setRescheduleSlot}
            />

            <View style={styles.failNoteCard}>
              <Ionicons name="alert-circle-outline" size={18} color="#b45309" />
              <Text style={styles.failNoteText}>
                Customer and shop will be notified of the failed attempt and new slot.
              </Text>
            </View>
          </>
        )}

        {/* SUBMIT */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <LinearGradient
            colors={mode === 'success' ? ['#2e7d32', '#388e3c'] : ['#c62828', '#ef4444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitBtnGrad}
          >
            <Ionicons name={mode === 'success' ? 'checkmark-done' : 'flag'} size={20} color="white" />
            <Text style={styles.submitBtnText}>
              {mode === 'success' ? 'Complete Trip' : 'Report & Reschedule'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dashboardBtn}
          onPress={() => router.replace('/delivery' as any)}
        >
          <Text style={styles.dashboardBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  content: { padding: 20, gap: 14, paddingBottom: 40 },

  orderCard: { backgroundColor: 'white', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  orderId: { fontSize: 12, fontWeight: '800', color: '#005d90' },
  customerName: { fontSize: 16, fontWeight: '800', color: '#181c20' },
  orderAddress: { fontSize: 12, color: '#707881', fontWeight: '500' },

  modeRow: { flexDirection: 'row', backgroundColor: '#f1f4f9', borderRadius: 16, padding: 4 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  modeBtnSuccess: { backgroundColor: '#e8f5e9' },
  modeBtnFailed: { backgroundColor: '#ffebee' },
  modeBtnText: { fontSize: 13, fontWeight: '700', color: '#707881' },

  successCard: { backgroundColor: 'white', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  successGrad: { padding: 28, alignItems: 'center', gap: 10, overflow: 'hidden' },
  successDecor: { position: 'absolute', right: -20, top: -20 },
  successTitle: { fontSize: 22, fontWeight: '900', color: 'white' },
  successSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  earningRow: { flexDirection: 'row', paddingVertical: 18, paddingHorizontal: 20 },
  earningItem: { flex: 1, alignItems: 'center' },
  earningLabel: { fontSize: 11, color: '#707881', fontWeight: '600', marginBottom: 4 },
  earningValue: { fontSize: 18, fontWeight: '900', color: '#181c20' },
  earningDivider: { width: 1, backgroundColor: '#f1f4f9' },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#181c20', letterSpacing: -0.3 },

  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: '#e0e2e8' },
  reasonRowActive: { borderColor: '#f87171', backgroundColor: '#fff5f5' },
  reasonIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center' },
  reasonIconActive: { backgroundColor: '#ffebee' },
  reasonText: { flex: 1, fontSize: 13, fontWeight: '700', color: '#181c20' },
  reasonTextActive: { color: '#c62828' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#e0e2e8', alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: '#c62828' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#c62828' },

  otherInput: {
    backgroundColor: 'white', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e0e2e8',
    fontSize: 14, color: '#181c20', minHeight: 80, textAlignVertical: 'top',
  },
  rescheduleInput: {
    backgroundColor: 'white', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: '#e0e2e8',
    fontSize: 14, color: '#181c20',
  },
  failNoteCard: { flexDirection: 'row', gap: 10, backgroundColor: '#fef3c7', borderRadius: 14, padding: 14, alignItems: 'flex-start' },
  failNoteText: { flex: 1, fontSize: 12, color: '#b45309', lineHeight: 17, fontWeight: '600' },

  submitBtn: { borderRadius: 18, overflow: 'hidden', marginTop: 4 },
  submitBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },

  dashboardBtn: { paddingVertical: 14, alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: '#e0e2e8', backgroundColor: 'white' },
  dashboardBtnText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
});
