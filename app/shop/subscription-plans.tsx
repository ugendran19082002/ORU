import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const PLAN_TYPES = [
  { id: 'daily', label: 'Daily Drop', cans: 1, price: 50, billing: 'per day', color: '#006878', gradient: ['#006878', '#004e5b'] as [string, string] },
  { id: 'weekly', label: 'Weekly Pack', cans: 7, price: 320, billing: 'per week', color: '#005d90', gradient: ['#005d90', '#003f6b'] as [string, string], tag: 'SAVE ₹30' },
  { id: 'monthly', label: 'Monthly Plan', cans: 30, price: 1200, billing: 'per month', color: '#7c3aed', gradient: ['#7c3aed', '#5b21b6'] as [string, string], tag: 'BEST VALUE' },
];

export default function ShopSubscriptionPlansScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState('weekly');
  const [autoRenew, setAutoRenew] = useState(true);

  const plan = PLAN_TYPES.find((p) => p.id === selected)!;

  const handleSubscribe = () => {
    Alert.alert('Subscribe Shop', `Subscribe shop to ${plan.label} at ₹${plan.price}/${plan.billing}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => Alert.alert('Subscribed!', `Shop enrolled in ${plan.label}.`) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shop Subscription Plans</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <LinearGradient colors={plan.gradient} style={styles.heroCard}>
          <Ionicons name="water" size={80} color="rgba(255,255,255,0.07)" style={styles.heroDecor} />
          <Text style={styles.heroLabel}>SELECTED PLAN</Text>
          <Text style={styles.heroName}>{plan.label}</Text>
          <Text style={styles.heroPrice}>₹{plan.price}<Text style={styles.heroUnit}>/{plan.billing}</Text></Text>
          <Text style={styles.heroCans}>{plan.cans} can{plan.cans > 1 ? 's' : ''} included</Text>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Choose a Plan</Text>
        {PLAN_TYPES.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.planCard, selected === p.id && styles.planCardActive]}
            onPress={() => setSelected(p.id)}
          >
            {p.tag && (
              <View style={[styles.tagBadge, { backgroundColor: p.color + '20' }]}>
                <Text style={[styles.tagText, { color: p.color }]}>{p.tag}</Text>
              </View>
            )}
            <View style={styles.planRow}>
              <View style={[styles.planIcon, { backgroundColor: p.color + '15' }]}>
                <Ionicons name="water" size={22} color={p.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.planName}>{p.label}</Text>
                <Text style={styles.planCans}>{p.cans} can{p.cans > 1 ? 's' : ''} / {p.billing}</Text>
              </View>
              <Text style={[styles.planPrice, { color: p.color }]}>₹{p.price}</Text>
              <View style={[styles.radio, selected === p.id && { borderColor: p.color }]}>
                {selected === p.id && <View style={[styles.radioDot, { backgroundColor: p.color }]} />}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* AUTO-RENEW */}
        <View style={styles.autoRenewCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.autoRenewTitle}>Auto-Renew</Text>
            <Text style={styles.autoRenewSub}>Automatically renew when the current period ends.</Text>
          </View>
          <Switch
            value={autoRenew}
            onValueChange={setAutoRenew}
            trackColor={{ false: '#e0e2e8', true: '#bfdbf7' }}
            thumbColor={autoRenew ? '#005d90' : '#94a3b8'}
          />
        </View>

        {/* BENEFITS */}
        <Text style={styles.sectionTitle}>What's Included</Text>
        <View style={styles.benefitsList}>
          {[
            { icon: 'checkmark-circle', text: 'Guaranteed delivery slots', color: '#2e7d32' },
            { icon: 'checkmark-circle', text: 'Priority order queue', color: '#2e7d32' },
            { icon: 'checkmark-circle', text: 'Fixed price — no surge pricing', color: '#2e7d32' },
            { icon: 'checkmark-circle', text: 'Dedicated shop support line', color: '#2e7d32' },
            { icon: 'checkmark-circle', text: 'Cancel or pause anytime', color: '#2e7d32' },
          ].map((b) => (
            <View key={b.text} style={styles.benefitRow}>
              <Ionicons name={b.icon as any} size={18} color={b.color} />
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.subscribeBtn} onPress={handleSubscribe}>
          <LinearGradient colors={plan.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.subscribeBtnGrad}>
            <Text style={styles.subscribeBtnText}>Subscribe — ₹{plan.price}/{plan.billing}</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  heroCard: { borderRadius: 24, padding: 24, overflow: 'hidden', shadowColor: '#005d90', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 },
  heroDecor: { position: 'absolute', right: -16, bottom: -16 },
  heroLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 6 },
  heroName: { fontSize: 26, fontWeight: '900', color: 'white', marginBottom: 6 },
  heroPrice: { fontSize: 38, fontWeight: '900', color: 'white', letterSpacing: -1 },
  heroUnit: { fontSize: 16, fontWeight: '500' },
  heroCans: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#181c20', letterSpacing: -0.3 },
  planCard: { backgroundColor: 'white', borderRadius: 18, padding: 16, borderWidth: 1.5, borderColor: '#e0e2e8', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  planCardActive: { borderColor: '#005d90', backgroundColor: '#f0f7ff' },
  tagBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginBottom: 10 },
  tagText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  planIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  planName: { fontSize: 16, fontWeight: '800', color: '#181c20', marginBottom: 2 },
  planCans: { fontSize: 12, color: '#707881', fontWeight: '600' },
  planPrice: { fontSize: 20, fontWeight: '900', marginRight: 12 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#e0e2e8', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  autoRenewCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'white', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  autoRenewTitle: { fontSize: 14, fontWeight: '800', color: '#181c20', marginBottom: 2 },
  autoRenewSub: { fontSize: 12, color: '#707881', fontWeight: '500' },
  benefitsList: { backgroundColor: 'white', borderRadius: 18, padding: 18, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitText: { fontSize: 13, color: '#181c20', fontWeight: '600' },
  subscribeBtn: { borderRadius: 18, overflow: 'hidden' },
  subscribeBtnGrad: { paddingVertical: 17, alignItems: 'center' },
  subscribeBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
});
