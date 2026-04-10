import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';

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
  const [selected, setSelected] = useState<PlanId>('standard');
  const [activeSub, setActiveSub] = useState<ActiveSub | null>({
    planId: 'standard',
    nextDelivery: 'Tomorrow, 10 AM',
    remaining: 5,
    paused: false,
  });

  const togglePause = () => {
    if (!activeSub) return;
    setActiveSub({ ...activeSub, paused: !activeSub.paused });
    Alert.alert(activeSub.paused ? 'Resumed!' : 'Paused!', activeSub.paused ? 'Your subscription is active again.' : 'No deliveries until you resume.');
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
                  <Text style={styles.pauseBtnText}>{activeSub.paused ? 'Resume' : 'Pause'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rescheduleBtn}>
                  <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.rescheduleBtnText}>Reschedule</Text>
                </TouchableOpacity>
              </View>
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
});
