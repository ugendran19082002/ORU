import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Image,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { deliveryApi } from '@/api/deliveryApi';

import { useDeliveryStore } from '@/stores/deliveryStore';
import { useOrderStore } from '@/stores/orderStore';
import { Shadow, thannigoPalette, roleAccent, roleSurface } from '@/constants/theme';

const DELIVERY_ACCENT = roleAccent.delivery;
const DELIVERY_SURF = roleSurface.delivery;

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
  const { taskId, imageUri } = useLocalSearchParams<{ taskId: string; imageUri: string }>();
  const { tasks, currentTaskId, updateTaskStatus, assignCurrentTask } = useDeliveryStore();
  const { updateStatus: updateOrderStatus } = useOrderStore();
 
  React.useEffect(() => {
    if (taskId) assignCurrentTask(taskId);
  }, [taskId]);
 
  const task = tasks.find((item) => item.id === (taskId || currentTaskId)) ?? tasks[0];
  
  const [mode, setMode] = useState<'success' | 'failed'>('success');
  const [selectedReason, setSelectedReason] = useState<FailReason | null>(null);
  const [otherText, setOtherText] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [proofUri, setProofUri] = useState<string | null>(imageUri || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orderId = '#9831';
  const customerName = 'Ananya Sharma';
  const earnings = '₹48';

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Permission Denied',
        text2: 'Sorry, we need camera permissions to capture delivery proof!'
      });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.5,
    });
    if (!result.canceled) {
      setProofUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (mode === 'success' && !proofUri) {
      Toast.show({ type: 'error', text1: 'Photo Required', text2: 'Please take a proof-of-delivery photo.' });
      return;
    }
    if (mode === 'failed' && !selectedReason) {
      Toast.show({ type: 'error', text1: 'Select Reason', text2: 'Please choose a reason for the failed delivery.' });
      return;
    }
    if (mode === 'failed' && !rescheduleSlot.trim()) {
      Toast.show({ type: 'error', text1: 'Reschedule Required', text2: 'Please suggest a next delivery slot.' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (!task) throw new Error("No active delivery task found");
      const assignmentId = Number(taskId || currentTaskId); // assuming taskId maps to assignment_id

      let podUrl: string | undefined = undefined;

      if (mode === 'success' && proofUri) {
        // 1. Upload POD photo
        const filename = proofUri.split('/').pop() ?? 'pod.jpg';
        const uploadResult = await deliveryApi.uploadPod({
          uri: proofUri,
          name: filename,
          type: 'image/jpeg',
        });
        podUrl = uploadResult.data?.url ?? proofUri;
      }

      // 2. Determine Failed Reason
      const reasonLabel = selectedReason === 'other' ? otherText : FAIL_REASONS.find(r => r.id === selectedReason)?.label;
      const finalFailedReason = mode === 'failed' ? `${reasonLabel} (Suggested: ${rescheduleSlot})` : undefined;

      // 3. Submit to backend
      await deliveryApi.submitPod({
        assignment_id: assignmentId,
        status: mode === 'success' ? 'delivered' : 'failed',
        pod_photo_url: podUrl,
        failed_reason: finalFailedReason,
      });

      // 4. Update local state
      updateTaskStatus(task.id, mode === 'success' ? 'completed' : 'cancelled');
      updateOrderStatus(task.orderId, mode === 'success' ? 'completed' : 'cancelled');

      Toast.show({
        type: mode === 'success' ? 'success' : 'info',
        text1: mode === 'success' ? '✅ Trip Complete!' : '⚠️ Delivery Reported',
        text2: mode === 'success' ? `Order ${task.orderId} marked delivered.` : `Failed delivery reported. Rescheduled for: ${rescheduleSlot}`,
      });

      router.replace('/delivery' as any);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: err?.message ?? 'Please check your connection and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
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
            <Ionicons name="checkmark-circle-outline" size={20} color={mode === 'success' ? thannigoPalette.deliveryGreen : thannigoPalette.neutral} />
            <Text style={[styles.modeBtnText, mode === 'success' && { color: thannigoPalette.deliveryGreen }]}>Delivered</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'failed' && styles.modeBtnFailed]}
            onPress={() => setMode('failed')}
          >
            <Ionicons name="close-circle-outline" size={20} color={mode === 'failed' ? thannigoPalette.error : thannigoPalette.neutral} />
            <Text style={[styles.modeBtnText, mode === 'failed' && { color: thannigoPalette.error }]}>Failed / Reschedule</Text>
          </TouchableOpacity>
        </View>

        {/* SUCCESS VIEW */}
        {mode === 'success' && (
          <View style={styles.successCard}>
            <LinearGradient colors={[thannigoPalette.deliveryGreen, '#388e3c']} style={styles.successGrad}>
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
            <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
              <Text style={styles.sectionTitle}>Delivery Proof (Required)</Text>
              {proofUri ? (
                <View style={styles.proofImageWrapper}>
                  <Image source={{ uri: proofUri }} style={styles.proofImage} />
                  <TouchableOpacity style={styles.retakeBtn} onPress={pickImage}>
                    <Ionicons name="camera-reverse" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.proofBtn} onPress={pickImage}>
                  <Ionicons name="camera" size={24} color={DELIVERY_ACCENT} />
                  <Text style={styles.proofBtnText}>Take Photo</Text>
                </TouchableOpacity>
              )}
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
                  <Ionicons name={r.icon as any} size={18} color={selectedReason === r.id ? thannigoPalette.error : thannigoPalette.neutral} />
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
              <Ionicons name="alert-circle-outline" size={18} color={thannigoPalette.warning} />
              <Text style={styles.failNoteText}>
                Customer and shop will be notified of the failed attempt and new slot.
              </Text>
            </View>
          </>
        )}

        {/* SUBMIT */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isSubmitting}>
          <LinearGradient
            colors={mode === 'success' ? [thannigoPalette.deliveryGreen, '#388e3c'] : [thannigoPalette.error, '#ef4444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.submitBtnGrad, isSubmitting && { opacity: 0.7 }]}
          >
            {isSubmitting ? (
              <Text style={styles.submitBtnText}>Processing...</Text>
            ) : (
              <>
                <Ionicons name={mode === 'success' ? 'checkmark-done' : 'flag'} size={20} color="white" />
                <Text style={styles.submitBtnText}>
                  {mode === 'success' ? 'Complete Trip' : 'Report & Reschedule'}
                </Text>
              </>
            )}
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
  container: { flex: 1, backgroundColor: thannigoPalette.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: thannigoPalette.surface, borderBottomWidth: 1, borderBottomColor: thannigoPalette.borderSoft,
  },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: thannigoPalette.background, alignItems: 'center', justifyContent: 'center', ...Shadow.xs },
  headerTitle: { fontSize: 20, fontWeight: '900', color: thannigoPalette.darkText },
  content: { padding: 20, gap: 14, paddingBottom: 40 },

  orderCard: { backgroundColor: thannigoPalette.surface, borderRadius: 18, padding: 16, ...Shadow.xs },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  orderId: { fontSize: 12, fontWeight: '800', color: DELIVERY_ACCENT },
  customerName: { fontSize: 16, fontWeight: '800', color: thannigoPalette.darkText },
  orderAddress: { fontSize: 12, color: thannigoPalette.neutral, fontWeight: '500' },

  modeRow: { flexDirection: 'row', backgroundColor: thannigoPalette.background, borderRadius: 16, padding: 4 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  modeBtnSuccess: { backgroundColor: thannigoPalette.deliveryGreenLight },
  modeBtnFailed: { backgroundColor: thannigoPalette.dangerSoft },
  modeBtnText: { fontSize: 13, fontWeight: '700', color: thannigoPalette.neutral },

  successCard: { backgroundColor: thannigoPalette.surface, borderRadius: 20, overflow: 'hidden', ...Shadow.sm },
  successGrad: { padding: 28, alignItems: 'center', gap: 10, overflow: 'hidden' },
  successDecor: { position: 'absolute', right: -20, top: -20 },
  successTitle: { fontSize: 22, fontWeight: '900', color: 'white' },
  successSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  earningRow: { flexDirection: 'row', paddingVertical: 18, paddingHorizontal: 20 },
  earningItem: { flex: 1, alignItems: 'center' },
  earningLabel: { fontSize: 11, color: thannigoPalette.neutral, fontWeight: '600', marginBottom: 4 },
  earningValue: { fontSize: 18, fontWeight: '900', color: thannigoPalette.darkText },
  earningDivider: { width: 1, backgroundColor: thannigoPalette.borderSoft },

  proofBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: DELIVERY_SURF, padding: 18, borderRadius: 16, marginTop: 10, borderWidth: 2, borderColor: DELIVERY_ACCENT + '40', borderStyle: 'dashed' },
  proofBtnText: { color: DELIVERY_ACCENT, fontSize: 15, fontWeight: '800' },
  proofImageWrapper: { marginTop: 10, borderRadius: 16, overflow: 'hidden', height: 160 },
  proofImage: { width: '100%', height: '100%' },
  retakeBtn: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 12 },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: thannigoPalette.darkText, letterSpacing: -0.3 },

  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: thannigoPalette.surface, borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: thannigoPalette.borderSoft },
  reasonRowActive: { borderColor: '#f87171', backgroundColor: thannigoPalette.dangerSoft },
  reasonIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: thannigoPalette.background, alignItems: 'center', justifyContent: 'center' },
  reasonIconActive: { backgroundColor: thannigoPalette.dangerSoft },
  reasonText: { flex: 1, fontSize: 13, fontWeight: '700', color: thannigoPalette.darkText },
  reasonTextActive: { color: thannigoPalette.error },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: thannigoPalette.borderSoft, alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: thannigoPalette.error },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: thannigoPalette.error },

  otherInput: {
    backgroundColor: thannigoPalette.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: thannigoPalette.borderSoft,
    fontSize: 14, color: thannigoPalette.darkText, minHeight: 80, textAlignVertical: 'top',
  },
  rescheduleInput: {
    backgroundColor: thannigoPalette.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: thannigoPalette.borderSoft,
    fontSize: 14, color: thannigoPalette.darkText,
  },
  failNoteCard: { flexDirection: 'row', gap: 10, backgroundColor: '#FFF8E1', borderRadius: 14, padding: 14, alignItems: 'flex-start' },
  failNoteText: { flex: 1, fontSize: 12, color: thannigoPalette.warning, lineHeight: 17, fontWeight: '600' },

  submitBtn: { borderRadius: 18, overflow: 'hidden', marginTop: 4 },
  submitBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },

  dashboardBtn: { paddingVertical: 14, alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: thannigoPalette.borderSoft, backgroundColor: thannigoPalette.surface },
  dashboardBtnText: { fontSize: 14, fontWeight: '700', color: thannigoPalette.neutral },
});


