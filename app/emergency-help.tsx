import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSecurityStore } from '@/stores/securityStore';
import { apiClient } from '@/api/client';
import { engagementApi } from '@/api/engagementApi';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { log } from '@/utils/logger';
import { useAppTheme } from '@/providers/ThemeContext';



const EMERGENCY_TYPES = [
  { id: 'accident', label: 'Accident / Injury', icon: 'medkit-outline', color: '#c62828', bg: '#ffebee', phone: '108' },
  { id: 'robbery', label: 'Robbery / Threat', icon: 'shield-outline', color: '#7c3aed', bg: '#ede9fe', phone: '100' },
  { id: 'fire', label: 'Fire Emergency', icon: 'flame-outline', color: '#ea580c', bg: '#fff7ed', phone: '101' },
  { id: 'medical', label: 'Medical Emergency', icon: 'heart-outline', color: '#c62828', bg: '#ffebee', phone: '102' },
  { id: 'delivery', label: 'Delivery Agent in Danger', icon: 'warning-outline', color: '#b45309', bg: '#fef3c7', phone: '112' },
];

import { systemApi, SystemSetting } from '@/api/systemApi';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { BackButton } from '@/components/ui/BackButton';

export default function EmergencyHelpScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { safeBack } = useAppNavigation();

  useAndroidBackHandler(() => {
    safeBack('/(tabs)/profile');
  });

  const [isTrigering, setIsTriggering] = useState(false);
  const [supportInfo, setSupportInfo] = useState<{ phone: string, whatsapp: string }>({
    phone: '1800-123-4567', // Default fallback
    whatsapp: '919876543210'
  });

  React.useEffect(() => {
    loadSupportInfo();
  }, []);

  const loadSupportInfo = async () => {
    try {
      const settings = await systemApi.getSettings('support');
      if (settings.data && Array.isArray(settings.data)) {
        const phone = settings.data.find(s => s.setting_key === 'support_phone')?.setting_value;
        const whatsapp = settings.data.find(s => s.setting_key === 'support_whatsapp')?.setting_value;
        setSupportInfo({
          phone: phone || '1800-123-4567',
          whatsapp: whatsapp || '919876543210'
        });
      }
    } catch (err) {
      console.error('Failed to load support info:', err);
    }
  };

  const triggerSosAPI = async () => {
    try {
      setIsTriggering(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      await engagementApi.triggerSos({
        note: "User triggered SOS from Emergency Help Screen"
      });

      Toast.show({
        type: 'success',
        text1: 'SOS Triggered!',
        text2: 'Emergency services and ThanniGo support notified.',
        position: 'bottom',
        visibilityTime: 5000,
      });
    } catch (error) {
      log.error('[SOS] Trigger failed:', error);
      Toast.show({
        type: 'error',
        text1: 'SOS Trigger Failed',
        text2: 'Please call emergency services manually.'
      });
    } finally {
      setIsTriggering(false);
    }
  };

  const callNumber = (number: string) => {
    const url = `tel:${number}`;
    require('react-native').Alert.alert('Emergency Call', `Call ${number}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: `Call ${number}`, style: 'destructive', onPress: () => Linking.openURL(url) },
    ]);
  };

  const callSupport = () => {
    require('react-native').Alert.alert('ThanniGo Support', 'Connecting you to our emergency support team.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Connect', onPress: () => Linking.openURL(`tel:${supportInfo.phone}`) },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* URGENT HEADER — keeps red accent, always light status bar */}
      <LinearGradient colors={['#c62828', '#ef4444']} style={styles.urgentHeader}>
        <BackButton variant="transparent" fallback="/(tabs)/profile" />
        <View style={styles.urgentContent}>
          <View style={styles.alertIconWrap}>
            <Ionicons name="warning" size={36} color="white" />
          </View>
          <Text style={styles.urgentTitle}>Emergency Help</Text>
          <Text style={styles.urgentSub}>Call emergency services or ThanniGo support instantly.</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* QUICK SOS */}
        <TouchableOpacity
          style={[styles.sosBtn, isTrigering && { opacity: 0.7 }]}
          onPress={() => {
            require('react-native').Alert.alert(
              'Confirm SOS',
              'This will alert authorities and ThanniGo support immediately. Are you sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'TRIGGER SOS', style: 'destructive', onPress: triggerSosAPI }
              ]
            );
          }}
          disabled={isTrigering}
        >
          <LinearGradient colors={['#c62828', '#ef4444']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sosBtnGrad}>
            <View style={styles.sosIconWrap}>
              <Ionicons name="megaphone" size={28} color="#c62828" />
            </View>
            <View>
              <Text style={styles.sosBtnTitle}>SILENT SOS</Text>
              <Text style={styles.sosBtnSub}>Alert Admins & Shop Owner</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>

        {/* EMERGENCY TYPES */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Services</Text>
        <View style={styles.emergencyGrid}>
          {EMERGENCY_TYPES.map((e) => (
            <TouchableOpacity
              key={e.id}
              style={[styles.emergencyCard, { backgroundColor: colors.surface }]}
              onPress={() => callNumber(e.phone)}
            >
              <View style={[styles.emergencyIcon, { backgroundColor: e.bg }]}>
                <Ionicons name={e.icon as any} size={24} color={e.color} />
              </View>
              <Text style={[styles.emergencyLabel, { color: colors.text }]}>{e.label}</Text>
              <Text style={[styles.emergencyNum, { color: e.color }]}>{e.phone}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* THANNIGO SUPPORT */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>ThanniGo Support</Text>
        <TouchableOpacity style={[styles.supportCard, { backgroundColor: colors.surface, borderColor: isDark ? colors.border : '#bfdbf7' }]} onPress={callSupport}>
          <View style={styles.supportLeft}>
            <View style={[styles.supportIcon, { backgroundColor: isDark ? 'rgba(0,93,144,0.2)' : '#e0f0ff' }]}>
              <Ionicons name="headset-outline" size={24} color="#005d90" />
            </View>
            <View>
              <Text style={styles.supportTitle}>Call ThanniGo Support</Text>
              <Text style={[styles.supportSub, { color: colors.muted }]}>24/7 emergency helpline · {supportInfo.phone}</Text>
            </View>
          </View>
          <View style={[styles.callBadge, { backgroundColor: isDark ? 'rgba(0,93,144,0.2)' : '#e0f0ff' }]}>
            <Ionicons name="call" size={16} color="#005d90" />
          </View>
        </TouchableOpacity>

        {/* SAFE TIPS */}
        <View style={[styles.tipsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.tipsTitle, { color: colors.text }]}>📋 Stay Safe Checklist</Text>
          {[
            'Move to a well-lit, public area',
            'Share your live location with someone you trust',
            'Do not confront aggressors — call police',
            'Document the incident if safe to do so',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={styles.tipBullet} />
              <Text style={[styles.tipText, { color: colors.muted }]}>{tip}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  urgentHeader: { paddingTop: 8, paddingBottom: 24, paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  urgentContent: { alignItems: 'center', gap: 8 },
  alertIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  urgentTitle: { fontSize: 26, fontWeight: '900', color: 'white' },
  urgentSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 18 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  sosBtn: { borderRadius: 20, overflow: 'hidden', shadowColor: '#c62828', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 14, elevation: 6 },
  sosBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18 },
  sosIconWrap: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  sosBtnTitle: { fontSize: 20, fontWeight: '900', color: 'white' },
  sosBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  emergencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emergencyCard: { width: '47%', borderRadius: 18, padding: 16, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  emergencyIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emergencyLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  emergencyNum: { fontSize: 18, fontWeight: '900' },
  supportCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, borderWidth: 1.5 },
  supportLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  supportIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  supportTitle: { fontSize: 15, fontWeight: '800', color: '#005d90' },
  supportSub: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  callBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tipsCard: { borderRadius: 18, padding: 18, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  tipsTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#005d90', marginTop: 6 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '500' },
});

