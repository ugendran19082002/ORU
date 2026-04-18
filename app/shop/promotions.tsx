import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Switch, Share, Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { apiClient } from '@/api/client';
import { promotionApi } from '@/api/promotionApi';
import { log } from '@/utils/logger';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Shadow, thannigoPalette, roleAccent, roleSurface, roleGradients } from '@/constants/theme';

type Promo = {
  id: number;
  code: string;
  type: string;
  discount_value: number;
  min_order_value: number;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  valid_until: string;
  issuer_type: 'admin' | 'shop';
};

const SHOP_ACCENT = roleAccent.shop_owner;
const CUSTOMER_ACCENT = roleAccent.customer;
const CUSTOMER_GRAD: [string, string] = [roleGradients.customer.start, roleGradients.customer.end];

export default function ShopPromotionsScreen() {
  const router = useRouter();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loyaltyLevels, setLoyaltyLevels] = useState<any[]>([]);
  const [loyaltySettings, setLoyaltySettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'coupons' | 'loyalty'>('coupons');
  
  // Create Form State
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newMin, setNewMin] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('100');
  const [newType, setNewType] = useState('percentage');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expiryDate, setExpiryDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  useEffect(() => { 
    fetchPromotions(); 
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    try {
      const [levelsRes, settingsRes] = await Promise.all([
        apiClient.get('/promotion/loyalty/levels'),
        apiClient.get('/promotion/loyalty/settings')
      ]);
      if (levelsRes.data.status === 1) setLoyaltyLevels(levelsRes.data.data);
      if (settingsRes.data.status === 1) setLoyaltySettings(settingsRes.data.data);
    } catch (e) {
      console.error('Failed to fetch loyalty data', e);
    }
  };

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const data = await promotionApi.getShopCoupons();
      setPromos(data);
    } catch (e) {
      log.error('[Promotions] Fetch error', e);
      Toast.show({ type: 'error', text1: 'Failed to fetch coupons' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const togglePromo = async (id: number) => {
    try {
      const data = await promotionApi.toggleCouponStatus(id);
      if (data) {
        setPromos(prev => prev.map(p => p.id === id ? { ...p, is_active: data.is_active } : p));
        Toast.show({ type: 'success', text1: `Coupon ${data.is_active ? 'activated' : 'deactivated'}` });
      }
    } catch (e) {
      log.error('[Promotions] Toggle error', e);
      Toast.show({ type: 'error', text1: 'Action failed' });
    }
  };

  const handleCreate = async () => {
    if (!newCode.trim() || !newValue.trim()) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Code and value required' });
      return;
    }
    try {
      const payload = {
        code: newCode.trim().toUpperCase(),
        type: newType,
        discount_value: parseFloat(newValue),
        min_order_value: parseFloat(newMin) || 0,
        max_uses: parseInt(newMaxUses) || 100,
        valid_until: expiryDate.toISOString()
      };
      
      await promotionApi.createShopCoupon(payload);
      Toast.show({ type: 'success', text1: 'Coupon Created' });
      fetchPromotions();
      setShowCreate(false);
      setNewCode(''); setNewValue(''); setNewMin('');
    } catch (e: any) {
      log.error('[Promotions] Create error', e);
      Toast.show({ type: 'error', text1: 'Creation failed', text2: e.message });
    }
  };

  const activeCount = promos.filter((p) => p.is_active).length;
  const totalUses = promos.reduce((s, p) => s + (p.used_count || 0), 0);
  const avgUse = promos.length ? Math.round(totalUses / promos.length) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity 
            style={styles.notifBtnSub} 
            onPress={() => router.push('/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={22} color={CUSTOMER_ACCENT} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => setShowCreate(true)}
          >
            <Ionicons name="add" size={18} color="white" />
            <Text style={styles.createBtnText}>New Coupon</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}>
        <Text style={styles.pageTitle}>Promotions</Text>

        {/* QUICK STATS */}
        <View style={styles.statsRow}>
          {[
            { label: 'Active', value: activeCount, icon: 'checkmark-circle', color: thannigoPalette.success, bg: '#e8f5e9' },
            { label: 'Total Uses', value: totalUses, icon: 'people', color: CUSTOMER_ACCENT, bg: '#e0f0ff' },
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
            <Ionicons name="pricetag-outline" size={16} color={activeTab === 'coupons' ? CUSTOMER_ACCENT : thannigoPalette.neutral} />
            <Text style={[styles.tabText, activeTab === 'coupons' && styles.tabTextActive]}>Coupons</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'loyalty' && styles.tabActive]}
            onPress={() => setActiveTab('loyalty')}
          >
            <Ionicons name="ribbon-outline" size={16} color={activeTab === 'loyalty' ? CUSTOMER_ACCENT : thannigoPalette.neutral} />
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
                  {(['percentage', 'fixed'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typePill, newType === t && styles.typePillActive]}
                      onPress={() => setNewType(t)}
                    >
                      <Text style={[styles.typePillText, newType === t && styles.typePillTextActive]}>
                        {t === 'percentage' ? '% Percent' : '₹ Flat'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.inputRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Value ({newType === 'percentage' ? '%' : '₹'})</Text>
                    <TextInput style={styles.input} placeholder="20" value={newValue} onChangeText={setNewValue} keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.inputLabel}>Min Order (₹)</Text>
                    <TextInput style={styles.input} placeholder="100" value={newMin} onChangeText={setNewMin} keyboardType="numeric" />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Expiry Date</Text>
                    <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                      <Text style={{ fontSize: 15, color: thannigoPalette.darkText }}>{expiryDate.toDateString()}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.inputLabel}>Usage Limit</Text>
                    <TextInput style={styles.input} placeholder="100" value={newMaxUses} onChangeText={setNewMaxUses} keyboardType="numeric" />
                  </View>
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={expiryDate}
                    mode="date"
                    minimumDate={new Date()}
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (date) setExpiryDate(date);
                    }}
                  />
                )}

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
              <View key={promo.id} style={[styles.promoCard, !promo.is_active && styles.promoCardInactive]}>
                {/* TOP ROW */}
                <View style={styles.promoTop}>
                  <LinearGradient
                    colors={promo.is_active ? [CUSTOMER_ACCENT, CUSTOMER_GRAD[1]] : ['#94a3b8', thannigoPalette.neutral]}
                    style={styles.codeBadge}
                  >
                    <Text style={styles.codeText}>{promo.code}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1, paddingHorizontal: 12 }}>
                    <Text style={styles.promoDesc}>{promo.discount_value}{promo.type === 'percentage' ? '%' : '₹'} off</Text>
                    <Text style={styles.promoMeta}>Min order ₹{promo.min_order_value} · Expires {new Date(promo.valid_until).toLocaleDateString()}</Text>
                  </View>
                  <Switch
                    value={promo.is_active}
                    onValueChange={() => togglePromo(promo.id)}
                    trackColor={{ false: thannigoPalette.borderSoft, true: '#bfdbf7' }}
                    thumbColor={promo.is_active ? CUSTOMER_ACCENT : '#94a3b8'}
                  />
                </View>

                {/* USAGE BAR */}
                <View style={styles.usageRow}>
                  <Text style={styles.usageLabel}>{promo.used_count || 0} / {promo.max_uses} uses</Text>
                  <Text style={[styles.usagePct, { color: (promo.used_count / promo.max_uses) > 0.8 ? '#c62828' : CUSTOMER_ACCENT }]}>
                    {Math.round(((promo.used_count || 0) / promo.max_uses) * 100)}%
                  </Text>
                </View>
                <View style={styles.usageTrack}>
                  <View
                    style={[
                      styles.usageFill,
                      {
                        width: `${Math.min(((promo.used_count || 0) / promo.max_uses) * 100, 100)}%`,
                        backgroundColor: (promo.used_count / promo.max_uses) > 0.8 ? '#f87171' : CUSTOMER_ACCENT,
                      },
                    ]}
                  />
                </View>

                {/* ACTIONS */}
                <View style={styles.promoActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => {
                      Share.share({ message: promo.code, title: 'Coupon Code' });
                    }}
                  >
                    <Ionicons name="copy-outline" size={14} color={CUSTOMER_ACCENT} />
                    <Text style={styles.actionBtnText}>Copy Code</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => {
                      Share.share({
                        message: `Use code ${promo.code} to get ${promo.discount_value}${promo.type === 'percentage' ? '%' : '₹'} off on your order! Min order ₹${promo.min_order_value}.`,
                        title: 'ThanniGo Coupon',
                      });
                    }}
                  >
                    <Ionicons name="share-social-outline" size={14} color={CUSTOMER_ACCENT} />
                    <Text style={styles.actionBtnText}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#fecaca' }]}
                    onPress={() => {
                      Alert.alert('Delete Coupon', `Delete coupon "${promo.code}"? This cannot be undone.`, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              await promotionApi.deleteShopCoupon(promo.id);
                              Toast.show({ type: 'success', text1: 'Coupon deleted' });
                              fetchPromotions();
                            } catch {
                              Toast.show({ type: 'error', text1: 'Delete failed' });
                            }
                          },
                        },
                      ]);
                    }}
                  >
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
              colors={[SHOP_ACCENT, '#004e5b']}
              style={styles.loyaltyHero}
            >
              <Ionicons name="sparkles" size={80} color="rgba(255,255,255,0.08)" style={styles.loyaltyDecor} />
              <Text style={styles.loyaltyHeroTitle}>Smart loyalty Engine</Text>
              <Text style={styles.loyaltyHeroSub}>
                ThanniGo automatically rewards your repeat customers and incentivizes new users to try your shop. No setup required!
              </Text>
              <View style={styles.autoBadge}>
                <Ionicons name="shield-checkmark" size={14} color="white" />
                <Text style={styles.autoBadgeText}>Platform Managed</Text>
              </View>
            </LinearGradient>

            <Text style={styles.sectionTitle}>How it works for your shop</Text>
            
            <View style={styles.ruleCard}>
              <View style={styles.ruleIconWrap}>
                 <Ionicons name="gift" size={20} color="#006878" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ruleTitle}>New Shop Bonus</Text>
                <Text style={styles.ruleDesc}>New users get +20 points on their first order at your shop.</Text>
              </View>
            </View>

            <View style={styles.ruleCard}>
              <View style={[styles.ruleIconWrap, { backgroundColor: '#e0f0ff' }]}>
                 <Ionicons name="trending-up" size={20} color={CUSTOMER_ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ruleTitle}>Loyalty Boost (+5%)</Text>
                <Text style={styles.ruleDesc}>Repeat customers (5+ orders) earn extra points at your shop automatically.</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="cash-outline" size={20} color={CUSTOMER_ACCENT} />
              <Text style={styles.infoText}>
                The cost of these extra points is funded by ThanniGo. These rewards do NOT reduce your payout. You only pay for the shop-specific coupons you create in the first tab.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
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
  notifBtnSub: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: CUSTOMER_ACCENT, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
  },
  createBtnText: { fontSize: 13, fontWeight: '800', color: 'white' },
  pageTitle: { fontSize: 32, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5, marginTop: 10, marginBottom: 18 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: {
    flex: 1, backgroundColor: 'white', borderRadius: 18, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '900', marginBottom: 2 },
  statLabel: { fontSize: 10, color: thannigoPalette.neutral, fontWeight: '600' },

  tabRow: {
    flexDirection: 'row', backgroundColor: thannigoPalette.borderSoft, borderRadius: 14, padding: 4, marginBottom: 20,
  },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
  tabActive: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '700', color: thannigoPalette.neutral },
  tabTextActive: { color: CUSTOMER_ACCENT },

  createCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16,
    shadowColor: CUSTOMER_ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: '#bfdbf7',
  },
  createTitle: { fontSize: 16, fontWeight: '900', color: thannigoPalette.darkText, marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: thannigoPalette.neutral, marginBottom: 6 },
  input: {
    backgroundColor: thannigoPalette.borderSoft, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontWeight: '600', color: thannigoPalette.darkText, marginBottom: 14, borderWidth: 1, borderColor: thannigoPalette.borderSoft,
  },
  inputRow: { flexDirection: 'row', gap: 12 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  typePill: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: thannigoPalette.borderSoft, alignItems: 'center' },
  typePillActive: { borderColor: CUSTOMER_ACCENT, backgroundColor: '#e0f0ff' },
  typePillText: { fontSize: 13, fontWeight: '700', color: thannigoPalette.neutral },
  typePillTextActive: { color: CUSTOMER_ACCENT },
  createActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  createSaveBtn: { flex: 1, backgroundColor: CUSTOMER_ACCENT, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  createSaveBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
  createCancelBtn: { flex: 1, backgroundColor: thannigoPalette.borderSoft, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  createCancelBtnText: { color: thannigoPalette.neutral, fontWeight: '700', fontSize: 14 },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: thannigoPalette.darkText },
  emptySub: { fontSize: 13, color: thannigoPalette.neutral, textAlign: 'center' },

  promoCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  promoCardInactive: { opacity: 0.6 },
  promoTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  codeBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  codeText: { fontSize: 16, fontWeight: '900', color: 'white', letterSpacing: 1 },
  promoDesc: { fontSize: 13, fontWeight: '700', color: thannigoPalette.darkText, marginBottom: 3 },
  promoMeta: { fontSize: 11, color: thannigoPalette.neutral, fontWeight: '500' },
  usageRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  usageLabel: { fontSize: 11, color: thannigoPalette.neutral, fontWeight: '600' },
  usagePct: { fontSize: 11, fontWeight: '700' },
  usageTrack: { height: 4, backgroundColor: thannigoPalette.borderSoft, borderRadius: 2, marginBottom: 14 },
  usageFill: { height: '100%', borderRadius: 2 },
  promoActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e0f0ff',
  },
  actionBtnText: { fontSize: 11, fontWeight: '700', color: CUSTOMER_ACCENT },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: thannigoPalette.darkText, marginBottom: 14, letterSpacing: -0.3 },
  loyaltyHero: {
    borderRadius: 24, padding: 24, marginBottom: 24, overflow: 'hidden',
    shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 8,
  },
  loyaltyDecor: { position: 'absolute', bottom: -20, right: -20 },
  loyaltyHeroTitle: { fontSize: 22, fontWeight: '900', color: 'white', marginBottom: 8 },
  loyaltyHeroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 18, marginBottom: 20 },
  autoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  autoBadgeText: { color: 'white', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  
  ruleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'white', borderRadius: 18, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  ruleIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center' },
  ruleTitle: { fontSize: 15, fontWeight: '800', color: thannigoPalette.darkText, marginBottom: 2 },
  ruleDesc: { fontSize: 12, color: thannigoPalette.neutral, lineHeight: 16 },

  infoCard: {
    flexDirection: 'row', gap: 10, backgroundColor: '#e0f0ff', borderRadius: 16, padding: 16, marginTop: 8,
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 12, color: CUSTOMER_ACCENT, lineHeight: 18, fontWeight: '600' },
});


