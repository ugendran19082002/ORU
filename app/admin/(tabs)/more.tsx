import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSession } from '@/providers/AppSessionProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { Shadow, thannigoPalette, roleAccent } from '@/constants/theme';

const ADMIN_ACCENT = roleAccent.admin;

const SECONDARY_MENUS = [
  { name: 'Users', path: '/admin/users', icon: 'people' },
  { name: 'Payouts', path: '/admin/payouts', icon: 'card' },
  { name: 'Refunds', path: '/admin/refunds', icon: 'refresh-circle' },
  { name: 'Complaints', path: '/admin/complaints', icon: 'alert-circle' },
  { name: 'Growth', path: '/admin/growth', icon: 'trending-up' },
  { name: 'Coupons', path: '/admin/coupons', icon: 'ticket' },
  { name: 'Plans', path: '/admin/plans', icon: 'calendar' },
  { name: 'Features', path: '/admin/features', icon: 'toggle' },
  { name: 'Master Menu', path: '/admin/master', icon: 'list' },
];

export default function MoreMenuScreen() {
  const router = useRouter();
  const { signOut } = useAppSession();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.headerContent}>
          <Text style={styles.pageTitle}>More Menus</Text>
          <Text style={styles.headerSub}>Platform Management Tools</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ width: '100%', maxWidth: 1200 }}>
        <View style={styles.grid}>
          {SECONDARY_MENUS.map((item) => (
            <TouchableOpacity 
              key={item.name} 
              style={styles.menuCard}
              onPress={() => router.push(item.path as any)}
            >
              <View style={[styles.iconBox, { backgroundColor: ADMIN_ACCENT + '15' }]}>
                <Ionicons name={item.icon as any} size={24} color={ADMIN_ACCENT} />
              </View>
              <Text style={styles.menuName}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={12} color="#94a3b8" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
           <View style={styles.logoutContent}>
            <Ionicons name="log-out-outline" size={20} color={ADMIN_ACCENT} />
            <Text style={styles.logoutText}>Sign Out of Admin</Text>
           </View>
           <Ionicons name="chevron-forward" size={16} color={ADMIN_ACCENT} />
        </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: thannigoPalette.background },
  headerSafe: {
    backgroundColor: thannigoPalette.surface,
    borderBottomWidth: 1,
    borderBottomColor: thannigoPalette.borderSoft,
    alignItems: 'center',
  },
  headerContent: {
    width: '100%',
    maxWidth: 1200,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  pageTitle: { fontSize: 28, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: thannigoPalette.neutral, fontWeight: '500', marginTop: 2 },

  content: { paddingVertical: 16, paddingHorizontal: 16, paddingBottom: 120, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  menuCard: {
    width: '48%',
    backgroundColor: thannigoPalette.surface,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.xs,
    borderWidth: 1,
    borderColor: thannigoPalette.borderSoft,
  },
  iconBox: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  menuName: { fontSize: 14, fontWeight: '800', color: thannigoPalette.darkText, textAlign: 'center' },
  logoutBtn: {
    marginTop: 24,
    backgroundColor: '#fff1f1',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  logoutContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoutText: { color: ADMIN_ACCENT, fontWeight: '800', fontSize: 16 },
});
