import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Logo } from '@/components/ui/Logo';

type Promo = {
  id: string;
  code: string;
  type: 'percent' | 'flat';
  value: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
  expiry: string;
  description: string;
};

const INITIAL_PROMOS: Promo[] = [
  { id: '1', code: 'FIRST10', type: 'percent', value: 10, minOrder: 100, maxUses: 200, usedCount: 87, active: true, expiry: '30 Apr 2026', description: '10% off on first order' },
  { id: '2', code: 'BULK20', type: 'percent', value: 20, minOrder: 500, maxUses: 100, usedCount: 44, active: true, expiry: '15 May 2026', description: '20% off on bulk orders' },
  { id: '3', code: 'WEEKEND5', type: 'flat', value: 5, minOrder: 50, maxUses: 500, usedCount: 312, active: false, expiry: '01 May 2026', description: '₹5 off every weekend' },
  { id: '4', code: 'LOYAL30', type: 'percent', value: 30, minOrder: 300, maxUses: 50, usedCount: 11, active: true, expiry: '31 May 2026', description: 'Loyalty reward for repeat customers' },
];

const LOYALTY_TIERS = [
  { name: 'Bronze', orders: '1–9', discount: '0%', color: '#b45309', bg: '#fef3c7' },
  { name: 'Silver', orders: '10–24', discount: '5%', color: '#64748b', bg: '#f1f5f9' },
  { name: 'Gold', orders: '25–49', discount: '10%', color: '#d97706', bg: '#fffbeb' },
  { name: 'Diamond', orders: '50+', discount: '15%', color: '#7c3aed', bg: '#ede9fe' },
];

export default function ShopPromotionsScreen() {
  const router = useRouter();
  const [promos, setPromos] = useState<Promo[]>(INITIAL_PROMOS);
  const [activeTab, setActiveTab] = useState<'coupons' | 'loyalty'>('coupons');
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newMin, setNewMin] = useState('');
  const [newType, setNewType] = useState<'percent' | 'flat'>('percent');

  const togglePromo = (id: string) => {
    setPromos(promos.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
  };

  const handleCreate = () => {
    if (!newCode.trim() || !newValue.trim()) {
      Alert.alert('Error', 'Please fill in the coupon code and discount value.');
      return;
    }
    const promo: Promo = {
      id: Date.now().toString(),
      code: newCode.trim().toUpperCase(),
      type: newType,
      value: parseFloat(newValue),
      minOrder: parseFloat(newMin) || 0,
      maxUses: 100,
      usedCount: 0,
      active: true,
      expiry: '30 Jun 2026',
      description: `${newType === 'percent' ? newValue + '% off' : '₹' + newValue + ' off'} with code ${newCode}`,
    };
    setPromos([promo, ...promos]);
    setNewCode(''); setNewValue(''); setNewMin('');
    setShowCreate(false);
  };

  const activeCount = promos.filter((p) => p.active).length;
  const totalUses = promos.reduce((s, p) => s + p.usedCount, 0);
  const avgUse = promos.length ? Math.round(totalUses / promos.length) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <View style={styles.brandRow}>
            <Logo size="md" />
            <Text style={styles.brandName}>ThanniGo</Text>
          </View>
          <Text style={styles.roleLabel}>SHOP PANEL</Text>
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setShowCreate(true)}
        >
          <Ionicons name="add" size={18} color="white" />
          <Text style={styles.createBtnText}>New Coupon</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}>
        <Text style={styles.pageTitle}>Promotions</Text>

        {/* QUICK STATS */}
        <View style={styles.statsRow}>
          {[
            { label: 'Active', value: activeCount, icon: 'checkmark-circle', color: '#2e7d32', bg: '#e8f5e9' },
            { label: 'Total Uses', value: totalUses, icon: 'people', color: '#005d90', bg: '#e0f0ff' },
            { label: 'Avg Uses', value: avgUse, icon: 'stats-chart', color: '#b45309', bg: '#fef3c7' },
          ].map((s) => (
            <View key={s.label} style={styles.statBox}>
              <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon as any} size={18} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* TABS */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'coupons' && styles.tabActive]}
            onPress={() => setActiveTab('coupons')}
          >
            <Ionicons name="pricetag-outline" size={16} color={activeTab === 'coupons' ? '#005d90' : '#707881'} />
            <Text style={[styles.tabText, activeTab === 'coupons' && styles.tabTextActive]}>Coupons</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'loyalty' && styles.tabActive]}
            onPress={() => setActiveTab('loyalty')}
          >
            <Ionicons name="ribbon-outline" size={16} color={activeTab === 'loyalty' ? '#005d90' : '#707881'} />
            <Text style={[styles.tabText, activeTab === 'loyalty' && styles.tabTextActive]}>Loyalty Programme</Text>
          </TouchableOpacity>
        </View>

        {/* COUPONS TAB */}
        {activeTab === 'coupons' && (
          <>
            {/* CREATE FORM */}
            {showCreate && (
              <View style={styles.createCard}>
                <Text style={styles.createTitle}>Create New Coupon</Text>

                <Text style={styles.inputLabel}>Coupon Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. SAVE20"
                  value={newCode}
                  onChangeText={(t) => setNewCode(t.toUpperCase())}
                  autoCapitalize="characters"
                />

                <Text style={styles.inputLabel}>Discount Type</Text>
                <View style={styles.typeRow}>
                  {(['percent', 'flat'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typePill, newType === t && styles.typePillActive]}
                      onPress={() => setNewType(t)}
                    >
                      <Text style={[styles.typePillText, newType === t && styles.typePillTextActive]}>
                        {t === 'percent' ? '% Percent' : '₹ Flat'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.inputRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Value ({newType === 'percent' ? '%' : '₹'})</Text>
                    <TextInput style={styles.input} placeholder="20" value={newValue} onChangeText={setNewValue} keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Min Order (₹)</Text>
                    <TextInput style={styles.input} placeholder="100" value={newMin} onChangeText={setNewMin} keyboardType="numeric" />
                  </View>
                </View>

                <View style={styles.createActions}>
                  <TouchableOpacity style={styles.createSaveBtn} onPress={handleCreate}>
                    <Text style={styles.createSaveBtnText}>Create Coupon</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.createCancelBtn} onPress={() => setShowCreate(false)}>
                    <Text style={styles.createCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {promos.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="pricetag-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>No coupons yet</Text>
                <Text style={styles.emptySub}>Create your first coupon to attract customers.</Text>
              </View>
            )}

            {promos.map((promo) => (
              <View key={promo.id} style={[styles.promoCard, !promo.active && styles.promoCardInactive]}>
                {/* TOP ROW */}
                <View style={styles.promoTop}>
                  <LinearGradient
                    colors={promo.active ? ['#005d90', '#0077b6'] : ['#94a3b8', '#64748b']}
                    style={styles.codeBadge}
                  >
                    <Text style={styles.codeText}>{promo.code}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1, paddingHorizontal: 12 }}>
                    <Text style={styles.promoDesc}>{promo.description}</Text>
                    <Text style={styles.promoMeta}>Min order ₹{promo.minOrder} · Expires {promo.expiry}</Text>
                  </View>
                  <Switch
                    value={promo.active}
                    onValueChange={() => togglePromo(promo.id)}
                    trackColor={{ false: '#e0e2e8', true: '#bfdbf7' }}
                    thumbColor={promo.active ? '#005d90' : '#94a3b8'}
                  />
                </View>

                {/* USAGE BAR */}
                <View style={styles.usageRow}>
                  <Text style={styles.usageLabel}>{promo.usedCount} / {promo.maxUses} uses</Text>
                  <Text style={[styles.usagePct, { color: promo.usedCount / promo.maxUses > 0.8 ? '#c62828' : '#005d90' }]}>
                    {Math.round((promo.usedCount / promo.maxUses) * 100)}%
                  </Text>
                </View>
                <View style={styles.usageTrack}>
                  <View
                    style={[
                      styles.usageFill,
                      {
                        width: `${Math.min((promo.usedCount / promo.maxUses) * 100, 100)}%`,
                        backgroundColor: promo.usedCount / promo.maxUses > 0.8 ? '#f87171' : '#005d90',
                      },
                    ]}
                  />
                </View>

                {/* ACTIONS */}
                <View style={styles.promoActions}>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="copy-outline" size={14} color="#005d90" />
                    <Text style={styles.actionBtnText}>Copy Code</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="share-social-outline" size={14} color="#005d90" />
                    <Text style={styles.actionBtnText}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { borderColor: '#fecaca' }]}>
                    <Ionicons name="trash-outline" size={14} color="#f87171" />
                    <Text style={[styles.actionBtnText, { color: '#f87171' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* LOYALTY TAB */}
        {activeTab === 'loyalty' && (
          <>
            <LinearGradient
              colors={['#7c3aed', '#5b21b6']}
              style={styles.loyaltyHero}
            >
              <Ionicons name="ribbon" size={80} color="rgba(255,255,255,0.08)" style={styles.loyaltyDecor} />
              <Text style={styles.loyaltyHeroTitle}>Loyalty Programme</Text>
              <Text style={styles.loyaltyHeroSub}>
                Reward repeat customers automatically. Tiers upgrade based on total orders.
              </Text>
              <View style={styles.loyaltyToggleRow}>
                <Text style={styles.loyaltyToggleLabel}>Programme Active</Text>
                <Switch
                  value={true}
                  trackColor={{ false: '#8b5cf6', true: '#c4b5fd' }}
                  thumbColor="white"
                />
              </View>
            </LinearGradient>

            <Text style={styles.sectionTitle}>Tier Structure</Text>
            {LOYALTY_TIERS.map((tier) => (
              <View key={tier.name} style={styles.tierCard}>
                <View style={[styles.tierIconWrap, { backgroundColor: tier.bg }]}>
                  <Ionicons name="ribbon" size={22} color={tier.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
                  <Text style={styles.tierOrders}>{tier.orders} lifetime orders</Text>
                </View>
                <View style={[styles.tierBadge, { backgroundColor: tier.bg }]}>
                  <Text style={[styles.tierDiscount, { color: tier.color }]}>{tier.discount} off</Text>
                </View>
              </View>
            ))}

            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={20} color="#005d90" />
              <Text style={styles.infoText}>
                Discounts are applied automatically at checkout based on the customer's lifetime order count with your shop.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.92)',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 22, fontWeight: '900', color: '#003a5c', letterSpacing: -0.5 },
  roleLabel: { fontSize: 9, fontWeight: '700', color: '#006878', letterSpacing: 1.5, marginTop: 3 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#005d90', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
  },
  createBtnText: { fontSize: 13, fontWeight: '800', color: 'white' },
  pageTitle: { fontSize: 32, fontWeight: '900', color: '#181c20', letterSpacing: -0.5, marginTop: 10, marginBottom: 18 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: {
    flex: 1, backgroundColor: 'white', borderRadius: 18, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '900', marginBottom: 2 },
  statLabel: { fontSize: 10, color: '#707881', fontWeight: '600' },

  tabRow: {
    flexDirection: 'row', backgroundColor: '#f1f4f9', borderRadius: 14, padding: 4, marginBottom: 20,
  },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
  tabActive: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '700', color: '#707881' },
  tabTextActive: { color: '#005d90' },

  createCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16,
    shadowColor: '#005d90', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: '#bfdbf7',
  },
  createTitle: { fontSize: 16, fontWeight: '900', color: '#181c20', marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#707881', marginBottom: 6 },
  input: {
    backgroundColor: '#f1f4f9', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontWeight: '600', color: '#181c20', marginBottom: 14, borderWidth: 1, borderColor: '#e0e2e8',
  },
  inputRow: { flexDirection: 'row', gap: 12 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  typePill: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#e0e2e8', alignItems: 'center' },
  typePillActive: { borderColor: '#005d90', backgroundColor: '#e0f0ff' },
  typePillText: { fontSize: 13, fontWeight: '700', color: '#707881' },
  typePillTextActive: { color: '#005d90' },
  createActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  createSaveBtn: { flex: 1, backgroundColor: '#005d90', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  createSaveBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
  createCancelBtn: { flex: 1, backgroundColor: '#f1f4f9', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  createCancelBtnText: { color: '#707881', fontWeight: '700', fontSize: 14 },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#181c20' },
  emptySub: { fontSize: 13, color: '#707881', textAlign: 'center' },

  promoCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  promoCardInactive: { opacity: 0.6 },
  promoTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  codeBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  codeText: { fontSize: 16, fontWeight: '900', color: 'white', letterSpacing: 1 },
  promoDesc: { fontSize: 13, fontWeight: '700', color: '#181c20', marginBottom: 3 },
  promoMeta: { fontSize: 11, color: '#707881', fontWeight: '500' },
  usageRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  usageLabel: { fontSize: 11, color: '#707881', fontWeight: '600' },
  usagePct: { fontSize: 11, fontWeight: '700' },
  usageTrack: { height: 4, backgroundColor: '#f1f4f9', borderRadius: 2, marginBottom: 14 },
  usageFill: { height: '100%', borderRadius: 2 },
  promoActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e0f0ff',
  },
  actionBtnText: { fontSize: 11, fontWeight: '700', color: '#005d90' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#181c20', marginBottom: 14, letterSpacing: -0.3 },
  loyaltyHero: {
    borderRadius: 24, padding: 24, marginBottom: 24, overflow: 'hidden',
    shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 8,
  },
  loyaltyDecor: { position: 'absolute', bottom: -20, right: -20 },
  loyaltyHeroTitle: { fontSize: 22, fontWeight: '900', color: 'white', marginBottom: 8 },
  loyaltyHeroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 18, marginBottom: 20 },
  loyaltyToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  loyaltyToggleLabel: { fontSize: 13, fontWeight: '700', color: 'white' },

  tierCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'white', borderRadius: 18, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  tierIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tierName: { fontSize: 16, fontWeight: '900', marginBottom: 2 },
  tierOrders: { fontSize: 11, color: '#707881', fontWeight: '600' },
  tierBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  tierDiscount: { fontSize: 13, fontWeight: '800' },

  infoCard: {
    flexDirection: 'row', gap: 10, backgroundColor: '#e0f0ff', borderRadius: 16, padding: 16, marginTop: 8,
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 12, color: '#005d90', lineHeight: 18, fontWeight: '600' },
});
