import React, { useCallback } from 'react';
import {
  View, Text, ScrollView,
  RefreshControl, Linking, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { Logo } from '@/components/ui/Logo';
import { useAppSession } from '@/hooks/use-app-session';
import { addressApi } from '@/api/addressApi';
import { useSecurityStore } from '@/stores/securityStore';



export default function ProfileScreen() {
  const router = useRouter();
  const { signOut, user, emergencyReset } = useAppSession();
  const { isPinEnabled, initialize: initSecurity } = useSecurityStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [addressCount, setAddressCount] = React.useState(0);

  React.useEffect(() => {
    initSecurity();
  }, []);

  const fetchAddressCount = React.useCallback(async () => {
    try {
      const res = await addressApi.getAddresses();
      if (res.data?.status === 1) {
        setAddressCount(res.data.data.length);
      }
    } catch (e) {
      console.error('Error fetching address count:', e);
    }
  }, []);

  React.useEffect(() => {
    fetchAddressCount();
  }, [fetchAddressCount]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchAddressCount();
    setRefreshing(false);
  }, [fetchAddressCount]);

  const menuItems = [
    { icon: 'location-outline' as const, label: 'Saved Addresses', subtitle: `${addressCount} saved locations`, hasArrow: true },
    { icon: 'card-outline' as const, label: 'Payment Methods', subtitle: 'UPI, Cards', hasArrow: true },
    { icon: 'receipt-outline' as const, label: 'Order History', subtitle: 'View past orders', hasArrow: true },
    { icon: 'repeat-outline' as const, label: 'Subscriptions', subtitle: 'Manage scheduled deliveries', hasArrow: true },
    { icon: 'gift-outline' as const, label: 'Rewards', subtitle: 'Referral code and loyalty points', hasArrow: true },
    { icon: 'shield-checkmark-outline' as const, label: 'Privacy & Security', subtitle: isPinEnabled ? 'PIN Protected' : 'Manage your data', hasArrow: true, status: isPinEnabled ? 'active' : 'none' },
    { icon: 'help-circle-outline' as const, label: 'Help & Support', subtitle: '24/7 customer service', hasArrow: true },
    { icon: 'information-circle-outline' as const, label: 'About ThanniGo', subtitle: 'Version 1.0.0', hasArrow: true },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth' as any);
  };

  const handleResetData = () => {
    require('react-native').Alert.alert(
      'Reset All Data',
      'This will clear your local session, cache, and log you out. This is useful if you are experiencing navigation or login issues. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset Everything', 
          style: 'destructive',
          onPress: async () => {
            await emergencyReset();
            router.replace('/auth' as any);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Logo size="md" />
          <Text style={styles.brandName}>ThanniGo</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/edit-profile' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="settings-outline" size={22} color="#005d90" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/notifications' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={22} color="#005d90" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />}
      >
        {/* PROFILE CARD */}
        <LinearGradient colors={['#005d90', '#0077b6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.profileCard}>
          <View style={styles.profileDecor}>
            <Ionicons name="person-circle" size={160} color="rgba(255,255,255,0.06)" />
          </View>
          <TouchableOpacity style={styles.cardEditBtn} onPress={() => router.push('/edit-profile' as any)}>
            <Ionicons name="pencil-sharp" size={18} color="white" />
          </TouchableOpacity>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={36} color="#005d90" />
            </View>
            <TouchableOpacity style={styles.editAvatarBtn} onPress={() => router.push('/edit-profile' as any)}>
              <Ionicons name="camera" size={14} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{user?.name || 'User'}</Text>
          <Text style={styles.profilePhone}>{user?.phone || 'No Phone'}</Text>
          
          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatVal}>47</Text>
              <Text style={styles.profileStatLabel}>Orders</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatVal}>{user?.loyalty_points || 0}</Text>
              <Text style={styles.profileStatLabel}>Points</Text>
            </View>
          </View>
        </LinearGradient>

        <TouchableOpacity style={styles.memberBadge} onPress={() => router.push('/rewards' as any)}>
          <View style={styles.memberBadgeIcon}>
            <Ionicons name="ribbon-outline" size={20} color="#0077b6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.memberBadgeTitle}>Earn Free Deliveries</Text>
            <Text style={styles.memberBadgeSub}>Refer friends and earn up to 500 bonus points</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#005d90" />
        </TouchableOpacity>

        {/* MENU LIST */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.label === 'Saved Addresses') {
                    router.push('/addresses' as any);
                  } else if (item.label === 'Order History') {
                    router.push('/(tabs)/orders' as any);
                  } else if (item.label === 'Subscriptions') {
                    router.push('/subscriptions' as any);
                  } else if (item.label === 'Rewards') {
                    router.push('/rewards' as any);
                  } else if (item.label === 'My Analytics') {
                    router.push('/customer-analytics' as any);
                  } else if (item.label === 'Payment Methods') {
                    router.push('/customer-payment-methods' as any);
                  } else if (item.label === 'My Reviews') {
                    router.push('/customer-reviews' as any);
                  } else if (item.label === 'Privacy & Security') {
                    router.push('/privacy-security' as any);
                  } else if (item.label === 'Help & Support') {
                    require('react-native').Alert.alert('Help & Support', 'How would you like to reach us?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Email Support', onPress: () => Linking.openURL('mailto:support@thannigo.com') },
                    ]);
                  } else if (item.label === 'About ThanniGo') {
                    Toast.show({
                      type: 'info',
                      text1: 'ThanniGo',
                      text2: "India's fastest 15-minute water delivery platform.\n© 2026 ThanniGo Pvt. Ltd."
                    });
                  }
                }}
              >
                <View style={styles.menuItemIcon}>
                  <Ionicons name={item.icon} size={20} color="#005d90" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                    {item.label === 'Privacy & Security' && isPinEnabled && (
                      <View style={styles.securityBadge}>
                         <Ionicons name="lock-closed" size={10} color="#10b981" />
                         <Text style={styles.securityBadgeText}>ACTIVE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.menuItemSub}>{item.subtitle}</Text>
                </View>
                {item.hasArrow && <Ionicons name="chevron-forward" size={16} color="#bfc7d1" />}
              </TouchableOpacity>
              {index < menuItems.length - 1 && <View style={styles.menuDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#ba1a1a" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* MAINTENANCE */}
        <View style={{ marginTop: 10, marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>Maintenance</Text>
          <TouchableOpacity 
            style={styles.maintenanceBtn} 
            onPress={handleResetData}
            activeOpacity={0.7}
          >
            <View style={styles.maintenanceIcon}>
              <Ionicons name="trash-outline" size={18} color="#64748b" />
            </View>
            <Text style={styles.maintenanceText}>Clear App Cache & Data</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>ThanniGo v1.0.0 · Made with 💧 in India</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.92)' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 22, fontWeight: '900', color: '#003a5c', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center' },

  profileCard: { borderRadius: 28, padding: 28, marginTop: 20, marginBottom: 14, alignItems: 'center', overflow: 'hidden', position: 'relative', shadowColor: '#005d90', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  profileDecor: { position: 'absolute', right: -20, bottom: -20 },
  cardEditBtn: { position: 'absolute', top: 20, right: 20, width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: '#006878', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' },
  profileName: { color: 'white', fontSize: 22, fontWeight: '900', letterSpacing: -0.3, marginBottom: 4 },
  profilePhone: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500', marginBottom: 20 },
  
  profileStats: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  profileStat: { alignItems: 'center', gap: 2 },
  profileStatVal: { color: 'white', fontSize: 20, fontWeight: '900' },
  profileStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  profileStatDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.25)' },

  editProfileBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'white', borderRadius: 16, paddingVertical: 12, borderWidth: 1.5, borderColor: '#e0f0ff', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  editProfileText: { color: '#005d90', fontWeight: '700', fontSize: 14 },

  memberBadge: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#e0f0ff', borderRadius: 20, padding: 16, marginBottom: 24, borderWidth: 1.5, borderColor: '#b3d9f2' },
  memberBadgeIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  memberBadgeTitle: { fontSize: 14, fontWeight: '800', color: '#005d90', marginBottom: 2 },
  memberBadgeSub: { fontSize: 11, color: '#0077b6', fontWeight: '500' },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#181c20', letterSpacing: -0.3, marginBottom: 12 },

  menuCard: { backgroundColor: 'white', borderRadius: 24, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16 },
  menuItemIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  menuItemLabel: { fontSize: 14, fontWeight: '700', color: '#181c20', marginBottom: 1 },
  menuItemSub: { fontSize: 11, color: '#707881' },
  menuDivider: { height: 1, backgroundColor: '#f1f4f9', marginLeft: 74 },
  
  securityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e0fdf4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  securityBadgeText: { fontSize: 8, fontWeight: '900', color: '#10b981', letterSpacing: 0.5 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ffdad6', borderRadius: 16, paddingVertical: 14, marginBottom: 20 },
  logoutText: { color: '#ba1a1a', fontWeight: '700', fontSize: 15 },
  
  maintenanceBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    backgroundColor: '#f1f5f9', 
    borderRadius: 16, 
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  maintenanceIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  maintenanceText: { 
    color: '#64748b', 
    fontWeight: '700', 
    fontSize: 14 
  },
  footer: { textAlign: 'center', fontSize: 12, color: '#bfc7d1', marginBottom: 8 },
});


