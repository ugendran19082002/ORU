import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { platformSubscriptionApi, PlatformPlan, PlatformSubscription } from '@/api/platformSubscriptionApi';


type PlanId = 'basic' | 'standard' | 'premium';

interface Plan {
  id: PlanId;
  name: string;
  cans: number;
  cadence: string;
  price: number;
  savings: number;
  popular: boolean;
  color: string;
  gradient: [string, string];
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    cans: 4,
    cadence: 'Monthly',
    price: 160,
    savings: 20,
    popular: false,
    color: '#006878',
    gradient: ['#006878', '#005566'],
    features: ['4 cans / month', 'Same-day delivery', 'Standard support', 'Pause anytime'],
  },
  {
    id: 'standard',
    name: 'Standard',
    cans: 8,
    cadence: 'Monthly',
    price: 300,
    savings: 40,
    popular: true,
    color: '#005d90',
    gradient: ['#005d90', '#003f6b'],
    features: ['8 cans / month', 'Priority delivery', 'Dedicated support', 'Pause & reschedule', 'Loyalty points 2×'],
  },
  {
    id: 'premium',
    name: 'Premium',
    cans: 15,
    cadence: 'Monthly',
    price: 525,
    savings: 75,
    popular: false,
    color: '#7c3aed',
    gradient: ['#7c3aed', '#5b21b6'],
    features: ['15 cans / month', 'Priority express', '24/7 support', 'Flexible schedule', 'Loyalty points 3×', 'Free delivery always'],
  },
];

interface ActiveSub {
  planId: PlanId;
  nextDelivery: string;
  remaining: number;
  paused: boolean;
}

export default function SubscriptionsScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();

  useAndroidBackHandler(() => { safeBack('/(tabs)/profile'); });

  // ─── Product subscription (water-can delivery plans) ─────────
  const [selected, setSelected] = useState<PlanId>('standard');
  const [activeSub, setActiveSub] = useState<ActiveSub | null>({
    planId: 'standard',
    nextDelivery: 'Tomorrow, 10 AM',
    remaining: 5,
    paused: false,
  });

  // ─── Platform subscription (Plus ₹99/month) ──────────────────
  const [platformPlans, setPlatformPlans] = useState<PlatformPlan[]>([]);
  const [myPlatformSub, setMyPlatformSub] = useState<PlatformSubscription | null>(null);
  const [platformLoading, setPlatformLoading] = useState(true);
  const [platformSubmitting, setPlatformSubmitting] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseEnd, setPauseEnd] = useState('');

  const fetchPlatformData = useCallback(async () => {
    try {
      const [plans, mySub] = await Promise.all([
        platformSubscriptionApi.listPlans(),
        platformSubscriptionApi.getMySubscription(),
      ]);
      setPlatformPlans(plans.filter((p) => p.price_monthly > 0));
      setMyPlatformSub(mySub);
    } catch { /* silently fallback */ }
    finally { setPlatformLoading(false); }
  }, []);

  useEffect(() => { fetchPlatformData(); }, [fetchPlatformData]);

  const plusPlan = platformPlans[0] ?? null;

  // ─── Helpers ──────────────────────────────────────────────────
  const subStatus = myPlatformSub?.status ?? null;

  const graceExpiresAt = (myPlatformSub as any)?.grace_expires_at ?? null;
  const graceDaysLeft = graceExpiresAt
    ? Math.max(0, Math.ceil((new Date(graceExpiresAt).getTime() - Date.now()) / 86400000))
    : 0;

  const freeDelivLeft = plusPlan
    ? Math.max(0, (plusPlan.free_delivery_count ?? 99) - (myPlatformSub?.free_deliveries_used ?? 0))
    : 99;

  // ─── Actions ─────────────────────────────────────────────────
  const handleGetPlus = () => {
    if (!plusPlan) return;
    Alert.alert(
      'Subscribe to Plus',
      `Get Plus Membership for ₹${plusPlan.price_monthly}/month?\n\n✓ Free delivery every order\n✓ ${plusPlan.auto_discount_pct}% auto discount\n✓ ${plusPlan.monthly_coupon_count} coupons/month\n✓ ${plusPlan.loyalty_boost_pct}% loyalty boost`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: async () => {
            setPlatformSubmitting(true);
            try {
              const sub = await platformSubscriptionApi.subscribe({ plan_id: plusPlan.id, billing_cycle: 'monthly' });
              setMyPlatformSub(sub);
              Toast.show({ type: 'success', text1: 'Plus Activated!', text2: 'Your membership is now active.' });
            } catch (e: any) {
              Toast.show({ type: 'error', text1: 'Failed', text2: e?.message ?? 'Could not activate Plus' });
            } finally { setPlatformSubmitting(false); }
          },
        },
      ],
    );
  };

  const handleCancelPlus = () => {
    if (!myPlatformSub) return;
    Alert.alert('Cancel Plus?', 'Benefits end immediately. Your existing coupons remain valid.', [
      { text: 'Keep Plus', style: 'cancel' },
      {
        text: 'Cancel', style: 'destructive',
        onPress: async () => {
          try {
            await platformSubscriptionApi.cancelSubscription(myPlatformSub.id);
            setMyPlatformSub(null);
            Toast.show({ type: 'success', text1: 'Cancelled', text2: 'Plus membership cancelled.' });
          } catch { Toast.show({ type: 'error', text1: 'Failed to cancel' }); }
        },
      },
    ]);
  };

  const handleRetryPayment = async () => {
    if (!myPlatformSub) return;
    try {
      setPlatformSubmitting(true);
      const result = await platformSubscriptionApi.retryPayment(myPlatformSub.id);
      Toast.show({ type: 'success', text1: 'Retry Initiated', text2: result.message });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Retry Failed', text2: e?.message ?? 'Could not retry payment' });
    } finally { setPlatformSubmitting(false); }
  };

  const handlePause = async () => {
    if (!myPlatformSub || !pauseEnd) {
      Toast.show({ type: 'error', text1: 'Enter a resume date' });
      return;
    }
    try {
      setPlatformSubmitting(true);
      const today = new Date().toISOString().split('T')[0];
      await platformSubscriptionApi.pauseSubscription(myPlatformSub.id, { pause_start: today, pause_end: pauseEnd });
      Toast.show({ type: 'success', text1: 'Paused', text2: `Subscription paused until ${pauseEnd}` });
      setShowPauseModal(false);
      setPauseEnd('');
      await fetchPlatformData();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed', text2: e?.message ?? 'Could not pause subscription' });
    } finally { setPlatformSubmitting(false); }
  };

  const handleResume = async () => {
    if (!myPlatformSub) return;
    try {
      setPlatformSubmitting(true);
      const updated = await platformSubscriptionApi.resumeSubscription(myPlatformSub.id);
      setMyPlatformSub(updated);
      Toast.show({ type: 'success', text1: 'Resumed!', text2: 'Your Plus membership is active again.' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed', text2: e?.message ?? 'Could not resume subscription' });
    } finally { setPlatformSubmitting(false); }
  };

  // ─── Water delivery plan actions ─────────────────────────────
  const togglePause = () => {
    if (!activeSub) return;
    setActiveSub({ ...activeSub, paused: !activeSub.paused });
    Toast.show({ type: 'success', text1: activeSub.paused ? 'Resumed!' : 'Paused!', text2: activeSub.paused ? 'Your subscription is active again.' : 'No deliveries until you resume.' });
  };

  const handleSubscribe = () => {
    const plan = PLANS.find((p) => p.id === selected)!;
    Alert.alert('Subscribe', `Activate ${plan.name} for ₹${plan.price}/month?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => setActiveSub({ planId: selected, nextDelivery: 'Tomorrow, 10 AM', remaining: plan.cans, paused: false }) },
    ]);
  };

  const activePlan = PLANS.find((p) => p.id === activeSub?.planId);



  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <BackButton fallback="/(tabs)/profile" />

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Subscriptions</Text>
          <Text style={styles.headerSub}>Save up to ₹75/month with a plan</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ─── PLUS MEMBERSHIP (Platform Subscription) ─────── */}
        <Text style={styles.sectionTitle}>Plus Membership</Text>

        {platformLoading ? (
          <View style={[styles.plusCard, { alignItems: 'center', paddingVertical: 24 }]}>
            <ActivityIndicator color="#7c3aed" />
          </View>

        ) : subStatus === 'active' ? (
          // ── ACTIVE ──────────────────────────────────────────────
          <LinearGradient colors={['#7c3aed', '#5b21b6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.plusCard}>
            <Ionicons name="diamond" size={80} color="rgba(255,255,255,0.06)" style={styles.plusDecor} />
            <View style={styles.plusTop}>
              <View>
                <Text style={styles.plusTitle}>Plus Member</Text>
                <Text style={styles.plusMeta}>Renews {new Date(myPlatformSub!.next_billing_at!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
              </View>
              <View style={styles.plusBadge}><Text style={styles.plusBadgeText}>ACTIVE</Text></View>
            </View>
            {/* Free delivery counter */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', marginBottom: 6 }}>Free deliveries this month</Text>
              <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3 }}>
                <View style={{ height: '100%', width: `${Math.min(100, ((99 - freeDelivLeft) / 99) * 100)}%`, backgroundColor: '#a5f3fc', borderRadius: 3 }} />
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 }}>{freeDelivLeft} / {plusPlan?.free_delivery_count ?? 99} remaining</Text>
            </View>
            <View style={styles.plusBenefitsRow}>
              {[`✓ ${plusPlan?.auto_discount_pct ?? 2}% discount`, `✓ ${plusPlan?.monthly_coupon_count ?? 3} coupons/mo`, `✓ ${plusPlan?.loyalty_boost_pct ?? 10}% boost`].map((b) => (
                <View key={b} style={styles.plusBenefit}><Text style={styles.plusBenefitText}>{b}</Text></View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <TouchableOpacity onPress={() => setShowPauseModal(true)} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>⏸ Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCancelPlus} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontWeight: '700', fontSize: 12 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

        ) : subStatus === 'paused' ? (
          // ── PAUSED ──────────────────────────────────────────────
          <LinearGradient colors={['#92400e', '#b45309']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.plusCard}>
            <View style={styles.plusTop}>
              <View>
                <Text style={styles.plusTitle}>Membership Paused</Text>
                <Text style={styles.plusMeta}>Resumes {myPlatformSub?.next_billing_at ? new Date(myPlatformSub.next_billing_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</Text>
              </View>
              <View style={[styles.plusBadge, { backgroundColor: 'rgba(251,191,36,0.35)' }]}><Text style={[styles.plusBadgeText, { color: '#fbbf24' }]}>PAUSED</Text></View>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 14 }}>Your benefits are frozen. Resume to reactivate free delivery and discounts.</Text>
            <TouchableOpacity onPress={handleResume} disabled={platformSubmitting} style={{ backgroundColor: '#fbbf24', borderRadius: 14, paddingVertical: 13, alignItems: 'center' }}>
              {platformSubmitting ? <ActivityIndicator color="#78350f" /> : <Text style={{ color: '#78350f', fontWeight: '800', fontSize: 14 }}>▶ Resume Membership</Text>}
            </TouchableOpacity>
          </LinearGradient>

        ) : subStatus === 'grace_period' ? (
          // ── PAYMENT FAILED / GRACE ───────────────────────────────
          <View style={[styles.plusCard, { borderColor: '#ef4444', borderWidth: 1.5 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="warning" size={22} color="#ef4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#1e1e2e' }}>Payment Failed</Text>
                <Text style={{ fontSize: 12, color: '#64748b' }}>Grace period: {graceDaysLeft} day{graceDaysLeft !== 1 ? 's' : ''} remaining</Text>
              </View>
            </View>
            <Text style={{ fontSize: 13, color: '#475569', marginBottom: 14, lineHeight: 20 }}>
              We couldn't charge your account. Your Plus benefits are preserved during the grace period. Retry payment to keep your membership active.
            </Text>
            <View style={{ height: 5, backgroundColor: '#fee2e2', borderRadius: 3, marginBottom: 14 }}>
              <View style={{ height: '100%', width: `${(graceDaysLeft / 3) * 100}%`, backgroundColor: '#ef4444', borderRadius: 3 }} />
            </View>
            <TouchableOpacity onPress={handleRetryPayment} disabled={platformSubmitting} style={{ backgroundColor: '#ef4444', borderRadius: 14, paddingVertical: 13, alignItems: 'center' }}>
              {platformSubmitting ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>↻ Retry Payment</Text>}
            </TouchableOpacity>
          </View>

        ) : subStatus === 'pending_payment' ? (
          // ── PENDING PAYMENT ─────────────────────────────────────
          <View style={[styles.plusCard, { alignItems: 'center', gap: 10, paddingVertical: 28 }]}>
            <ActivityIndicator color="#7c3aed" size="large" />
            <Text style={{ color: '#7c3aed', fontWeight: '700', fontSize: 14 }}>Processing payment…</Text>
            <Text style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center' }}>Please wait while we confirm your subscription. This usually takes a few seconds.</Text>
          </View>

        ) : subStatus === 'expired' || subStatus === 'cancelled' ? (
          // ── EXPIRED / CANCELLED ─────────────────────────────────
          <View style={styles.plusCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="diamond-outline" size={22} color="#94a3b8" />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#1e1e2e' }}>{subStatus === 'expired' ? 'Subscription Expired' : 'Subscription Cancelled'}</Text>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>Restart anytime — same ₹99/mo price</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleGetPlus} disabled={platformSubmitting || !plusPlan} style={{ borderRadius: 14, overflow: 'hidden' }}>
              <LinearGradient colors={['#7c3aed', '#5b21b6']} style={styles.plusSubscribeBtn}>
                {platformSubmitting ? <ActivityIndicator color="white" /> : <><Ionicons name="diamond-outline" size={18} color="white" /><Text style={styles.plusSubscribeBtnText}>Renew Plus — ₹99/mo</Text></>}
              </LinearGradient>
            </TouchableOpacity>
          </View>

        ) : (
          // ── INACTIVE (no subscription) ───────────────────────────
          <View style={styles.plusCard}>
            <View style={styles.plusPromoTop}>
              <View style={[styles.plusPromoIcon, { backgroundColor: '#ede9fe' }]}>
                <Ionicons name="diamond-outline" size={28} color="#7c3aed" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.plusPromoTitle}>Upgrade to Plus</Text>
                <Text style={styles.plusPromoSub}>Free delivery + 2% discount + coupons every month</Text>
              </View>
              <Text style={styles.plusPromoPrice}>₹99/mo</Text>
            </View>
            <View style={styles.plusBenefitsRow}>
              {['Free delivery', '2% auto discount', '3 coupons/month', '10% loyalty boost'].map((b) => (
                <View key={b} style={[styles.plusBenefit, { backgroundColor: '#ede9fe' }]}>
                  <Text style={[styles.plusBenefitText, { color: '#7c3aed' }]}>✓ {b}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity onPress={handleGetPlus} disabled={platformSubmitting || !plusPlan} style={{ borderRadius: 14, overflow: 'hidden', marginTop: 12 }}>
              <LinearGradient colors={['#7c3aed', '#5b21b6']} style={styles.plusSubscribeBtn}>
                {platformSubmitting ? <ActivityIndicator color="white" /> : <><Ionicons name="diamond-outline" size={18} color="white" /><Text style={styles.plusSubscribeBtnText}>Get Plus — ₹99/mo</Text></>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── PAUSE MODAL ────────────────────────────────────── */}
        {showPauseModal && (
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', marginTop: -8, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#1e1e2e', marginBottom: 4 }}>Pause Membership</Text>
            <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Your renewal date will be extended by the pause duration.</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 }}>Resume Date (YYYY-MM-DD)</Text>
            <View style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: pauseEnd ? '#1e1e2e' : '#94a3b8' }} onPress={() => {}} suppressHighlighting>
                {pauseEnd || 'e.g. 2026-05-01'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {[7, 14, 30].map((days) => {
                const d = new Date(); d.setDate(d.getDate() + days);
                const val = d.toISOString().split('T')[0];
                return (
                  <TouchableOpacity key={days} onPress={() => setPauseEnd(val)} style={{ backgroundColor: pauseEnd === val ? '#7c3aed' : '#f1f5f9', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: pauseEnd === val ? 'white' : '#475569' }}>{days}d</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => { setShowPauseModal(false); setPauseEnd(''); }} style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: 14, paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ fontWeight: '700', color: '#475569' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePause} disabled={platformSubmitting || !pauseEnd} style={{ flex: 1, backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 12, alignItems: 'center' }}>
                {platformSubmitting ? <ActivityIndicator color="white" /> : <Text style={{ fontWeight: '700', color: 'white' }}>Confirm Pause</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.dividerRow}><View style={styles.dividerLine} /><Text style={styles.dividerText}>WATER DELIVERY PLANS</Text><View style={styles.dividerLine} /></View>

        {/* ACTIVE SUBSCRIPTION */}
        {activeSub && activePlan && (
          <>
            <Text style={styles.sectionTitle}>Your Active Plan</Text>
            <LinearGradient
              colors={activePlan.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activeCard}
            >
              <Ionicons name="water" size={80} color="rgba(255,255,255,0.06)" style={styles.activeDecor} />
              <View style={styles.activeTop}>
                <View>
                  <Text style={styles.activePlanName}>{activePlan.name} Plan</Text>
                  <Text style={styles.activePlanMeta}>{activePlan.cans} cans · ₹{activePlan.price}/mo</Text>
                </View>
                <View style={[styles.statusBadge, activeSub.paused && styles.statusBadgePaused]}>
                  <View style={[styles.statusDot, activeSub.paused && styles.statusDotPaused]} />
                  <Text style={[styles.statusText, activeSub.paused && styles.statusTextPaused]}>
                    {activeSub.paused ? 'Paused' : 'Active'}
                  </Text>
                </View>
              </View>

              <View style={styles.activeMeta}>
                <View style={styles.activeMetaItem}>
                  <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.activeMetaText}>Next: {activeSub.nextDelivery}</Text>
                </View>
                <View style={styles.activeMetaItem}>
                  <Ionicons name="water-outline" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.activeMetaText}>{activeSub.remaining} cans remaining</Text>
                </View>
              </View>

              {/* PROGRESS */}
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${((activePlan.cans - activeSub.remaining) / activePlan.cans) * 100}%` }]} />
              </View>

              <View style={styles.activeActions}>
                <TouchableOpacity style={styles.pauseBtn} onPress={togglePause}>
                  <Ionicons name={activeSub.paused ? 'play' : 'pause'} size={16} color="#005d90" />
                  <Text style={styles.pauseBtnText}>{activeSub.paused ? 'Resume Sub.' : 'Pause (Vacation)'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rescheduleBtn}
                  onPress={() => Toast.show({
                    type: 'info',
                    text1: 'Modify Order',
                    text2: 'Change bottle count or brand for next delivery.\n\nThis feature will be available in the next update.'
                  })}
                >
                  <Ionicons name="create-outline" size={16} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.rescheduleBtnText}>Modify</Text>
                </TouchableOpacity>
              </View>
              {/* Cancel subscription */}
              <TouchableOpacity
                style={styles.cancelSubBtn}
                onPress={() => require('react-native').Alert.alert(
                  'Cancel Subscription',
                  'Are you sure? You will lose your remaining deliveries and savings for this month.',
                  [
                    { text: 'Keep Plan', style: 'cancel' },
                    {
                      text: 'Yes, Cancel',
                      style: 'destructive',
                      onPress: () => {
                        setActiveSub(null);
                        Toast.show({
                          type: 'success',
                          text1: 'Cancelled',
                          text2: 'Your subscription has been cancelled.'
                        });
                      },
                    },
                  ]
                )}
              >
                <Text style={styles.cancelSubText}>Cancel Subscription</Text>
              </TouchableOpacity>
            </LinearGradient>
          </>
        )}

        {/* PLAN SELECTOR */}
        <Text style={styles.sectionTitle}>{activeSub ? 'Change Plan' : 'Choose a Plan'}</Text>

        {PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[styles.planCard, selected === plan.id && styles.planCardActive]}
            onPress={() => setSelected(plan.id)}
            activeOpacity={0.8}
          >
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>⭐ MOST POPULAR</Text>
              </View>
            )}

            <View style={styles.planTop}>
              <View style={[styles.planIcon, { backgroundColor: plan.color + '18' }]}>
                <Ionicons name="water" size={24} color={plan.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planCadence}>{plan.cans} cans / {plan.cadence.toLowerCase()}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.planPrice, { color: plan.color }]}>₹{plan.price}</Text>
                <Text style={styles.planSavings}>Save ₹{plan.savings}</Text>
              </View>
              <View style={[styles.radioOuter, selected === plan.id && { borderColor: plan.color }]}>
                {selected === plan.id && <View style={[styles.radioInner, { backgroundColor: plan.color }]} />}
              </View>
            </View>

            {selected === plan.id && (
              <View style={styles.featureList}>
                {plan.features.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={16} color={plan.color} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* SUBSCRIBE BUTTON */}
        <TouchableOpacity style={styles.subscribeBtn} onPress={handleSubscribe}>
          <LinearGradient
            colors={['#005d90', '#0077b6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.subscribeBtnGrad}
          >
            <Ionicons name="water" size={20} color="white" />
            <Text style={styles.subscribeBtnText}>
              {activeSub ? 'Switch Plan' : `Subscribe — ₹${PLANS.find(p => p.id === selected)!.price}/mo`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Cancel anytime. No hidden fees. Delivery slots reset on the 1st of each month.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  headerSub: { fontSize: 12, color: '#64748b', fontWeight: '500', marginTop: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 120 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#181c20', letterSpacing: -0.3 },

  activeCard: {
    borderRadius: 24, padding: 22, overflow: 'hidden',
    shadowColor: '#005d90', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 20, elevation: 8,
  },
  activeDecor: { position: 'absolute', right: -20, bottom: -20 },
  activeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  activePlanName: { fontSize: 22, fontWeight: '900', color: 'white' },
  activePlanMeta: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusBadgePaused: { backgroundColor: 'rgba(251,191,36,0.25)' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  statusDotPaused: { backgroundColor: '#fbbf24' },
  statusText: { fontSize: 12, fontWeight: '700', color: '#4ade80' },
  statusTextPaused: { color: '#fbbf24' },
  activeMeta: { flexDirection: 'row', gap: 20, marginBottom: 16 },
  activeMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginBottom: 18 },
  progressFill: { height: '100%', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 2 },
  activeActions: { flexDirection: 'row', gap: 10 },
  pauseBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'white', borderRadius: 14, paddingVertical: 12 },
  pauseBtnText: { color: '#005d90', fontWeight: '800', fontSize: 13 },
  rescheduleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  rescheduleBtnText: { color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: 13 },

  planCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 18,
    borderWidth: 1.5, borderColor: '#e0e2e8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  planCardActive: { borderColor: '#005d90', backgroundColor: '#f0f7ff' },
  popularBadge: { backgroundColor: '#fef3c7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 10 },
  popularText: { fontSize: 10, fontWeight: '800', color: '#b45309', letterSpacing: 0.5 },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  planIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  planName: { fontSize: 17, fontWeight: '900', color: '#181c20' },
  planCadence: { fontSize: 12, color: '#707881', fontWeight: '600', marginTop: 2 },
  planPrice: { fontSize: 22, fontWeight: '900' },
  planSavings: { fontSize: 11, color: '#2e7d32', fontWeight: '700' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#e0e2e8', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  featureList: { marginTop: 14, gap: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, color: '#181c20', fontWeight: '600' },

  subscribeBtn: { borderRadius: 18, overflow: 'hidden' },
  subscribeBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  subscribeBtnText: { color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  disclaimer: { fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 16 },
  cancelSubBtn: {
    marginTop: 12, paddingVertical: 10, alignItems: 'center',
  },
  cancelSubText: {
    fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // Plus Membership styles
  plusCard: {
    backgroundColor: 'white', borderRadius: 24, padding: 20, overflow: 'hidden',
    shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 6,
    borderWidth: 1, borderColor: '#ede9fe',
  },
  plusDecor: { position: 'absolute', right: -10, bottom: -10 },
  plusTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  plusTitle: { fontSize: 20, fontWeight: '900', color: 'white' },
  plusMeta: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontWeight: '600' },
  plusBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  plusBadgeText: { color: 'white', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  plusBenefitsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  plusBenefit: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  plusBenefitText: { color: 'white', fontSize: 12, fontWeight: '700' },
  plusCancelBtn: { alignItems: 'center', paddingTop: 8 },
  plusCancelText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
  plusPromoTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  plusPromoIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  plusPromoTitle: { fontSize: 17, fontWeight: '900', color: '#181c20' },
  plusPromoSub: { fontSize: 12, color: '#707881', marginTop: 2, lineHeight: 16 },
  plusPromoPrice: { fontSize: 20, fontWeight: '900', color: '#7c3aed' },
  plusSubscribeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  plusSubscribeBtnText: { color: 'white', fontSize: 15, fontWeight: '800' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e0e2e8' },
  dividerText: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },
});


