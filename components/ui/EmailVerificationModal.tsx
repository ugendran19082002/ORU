import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '@/providers/ThemeContext';
import { authApi } from '@/api/authApi';
import { Radius, Spacing, Typography, Shadow } from '@/constants/theme';

interface EmailVerificationModalProps {
  visible: boolean;
  email: string;
  onClose: () => void;
  onSuccess: () => void;
}

const OTP_LENGTH = 6;

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({ 
  visible, 
  email, 
  onClose, 
  onSuccess 
}) => {
  const { colors } = useAppTheme();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [timer, setTimer] = useState(0);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (visible && email && timer === 0 && Array.isArray(otp) && otp.every(x => x === '')) {
      handleSendOtp();
    }
  }, [visible]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const getErrorMessage = (err: any): string =>
    err?.response?.data?.message || err?.message || 'Something went wrong.';

  const handleSendOtp = async () => {
    try {
      setSending(true);
      setOtp(Array(OTP_LENGTH).fill(''));
      await authApi.sendEmailVerification(email);
      setTimer(60);
      Toast.show({ type: 'success', text1: 'OTP Sent', text2: 'Please check your email inbox.' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed to Send', text2: getErrorMessage(err) });
      onClose();
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) return;

    try {
      setVerifying(true);
      await authApi.verifyEmailOtp(email, code);
      Toast.show({ type: 'success', text1: 'Verified!', text2: 'Email verified successfully.' });
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = getErrorMessage(err);
      Toast.show({ type: 'error', text1: 'Verification Failed', text2: msg });
      if (msg.toLowerCase().includes('expired')) {
        setOtp(Array(OTP_LENGTH).fill(''));
        setTimer(0);
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleOtpChange = (val: string, index: number) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    card: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: Radius.xl,
      padding: Spacing.xl,
      ...Shadow.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    title: {
      ...Typography.h4,
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: colors.muted,
      marginBottom: Spacing.xl,
    },
    emailHighlight: {
      fontWeight: 'bold',
      color: colors.text,
    },
    otpRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.xl,
    },
    otpBox: {
      width: 42,
      height: 52,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.background,
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
      textAlign: 'center',
    },
    btnActive: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}11`,
    },
    verifyBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: Radius.lg,
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    verifyBtnDisabled: {
      opacity: 0.5,
    },
    verifyBtnText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 16,
    },
    resendRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    resendText: {
      color: colors.primary,
      fontWeight: '600',
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Verify Email</Text>
            <TouchableOpacity onPress={onClose} disabled={verifying}>
              <Ionicons name="close-circle" size={26} color={colors.border} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to <Text style={styles.emailHighlight}>{email}</Text>
          </Text>

          <View style={styles.otpRow}>
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <TextInput
                key={i}
                ref={ref => (inputRefs.current[i] = ref)}
                style={[styles.otpBox, otp[i] ? styles.btnActive : null]}
                value={otp[i]}
                onChangeText={(v) => handleOtpChange(v, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                editable={!verifying}
              />
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.verifyBtn, (otp.join('').length < OTP_LENGTH || verifying) && styles.verifyBtnDisabled]}
            disabled={otp.join('').length < OTP_LENGTH || verifying}
            onPress={handleVerify}
          >
            {verifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyBtnText}>Verify OTP</Text>}
          </TouchableOpacity>

          <View style={styles.resendRow}>
            {sending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : timer > 0 ? (
              <Text style={{ color: colors.muted }}>Resend in {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleSendOtp}>
                <Text style={styles.resendText}>Resend Code</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};
