import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSession } from '@/providers/AppSessionProvider';
import { LinearGradient } from 'expo-linear-gradient';

const SECONDARY_MENUS = [
  { name: 'Users', path: '/admin/users', icon: 'people', color: '#005d90' },
  { name: 'Payouts', path: '/admin/payouts', icon: 'card', color: '#006878' },
  { name: 'Refunds', path: '/admin/refunds', icon: 'refresh-circle', color: '#7c3aed' },
  { name: 'Complaints', path: '/admin/complaints', icon: 'alert-circle', color: '#ba1a1a' },
  { name: 'Growth', path: '/admin/growth', icon: 'trending-up', color: '#16a34a' },
  { name: 'Coupons', path: '/admin/coupons', icon: 'ticket', color: '#b45309' },
  { name: 'Plans', path: '/admin/plans', icon: 'calendar', color: '#005d90' },
  { name: 'Features', path: '/admin/features', icon: 'toggle', color: '#475569' },
  { name: 'Master Menu', path: '/admin/master', icon: 'list', color: '#005d90' },
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
              <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={styles.menuName}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={12} color="#94a3b8" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
           <View style={styles.logoutContent}>
            <Ionicons name="log-out-outline" size={20} color="#ba1a1a" />
            <Text style={styles.logoutText}>Sign Out of Admin</Text>
           </View>
           <Ionicons name="chevron-forward" size={16} color="#ba1a1a" />
        </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  headerSafe: { 
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  headerContent: {
    width: '100%',
    maxWidth: 1200,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  pageTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#64748b', fontWeight: '500', marginTop: 2 },
  
  content: { paddingVertical: 16, paddingHorizontal: 16, paddingBottom: 120, alignItems: 'center' },
  grid: { 
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  iconBox: {
    width: 54, height: 54, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  menuName: { fontSize: 14, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
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
  logoutText: { color: '#ba1a1a', fontWeight: '800', fontSize: 16 },
});
