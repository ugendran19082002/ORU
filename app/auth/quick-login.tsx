import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/providers/ThemeContext';
import type { ColorSchemeColors } from '@/providers/ThemeContext';

import { useSecurityStore } from '@/stores/securityStore';
import { useAppSession } from '@/hooks/use-app-session';
import { PinEntryModal } from '@/components/security/PinEntryModal';
import { Logo } from '@/components/ui/Logo';

import { Shadow, roleAccent, roleSurface, roleGradients } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function QuickLoginScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { signIn } = useAppSession();
  const { 
    isBiometricsEnabled, 
    isPinEnabled, 
    loginWithPin, 
    loginWithBiometric 
  } = useSecurityStore();

  const params = useLocalSearchParams<{ phone?: string }>();
  const [userName, setUserName] = useState('User');
  const [phone, setPhone] = useState(params.phone ?? '');
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const loadIdentity = async () => {
      const name = await SecureStore.getItemAsync('thannigo_last_name');
      const storedPhone = await SecureStore.getItemAsync('thannigo_last_phone');
      if (name) setUserName(name);
      // Prefer param phone (coming from login screen) over stored phone
      const resolvedPhone = params.phone || storedPhone || '';
      if (!params.phone && storedPhone) setPhone(storedPhone);

      // Auto-trigger biometrics if enabled
      if (isBiometricsEnabled && resolvedPhone) {
          handleBiometricLogin(resolvedPhone);
      }
    };
    loadIdentity();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleBiometricLogin = async (targetPhone: string) => {
    try {
      setLoading(true);
      const data = await loginWithBiometric(targetPhone);
      await signIn(data);
    } catch (error: any) {
      console.log('[QuickLogin] Biometric login failed:', error.message);
      
      const isDeviceError = error.response?.status === 403 || error.message?.includes('trust');
      
      require('react-native-toast-message').default.show({
        type: 'info',
        text1: 'Biometric Login Failed',
        text2: isDeviceError ? 'This device is not trusted. Use PIN instead.' : 'Verification failed or cancelled.'
      });
      
      // Auto-open PIN modal if biometrics failed for hardware/trust reasons
      if (isDeviceError || !error.message?.includes('cancel')) {
          setIsPinModalVisible(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePinLogin = async (pin: string) => {
    try {
      setLoading(true);
      const data = await loginWithPin(phone, pin);
      await signIn(data);
      setIsPinModalVisible(false);
    } catch (error: any) {
      throw error; // Let the Modal handle the vibrating error
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
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Logo size="lg" style={styles.logo} />
          
          <Text style={styles.welcomeText}>Welcome Back,</Text>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.phoneSub}>{phone}</Text>

          <View style={styles.actionContainer}>
            {isBiometricsEnabled && (
              <TouchableOpacity 
                style={styles.biometricBtn} 
                onPress={() => handleBiometricLogin(phone)}
                disabled={loading}
              >
                <Ionicons name="finger-print-outline" size={48} color="white" />
                <Text style={styles.biometricText}>Use Biometrics</Text>
              </TouchableOpacity>
            )}

            {isPinEnabled && (
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
    marginBottom: 20
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
    justifyContent: 'center'
  }
});
