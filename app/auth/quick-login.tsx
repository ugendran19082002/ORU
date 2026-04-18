import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '@/providers/ThemeContext';
import type { ColorSchemeColors } from '@/providers/ThemeContext';

import { useSecurityStore } from '@/stores/securityStore';
import { useAppSession } from '@/hooks/use-app-session';
import { PinEntryModal } from '@/components/security/PinEntryModal';
import { Logo } from '@/components/ui/Logo';

const LAST_PHONE_KEY = 'thannigo_last_phone_v1';
const LAST_NAME_KEY = 'thannigo_last_name_v1';

export default function QuickLoginScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { signIn } = useAppSession();
  const {
    isBiometricsEnabled,
    isPinEnabled,
    loginWithPin,
    loginWithBiometric,
  } = useSecurityStore();

  const params = useLocalSearchParams<{ phone?: string; has_pin?: string }>();
  const [userName, setUserName] = useState('User');
  const [phone, setPhone] = useState(params.phone ?? '');
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // has_pin param = backend confirmed PIN exists (used before signIn syncs the store)
  const showPin = isPinEnabled || params.has_pin === '1';
  const showBiometric = isBiometricsEnabled;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();

    const loadIdentity = async () => {
      const [name, storedPhone] = await Promise.all([
        SecureStore.getItemAsync(LAST_NAME_KEY),
        SecureStore.getItemAsync(LAST_PHONE_KEY),
      ]);

      if (name) setUserName(name);

      const resolvedPhone = params.phone || storedPhone || '';
      if (!params.phone && storedPhone) setPhone(storedPhone);

      // Read store state directly to avoid stale closure
      const biometricEnabled = useSecurityStore.getState().isBiometricsEnabled;
      if (biometricEnabled && resolvedPhone) {
        handleBiometricLogin(resolvedPhone);
      }
    };

    loadIdentity();
  }, []);

  const handleBiometricLogin = async (targetPhone: string) => {
    try {
      setLoading(true);
      const normalizedPhone = targetPhone.startsWith('+91') ? targetPhone : `+91${targetPhone}`;
      const data = await loginWithBiometric(normalizedPhone);
      await signIn(data);
    } catch (error: any) {
      const msg: string = error.message ?? '';
      const isUserCancel = /cancel/i.test(msg) || msg.includes('user_cancel');
      const isDeviceError = error.response?.status === 403 || msg.includes('trust');

      if (!isUserCancel) {
        Toast.show({
          type: 'info',
          text1: 'Biometric Login Failed',
          text2: isDeviceError
            ? 'This device is not trusted. Use PIN instead.'
            : 'Verification failed.',
        });
      }

      // Only auto-open PIN on explicit trust/device errors
      if (isDeviceError) {
        setIsPinModalVisible(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePinLogin = async (pin: string) => {
    try {
      setLoading(true);
      const normalizedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      const data = await loginWithPin(normalizedPhone, pin);
      await signIn(data);
      setIsPinModalVisible(false);
    } catch (error: any) {
      throw error; // let PinEntryModal handle shake + error display
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.text, colors.primary]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safe}>
        <Animated.View
          style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <Logo size="lg" style={styles.logo} />

          <Text style={styles.welcomeText}>Welcome Back,</Text>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.phoneSub}>{phone}</Text>

          <View style={styles.actionContainer}>
            {showBiometric && (
              <TouchableOpacity
                style={styles.biometricBtn}
                onPress={() => handleBiometricLogin(phone)}
                disabled={loading}
              >
                <Ionicons name="finger-print-outline" size={48} color="white" />
                <Text style={styles.biometricText}>Use Biometrics</Text>
              </TouchableOpacity>
            )}

            {showPin && (
              <TouchableOpacity
                style={styles.pinBtn}
                onPress={() => setIsPinModalVisible(true)}
                disabled={loading}
              >
                <Ionicons name="keypad-outline" size={24} color="#005d90" />
                <Text style={styles.pinBtnText}>Enter App PIN</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={{ marginTop: 16, padding: 10 }}
            onPress={() => router.push({ pathname: '/auth/forgot-pin' as any, params: { phone } })}
            disabled={loading}
          >
            <Text style={[styles.switchText, { color: 'rgba(255,255,255,0.5)' }]}>Forgot PIN?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchAccount}
            onPress={() => router.replace('/auth')}
            disabled={loading}
          >
            <Text style={styles.switchText}>Not you? Login with Phone OTP</Text>
          </TouchableOpacity>
        </Animated.View>

        {loading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="white" />
          </View>
        )}

        <PinEntryModal
          visible={isPinModalVisible}
          onCancel={() => setIsPinModalVisible(false)}
          onSuccess={handlePinLogin}
          onForgotPin={() => {
            setIsPinModalVisible(false);
            router.push({ pathname: '/auth/forgot-pin' as any, params: { phone } });
          }}
          mode="verify"
          title="Enter PIN to Login"
        />
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 32 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  logo: { marginBottom: 40 },
  welcomeText: { color: 'rgba(255,255,255,0.7)', fontSize: 18, fontWeight: '500' },
  userName: { color: 'white', fontSize: 32, fontWeight: '900', marginTop: 4 },
  phoneSub: { color: 'rgba(255,255,255,0.5)', fontSize: 16, marginTop: 8 },

  actionContainer: { width: '100%', marginTop: 60, gap: 20 },
  biometricBtn: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  biometricText: { color: 'white', fontSize: 16, fontWeight: '600' },

  pinBtn: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  pinBtnText: { color: colors.primary, fontSize: 18, fontWeight: '800' },

  switchAccount: { marginTop: 40, padding: 10 },
  switchText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecorationLine: 'underline' },

  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
