import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity,
  Dimensions, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator } from 'react-native';
import { useSecurityStore } from '@/stores/securityStore';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const ACCENT = '#005d90';

export type PinEntryModalProps = {
  visible: boolean;
  onSuccess: (pin: string) => Promise<void>;
  onCancel?: () => void;
  onForgotPin?: () => void;
  title?: string;
  mode?: 'verify' | 'set';
  pinLength?: 4 | 6;
};

export const PinEntryModal: React.FC<PinEntryModalProps> = ({
  visible,
  onSuccess,
  onCancel,
  onForgotPin,
  title = 'Enter PIN',
  mode = 'verify',
  pinLength = 4,
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [lockedSeconds, setLockedSeconds] = useState(0);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const { isBiometricsEnabled, authenticateBiometrics } = useSecurityStore();

  // Lockout countdown
  useEffect(() => {
    if (lockedSeconds <= 0) return;
    const t = setInterval(() => {
      setLockedSeconds((s) => {
        if (s <= 1) { clearInterval(t); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [lockedSeconds]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setPin('');
      setConfirmPin('');
      setStep('enter');
      setError('');
      setIsLoading(false);
      setAttemptsLeft(null);
    } else if (mode === 'verify' && isBiometricsEnabled) {
      triggerBiometrics();
    }
  }, [visible]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const triggerBiometrics = async () => {
    const success = await authenticateBiometrics();
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await onSuccess('');
    }
  };

  const handleKey = (key: string) => {
    if (isLoading || lockedSeconds > 0) return;
    if (pin.length >= pinLength) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = pin + key;
    setPin(next);
    setError('');
    if (next.length === pinLength) handleComplete(next);
  };

  const handleDelete = () => {
    if (isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPin((p) => p.slice(0, -1));
    setError('');
  };

  const handleComplete = async (finalPin: string) => {
    if (mode === 'set') {
      if (step === 'enter') {
        setConfirmPin(finalPin);
        setPin('');
        setStep('confirm');
      } else {
        if (finalPin === confirmPin) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setIsLoading(true);
          try { await onSuccess(finalPin); } finally { setIsLoading(false); }
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          shake();
          setError('PINs do not match. Try again.');
          setPin('');
          setConfirmPin('');
          setStep('enter');
        }
      }
      return;
    }

    // verify mode
    setIsLoading(true);
    try {
      await onSuccess(finalPin);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAttemptsLeft(null);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shake();
      setPin('');

      const data = err?.response?.data?.error?.details ?? err?.response?.data?.data ?? {};
      const code = err?.response?.data?.error?.code ?? '';

      if (code === 'PIN_LOCKED') {
        setLockedSeconds(data.locked_seconds ?? 300);
        setError('');
        setAttemptsLeft(0);
      } else {
        const remaining = data.attempts_remaining ?? null;
        setAttemptsLeft(remaining);
        setError(err?.response?.data?.message || err?.message || 'Incorrect PIN');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const dots = Array.from({ length: pinLength }, (_, i) => {
    const filled = pin.length > i;
    const isError = !!error || lockedSeconds > 0;
    return (
      <View
        key={i}
        style={[
          styles.dot,
          filled && styles.dotFilled,
          isError && filled && styles.dotError,
        ]}
      />
    );
  });

  const lockedMin = Math.floor(lockedSeconds / 60);
  const lockedSec = lockedSeconds % 60;
  const lockedLabel = lockedSeconds > 0
    ? `${lockedMin}:${String(lockedSec).padStart(2, '0')}`
    : '';

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.headerRow}>
            {onCancel ? (
              <TouchableOpacity style={styles.headerBtn} onPress={onCancel}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            ) : <View style={styles.headerBtn} />}

            <Text style={styles.title}>
              {step === 'confirm' ? 'Confirm PIN' : title}
            </Text>

            {mode === 'verify' && isBiometricsEnabled ? (
              <TouchableOpacity style={styles.headerBtn} onPress={triggerBiometrics}>
                <Ionicons name="finger-print" size={24} color={ACCENT} />
              </TouchableOpacity>
            ) : <View style={styles.headerBtn} />}
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            {step === 'confirm'
              ? 'Re-enter your PIN to confirm'
              : mode === 'set'
              ? `Choose a ${pinLength}-digit PIN for your account`
              : 'Enter your PIN to continue'}
          </Text>

          {/* Lockout banner */}
          {lockedSeconds > 0 && (
            <View style={styles.lockBanner}>
              <Ionicons name="lock-closed" size={16} color="#b45309" />
              <Text style={styles.lockText}>
                Too many attempts. Try again in {lockedLabel}
              </Text>
            </View>
          )}

          {/* Dots */}
          <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
            {isLoading
              ? <ActivityIndicator color={ACCENT} size="large" />
              : dots}
          </Animated.View>

          {/* Error / attempts left */}
          {!!error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          {attemptsLeft !== null && attemptsLeft > 0 && !error && (
            <Text style={styles.attemptsText}>{attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining</Text>
          )}

          {/* Keypad */}
          <View style={styles.keypad}>
            {[[1,2,3],[4,5,6],[7,8,9]].map((row, ri) => (
              <View key={ri} style={styles.row}>
                {row.map((k) => (
                  <TouchableOpacity
                    key={k}
                    style={[styles.key, (isLoading || lockedSeconds > 0) && styles.keyDisabled]}
                    onPress={() => handleKey(k.toString())}
                    disabled={isLoading || lockedSeconds > 0}
                  >
                    <Text style={styles.keyText}>{k}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
            <View style={styles.row}>
              {/* Forgot PIN (verify mode only) */}
              {mode === 'verify' && onForgotPin ? (
                <TouchableOpacity style={styles.key} onPress={onForgotPin}>
                  <Text style={styles.forgotText}>Forgot?</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.key} />
              )}
              <TouchableOpacity
                style={[styles.key, (isLoading || lockedSeconds > 0) && styles.keyDisabled]}
                onPress={() => handleKey('0')}
                disabled={isLoading || lockedSeconds > 0}
              >
                <Text style={styles.keyText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.key} onPress={handleDelete} disabled={isLoading}>
                <Ionicons name="backspace-outline" size={24} color="#334155" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingTop: 24, paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', paddingHorizontal: 20, marginBottom: 6,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 24, textAlign: 'center' },

  lockBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fffbeb', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    marginBottom: 16, borderWidth: 1, borderColor: '#fcd34d',
  },
  lockText: { fontSize: 13, fontWeight: '700', color: '#b45309' },

  dotsRow: { flexDirection: 'row', gap: 16, marginBottom: 12, minHeight: 28 },
  dot: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: '#cbd5e1',
  },
  dotFilled: { backgroundColor: ACCENT, borderColor: ACCENT },
  dotError: { backgroundColor: '#ef4444', borderColor: '#ef4444' },

  errorText: { color: '#ef4444', fontSize: 13, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  attemptsText: { color: '#f59e0b', fontSize: 12, fontWeight: '700', marginBottom: 16 },

  keypad: { width: width * 0.78, marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  key: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },
  keyDisabled: { opacity: 0.4 },
  keyText: { fontSize: 26, fontWeight: '700', color: '#0f172a' },
  forgotText: { fontSize: 11, fontWeight: '800', color: ACCENT, textAlign: 'center' },
});
