import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '@/components/ui/Logo';

const { width } = Dimensions.get('window');

type Role = 'customer' | 'shop' | 'delivery' | 'admin';

const ROLES = [
  {
    id: 'customer' as Role,
    title: 'Customer',
    subtitle: 'Order pure water\ndelivered to your door',
    icon: 'person-outline' as const,
    accent: '#005d90',
    bg: '#e0f0ff',
    features: ['Browse nearby shops', 'Track live delivery', 'Pay via UPI / COD'],
  },
  {
    id: 'shop' as Role,
    title: 'Shop Owner',
    subtitle: 'Manage orders &\ngrow your business',
    icon: 'storefront-outline' as const,
    accent: '#006878',
    bg: '#e0f7fa',
    features: ['Accept/reject orders', 'Track daily earnings', 'View delivery map'],
  },
  {
    id: 'delivery' as Role,
    title: 'Delivery',
    subtitle: 'Complete assigned trips\nwith OTP handoff',
    icon: 'bicycle-outline' as const,
    accent: '#0f766e',
    bg: '#ccfbf1',
    features: ['View assigned drops', 'Navigate to customers', 'Verify delivery OTP'],
  },
  {
    id: 'admin' as Role,
    title: 'Admin',
    subtitle: 'Oversee the entire\nThanniGo platform',
    icon: 'shield-checkmark-outline' as const,
    accent: '#23616b',
    bg: '#e0f2f1',
    features: ['Live orders feed', 'Shop verification', 'Revenue analytics'],
  },
];

export default function RoleSelectScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Role | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    router.push({ pathname: '/auth/login', params: { role: selected } });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safe}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#005d90" />
          </TouchableOpacity>
          <View style={styles.brandRow}>
            <Logo size="sm" />
            <Text style={styles.brandName}>ThanniGo</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Who are you?</Text>
          <Text style={styles.subtitle}>Choose your role to continue</Text>
        </View>

        {/* ROLE CARDS */}
        <View style={styles.roleList}>
          {ROLES.map((role) => {
            const isSelected = selected === role.id;
            return (
              <TouchableOpacity
                key={role.id}
                activeOpacity={0.88}
                style={[
                  styles.roleCard,
                  isSelected && { borderColor: role.accent, borderWidth: 2.5 },
                ]}
                onPress={() => setSelected(role.id)}
              >
                {/* Selection indicator */}
                <View style={[styles.radioOuter, isSelected && { borderColor: role.accent }]}>
                  {isSelected && <View style={[styles.radioInner, { backgroundColor: role.accent }]} />}
                </View>

                <View style={[styles.roleIconWrap, { backgroundColor: role.bg }]}>
                  <Ionicons name={role.icon} size={26} color={role.accent} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleTitle, isSelected && { color: role.accent }]}>
                    {role.title}
                  </Text>
                  <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
                  {isSelected && (
                    <View style={styles.featureList}>
                      {role.features.map((f) => (
                        <View key={f} style={styles.featureRow}>
                          <Ionicons name="checkmark-circle" size={13} color={role.accent} />
                          <Text style={[styles.featureText, { color: role.accent }]}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CTA */}
        <TouchableOpacity
          activeOpacity={selected ? 0.9 : 1}
          onPress={handleContinue}
          style={[styles.ctaWrap, !selected && { opacity: 0.4 }]}
        >
          <LinearGradient
            colors={['#005d90', '#0077b6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBtn}
          >
            <Text style={styles.ctaText}>
              Continue as {selected ? ROLES.find((r) => r.id === selected)?.title : '—'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  safe: { flex: 1, paddingHorizontal: 24 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: '#ebeef4', alignItems: 'center', justifyContent: 'center',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 20, fontWeight: '900', color: '#003a5c', letterSpacing: -0.5 },

  titleBlock: { marginTop: 8, marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '900', color: '#181c20', letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#707881', fontWeight: '500' },

  roleList: { gap: 14, flex: 1 },
  roleCard: {
    backgroundColor: 'white', borderRadius: 24,
    padding: 18, flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    borderWidth: 1.5, borderColor: '#ebeef4',
    shadowColor: '#003a5c', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#bfc7d1',
    alignItems: 'center', justifyContent: 'center', marginTop: 3,
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  roleIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  roleTitle: { fontSize: 18, fontWeight: '900', color: '#181c20', marginBottom: 3 },
  roleSubtitle: { fontSize: 12, color: '#707881', lineHeight: 17 },
  featureList: { marginTop: 10, gap: 5 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureText: { fontSize: 12, fontWeight: '600' },

  ctaWrap: { paddingVertical: 20 },
  ctaBtn: {
    borderRadius: 20, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: '#005d90', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 14, elevation: 6,
  },
  ctaText: { color: 'white', fontSize: 17, fontWeight: '900' },
});
