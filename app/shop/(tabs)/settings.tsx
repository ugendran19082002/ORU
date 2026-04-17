import React, { useState } from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  TouchableOpacity, Switch, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { useAppSession } from '@/hooks/use-app-session';

import { useSecurityStore } from '@/stores/securityStore';
import { PinEntryModal } from '@/components/security/PinEntryModal';
import { shopApi } from '@/api/shopApi';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { Shadow, thannigoPalette, roleAccent, roleSurface } from '@/constants/theme';

const SHOP_ACCENT = roleAccent.shop_owner;
const SHOP_SURF = roleSurface.shop_owner;

type NavItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  badge?: string;
  color?: string;
};

const QUICK_ACTIONS: NavItem[] = [
  { label: 'Inventory', icon: 'cube-outline', route: '/shop/inventory', color: '#005d90' },
  { label: 'Can Management', icon: 'water-outline', route: '/shop/can-management', color: '#0077b6' },
  { label: 'Earnings', icon: 'cash-outline', route: '/shop/earnings', color: '#10b981' },
  { label: 'Delivery Slots', icon: 'calendar-outline', route: '/shop/slots', color: '#f59e0b' },
  { label: 'Business Hours', icon: 'time-outline', route: '/shop/schedule', color: '#6366f1' },
];

const SHOP_MGMT_MENU: NavItem[] = [
  { label: 'Operational Rules', icon: 'settings-outline', route: '/shop/operational-settings' },
  { label: 'Holiday Master', icon: 'calendar-outline', route: '/shop/holidays' },
  { label: 'Shop Profile & Address', icon: 'storefront-outline', route: '/shop/profile' },
  { label: 'Promotions & Coupons', icon: 'pricetag-outline', route: '/shop/promotions', badge: 'NEW' },
  { label: 'Staff Management', icon: 'people-outline', route: '/shop/staff' },
  { label: 'Customer Reviews', icon: 'star-outline', route: '/shop/reviews' },
  { label: 'Delivery Management', icon: 'bicycle-outline', route: '/shop/delivery' },
  { label: 'Subscription Plans', icon: 'shield-checkmark-outline', route: '/shop/subscription-plans' },
];

const SUPPORT_MENU: NavItem[] = [
  { label: 'Notifications', icon: 'notifications-outline', route: '/notifications' },
  { label: 'Customer Complaints', icon: 'warning-outline', route: '/shop/complaints' },
  { label: 'Report an Issue', icon: 'chatbubble-ellipses-outline', route: '/report-issue' },
  { label: 'Emergency Help', icon: 'warning-outline', route: '/emergency-help', color: '#c62828' },
];

const LEGAL_MENU: NavItem[] = [
  { label: 'Terms of Service', icon: 'document-text-outline', route: '/terms' },
  { label: 'Support & Help', icon: 'help-buoy-outline', route: '/report-issue' },
];

function GridItem({ item }: { item: NavItem }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.gridCard}
      onPress={() => item.route && router.navigate(item.route as any)}
      activeOpacity={0.7}
    >
      <View style={[styles.gridIcon, { backgroundColor: item.color + '15' }]}>
        <Ionicons name={item.icon} size={24} color={item.color} />
      </View>
      <Text style={styles.gridLabel}>{item.label}</Text>
    </TouchableOpacity>
  );
}

function MenuRow({ item }: { item: NavItem }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.menuRow}
      onPress={() => item.route && router.navigate(item.route as any)}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: item.color ? item.color + '15' : '#f1f4f9' }]}>
        <Ionicons name={item.icon} size={20} color={item.color ?? '#006878'} />
      </View>
      <Text style={[styles.menuLabel, item.color && { color: item.color }]}>{item.label}</Text>
      {item.badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color="#bfc7d1" />
    </TouchableOpacity>
  );
}

export default function ShopSettingsScreen() {
  const router = useRouter();
  const { signOut } = useAppSession();
  const { 
    isPinEnabled, isBiometricsEnabled, togglePin, toggleBiometrics, 
    enablePinRemote, authenticateBiometrics,
  } = useSecurityStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [, setIsLoading] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [deliveryActive, setDeliveryActive] = useState(false);
  const [, setShopName] = useState('');
  const [, setShopAddress] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinMode, setPinMode] = useState<'set' | 'verify'>('set');

  React.useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const data = await shopApi.getMyShop();
      if (data) {
        setShopOpen(data.is_open);
        setShopName(data.name ?? '');
        setShopAddress([data.address_line1, data.city].filter(Boolean).join(', '));
      }
      const settings = await shopApi.getShopSettings();
      if (settings) {
        setDeliveryActive(!settings.busy_mode);
      }
    } catch (error) {
      console.error('[Settings] Fetch failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSettings().finally(() => setRefreshing(false));
  };

  const handleToggleShop = async (val: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShopOpen(val);
      await shopApi.toggleShopOpen(val);
      Toast.show({
        type: 'success',
        text1: val ? 'Shop matches Open' : 'Shop matches Closed',
        text2: val ? 'You can now receive new orders.' : 'No new orders will be accepted.'
      });
    } catch (error) {
      setShopOpen(!val);
      Toast.show({ type: 'error', text1: 'Update failed' });
    }
  };

  const handleToggleDelivery = async (val: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setDeliveryActive(val);
      await shopApi.toggleBusyMode(!val);
      Toast.show({
        type: 'success',
        text1: val ? 'Delivery Active' : 'Delivery Paused',
        text2: val ? 'Orders will be assigned to agents.' : 'New orders will be auto-rejected.'
      });
    } catch (error) {
      setDeliveryActive(!val);
      Toast.show({ type: 'error', text1: 'Update failed' });
    }
  };


  const handleSetPin = async (newPin: string) => {
    await enablePinRemote(newPin);
    Toast.show({ type: 'success', text1: 'PIN Set Successfully' });
  };



  const handleSignOut = async () => {
    require('react-native').Alert.alert('Sign Out', 'Are you sure you want to sign out of the Shop Panel?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth' as any);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>

          <View>
            <View style={styles.brandRow}>
              <Logo size="md" />
              <Text style={styles.brandName}>ThanniGo</Text>
            </View>
            <Text style={styles.roleLabel}>SHOP PANEL</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => router.push('/notifications' as any)}
        >
          <Ionicons name="notifications-outline" size={22} color={SHOP_ACCENT} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[SHOP_ACCENT]} tintColor={SHOP_ACCENT} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
      >
        <Text style={styles.pageTitle}>Settings</Text>



        {/* QUICK STATUS */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>Shop Open</Text>
              <Text style={styles.statusSub}>Customers can place new orders</Text>
            </View>
            <Switch
              value={shopOpen}
              onValueChange={handleToggleShop}
              trackColor={{ false: '#e0e2e8', true: '#a7edff' }}
              thumbColor={shopOpen ? '#006878' : '#707881'}
            />
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>Delivery Active</Text>
              <Text style={styles.statusSub}>Delivery agents are available</Text>
            </View>
            <Switch
              value={deliveryActive}
              onValueChange={handleToggleDelivery}
              trackColor={{ false: '#e0e2e8', true: '#a7edff' }}
              thumbColor={deliveryActive ? '#006878' : '#707881'}
            />
          </View>
        </View>


        {/* QUICK ACTIONS GRID */}
        <Text style={styles.sectionHeader}>Quick Operations</Text>
        <View style={styles.gridContainer}>
          {QUICK_ACTIONS.map((item) => (
            <GridItem key={item.label} item={item} />
          ))}
        </View>

        {/* SHOP MANAGEMENT */}
        <Text style={styles.sectionHeader}>Shop Management</Text>
        <View style={styles.menuCard}>
          {SHOP_MGMT_MENU.map((item, i) => (
            <View key={item.label}>
              <MenuRow item={item} />
              {i < SHOP_MGMT_MENU.length - 1 && <View style={styles.menuDivider} />}
            </View>
          ))}
        </View>

        {/* SUPPORT & PRIVACY */}
        <Text style={styles.sectionHeader}>Privacy & Support</Text>
        <View style={styles.menuCard}>
          <View style={styles.menuRow}>
            <View style={[styles.menuIcon, { backgroundColor: '#f1f4f9' }]}>
              <Ionicons name="lock-closed-outline" size={20} color="#006878" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>App PIN Lock</Text>
              <Text style={styles.statusSub}>Lock app when in background</Text>
            </View>
            <Switch
              value={isPinEnabled}
              onValueChange={(val) => {
                if (val) {
                  setPinMode('set');
                  setShowPinModal(true);
                } else {
                  togglePin(false);
                }
              }}
              trackColor={{ false: '#e0e2e8', true: '#a7edff' }}
              thumbColor={isPinEnabled ? '#006878' : '#707881'}
            />
          </View>
          
          <View style={styles.menuDivider} />
          
          <View style={styles.menuRow}>
            <View style={[styles.menuIcon, { backgroundColor: '#f1f4f9' }]}>
              <Ionicons name="finger-print-outline" size={20} color="#006878" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>Biometric Unlock</Text>
              <Text style={styles.statusSub}>Use FaceID or Fingerprint</Text>
            </View>
            <Switch
              value={isBiometricsEnabled}
              onValueChange={async (val) => {
                if (val) {
                  const success = await authenticateBiometrics();
                  if (!success) {
                    Toast.show({ type: 'error', text1: 'Biometrics Failed', text2: 'Verification failed' });
                    return;
                  }
                }
                toggleBiometrics(val);
                Toast.show({ 
                  type: 'success', 
                  text1: val ? 'Biometrics Enabled' : 'Biometrics Disabled' 
                });
              }}
              disabled={!isPinEnabled}
              trackColor={{ false: '#e0e2e8', true: '#a7edff' }}
              thumbColor={isBiometricsEnabled ? '#006878' : '#707881'}
            />
          </View>

          {isPinEnabled && (
            <>
              <View style={styles.menuDivider} />
              <TouchableOpacity 
                style={styles.menuRow}
                onPress={() => {
                  setPinMode('set');
                  setShowPinModal(true);
                }}
              >
                <View style={[styles.menuIcon, { backgroundColor: '#f1f4f9' }]}>
                  <Ionicons name="key-outline" size={20} color="#006878" />
                </View>
                <Text style={styles.menuLabel}>Change App PIN</Text>
                <Ionicons name="chevron-forward" size={16} color="#bfc7d1" />
              </TouchableOpacity>
            </>
          )}

          <View style={styles.menuDivider} />

          {SUPPORT_MENU.map((item, i) => (
            <View key={item.label}>
              <MenuRow item={item} />
              {i < SUPPORT_MENU.length - 1 && <View style={styles.menuDivider} />}
            </View>
          ))}
        </View>

        <Text style={styles.sectionHeader}>Legal & More</Text>
        <View style={styles.menuCard}>
          {LEGAL_MENU.map((item, i) => (
            <View key={item.label}>
              <MenuRow item={item} />
              {i < LEGAL_MENU.length - 1 && <View style={styles.menuDivider} />}
            </View>
          ))}
        </View>

 

        {/* SIGN OUT */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#ba1a1a" />
          <Text style={styles.signOutText}>Sign Out from Shop Panel</Text>
        </TouchableOpacity>

        <Text style={styles.version}>ThanniGo Shop Panel · v1.0.0</Text>
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
  container: { flex: 1, backgroundColor: thannigoPalette.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.92)',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 22, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5 },
  roleLabel: { fontSize: 9, fontWeight: '700', color: SHOP_ACCENT, letterSpacing: 1.5, marginTop: 3 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: thannigoPalette.surface, alignItems: 'center', justifyContent: 'center', position: 'relative', ...Shadow.xs },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, backgroundColor: '#ba1a1a', borderRadius: 4 },
  pageTitle: { fontSize: 32, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5, marginTop: 10, marginBottom: 20 },

  statusCard: { backgroundColor: thannigoPalette.surface, borderRadius: 20, padding: 18, marginBottom: 22, ...Shadow.xs },
  statusRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  statusTitle: { fontSize: 15, fontWeight: '800', color: thannigoPalette.darkText, marginBottom: 2 },
  statusSub: { fontSize: 12, color: thannigoPalette.neutral },
  statusDivider: { height: 1, backgroundColor: thannigoPalette.borderSoft, marginVertical: 14 },

  sectionHeader: { fontSize: 12, fontWeight: '800', color: thannigoPalette.neutral, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },

  menuCard: { backgroundColor: thannigoPalette.surface, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 20, ...Shadow.xs },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  gridCard: { flex: 1, minWidth: '45%', backgroundColor: thannigoPalette.surface, borderRadius: 20, padding: 16, alignItems: 'center', gap: 10, ...Shadow.xs },
  gridIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  gridLabel: { fontSize: 13, fontWeight: '800', color: thannigoPalette.darkText },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  menuIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: thannigoPalette.darkText },
  menuDivider: { height: 1, backgroundColor: thannigoPalette.borderSoft, marginLeft: 50 },
  badge: { backgroundColor: SHOP_SURF, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginRight: 4 },
  badgeText: { fontSize: 9, fontWeight: '800', color: SHOP_ACCENT, letterSpacing: 0.5 },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: thannigoPalette.surface, borderRadius: 20, padding: 16, marginBottom: 22,
    ...Shadow.xs, borderWidth: 1.5, borderColor: SHOP_SURF,
  },
  profileIconWrap: { width: 52, height: 52, borderRadius: 16, backgroundColor: SHOP_SURF, alignItems: 'center', justifyContent: 'center' },
  shopName: { fontSize: 15, fontWeight: '800', color: thannigoPalette.darkText, marginBottom: 2 },
  shopAddress: { fontSize: 12, color: thannigoPalette.neutral, lineHeight: 16 },
  editBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: thannigoPalette.background, alignItems: 'center', justifyContent: 'center' },

  inputGroup: { paddingVertical: 4 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: thannigoPalette.neutral, marginBottom: 8 },
  settingInput: {
    backgroundColor: thannigoPalette.background,
    borderRadius: 12, borderWidth: 1.5, borderColor: thannigoPalette.borderSoft,
    paddingHorizontal: 16, height: 48, fontSize: 15, fontWeight: '700', color: thannigoPalette.darkText,
  },
  saveBtn: { backgroundColor: SHOP_ACCENT, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: thannigoPalette.surface, borderWidth: 2, borderColor: '#ffdad6',
    borderRadius: 18, paddingVertical: 16, marginBottom: 12,
  },
  signOutText: { color: '#ba1a1a', fontWeight: '800', fontSize: 15 },
  version: { fontSize: 11, color: thannigoPalette.neutral, textAlign: 'center', fontWeight: '500' },
});

