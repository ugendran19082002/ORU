import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import Toast from 'react-native-toast-message';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';

export default function PrivacySecurityScreen() {
  const router = useRouter();

  const [appPin, setAppPin] = useState('');
  const [fingerprintEnabled, setFingerprintEnabled] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const loadSettings = async () => {
      const savedPin = await SecureStore.getItemAsync('user_app_pin');
      const savedBiometrics = await SecureStore.getItemAsync('fingerprint_enabled');
      if (savedPin) setAppPin(savedPin);
      if (savedBiometrics === 'true') setFingerprintEnabled(true);
    };
    loadSettings();
  }, []);

  const handleToggleFingerprint = async () => {
    if (!fingerprintEnabled) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Your device does not support biometric authentication.'
        });
        return;
      }
      if (!isEnrolled) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No biometrics found. Please set them up in your phone settings.'
        });
        return;
      }

      setFingerprintEnabled(true);
      await SecureStore.setItemAsync('fingerprint_enabled', 'true');
      Toast.show({
        type: 'success',
        text1: 'Security Updated',
        text2: 'Biometric login has been enabled.'
      });
    } else {
      setFingerprintEnabled(false);
      await SecureStore.setItemAsync('fingerprint_enabled', 'false');
      Toast.show({
        type: 'success',
        text1: 'Security Updated',
        text2: 'Biometric login has been disabled.'
      });
    }
  };

  const handleUpdatePin = async (val: string) => {
    setAppPin(val);
    if (val.length === 4) {
      await SecureStore.setItemAsync('user_app_pin', val);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Security PIN has been updated.'
      });
    }
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

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>App Lock PIN</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="keypad" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  value={appPin}
                  onChangeText={handleUpdatePin}
                  placeholder="Set 4-digit PIN"
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                />
              </View>
              <Text style={styles.helperText}>Used for sensitive actions and app entry.</Text>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={[styles.securityToggleWrap, fingerprintEnabled && { borderColor: '#10b981', backgroundColor: '#f0fdf4' }]}
              activeOpacity={0.8}
              onPress={handleToggleFingerprint}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={[styles.fingerprintIconBlock, fingerprintEnabled ? { backgroundColor: '#10b981' } : { backgroundColor: '#e2e8f0' }]}>
                  <Ionicons name="finger-print" size={22} color="white" />
                </View>
                <View>
                  <Text style={[styles.securityToggleTitle, fingerprintEnabled && { color: '#047857' }]}>Biometric Login</Text>
                  <Text style={styles.securityToggleSub}>{fingerprintEnabled ? 'Active' : 'Disabled'}</Text>
                </View>
              </View>
              <View style={[styles.toggleSwitch, fingerprintEnabled && styles.toggleSwitchActive]}>
                <View style={[styles.toggleThumb, fingerprintEnabled && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
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
  
  card: { backgroundColor: 'white', borderRadius: 24, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 16 },
  
  inputGroup: { gap: 8 },
  label: { fontSize: 12, fontWeight: '800', color: '#64748b', marginLeft: 4, textTransform: 'uppercase' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  inputIcon: { paddingLeft: 18, paddingRight: 10 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#0f172a', fontWeight: '600' },
  helperText: { fontSize: 12, color: '#94a3b8', marginLeft: 4 },

  securityToggleWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 4 },
  fingerprintIconBlock: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  securityToggleTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  securityToggleSub: { fontSize: 12, color: '#64748b', marginTop: 1 },
  toggleSwitch: { width: 44, height: 26, borderRadius: 13, backgroundColor: '#cbd5e1', padding: 2, justifyContent: 'center' },
  toggleSwitchActive: { backgroundColor: '#10b981' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'white' },
  toggleThumbActive: { transform: [{ translateX: 18 }] },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  actionIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0f9ff', alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  actionSub: { fontSize: 12, color: '#64748b', marginTop: 1 },

  deleteBtn: { paddingVertical: 18, alignItems: 'center' },
  deleteBtnText: { color: '#ba1a1a', fontWeight: '700', fontSize: 14 },
});
