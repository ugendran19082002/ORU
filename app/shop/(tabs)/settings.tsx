import React, { useState } from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  TouchableOpacity, Switch, StyleSheet, Alert,
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
import type { ShopSettings } from '@/types/api';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { Shadow, roleAccent, roleSurface, Radius } from '@/constants/theme';
import { useAppTheme, ThemePreference } from '@/providers/ThemeContext';

const SHOP_ACCENT = roleAccent.shop_owner;
const SHOP_SURF = roleSurface.shop_owner;

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

type NavItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  badge?: string;
  color?: string;
};





const SHOP_MGMT_MENU: NavItem[] = [
  { label: 'Shop Profile & Address', icon: 'storefront-outline', route: '/shop/profile' },
  { label: 'Holiday Master', icon: 'calendar-outline', route: '/shop/holidays' },

  { label: 'Promotions & Coupons', icon: 'pricetag-outline', route: '/shop/promotions', badge: 'NEW' },
  { label: 'Staff Management', icon: 'people-outline', route: '/shop/staff' },
  { label: 'Customer Reviews', icon: 'star-outline', route: '/shop/reviews' },
  { label: 'Fleet Management', icon: 'bicycle-outline', route: '/shop/delivery' },
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

export default function ShopSettingsScreen() {
  const router = useRouter();
  const { colors, isDark, themePreference, setThemePreference } = useAppTheme();
  const { user, signOut, refreshShopStatus, updateUser } = useAppSession();
  const { isPinEnabled, isBiometricsEnabled, togglePin, toggleBiometrics, enablePinRemote, authenticateBiometrics } = useSecurityStore();

  const [refreshing, setRefreshing] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [deliveryActive, setDeliveryActive] = useState(false);
  const [autoAccept, setAutoAccept] = useState(false);
  const [instantDelivery, setInstantDelivery] = useState(false);
  const [allowCod, setAllowCod] = useState(false);

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinMode, setPinMode] = useState<'set' | 'verify'>('set');

  React.useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const data = await shopApi.getMyShop();
      if (data) setShopOpen(data.is_open);
      const settings = await shopApi.getShopSettings();
      if (settings) {
        setDeliveryActive(!settings.busy_mode);
        setAutoAccept(settings.auto_accept_orders);
        setInstantDelivery(settings.enable_instant_delivery ?? false);
        setAllowCod(settings.allow_cod ?? false);
      }
    } catch {}
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSettings().finally(() => setRefreshing(false));
  };

  const handleToggleShop = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShopOpen(val);
    try {
      await shopApi.toggleShopOpen(val);
      Toast.show({ type: 'success', text1: val ? 'Shop is Open' : 'Shop is Closed', text2: val ? 'You can receive new orders.' : 'No new orders will be accepted.' });
    } catch {
      setShopOpen(!val);
      Toast.show({ type: 'error', text1: 'Update failed' });
    }
  };

  const handleToggleDelivery = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDeliveryActive(val);
    try {
      await shopApi.toggleBusyMode(!val);
      Toast.show({ type: 'success', text1: val ? 'Delivery Active' : 'Delivery Paused' });
    } catch {
      setDeliveryActive(!val);
      Toast.show({ type: 'error', text1: 'Update failed' });
    }
  };

  const handleToggleSetting = async (key: keyof ShopSettings, val: boolean, setter: (v: boolean) => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const oldVal = !val; 
    setter(val);
    try {
      await shopApi.updateShopSettings({ [key]: val } as any);
      Toast.show({ type: 'success', text1: 'Setting Updated' });
    } catch {
      setter(oldVal);
      Toast.show({ type: 'error', text1: 'Update failed' });
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Sign out of the Shop Panel?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/auth' as any); } },
    ]);
  };

  const bg = colors.background;
  const surf = colors.surface;
  const border = colors.border;
  const text = colors.text;
  const muted = colors.muted;
  const inputBg = colors.inputBg;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={[styles.header, { backgroundColor: surf, borderBottomColor: border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Logo size="md" />
          <View>
            <Text style={[styles.brandName, { color: text }]}>ThanniGo</Text>
            <Text style={styles.roleLabel}>SHOP PANEL</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.notifBtn, { backgroundColor: inputBg }]} onPress={() => router.push('/notifications' as any)}>
          <Ionicons name="notifications-outline" size={22} color={SHOP_ACCENT} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[SHOP_ACCENT]} tintColor={SHOP_ACCENT} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
      >
        <Text style={[styles.pageTitle, { color: text }]}>Settings</Text>

        {/* Quick status */}
        <Text style={[styles.sectionLabel, { color: muted }]}>QUICK OPTIONS</Text>
        <View style={[styles.card, { backgroundColor: surf, borderColor: border }]}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.switchTitle, { color: text }]}>Shop Accepting Orders</Text>
              <Text style={[styles.switchSub, { color: muted }]}>Manual override to open/close shop</Text>
            </View>
            <Switch value={shopOpen} onValueChange={handleToggleShop} trackColor={{ false: border, true: '#a7edff' }} thumbColor={shopOpen ? SHOP_ACCENT : muted} />
          </View>
          <View style={[styles.divider, { backgroundColor: border }]} />
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.switchTitle, { color: text }]}>Delivery Service</Text>
              <Text style={[styles.switchSub, { color: muted }]}>Toggle active delivery status</Text>
            </View>
            <Switch value={deliveryActive} onValueChange={handleToggleDelivery} trackColor={{ false: border, true: '#a7edff' }} thumbColor={deliveryActive ? SHOP_ACCENT : muted} />
          </View>
          <View style={[styles.divider, { backgroundColor: border }]} />
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.switchTitle, { color: text }]}>Auto-Accept Mode</Text>
              <Text style={[styles.switchSub, { color: muted }]}>Skip manual confirmation for new orders</Text>
            </View>
            <Switch value={autoAccept} onValueChange={(v) => handleToggleSetting('auto_accept_orders', v, setAutoAccept)} trackColor={{ false: border, true: '#a7edff' }} thumbColor={autoAccept ? SHOP_ACCENT : muted} />
          </View>
          <View style={[styles.divider, { backgroundColor: border }]} />
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.switchTitle, { color: text }]}>Instant Delivery</Text>
              <Text style={[styles.switchSub, { color: muted }]}>Support orders for immediate fulfillment</Text>
            </View>
            <Switch value={instantDelivery} onValueChange={(v) => handleToggleSetting('enable_instant_delivery', v, setInstantDelivery)} trackColor={{ false: border, true: '#a7edff' }} thumbColor={instantDelivery ? SHOP_ACCENT : muted} />
          </View>
          <View style={[styles.divider, { backgroundColor: border }]} />
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.switchTitle, { color: text }]}>Allow COD</Text>
              <Text style={[styles.switchSub, { color: muted }]}>Accept Cash on Delivery payments</Text>
            </View>
            <Switch value={allowCod} onValueChange={(v) => handleToggleSetting('allow_cod', v, setAllowCod)} trackColor={{ false: border, true: '#a7edff' }} thumbColor={allowCod ? SHOP_ACCENT : muted} />
          </View>
        </View>

        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: muted }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: surf, borderColor: border }]}>
          <Text style={[styles.cardSubLabel, { color: muted }]}>Theme Mode</Text>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((opt) => {
              const active = themePreference === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.themeOption,
                    { borderColor: border, backgroundColor: bg },
                    active && { borderColor: SHOP_ACCENT, backgroundColor: SHOP_SURF },
                  ]}
                  onPress={() => setThemePreference(opt.value)}
                >
                  <Ionicons name={opt.icon as any} size={18} color={active ? SHOP_ACCENT : muted} />
                  <Text style={[styles.themeOptionText, { color: active ? SHOP_ACCENT : muted }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>



      

        {/* Shop management */}
        <Text style={[styles.sectionLabel, { color: muted }]}>SHOP MANAGEMENT</Text>
        <View style={[styles.card, { backgroundColor: surf, borderColor: border }]}>
          {SHOP_MGMT_MENU.map((item, i) => (
            <View key={item.label}>
              <TouchableOpacity style={styles.menuRow} onPress={() => router.navigate(item.route as any)} activeOpacity={0.7}>
                <View style={[styles.menuIcon, { backgroundColor: (item.color ?? SHOP_ACCENT) + '18' }]}>
                  <Ionicons name={item.icon} size={19} color={item.color ?? SHOP_ACCENT} />
                </View>
                <Text style={[styles.menuLabel, { color: item.color ?? text, marginLeft: 12 }]}>{item.label}</Text>
                {item.badge && (
                  <View style={[styles.badge, { backgroundColor: SHOP_SURF }]}>
                    <Text style={[styles.badgeText, { color: SHOP_ACCENT }]}>{item.badge}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={16} color={muted} />
              </TouchableOpacity>
              {i < SHOP_MGMT_MENU.length - 1 && <View style={[styles.menuDivider, { backgroundColor: border }]} />}
            </View>
          ))}
        </View>

        {/* Security */}
        <Text style={[styles.sectionLabel, { color: muted }]}>PRIVACY & SECURITY</Text>
        <View style={[styles.card, { backgroundColor: surf, borderColor: border }]}>
          <View style={styles.switchRow}>
            <View style={[styles.menuIcon, { backgroundColor: SHOP_SURF }]}>
              <Ionicons name="lock-closed-outline" size={19} color={SHOP_ACCENT} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.switchTitle, { color: text }]}>App PIN Lock</Text>
              <Text style={[styles.switchSub, { color: muted }]}>Lock app when in background</Text>
            </View>
            <Switch
              value={isPinEnabled}
              onValueChange={(val) => { if (val) { setPinMode('set'); setShowPinModal(true); } else { togglePin(false); } }}
              trackColor={{ false: border, true: '#a7edff' }}
              thumbColor={isPinEnabled ? SHOP_ACCENT : muted}
            />
          </View>
          <View style={[styles.menuDivider, { backgroundColor: border }]} />
          <View style={styles.switchRow}>
            <View style={[styles.menuIcon, { backgroundColor: SHOP_SURF }]}>
              <Ionicons name="finger-print-outline" size={19} color={SHOP_ACCENT} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.switchTitle, { color: text }]}>Biometric Unlock</Text>
              <Text style={[styles.switchSub, { color: muted }]}>Face ID or Fingerprint</Text>
            </View>
            <Switch
              value={isBiometricsEnabled}
              onValueChange={async (val) => {
                if (val) {
                  const ok = await authenticateBiometrics();
                  if (!ok) { Toast.show({ type: 'error', text1: 'Biometrics failed' }); return; }
                }
                toggleBiometrics(val);
                Toast.show({ type: 'success', text1: val ? 'Biometrics enabled' : 'Biometrics disabled' });
              }}
              disabled={!isPinEnabled}
              trackColor={{ false: border, true: '#a7edff' }}
              thumbColor={isBiometricsEnabled ? SHOP_ACCENT : muted}
            />
          </View>
          {isPinEnabled && (
            <>
              <View style={[styles.menuDivider, { backgroundColor: border }]} />
              <TouchableOpacity style={styles.menuRow} onPress={() => { setPinMode('set'); setShowPinModal(true); }}>
                <View style={[styles.menuIcon, { backgroundColor: SHOP_SURF }]}>
                  <Ionicons name="key-outline" size={19} color={SHOP_ACCENT} />
                </View>
                <Text style={[styles.menuLabel, { color: text, marginLeft: 12 }]}>Change App PIN</Text>
                <Ionicons name="chevron-forward" size={16} color={muted} />
              </TouchableOpacity>
            </>
          )}
          <View style={[styles.menuDivider, { backgroundColor: border }]} />
          {SUPPORT_MENU.map((item, i) => (
            <View key={item.label}>
              <TouchableOpacity style={styles.menuRow} onPress={() => router.navigate(item.route as any)} activeOpacity={0.7}>
                <View style={[styles.menuIcon, { backgroundColor: (item.color ?? SHOP_ACCENT) + '18' }]}>
                  <Ionicons name={item.icon} size={19} color={item.color ?? SHOP_ACCENT} />
                </View>
                <Text style={[styles.menuLabel, { color: item.color ?? text, marginLeft: 12 }]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={muted} />
              </TouchableOpacity>
              {i < SUPPORT_MENU.length - 1 && <View style={[styles.menuDivider, { backgroundColor: border }]} />}
            </View>
          ))}
        </View>

        {/* Legal */}
        <Text style={[styles.sectionLabel, { color: muted }]}>LEGAL & MORE</Text>
        <View style={[styles.card, { backgroundColor: surf, borderColor: border }]}>
          {LEGAL_MENU.map((item, i) => (
            <View key={item.label}>
              <TouchableOpacity style={styles.menuRow} onPress={() => router.navigate(item.route as any)} activeOpacity={0.7}>
                <View style={[styles.menuIcon, { backgroundColor: SHOP_SURF }]}>
                  <Ionicons name={item.icon} size={19} color={SHOP_ACCENT} />
                </View>
                <Text style={[styles.menuLabel, { color: text, marginLeft: 12 }]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={muted} />
              </TouchableOpacity>
              {i < LEGAL_MENU.length - 1 && <View style={[styles.menuDivider, { backgroundColor: border }]} />}
            </View>
          ))}
        </View>

        {/* Session Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: SHOP_ACCENT, backgroundColor: isDark ? '#0A1A1A' : '#f0fff4' }]}
            onPress={() => {
              Alert.alert('Switch Workspace', 'Switching to your Customer profile.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Switch', onPress: () => updateUser({ role: 'customer' }) }
              ]);
            }}
          >
            <Ionicons name="person-outline" size={18} color={SHOP_ACCENT} />
            <Text style={[styles.actionText, { color: SHOP_ACCENT }]}>Switch to Customer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: '#ffdad6', backgroundColor: isDark ? '#2D0A0A' : '#fff0f0' }]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={18} color="#ba1a1a" />
            <Text style={[styles.actionText, { color: '#ba1a1a' }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.brandingFooter}>
          <Text style={[styles.brandText, { color: colors.text }]}>
            ThanniGo™
          </Text>
          <Text style={[styles.founderText, { color: muted }]}>
            Founded by Ugendran
          </Text>
        </View>
      </ScrollView>

      <PinEntryModal
        visible={showPinModal}
        mode={pinMode}
        onSuccess={async (pin) => {
          if (pinMode === 'set') { await enablePinRemote(pin); Toast.show({ type: 'success', text1: 'PIN set' }); }
          setShowPinModal(false);
        }}
        onCancel={() => setShowPinModal(false)}
        title={pinMode === 'set' ? 'Set App PIN' : 'Verify PIN'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  brandName: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  roleLabel: { fontSize: 9, fontWeight: '700', color: SHOP_ACCENT, letterSpacing: 1.5, marginTop: 2 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', position: 'relative', ...Shadow.xs },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, backgroundColor: '#ba1a1a', borderRadius: 4 },

  pageTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginTop: 10, marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, marginLeft: 2 },

  card: { borderRadius: Radius.xl, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 20, borderWidth: 1, ...Shadow.xs },
  cardSubLabel: { fontSize: 12, fontWeight: '700', paddingTop: 14, paddingBottom: 10, paddingHorizontal: 2 },
  divider: { height: 1, marginVertical: 4 },

  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 2 },
  switchTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  switchSub: { fontSize: 12, lineHeight: 17 },

  themeRow: { flexDirection: 'row', gap: 10, paddingBottom: 14 },
  themeOption: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 13, borderWidth: 1.5, gap: 5 },
  themeOptionText: { fontSize: 11, fontWeight: '700' },

  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  gridCard: { width: '31%', flexGrow: 1, alignItems: 'center', borderRadius: 16, padding: 14, gap: 8, borderWidth: 1, ...Shadow.xs },
  gridIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  gridLabel: { fontSize: 11, fontWeight: '800', textAlign: 'center' },

  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
  menuIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  menuDivider: { height: 1, marginLeft: 50 },
  brandingFooter: { alignItems: 'center', marginTop: 32, marginBottom: 40, opacity: 0.8 },
  brandText: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  founderText: { fontSize: 11, fontWeight: '400', marginTop: 2 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7, marginRight: 6 },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: Radius.lg, paddingVertical: 14, borderWidth: 1.5 },
  actionText: { fontWeight: '700', fontSize: 13 },

  signOutText: { color: '#ba1a1a', fontWeight: '800', fontSize: 14 },

  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16, marginBottom: 4 },
  footerBrand: { fontSize: 14, fontWeight: '900', letterSpacing: -0.3 },
  footerSep: { width: 1, height: 12 },
  footerFounder: { fontSize: 12, fontWeight: '400', opacity: 0.6 },
});
