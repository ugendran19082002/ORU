import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

import { useAppTheme } from '@/providers/ThemeContext';
import { BackButton } from '@/components/ui/BackButton';
import { Logo } from '@/components/ui/Logo';
import { authApi } from '@/api/authApi';
import { getOriginalDeviceId } from '@/utils/device';
import { useAppSession } from '@/providers/AppSessionProvider';
import { Radius, Shadow } from '@/constants/theme';

const OTP_LENGTH = 6;

type Step = 'enter_phone' | 'verify_otp' | 'done';

export default function ForgotPinScreen() {
  const { colors, isDark } = useAppTheme();
  const router = useRouter();
  const { signIn } = useAppSession();
  const params = useLocalSearchParams<{ phone?: string }>();

  const [step, setStep] = useState<Step>(params.phone ? 'verify_otp' : 'enter_phone');
  const [phone, setPhone] = useState(params.phone?.replace('+91', '') ?? '');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpType, setOtpType] = useState<'sms' | 'email'>('sms');
  const [emailHint, setEmailHint] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Auto-send OTP if phone was passed in (came from quick-login forgot-pin link)
  useEffect(() => {
    if (params.phone && step === 'verify_otp') {
      sendOtp(params.phone.replace('+91', ''));
    }
  }, []);

  const sendOtp = async (targetPhone: string) => {
    setLoading(true);
    try {
      const deviceId = await getOriginalDeviceId();
      const res = await authApi.sendOtp(`+91${targetPhone}`, deviceId, 'forgot_pin');
      const type = res.data?.otp_type ?? 'sms';
      const hint = res.data?.email_hint ?? '';
      setOtpType(type);
      setEmailHint(hint);
      setStep('verify_otp');
      setResendTimer(30);
      Toast.show({
        type: 'success',
        text1: 'OTP Sent',
        text2: type === 'email' ? `Code sent to ${hint}` : `Code sent to +91${targetPhone}`,
      });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.message || 'Could not send OTP.' });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) return;
    setLoading(true);
    try {
      const deviceId = await getOriginalDeviceId();
      const response = await authApi.verifyOtp(`+91${phone}`, code, deviceId);
      if (response.status === 1) {
        await signIn({
          user: response.data.user,
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
          nextStep: response.data.next_step,
        });
        // Go to security-setup in forgot-pin mode to reset the PIN
        router.replace({ pathname: '/security-setup' as any, params: { is_forgot_pin: '1' } });
      } else {
        throw new Error(response.message || 'Invalid OTP');
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Verification Failed', text2: err?.response?.data?.message || err?.message || 'Please check your OTP.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val: string, idx: number) => {
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < OTP_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const accent = '#005d90';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <StatusBar style={isDark ? 'light' : 'dark'} />

          {/* HEADER */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <BackButton fallback="/auth/quick-login" iconColor={accent} />
            <View style={styles.brandRow}>
              <Logo size="sm" />
              <Text style={[styles.brandName, { color: colors.text }]}>ThanniGo</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.body}>
            {/* ICON */}
            <View style={[styles.iconCircle, { backgroundColor: isDark ? '#0f2d42' : '#e0f0ff' }]}>
              <Ionicons name="lock-open-outline" size={36} color={accent} />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
              {step === 'enter_phone' ? 'Reset Your PIN' : 'Verify OTP'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {step === 'enter_phone'
                ? 'Enter your registered mobile number to receive a verification code.'
                : otpType === 'email'
                  ? `Enter the 6-digit code sent to your email\n${emailHint}`
                  : `Enter the 6-digit code sent to\n+91 ${phone.slice(0, 5)}${'*'.repeat(5)}`}
            </Text>
            {step === 'verify_otp' && otpType === 'email' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20, backgroundColor: accent + '18', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
                <Ionicons name="mail-outline" size={14} color={accent} />
                <Text style={{ fontSize: 12, color: accent, fontWeight: '600' }}>Sent via email to save SMS cost</Text>
              </View>
            )}

            {step === 'enter_phone' ? (
              <>
                <View style={[styles.phoneBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Text style={[styles.prefix, { color: colors.muted }]}>+91</Text>
                  <TextInput
                    style={[styles.phoneInput, { color: colors.text }]}
                    placeholder="Mobile number"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={setPhone}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, loading || phone.length < 10 ? { opacity: 0.5 } : {}]}
                  onPress={() => sendOtp(phone)}
                  disabled={loading || phone.length < 10}
                >
                  <LinearGradient colors={['#005d90', '#0077b6']} style={styles.btnGrad}>
                    <Text style={styles.btnText}>{loading ? 'Sending...' : 'Send OTP'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.otpRow}>
                  {otp.map((digit, idx) => (
                    <TextInput
                      key={idx}
                      ref={(r) => { inputRefs.current[idx] = r; }}
                      style={[styles.otpBox, { backgroundColor: colors.inputBg, borderColor: digit ? accent : colors.border, color: colors.text }]}
                      value={digit}
                      onChangeText={(v) => handleOtpChange(v, idx)}
                      onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, loading || otp.join('').length < OTP_LENGTH ? { opacity: 0.5 } : {}]}
                  onPress={verifyOtp}
                  disabled={loading || otp.join('').length < OTP_LENGTH}
                >
                  <LinearGradient colors={['#10b981', '#059669']} style={styles.btnGrad}>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={styles.btnText}>{loading ? 'Verifying...' : 'Verify & Reset PIN'}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {resendTimer > 0 ? (
                  <Text style={[styles.resendTimer, { color: colors.muted }]}>Resend in {resendTimer}s</Text>
                ) : (
                  <TouchableOpacity onPress={() => sendOtp(phone)} disabled={loading}>
                    <Text style={[styles.resendLink, { color: accent }]}>Resend OTP</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </SafeAreaView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 18, fontWeight: '900' },

  body: { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 40 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  title: { fontSize: 26, fontWeight: '900', marginBottom: 10, letterSpacing: -0.4 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },

  phoneBox: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    borderRadius: Radius.lg, borderWidth: 1.5, paddingHorizontal: 16, height: 56, marginBottom: 20,
  },
  prefix: { fontSize: 16, fontWeight: '700', marginRight: 10 },
  phoneInput: { flex: 1, fontSize: 18, fontWeight: '600', letterSpacing: 1 },

  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  otpBox: {
    width: 46, height: 56, borderRadius: 14, borderWidth: 2,
    fontSize: 22, fontWeight: '800',
  },

  primaryBtn: { width: '100%', borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  btnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  btnText: { color: 'white', fontSize: 16, fontWeight: '800' },

  resendTimer: { marginTop: 20, fontSize: 13 },
  resendLink: { marginTop: 20, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
});
