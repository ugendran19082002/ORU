import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useSecurityStore } from '@/stores/securityStore';
import { PinEntryModal } from '@/components/security/PinEntryModal';
import { BackButton } from '@/components/ui/BackButton';
import * as Haptics from 'expo-haptics';

export default function PrivacySecurityScreen() {
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <BackButton fallback="/(tabs)/profile" />
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* SECURITY SETTINGS SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Security</Text>
          <Text style={styles.sectionDesc}>Protect your account with additional layers of security.</Text>

            <View style={styles.menuRow}>
              <View style={[styles.menuIcon, { backgroundColor: '#f1f4f9' }]}>
                <Ionicons name="lock-closed-outline" size={20} color="#005d90" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>App PIN Lock</Text>
                <Text style={styles.menuSub}>Protect app when minimized</Text>
              </View>
              <Switch
                value={isPinEnabled}
                onValueChange={handleTogglePin}
                trackColor={{ false: '#e0e2e8', true: '#a7edff' }}
                thumbColor={isPinEnabled ? '#006878' : '#707881'}
              />
            </View>

            {isPinEnabled && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity 
                  style={styles.menuRow}
                  onPress={() => {
                    setPinMode('set');
                    setShowPinModal(true);
                  }}
                >
                  <View style={[styles.menuIcon, { backgroundColor: '#f1f4f9' }]}>
                    <Ionicons name="key-outline" size={20} color="#005d90" />
                  </View>
                  <Text style={styles.menuLabel}>Change App PIN</Text>
                  <Ionicons name="chevron-forward" size={16} color="#bfc7d1" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              </>
            )}

            <View style={styles.divider} />

            <View style={styles.menuRow}>
              <View style={[styles.menuIcon, { backgroundColor: '#f1f4f9' }]}>
                <Ionicons name="finger-print-outline" size={20} color="#005d90" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>Biometric Unlock</Text>
                <Text style={styles.menuSub}>Use FaceID or Fingerprint</Text>
              </View>
              <Switch
                value={isBiometricsEnabled}
                onValueChange={handleToggleBiometrics}
                disabled={!isPinEnabled}
                trackColor={{ false: '#e0e2e8', true: '#a7edff' }}
                thumbColor={isBiometricsEnabled ? '#006878' : '#707881'}
              />
            </View>
        </View>

        {/* DATA PRIVACY SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          
          <View style={styles.card}>
            <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/privacy-policy' as any)}>
              <View style={styles.actionIconWrap}>
                 <Ionicons name="document-text-outline" size={20} color="#005d90" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionLabel}>Privacy Policy</Text>
                <Text style={styles.actionSub}>How we handle your data</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/terms' as any)}>
              <View style={styles.actionIconWrap}>
                 <Ionicons name="shield-outline" size={20} color="#005d90" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionLabel}>Terms of Service</Text>
                <Text style={styles.actionSub}>App usage rules</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.deleteBtn}
          onPress={() => require('react-native').Alert.alert('Request Account Deletion', 'Our team will contact you within 24 hours to process your request.', [{ text: 'Cancel' }, { text: 'Send Request', style: 'destructive' }])}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  
  scrollContent: { padding: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  
  card: { backgroundColor: 'white', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 18 },
  
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 4 },
  menuIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  menuSub: { fontSize: 12, color: '#64748b', marginTop: 1, fontWeight: '500' },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  actionIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0f9ff', alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  actionSub: { fontSize: 12, color: '#64748b', marginTop: 1 },

  deleteBtn: { paddingVertical: 18, alignItems: 'center' },
  deleteBtnText: { color: '#ba1a1a', fontWeight: '700', fontSize: 14 },
});


