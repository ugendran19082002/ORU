import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useSecurityStore } from '@/stores/securityStore';
import { PinEntryModal } from '@/components/security/PinEntryModal';
import { BackButton } from '@/components/ui/BackButton';
import * as Haptics from 'expo-haptics';
import { Shadow, roleAccent, Radius } from '@/constants/theme';
import { useAppTheme } from '@/providers/ThemeContext';

const ACCENT = roleAccent.customer;

export default function PrivacySecurityScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const {
    isPinEnabled, isBiometricsEnabled, togglePin, toggleBiometrics, enablePinRemote, initialize
  } = useSecurityStore();

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinMode, setPinMode] = useState<'set' | 'verify'>('set');


  const handleTogglePin = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (val) {
      setPinMode('set');
      setShowPinModal(true);
    } else {
      togglePin(false);
      Toast.show({ type: 'success', text1: 'App PIN Disabled' });
    }
  };

  const handleToggleBiometrics = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (val) {
      // Immediate verification to 'lock in' the setting
      const { authenticateBiometrics } = useSecurityStore.getState();
      const success = await authenticateBiometrics();
      if (!success) {
        Toast.show({
          type: 'error',
          text1: 'Biometrics Failed',
          text2: 'Could not verify identity. Please try again.'
        });
        return;
      }
    }

    await toggleBiometrics(val);
    Toast.show({
      type: 'success',
      text1: val ? 'Biometrics Enabled' : 'Biometrics Disabled',
      text2: val ? 'Use FaceID/Fingerprint for quick unlock' : 'Reverted to PIN only access'
    });
  };

  const handleSetPin = async (newPin: string) => {
    await enablePinRemote(newPin);
    Toast.show({ type: 'success', text1: 'PIN Set Successfully' });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <BackButton fallback="/(tabs)/profile" />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy & Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* SECURITY SETTINGS SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>App Security</Text>
          <Text style={[styles.sectionDesc, { color: colors.muted }]}>Protect your account with additional layers of security.</Text>

            <View style={styles.menuRow}>
              <View style={[styles.menuIcon, { backgroundColor: colors.background }]}>
                <Ionicons name="lock-closed-outline" size={20} color={ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: colors.text }]}>App PIN Lock</Text>
                <Text style={[styles.menuSub, { color: colors.muted }]}>Protect app when minimized</Text>
              </View>
              <Switch
                value={isPinEnabled}
                onValueChange={handleTogglePin}
                trackColor={{ false: colors.border, true: ACCENT }}
                thumbColor={isPinEnabled ? 'white' : colors.muted}
              />
            </View>

            {isPinEnabled && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => {
                    setPinMode('set');
                    setShowPinModal(true);
                  }}
                >
                  <View style={[styles.menuIcon, { backgroundColor: colors.background }]}>
                    <Ionicons name="key-outline" size={20} color={ACCENT} />
                  </View>
                  <Text style={[styles.menuLabel, { color: colors.text }]}>Change App PIN</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.muted} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              </>
            )}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.menuRow}>
              <View style={[styles.menuIcon, { backgroundColor: colors.background }]}>
                <Ionicons name="finger-print-outline" size={20} color={ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Biometric Unlock</Text>
                <Text style={[styles.menuSub, { color: colors.muted }]}>Use FaceID or Fingerprint</Text>
              </View>
              <Switch
                value={isBiometricsEnabled}
                onValueChange={handleToggleBiometrics}
                disabled={!isPinEnabled}
                trackColor={{ false: colors.border, true: ACCENT }}
                thumbColor={isBiometricsEnabled ? 'white' : colors.muted}
              />
            </View>
        </View>

        {/* DATA PRIVACY SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Data & Privacy</Text>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/privacy-policy' as any)}>
              <View style={[styles.actionIconWrap, { backgroundColor: colors.inputBg }]}>
              <Ionicons name="document-text-outline" size={20} color={ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Privacy Policy</Text>
                <Text style={[styles.actionSub, { color: colors.muted }]}>How we handle your data</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/terms' as any)}>
              <View style={[styles.actionIconWrap, { backgroundColor: colors.inputBg }]}>
              <Ionicons name="shield-outline" size={20} color={ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Terms of Service</Text>
                <Text style={[styles.actionSub, { color: colors.muted }]}>App usage rules</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => require('react-native').Alert.alert(
            'Request Account Deletion',
            'This action is irreversible and will delete all your data. Are you sure?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete Account',
                style: 'destructive',
                onPress: async () => {
                  try {
                    const { userApi } = require('@/api/userApi');
                    const { useAppSession } = require('@/hooks/use-app-session');
                    await userApi.deleteAccount();
                    Toast.show({ type: 'success', text1: 'Account Deleted', text2: 'Your account has been deleted.' });
                    useAppSession.getState().logout();
                    router.replace('/auth/role');
                  } catch (err: any) {
                    Toast.show({ type: 'error', text1: 'Deletion Failed', text2: err.message || 'Could not delete your account.' });
                  }
                }
              }
            ]
          )}
        >
          <Text style={styles.deleteBtnText}>Request Account Deletion</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      <PinEntryModal
        visible={showPinModal}
        mode={pinMode}
        onSuccess={async () => { setShowPinModal(false); }}
        onCancel={() => setShowPinModal(false)}
        onSetPin={handleSetPin}
        title={pinMode === 'set' ? 'Set App PIN' : 'Verify PIN'}
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '900' },

  scrollContent: { padding: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '900', marginBottom: 4 },
  sectionDesc: { fontSize: 13, marginBottom: 16 },

  card: { borderRadius: Radius.xl, padding: 20, ...Shadow.xs },
  divider: { height: 1, marginVertical: 18 },

  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 4 },
  menuIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 15, fontWeight: '800' },
  menuSub: { fontSize: 12, marginTop: 1, fontWeight: '500' },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  actionIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 15, fontWeight: '800' },
  actionSub: { fontSize: 12, marginTop: 1 },

  deleteBtn: { paddingVertical: 18, alignItems: 'center' },
  deleteBtnText: { color: colors.error, fontWeight: '700', fontSize: 14 },
});
