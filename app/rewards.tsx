import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { useAppSession } from '@/hooks/use-app-session';
import { addressApi } from '@/api/addressApi';
import { apiClient } from '@/api/client';

export default function RewardsScreen() {
  const router = useRouter();
  const { user } = useAppSession();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Dynamic State
  const [history, setHistory] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [coupons, setCoupons] = useState<any[]>([]);

  const fetchRewardsData = useCallback(async () => {
    try {
      const [historyRes, tierRes, settingRes, couponRes] = await Promise.all([
        apiClient.get('/promotion/loyalty/ledger'),
        apiClient.get('/promotion/loyalty/levels'),
        apiClient.get('/promotion/loyalty/settings'),
        apiClient.get('/promotion/coupons/active')
      ]);

      if (historyRes.data.status === 1) setHistory(historyRes.data.data);
      if (tierRes.data.status === 1) setTiers(tierRes.data.data);
      if (settingRes.data.status === 1) setSettings(settingRes.data.data);
      if (couponRes.data.status === 1) setCoupons(couponRes.data.data.filter((c: any) => c.is_active));
    } catch (err) {
      console.error('Failed to fetch rewards data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRewardsData(); }, [fetchRewardsData]);

  const currentPoints = user?.loyalty_points || 0;
  // Note: For total orders, we'd ideally fetch from an analytics endpoint.
  // Using points as a proxy for progress if levels are point-based.
  const currentTier = tiers.find(t => currentPoints >= t.min_points && (!t.max_points || currentPoints <= t.max_points)) || tiers[0] || { name: 'Bronze', discount_percentage: 0, min_points: 0 };
  const nextTier = tiers.find(t => t.min_points > currentPoints);
  
  const pointsToNext = nextTier ? nextTier.min_points - currentPoints : 0;
  const tierProgress = nextTier ? (currentPoints / nextTier.min_points) : 1;
  const referralCode = user?.referral_code || 'THANNIGO-INVITE';

  const handleShare = async () => {
    await Share.share({
      message: `🌊 Join ThanniGo — pure water delivered in 15 mins!\nUse my code ${referralCode} and get a special discount on your first order.\nhttps://thannigo.app`,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#005d90" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <BackButton fallback="/(tabs)/profile" />
        <Text style={styles.headerTitle}>Rewards & Referrals</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRewardsData(); }} />}
      >
        {/* HERO LOYALTY CARD */}
        <LinearGradient
          colors={['#005d90', '#0077b6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Ionicons name="ribbon" size={100} color="rgba(255,255,255,0.06)" style={styles.heroDecor} />
          <View style={styles.heroTop}>
            <View style={[styles.tierBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="medal-outline" size={16} color="white" />
              <Text style={styles.tierBadgeText}>{currentTier.name} Member</Text>
            </View>
            <Text style={styles.discountChip}>{currentTier.discount_percentage}% OFF</Text>
          </View>
          <Text style={styles.heroPoints}>{currentPoints.toLocaleString()}</Text>
          <Text style={styles.heroPointsLabel}>Total Points</Text>

          {nextTier && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>{pointsToNext} pts to {nextTier.name}</Text>
                <Text style={styles.progressPct}>{Math.round(tierProgress * 100)}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${tierProgress * 100}%` }]} />
              </View>
            </View>
          )}

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatVal}>{settings?.min_order_amount_for_redeem || 200}</Text>
              <Text style={styles.heroStatLabel}>Min Order</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatVal}>{settings ? (1 / settings.points_to_currency_ratio) : '10'}</Text>
              <Text style={styles.heroStatLabel}>Pts = ₹1</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatVal}>{settings?.max_points_percentage_per_order || 20}%</Text>
              <Text style={styles.heroStatLabel}>Max Discount</Text>
            </View>
          </View>
        </LinearGradient>

        {/* REFERRAL CARD */}
        <View style={styles.referralCard}>
          <View style={styles.referralTop}>
            <View style={styles.referralIconWrap}>
              <Ionicons name="people" size={24} color="#005d90" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.referralTitle}>Invite & Earn Points</Text>
              <Text style={styles.referralSub}>Share your code and earn points on their first signup and order.</Text>
            </View>
          </View>
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
            <Text style={styles.codeValue}>{referralCode}</Text>
          </View>
          <View style={styles.referralActions}>
            <TouchableOpacity 
              style={styles.copyBtn} 
              onPress={() => {
                Toast.show({
                  type: 'success',
                  text1: 'Copied!',
                  text2: `${referralCode} copied to clipboard.`
                });
              }}
            >
              <Ionicons name="copy-outline" size={16} color="#005d90" />
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <LinearGradient colors={['#005d90', '#0077b6']} style={styles.shareBtnGrad}>
                <Ionicons name="share-social-outline" size={16} color="white" />
                <Text style={styles.shareBtnText}>Share Invite</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* VOUCHERS */}
        {coupons.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Available Coupons</Text>
            {coupons.map((v) => (
              <TouchableOpacity key={v.id} style={styles.voucherCard} activeOpacity={0.8}>
                <View style={styles.voucherLeft}>
                  <Text style={styles.voucherValue}>{v.type === 'percentage' ? `${v.discount_value}%` : `₹${v.discount_value}`} OFF</Text>
                  <Text style={styles.voucherMeta}>Min order ₹{v.min_order_value} · Expires {new Date(v.valid_until).toLocaleDateString()}</Text>
                </View>
                <View style={styles.voucherCode}>
                  <Text style={styles.voucherCodeText}>{v.code}</Text>
                  <Text style={styles.voucherApply}>Use at checkout →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* LOYALTY TIERS */}
        <Text style={styles.sectionTitle}>Loyalty Tiers</Text>
        <View style={styles.tiersList}>
          {tiers.map((tier) => (
            <View key={tier.id} style={[styles.tierRow, tier.id === currentTier.id && styles.tierRowActive]}>
              <View style={[styles.tierIcon, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="medal-outline" size={18} color="#005d90" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.tierName, { color: '#1a1c1e' }]}>{tier.name}</Text>
                <Text style={styles.tierRange}>{tier.min_points}+ lifetime points</Text>
              </View>
              <Text style={[styles.tierDiscount, { color: '#005d90' }]}>{tier.discount_percentage}% off</Text>
              {tier.id === currentTier.id && (
                <View style={[styles.currentChip, { backgroundColor: '#005d9018' }]}>
                  <Text style={[styles.currentChipText, { color: '#005d90' }]}>CURRENT</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* POINTS HISTORY */}
        <Text style={styles.sectionTitle}>Points History</Text>
        <View style={styles.historyCard}>
          {history.length === 0 && (
            <Text style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>No transactions yet</Text>
          )}
          {history.map((h, i) => (
            <View key={h.id} style={[styles.historyRow, i < history.length - 1 && styles.historyDivider]}>
              <View style={[styles.historyIcon, { backgroundColor: h.points > 0 ? '#e8f5e9' : '#ffebee' }]}>
                <Ionicons name={h.points > 0 ? 'arrow-up' : 'arrow-down'} size={14} color={h.points > 0 ? '#2e7d32' : '#c62828'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyEvent}>{h.description || h.source}</Text>
                <Text style={styles.historyDate}>{new Date(h.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
              </View>
              <Text style={[styles.historyPoints, { color: h.points > 0 ? '#2e7d32' : '#c62828' }]}>
                {h.points > 0 ? '+' : ''}{h.points}
              </Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfdff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  content: { padding: 20, gap: 16, paddingBottom: 120 },

  heroCard: {
    borderRadius: 24, padding: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8,
  },
  heroDecor: { position: 'absolute', bottom: -20, right: -20 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tierBadgeText: { color: 'white', fontSize: 12, fontWeight: '700' },
  discountChip: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, fontSize: 13, color: 'white', fontWeight: '800' },
  heroPoints: { fontSize: 52, fontWeight: '900', color: 'white', letterSpacing: -2, marginBottom: 2 },
  heroPointsLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 18 },
  progressSection: { marginBottom: 20 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  progressPct: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: 'white', borderRadius: 2 },
  heroStats: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 16 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatVal: { fontSize: 20, fontWeight: '900', color: 'white' },
  heroStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 2 },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

  referralCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: '#f1f4f9'
  },
  referralTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  referralIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  referralTitle: { fontSize: 16, fontWeight: '800', color: '#181c20' },
  referralSub: { fontSize: 12, color: '#707881', marginTop: 2, lineHeight: 16 },
  codeBox: { backgroundColor: '#f1f4f9', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e0e2e8', borderStyle: 'dashed', marginBottom: 14 },
  codeLabel: { fontSize: 10, color: '#707881', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  codeValue: { fontSize: 18, fontWeight: '900', color: '#005d90', letterSpacing: 1 },
  referralActions: { flexDirection: 'row', gap: 10 },
  copyBtn: { flex: 0.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, borderColor: '#bfdbf7' },
  copyBtnText: { color: '#005d90', fontWeight: '700', fontSize: 13 },
  shareBtn: { flex: 0.6, borderRadius: 14, overflow: 'hidden' },
  shareBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  shareBtnText: { color: 'white', fontWeight: '800', fontSize: 13 },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#181c20', letterSpacing: -0.3 },

  voucherCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'white', borderRadius: 18, padding: 16,
    borderLeftWidth: 4, borderLeftColor: '#005d90',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  voucherLeft: { flex: 1 },
  voucherValue: { fontSize: 18, fontWeight: '900', color: '#005d90', marginBottom: 3 },
  voucherMeta: { fontSize: 11, color: '#707881', fontWeight: '600' },
  voucherCode: { alignItems: 'flex-end' },
  voucherCodeText: { fontSize: 13, fontWeight: '800', color: '#181c20', marginBottom: 2 },
  voucherApply: { fontSize: 11, color: '#005d90', fontWeight: '700' },

  tiersList: {
    backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tierRowActive: { backgroundColor: '#f8fafc', borderRadius: 14, paddingHorizontal: 8, marginHorizontal: -8 },
  tierIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tierName: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  tierRange: { fontSize: 11, color: '#707881', fontWeight: '600' },
  tierDiscount: { fontSize: 14, fontWeight: '900' },
  currentChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 10 },
  currentChipText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  historyCard: {
    backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  historyDivider: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  historyIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  historyEvent: { fontSize: 13, fontWeight: '700', color: '#181c20', marginBottom: 2 },
  historyDate: { fontSize: 11, color: '#707881', fontWeight: '500' },
  historyPoints: { fontSize: 15, fontWeight: '800' },
});



