import React, { useCallback } from 'react';
import {
  View, Text, ScrollView,
  RefreshControl, Linking, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';

import { Logo } from '@/components/ui/Logo';
import { useAppSession } from '@/hooks/use-app-session';
import { addressApi } from '@/api/addressApi';
import { useSecurityStore } from '@/stores/securityStore';
import { useOrderStore } from '@/stores/orderStore';
import { Shadow, roleAccent, roleSurface, roleGradients, Radius } from '@/constants/theme';
import { useAppTheme, ThemePreference, type ColorSchemeColors } from '@/providers/ThemeContext';

const CUSTOMER_ACCENT = roleAccent.customer;
const CUSTOMER_SURF = roleSurface.customer;
const CUSTOMER_GRAD: [string, string] = [roleGradients.customer.start, roleGradients.customer.end];

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

export default function ProfileScreen() {
  const { colors, isDark, themePreference, setThemePreference } = useAppTheme();
  const router = useRouter();
  const { signOut, user, emergencyReset } = useAppSession();
  const { isPinEnabled, initialize: initSecurity } = useSecurityStore();
  const { orders, fetchOrders } = useOrderStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [addressCount, setAddressCount] = React.useState(0);

  React.useEffect(() => { initSecurity(); }, []);

  const fetchAddressCount = React.useCallback(async () => {
    try {
      const res = await addressApi.getAddresses();
      if (res.data?.status === 1) setAddressCount(res.data.data.length);
    } catch {}
  }, []);

  React.useEffect(() => { fetchAddressCount(); }, [fetchAddressCount]);

  useFocusEffect(useCallback(() => { fetchOrders(); }, [fetchOrders]));

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchAddressCount(), fetchOrders()]);
    setRefreshing(false);
  }, [fetchAddressCount, fetchOrders]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth' as any);
  };

  const menuItems = [
    { icon: 'location-outline' as const, label: 'Saved Addresses', subtitle: `${addressCount} saved locations`, route: '/addresses' },
    { icon: 'card-outline' as const, label: 'Payment Methods', subtitle: 'UPI, Cards', route: '/customer-payment-methods' },
    { icon: 'document-text-outline' as const, label: 'Payment History', subtitle: 'All transactions', route: '/payments/history' },
    { icon: 'receipt-outline' as const, label: 'Order History', subtitle: 'View past orders', route: '/(tabs)/orders' },
    { icon: 'analytics-outline' as const, label: 'My Analytics', subtitle: 'Spendings and trends', route: '/customer-analytics' },
    { icon: 'star-outline' as const, label: 'My Reviews', subtitle: 'Manage your ratings', route: '/customer-reviews' },
    { icon: 'repeat-outline' as const, label: 'Subscriptions', subtitle: 'Manage scheduled deliveries', route: '/subscriptions' },
    { icon: 'gift-outline' as const, label: 'Rewards', subtitle: 'Referral code and loyalty points', route: '/rewards' },
    { icon: 'shield-checkmark-outline' as const, label: 'Privacy & Security', subtitle: isPinEnabled ? 'PIN Protected' : 'Manage your data', route: '/privacy-security', pinBadge: isPinEnabled },
    { icon: 'help-circle-outline' as const, label: 'Help & Support', subtitle: '24/7 customer service', route: null },
    { icon: 'information-circle-outline' as const, label: 'About ThanniGo', subtitle: 'Version 1.0.0', route: null },
  ];

  const handleMenuPress = (item: typeof menuItems[0]) => {
    if (item.route) {
      router.push(item.route as any);
    } else if (item.label === 'Help & Support') {
      Alert.alert('Help & Support', 'How would you like to reach us?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Email Support', onPress: () => Linking.openURL('mailto:support@thannigo.com') },
      ]);
    } else if (item.label === 'About ThanniGo') {
      Toast.show({ type: 'info', text1: 'ThanniGo', text2: "India's fastest 15-minute water delivery.\n© 2026 ThanniGo Pvt. Ltd." });
    }
  };

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.brandRow}>
          <Logo size="md" />
          <Text style={[styles.brandName, { color: colors.text }]}>ThanniGo</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.background }]} onPress={() => router.push('/edit-profile' as any)}>
            <Ionicons name="settings-outline" size={22} color={CUSTOMER_ACCENT} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.background }]} onPress={() => router.push('/notifications' as any)}>
            <Ionicons name="notifications-outline" size={22} color={CUSTOMER_ACCENT} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[CUSTOMER_ACCENT]} tintColor={CUSTOMER_ACCENT} />}
      >
        {/* Profile card */}
        <LinearGradient colors={CUSTOMER_GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.profileCard}>
          <View style={styles.profileDecor}>
            <Ionicons name="person-circle" size={160} color="rgba(255,255,255,0.06)" />
          </View>
          <TouchableOpacity style={styles.cardEditBtn} onPress={() => router.push('/edit-profile' as any)}>
            <Ionicons name="pencil-sharp" size={16} color="white" />
          </TouchableOpacity>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={34} color={CUSTOMER_ACCENT} />
            </View>
            <TouchableOpacity style={styles.editAvatarBtn} onPress={() => router.push('/edit-profile' as any)}>
              <Ionicons name="camera" size={13} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{user?.name || 'User'}</Text>
          <Text style={styles.profilePhone}>{user?.phone || ''}</Text>
          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatVal}>{orders.length}</Text>
              <Text style={styles.profileStatLabel}>Orders</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatVal}>{user?.loyalty_points || 0}</Text>
              <Text style={styles.profileStatLabel}>Points</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Rewards banner */}
        <TouchableOpacity style={[styles.rewardsBanner, { backgroundColor: colors.customerSoft ?? CUSTOMER_SURF, borderColor: CUSTOMER_ACCENT + '40' }]} onPress={() => router.push('/rewards' as any)}>
          <View style={[styles.rewardsBannerIcon, { backgroundColor: colors.surface }]}>
            <Ionicons name="ribbon-outline" size={20} color={CUSTOMER_ACCENT} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rewardsBannerTitle, { color: CUSTOMER_ACCENT }]}>Earn Free Deliveries</Text>
            <Text style={[styles.rewardsBannerSub, { color: CUSTOMER_ACCENT }]}>Refer friends and earn up to 500 bonus points</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={CUSTOMER_ACCENT} />
        </TouchableOpacity>

        {/* Appearance */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.muted }]}>Theme Mode</Text>
          <View style={styles.themeToggleRow}>
            {THEME_OPTIONS.map((opt) => {
              const active = themePreference === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.themeOption,
                    { borderColor: colors.border, backgroundColor: colors.background },
                    active && { borderColor: CUSTOMER_ACCENT, backgroundColor: CUSTOMER_SURF },
                  ]}
                  onPress={() => setThemePreference(opt.value)}
                >
                  <Ionicons name={opt.icon as any} size={20} color={active ? CUSTOMER_ACCENT : colors.muted} />
                  <Text style={[styles.themeOptionText, { color: active ? CUSTOMER_ACCENT : colors.muted }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Account */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {menuItems.map((item, index) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => handleMenuPress(item)}>
                <View style={[styles.menuItemIcon, { backgroundColor: colors.customerSoft ?? CUSTOMER_SURF }]}>
                  <Ionicons name={item.icon} size={20} color={CUSTOMER_ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.menuItemLabel, { color: colors.text }]}>{item.label}</Text>
                    {item.pinBadge && (
                      <View style={[styles.pinBadge, { backgroundColor: colors.successSoft }]}>
                        <Ionicons name="lock-closed" size={9} color={colors.success} />
                        <Text style={[styles.pinBadgeText, { color: colors.success }]}>ACTIVE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.menuItemSub, { color: colors.muted }]}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </TouchableOpacity>
              {index < menuItems.length - 1 && <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />}
            </React.Fragment>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={[styles.signOutBtn, { backgroundColor: isDark ? '#2D0A0A' : '#fff0f0', borderColor: '#ffdad6' }]}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={18} color="#ba1a1a" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Delete / Reset */}
        <View style={styles.dangerRow}>
          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={() =>
              Alert.alert('Clear App Data', 'This clears your local session and logs you out. Use this if you have login or navigation issues.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear & Restart', style: 'destructive', onPress: async () => { await emergencyReset(); router.replace('/auth' as any); } },
              ])
            }
          >
            <Ionicons name="trash-outline" size={15} color={colors.muted} />
            <Text style={[styles.dangerBtnText, { color: colors.muted }]}>Clear App Cache</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={() =>
              Alert.alert('Delete Account', 'Permanently deletes your account within 30 days. Cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete', style: 'destructive',
                  onPress: async () => {
                    try {
                      const { apiClient } = require('@/api/client');
                      await apiClient.post('/users/me/delete-account');
                      Toast.show({ type: 'success', text1: 'Scheduled for deletion' });
                      await signOut();
                      router.replace('/auth' as any);
                    } catch (e: any) {
                      Toast.show({ type: 'error', text1: 'Failed', text2: e?.message });
                    }
                  },
                },
              ])
            }
          >
            <Ionicons name="person-remove-outline" size={15} color={colors.muted} />
            <Text style={[styles.dangerBtnText, { color: colors.muted }]}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Branding footer */}
        <View style={styles.footerRow}>
          <Ionicons name="water" size={13} color={CUSTOMER_ACCENT} />
          <Text style={[styles.footerBrand, { color: colors.text }]}>ThanniGo™</Text>
          <View style={[styles.footerSep, { backgroundColor: colors.border }]} />
          <Text style={[styles.footerFounder, { color: colors.muted }]}>Founded by Ugendran</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 42, height: 42, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', ...Shadow.xs },

  profileCard: { borderRadius: Radius.xl, padding: 26, marginTop: 20, marginBottom: 14, alignItems: 'center', overflow: 'hidden', position: 'relative', shadowColor: CUSTOMER_ACCENT, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  profileDecor: { position: 'absolute', right: -20, bottom: -20 },
  cardEditBtn: { position: 'absolute', top: 18, right: 18, width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: CUSTOMER_ACCENT, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' },
  profileName: { color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: -0.3, marginBottom: 4 },
  profilePhone: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500', marginBottom: 18 },
  profileStats: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  profileStat: { alignItems: 'center', gap: 2 },
  profileStatVal: { color: 'white', fontSize: 20, fontWeight: '900' },
  profileStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  profileStatDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.25)' },

  rewardsBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 14, marginBottom: 22, borderWidth: 1.5 },
  rewardsBannerIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rewardsBannerTitle: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  rewardsBannerSub: { fontSize: 11, fontWeight: '500', opacity: 0.8 },

  sectionTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3, marginBottom: 10 },

  card: { borderRadius: Radius.xl, marginBottom: 20, overflow: 'hidden', borderWidth: 1, ...Shadow.xs },
  cardLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10 },
  themeToggleRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingBottom: 16 },
  themeOption: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, gap: 6 },
  themeOptionText: { fontSize: 12, fontWeight: '700' },

  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 15 },
  menuItemIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuItemLabel: { fontSize: 14, fontWeight: '700', marginBottom: 1 },
  menuItemSub: { fontSize: 11 },
  menuDivider: { height: 1, marginLeft: 70 },
  pinBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  pinBadgeText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },

  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: Radius.lg, paddingVertical: 14, marginBottom: 12, borderWidth: 1.5 },
  signOutText: { color: '#ba1a1a', fontWeight: '700', fontSize: 15 },

  dangerRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  dangerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: Radius.md },
  dangerBtnText: { fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' },

  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, marginBottom: 4 },
  footerBrand: { fontSize: 14, fontWeight: '900', letterSpacing: -0.3 },
  footerSep: { width: 1, height: 12 },
  footerFounder: { fontSize: 12, fontWeight: '400', opacity: 0.6 },
});

