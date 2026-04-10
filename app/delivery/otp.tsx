import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const CORRECT_OTP = '4829';

export default function DeliveryOtpScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const inputs = useRef<TextInput[]>([]);

  const handleInput = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const updated = [...otp];
    updated[idx] = val.slice(-1);
    setOtp(updated);
    setError('');
    if (val && idx < 3) inputs.current[idx + 1]?.focus();
    if (!val && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const handleVerify = () => {
    Keyboard.dismiss();
    const entered = otp.join('');
    if (entered.length < 4) {
      setError('Please enter all 4 digits.');
      return;
    }
    if (entered !== CORRECT_OTP) {
      setError('Incorrect OTP. Please ask the customer again.');
      setOtp(['', '', '', '']);
      inputs.current[0]?.focus();
      return;
    }
    setVerified(true);
    setTimeout(() => router.push('/delivery/complete' as any), 1200);
  };

  const customerName = 'Ananya Sharma';
  const orderId = '#9831';
  const cans = '1× 20L Can';
  const amount = '₹50 (UPI)';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify OTP</Text>
      </View>

      <View style={styles.content}>
        {/* ORDER INFO */}
        <View style={styles.orderCard}>
          <View style={styles.orderTop}>
            <View style={styles.orderIconWrap}>
              <Ionicons name="person" size={22} color="#005d90" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{customerName}</Text>
              <Text style={styles.orderId}>Order {orderId}</Text>
            </View>
            <View style={styles.amtBadge}>
              <Text style={styles.amtText}>{amount}</Text>
            </View>
          </View>
          <View style={styles.orderDetail}>
            <Ionicons name="water-outline" size={14} color="#707881" />
            <Text style={styles.orderDetailText}>{cans}</Text>
          </View>
        </View>

        {/* OTP INSTRUCTION */}
        <View style={styles.instructionCard}>
          <Ionicons name="information-circle-outline" size={20} color="#005d90" />
          <Text style={styles.instructionText}>
            Ask the customer for their 4-digit delivery OTP. They received it on their order confirmation screen.
          </Text>
        </View>

        {/* OTP INPUT */}
        <Text style={styles.otpLabel}>Enter Customer OTP</Text>
        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => { if (r) inputs.current[i] = r; }}
              style={[
                styles.otpBox,
                digit && styles.otpBoxFilled,
                error && styles.otpBoxError,
                verified && styles.otpBoxSuccess,
              ]}
              value={digit}
              onChangeText={(v) => handleInput(v, i)}
              keyboardType="number-pad"
              maxLength={1}
              textContentType="oneTimeCode"
              selectTextOnFocus
            />
          ))}
        </View>

        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={14} color="#c62828" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {verified && (
          <View style={styles.successRow}>
            <Ionicons name="checkmark-circle" size={16} color="#2e7d32" />
            <Text style={styles.successText}>OTP Verified! Completing order...</Text>
          </View>
        )}

        {/* VERIFY BUTTON */}
        <TouchableOpacity
          style={[styles.verifyBtn, verified && styles.verifyBtnSuccess]}
          onPress={handleVerify}
          disabled={verified}
        >
          <LinearGradient
            colors={verified ? ['#2e7d32', '#388e3c'] : ['#005d90', '#0077b6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.verifyBtnGrad}
          >
            <Ionicons name={verified ? 'checkmark-circle' : 'shield-checkmark-outline'} size={20} color="white" />
            <Text style={styles.verifyBtnText}>{verified ? 'Verified!' : 'Verify & Complete Delivery'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* REPORT ISSUE */}
        <TouchableOpacity
          style={styles.failBtn}
          onPress={() => Alert.alert('Report Issue', 'Mark this delivery as failed?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Mark Failed', style: 'destructive', onPress: () => router.push('/delivery/complete' as any) },
          ])}
        >
          <Ionicons name="warning-outline" size={16} color="#c62828" />
          <Text style={styles.failBtnText}>Customer not available / Failed delivery</Text>
        </TouchableOpacity>
      </View>
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
  content: { flex: 1, padding: 24, gap: 18 },

  orderCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  orderTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  orderIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  customerName: { fontSize: 17, fontWeight: '800', color: '#181c20' },
  orderId: { fontSize: 12, color: '#707881', fontWeight: '600', marginTop: 1 },
  amtBadge: { backgroundColor: '#e8f5e9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  amtText: { fontSize: 13, fontWeight: '800', color: '#2e7d32' },
  orderDetail: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  orderDetailText: { fontSize: 13, color: '#707881', fontWeight: '600' },

  instructionCard: {
    flexDirection: 'row', gap: 10, backgroundColor: '#e0f0ff', borderRadius: 16, padding: 14, alignItems: 'flex-start',
  },
  instructionText: { flex: 1, fontSize: 13, color: '#005d90', lineHeight: 18, fontWeight: '600' },

  otpLabel: { fontSize: 14, fontWeight: '800', color: '#181c20', marginBottom: -6 },
  otpRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  otpBox: {
    width: 68, height: 72, borderRadius: 18,
    borderWidth: 2, borderColor: '#e0e2e8',
    fontSize: 32, fontWeight: '900', color: '#181c20',
    textAlign: 'center', backgroundColor: 'white',
  },
  otpBoxFilled: { borderColor: '#005d90', backgroundColor: '#f0f7ff' },
  otpBoxError: { borderColor: '#f87171', backgroundColor: '#fff5f5' },
  otpBoxSuccess: { borderColor: '#2e7d32', backgroundColor: '#f0fdf4' },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  errorText: { fontSize: 13, color: '#c62828', fontWeight: '600' },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  successText: { fontSize: 13, color: '#2e7d32', fontWeight: '700' },

  verifyBtn: { borderRadius: 18, overflow: 'hidden' },
  verifyBtnSuccess: { opacity: 0.9 },
  verifyBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  verifyBtnText: { color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },

  failBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#fecaca',
    backgroundColor: '#fff5f5',
  },
  failBtnText: { color: '#c62828', fontWeight: '700', fontSize: 13 },
});
