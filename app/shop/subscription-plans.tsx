import {
  View, Text, StyleSheet, TouchableOpacity, Switch,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/providers/ThemeContext';
import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { subscriptionApi, SubscriptionData } from '@/api/subscriptionApi';

import { Shadow, roleAccent, roleSurface, roleGradients } from '@/constants/theme';

const SHOP_ACCENT = roleAccent.shop_owner;
const SHOP_SURF = roleSurface.shop_owner;
const SHOP_GRAD: [string, string] = [roleGradients.shop_owner.start, roleGradients.shop_owner.end];

type SubStatus = 'INACTIVE' | 'PENDING_PAYMENT' | 'ACTIVE' | 'PAYMENT_FAILED' | 'EXPIRED' | 'CANCELLED';





const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING_PAYMENT: 'Pending Payment',
  PAYMENT_FAILED: 'Payment Failed',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
};

export default function ShopSubscriptionPlansScreen() {
  const { colors, isDark } = useAppTheme();

  const PLAN_FEATURES = [
    { icon: 'checkmark-circle', text: 'Priority listing in search results', color: colors.success },
    { icon: 'checkmark-circle', text: 'Advanced analytics dashboard', color: colors.success },
    { icon: 'checkmark-circle', text: 'Lower platform commission', color: colors.success },
    { icon: 'checkmark-circle', text: 'Instant delivery support', color: colors.success },
    { icon: 'checkmark-circle', text: 'Cancel anytime', color: colors.success },
  ];

  const STATUS_COLOR: Record<string, string> = {
    ACTIVE: colors.success,
    INACTIVE: colors.muted,
    PENDING_PAYMENT: '#b45309',
    PAYMENT_FAILED: '#dc2626',
    EXPIRED: '#94a3b8',
    CANCELLED: '#94a3b8',
  };

  const styles = makeStyles(colors);
  const router = useRouter();
  const { safeBack } = useAppNavigation();

  useAndroidBackHandler(() => {
    safeBack('/shop/settings');
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRenew, setAutoRenew] = useState(true);

  const fetchSubscription = useCallback(async () => {
    try {
      setError(null);
      const data = await subscriptionApi.getSubscription();
      setSubscription(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load subscription.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const isActive = subscription?.status === 'ACTIVE';

  const handleActivate = () => {
    Alert.alert(
      'Activate Subscription',
      'Activate your shop subscription? Your first plan is FREE.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: async () => {
            try {
              setActionLoading(true);
              await subscriptionApi.activateSubscription(undefined, autoRenew);
              Toast.show({ type: 'success', text1: 'Subscribed!', text2: 'Shop subscription is now active.' });
              await fetchSubscription();
            } catch (e: any) {
              Toast.show({ type: 'error', text1: 'Error', text2: e.message || 'Activation failed.' });
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to premium features.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await subscriptionApi.cancelSubscription('User requested cancellation');
              Toast.show({ type: 'success', text1: 'Cancelled', text2: 'Subscription has been cancelled.' });
              await fetchSubscription();
            } catch (e: any) {
              Toast.show({ type: 'error', text1: 'Error', text2: e.message || 'Cancellation failed.' });
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const heroGradient: [string, string] = isActive ? [colors.success, '#1b5e20'] : [SHOP_ACCENT, SHOP_ACCENT];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <BackButton fallback="/shop/settings" />
          <View>
            <View style={styles.brandRow}>
              <Logo size="md" />
              <Text style={styles.brandName}>ThanniGo</Text>
            </View>
            <Text style={styles.roleLabel}>SHOP PANEL</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.notifBtnSub} 
          onPress={() => router.push('/notifications' as any)}
        >
          <Ionicons name="notifications-outline" size={22} color={SHOP_ACCENT} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={SHOP_ACCENT} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color="#94a3b8" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchSubscription}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.pageTitle}>Shop Subscription</Text>

          {/* STATUS HERO CARD */}
          <LinearGradient colors={heroGradient} style={styles.heroCard}>
            <Ionicons name="water" size={80} color="rgba(255,255,255,0.07)" style={styles.heroDecor} />
            <Text style={styles.heroLabel}>SUBSCRIPTION STATUS</Text>
            <View style={styles.heroStatusRow}>
              <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[subscription?.status ?? 'INACTIVE'] }]} />
              <Text style={styles.heroStatus}>{STATUS_LABEL[subscription?.status ?? 'INACTIVE']}</Text>
            </View>
            {isActive && subscription?.subscription?.end_date && (
              <Text style={styles.heroSub}>Renews on {new Date(subscription.subscription.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            )}
            {!isActive && (
              <Text style={styles.heroSub}>Activate to unlock premium features — first plan is FREE</Text>
            )}
          </LinearGradient>

          {/* FEATURES */}
          {isActive && subscription?.features && (
            <>
              <Text style={styles.sectionTitle}>Active Features</Text>
              <View style={styles.featureGrid}>
                {[
                  { key: 'priorityListing', label: 'Priority Listing', icon: 'star' },
                  { key: 'analyticsAccess', label: 'Analytics', icon: 'bar-chart' },
                  { key: 'lowCommission', label: 'Lower Commission', icon: 'trending-down' },
                  { key: 'instantDelivery', label: 'Instant Delivery', icon: 'flash' },
                ].map((f) => {
                  const enabled = subscription.features[f.key as keyof typeof subscription.features];
                  return (
                    <View key={f.key} style={[styles.featureChip, !enabled && styles.featureChipOff]}>
                      <Ionicons name={f.icon as any} size={16} color={enabled ? colors.success : '#94a3b8'} />
                      <Text style={[styles.featureChipText, !enabled && styles.featureChipTextOff]}>{f.label}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* PLAN BENEFITS */}
          <Text style={styles.sectionTitle}>What's Included</Text>
          <View style={styles.benefitsList}>
            {PLAN_FEATURES.map((b) => (
              <View key={b.text} style={styles.benefitRow}>
                <Ionicons name={b.icon as any} size={18} color={b.color} />
                <Text style={styles.benefitText}>{b.text}</Text>
              </View>
            ))}
          </View>

          {/* AUTO-RENEW (only show if not active — settings for future activation) */}
          {!isActive && (
            <View style={styles.autoRenewCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.autoRenewTitle}>Auto-Renew</Text>
                <Text style={styles.autoRenewSub}>Automatically renew when the current period ends.</Text>
              </View>
              <Switch
                value={autoRenew}
                onValueChange={setAutoRenew}
                trackColor={{ false: colors.border, true: '#bfdbf7' }}
                thumbColor={autoRenew ? SHOP_ACCENT : '#94a3b8'}
              />
            </View>
          )}

          {/* ACTION BUTTON */}
          {isActive ? (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancel}
              disabled={actionLoading}
            >
              {actionLoading
                ? <ActivityIndicator color="#dc2626" />
                : <Text style={styles.cancelBtnText}>Cancel Subscription</Text>
              }
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.subscribeBtn} onPress={handleActivate} disabled={actionLoading}>
              <LinearGradient colors={[SHOP_ACCENT, SHOP_ACCENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.subscribeBtnGrad}>
                {actionLoading
                  ? <ActivityIndicator color="white" />
                  : <Text style={styles.subscribeBtnText}>Activate Free Plan</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  notifBtnSub: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  roleLabel: { fontSize: 9, fontWeight: '700', color: SHOP_ACCENT, letterSpacing: 1.5, marginTop: 3 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorText: { fontSize: 14, color: colors.muted, textAlign: 'center', fontWeight: '500' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: SHOP_ACCENT, borderRadius: 12 },
  retryText: { color: 'white', fontWeight: '700', fontSize: 14 },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: -0.5, marginBottom: 8 },
  heroCard: { borderRadius: 24, padding: 24, overflow: 'hidden', shadowColor: SHOP_ACCENT, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 },
  heroDecor: { position: 'absolute', right: -16, bottom: -16 },
  heroLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 8 },
  heroStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  heroStatus: { fontSize: 28, fontWeight: '900', color: 'white' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: '500' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#e8f5e9', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  featureChipOff: { backgroundColor: colors.border },
  featureChipText: { fontSize: 12, fontWeight: '700', color: colors.success },
  featureChipTextOff: { color: '#94a3b8' },
  benefitsList: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  autoRenewCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  autoRenewTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 2 },
  autoRenewSub: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  subscribeBtn: { borderRadius: 18, overflow: 'hidden' },
  subscribeBtnGrad: { paddingVertical: 17, alignItems: 'center' },
  subscribeBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
  cancelBtn: { borderWidth: 1.5, borderColor: '#dc2626', borderRadius: 18, paddingVertical: 16, alignItems: 'center', backgroundColor: '#fff5f5' },
  cancelBtnText: { color: '#dc2626', fontSize: 15, fontWeight: '800' },
});
