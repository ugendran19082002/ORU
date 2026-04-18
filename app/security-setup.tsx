import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

import { useSecurityStore } from '@/stores/securityStore';
import { PinEntryModal } from '@/components/security/PinEntryModal';
import { useAppSession } from '@/providers/AppSessionProvider';
import { useAppTheme } from '@/providers/ThemeContext';

/**
 * MANDATORY SECURITY SETUP SCREEN
 * This screen is triggered immediately after OTP verification if no PIN is set.
 */
export default function SecuritySetupScreen() {
  const router = useRouter();
  const { is_new_user, is_forgot_pin } = useLocalSearchParams<{ is_new_user?: string; is_forgot_pin?: string }>();
  const { colors, isDark } = useAppTheme();
  const { setIsVerified, syncSession, user } = useAppSession();
  const { enablePinRemote, enableBiometricRemote, initialize } = useSecurityStore();
  const [showModal, setShowModal] = useState(false);
  const [complete, setComplete] = useState(false);

  const handleStartSetup = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowModal(true);
  };

  const handleSetPin = async (newPin: string) => {
    try {
      await enablePinRemote(newPin);
      await syncSession(); // Refresh global user object to show PIN is now enabled
      setIsVerified(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setComplete(true);
      setShowModal(false);

      // Auto-prompt biometrics if supported
      handleEnableBiometric();

      Toast.show({
        type: 'success',
        text1: 'Security Enabled',
        text2: 'Your account is now protected with a PIN.'
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Setup Failed',
        text2: 'Could not save your PIN. Please try again.'
      });
    }
  };

  const handleEnableBiometric = async () => {
    try {
       await enableBiometricRemote();
    } catch (e) {
       console.log('Biometric setup skipped or failed');
    }
  };

  const handleFinish = async () => {
    await syncSession();
    if (is_forgot_pin === '1') {
      // Forgot PIN reset complete — go to quick-login to re-authenticate
      router.replace('/auth/quick-login' as any);
      return;
    }
    if (is_new_user === '1') {
      // New user — go to role selection / onboarding
      router.replace('/auth/role' as any);
      return;
    }
    // Returning user PIN reset — go to their role dashboard
    const role = user?.role;
    if (role === 'shop_owner') router.replace('/shop' as any);
    else if (role === 'admin') router.replace('/admin' as any);
    else if (role === 'delivery') router.replace('/delivery' as any);
    else router.replace('/(tabs)' as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        {/* BRANDING */}
        <View style={styles.brandRow}>
           <View style={styles.logoCircle}>
              <Ionicons name="shield-checkmark" size={32} color="white" />
           </View>
           <Text style={[styles.brandTitle, { color: colors.text }]}>ThanniGo Security</Text>
        </View>

        {/* HERO SECTION */}
        <View style={styles.hero}>
           <Text style={[styles.title, { color: colors.text }]}>Secure your{"\n"}Account</Text>
           <Text style={[styles.subtitle, { color: colors.muted }]}>
             To protect your orders and wallet, we require a 4-digit PIN setup for every session.
           </Text>
        </View>

        {/* ILLUSTRATION/BADGE */}
        <View style={styles.illustrationWrap}>
           <LinearGradient
             colors={complete ? ['#0ea5e9', '#0284c7'] : isDark ? ['#1e293b', '#0f172a'] : ['#f1f5f9', '#e2e8f0']}
             style={styles.circle}
           >
              <Ionicons
                name={complete ? "lock-closed" : "keypad-outline"}
                size={80}
                color={complete ? "white" : "#94a3b8"}
              />
           </LinearGradient>
        </View>

        {/* ACTIONS */}
        <View style={styles.actions}>
           {!complete ? (
             <>
               <TouchableOpacity
                 style={styles.primaryBtn}
                 onPress={handleStartSetup}
                 activeOpacity={0.8}
               >
                 <LinearGradient
                   colors={['#0ea5e9', '#0284c7']}
                   start={{ x: 0, y: 0 }}
                   end={{ x: 1, y: 0 }}
                   style={styles.gradient}
                 >
                   <Text style={styles.primaryBtnText}>Set 4-Digit PIN</Text>
                   <Ionicons name="arrow-forward" size={20} color="white" />
                 </LinearGradient>
               </TouchableOpacity>

               <Text style={[styles.footerNote, { color: colors.muted }]}>
                 This PIN will be required whenever you reopen the app.
               </Text>
             </>
           ) : (
             <TouchableOpacity
               style={styles.primaryBtn}
               onPress={handleFinish}
               activeOpacity={0.8}
             >
                <LinearGradient
                   colors={['#10b981', '#059669']}
                   start={{ x: 0, y: 0 }}
                   end={{ x: 1, y: 0 }}
                   style={styles.gradient}
                 >
                   <Text style={styles.primaryBtnText}>Continue to App</Text>
                   <Ionicons name="checkmark-circle" size={20} color="white" />
                 </LinearGradient>
             </TouchableOpacity>
           )}
        </View>
      </ScrollView>

      {/* PIN MODAL */}
      <PinEntryModal
        visible={showModal}
        mode="set"
        onSuccess={async () => {}} // Handled via onSetPin
        onCancel={() => setShowModal(false)}
        onSetPin={handleSetPin}
        title="Create App PIN"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },

  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 40 },
  logoCircle: { width: 56, height: 56, borderRadius: 20, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center' },
  brandTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },

  hero: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 36, fontWeight: '900', textAlign: 'center', lineHeight: 40, marginBottom: 16 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },

  illustrationWrap: { marginBottom: 50 },
  circle: { width: 180, height: 180, borderRadius: 90, alignItems: 'center', justifyContent: 'center', shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },

  actions: { width: '100%', alignItems: 'center', gap: 16 },
  primaryBtn: { width: '100%', height: 64, borderRadius: 20, overflow: 'hidden' },
  gradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  primaryBtnText: { color: 'white', fontSize: 18, fontWeight: '900' },

  footerNote: { fontSize: 13, textAlign: 'center', marginTop: 8 },
});
