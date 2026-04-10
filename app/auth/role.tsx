import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '@/components/ui/Logo';
import { roleAccent, roleGradients } from '@/constants/theme';
import { useAppSession } from '@/hooks/use-app-session';

type Role = 'customer' | 'shop' | 'delivery' | 'admin';

const ROLES = [
  {
    id: 'customer' as Role,
    title: 'Customer',
    subtitle: 'Order pure water\ndelivered to your door',
    icon: 'person-outline' as const,
    accent: roleAccent.customer,
    bg: '#e0f0ff',
    gradient: ['#005d90', '#0077b6'] as [string, string],
    features: ['Browse nearby shops', 'Track live delivery', 'Pay via UPI / COD'],
  },
  {
    id: 'shop' as Role,
    title: 'Shop Owner',
    subtitle: 'Manage orders &\ngrow your business',
    icon: 'storefront-outline' as const,
    accent: roleAccent.shop,
    bg: '#e0f7fa',
    gradient: ['#006878', '#005566'] as [string, string],
    features: ['Accept/reject orders', 'Track daily earnings', 'Inventory & analytics'],
  },
  {
    id: 'delivery' as Role,
    title: 'Delivery Agent',
    subtitle: 'Deliver orders &\nearn per trip',
    icon: 'bicycle-outline' as const,
    accent: '#2e7d32',
    bg: '#e8f5e9',
    gradient: ['#2e7d32', '#388e3c'] as [string, string],
    features: ['View assigned trips', 'Verify OTP & collect payment', 'Track shift earnings'],
  },
  {
    id: 'admin' as Role,
    title: 'Admin',
    subtitle: 'Oversee the entire\nThanniGo platform',
    icon: 'shield-checkmark-outline' as const,
    accent: roleAccent.admin,
    bg: '#e0f2f1',
    gradient: ['#00796b', '#004d40'] as [string, string],
    features: ['Live orders feed', 'Shop verification', 'Revenue analytics'],
  },
];

const ROLE_DESTINATIONS: Record<Role, string> = {
  customer: '/(tabs)',
  shop: '/shop',
  delivery: '/delivery',
  admin: '/admin',
};

export default function RoleSelectScreen() {
  const router = useRouter();
  const { setPreferredRole } = useAppSession();
  const [selected, setSelected] = useState<Role | null>(null);

  const handleContinue = async () => {
    if (!selected) return;
    await setPreferredRole(selected);
    // For delivery: go directly to delivery dashboard (separate from shop)
    if (selected === 'delivery') {
      router.push({ pathname: '/auth/login', params: { role: selected } });
    } else {
      router.push({ pathname: '/auth/login', params: { role: selected } });
    }
  };

  const selectedRole = ROLES.find((r) => r.id === selected);

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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.roleList}>
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
                {/* Radio */}
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
        </ScrollView>

        {/* CTA */}
        <TouchableOpacity
          activeOpacity={selected ? 0.9 : 1}
          onPress={handleContinue}
          style={[styles.ctaWrap, !selected && { opacity: 0.4 }]}
        >
          <LinearGradient
            colors={selectedRole?.gradient ?? ['#005d90', '#0077b6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBtn}
          >
            <Text style={styles.ctaText}>
              Continue as {selectedRole?.title ?? '—'}
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

  titleBlock: { marginTop: 8, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '900', color: '#181c20', letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#707881', fontWeight: '500' },

  roleList: { gap: 12, paddingBottom: 8 },
  roleCard: {
    backgroundColor: 'white', borderRadius: 24,
    padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 14,
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

  ctaWrap: { paddingVertical: 16 },
  ctaBtn: {
    borderRadius: 20, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: '#005d90', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 14, elevation: 6,
  },
  ctaText: { color: 'white', fontSize: 17, fontWeight: '900' },
});
