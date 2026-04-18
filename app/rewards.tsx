import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator, Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { useAppSession } from '@/hooks/use-app-session';
import { apiClient } from '@/api/client';
import { Shadow, thannigoPalette, roleAccent, Radius } from '@/constants/theme';
import { useAppTheme } from '@/providers/ThemeContext';

const ACCENT = roleAccent.customer;
const GRAD: [string, string] = [ACCENT, '#0077b6'];

export default function RewardsScreen() {
  const router = useRouter();
  const { user } = useAppSession();
  const { colors, isDark } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dynamic State
  const [history, setHistory] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [referralData, setReferralData] = useState<{ code: string; total_referred: number; total_earned: number } | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  const fetchRewardsData = useCallback(async () => {
    try {
      const [historyRes, tierRes, settingRes, couponRes, referralRes] = await Promise.all([
        apiClient.get('/promotion/loyalty/ledger'),
        apiClient.get('/promotion/loyalty/levels'),
        apiClient.get('/promotion/loyalty/settings'),
        apiClient.get('/promotion/coupons/active'),
        apiClient.get('/promotion/referrals/mine').catch(() => null),
      ]);

      if (historyRes.data?.status === 1) setHistory(historyRes.data.data?.data || []);
      if (tierRes.data?.status === 1) setTiers(tierRes.data.data || []);
      if (settingRes.data?.status === 1) setSettings(settingRes.data.data || null);
      if (couponRes.data?.status === 1) setCoupons((couponRes.data.data || []).filter((c: any) => c?.is_active));
      if (referralRes?.data?.status === 1) setReferralData(referralRes.data.data || null);
    } catch (err) {
      console.error('Failed to fetch rewards data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const generateReferralCode = async () => {
    try {
      setGeneratingCode(true);
      const res = await apiClient.post('/promotion/referrals/generate');
      if (res.data?.status === 1) {
        setReferralData(res.data.data || null);
        Toast.show({ type: 'success', text1: 'Code Generated!', text2: 'Your referral code is ready to share.' });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not generate referral code.' });
    } finally {
      setGeneratingCode(false);
    }
  };

  useEffect(() => { fetchRewardsData(); }, [fetchRewardsData]);

  const currentPoints = user?.loyalty_points || 0;
  const currentTier = (tiers || []).find(t => currentPoints >= t.min_points && (!t.max_points || currentPoints <= t.max_points)) || tiers[0] || { name: 'Bronze', discount_percent: 0, min_points: 0 };
  const nextTier = (tiers || []).find(t => t.min_points > currentPoints);

  const pointsToNext = nextTier ? nextTier.min_points - currentPoints : 0;
  const tierProgress = nextTier ? (currentPoints / nextTier.min_points) : 1;
  const referralCode = referralData?.code ?? user?.referral_code ?? null;

  const handleShare = async () => {
    await Share.share({
      message: `🌊 Join ThanniGo — pure water delivered in 15 mins!\nUse my code ${referralCode} and get a special discount on your first order.\nhttps://thannigo.app`,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <BackButton fallback="/(tabs)/profile" />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Rewards & Referrals</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRewardsData(); }} />}
      >
        {/* HERO LOYALTY CARD */}
        <LinearGradient
          colors={GRAD}
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
            <Text style={styles.discountChip}>{currentTier.discount_percent}% OFF</Text>
          </View>
          <Text style={styles.heroPoints}>{currentPoints.toLocaleString()}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 }}>
            <Text style={styles.heroPointsLabel}>Total Points</Text>
            <View style={styles.valueBadge}>
              <Text style={styles.valueBadgeText}>≈ ₹{settings ? (currentPoints / settings.points_to_currency_ratio).toFixed(2) : '0'}</Text>
            </View>
          </View>

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
              <Text style={styles.heroStatVal}>₹{Math.round(settings?.min_order_amount_for_redeem || 100)}</Text>
              <Text style={styles.heroStatLabel}>Min Order</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatVal}>{settings?.points_to_currency_ratio || 10}</Text>
              <Text style={styles.heroStatLabel}>Pts = ₹1</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatVal}>{settings?.max_points_percentage_per_order || 10}%</Text>
              <Text style={styles.heroStatLabel}>Max Discount</Text>
            </View>
          </View>
        </LinearGradient>

        {/* REFERRAL CARD */}
        <View style={[styles.referralCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.referralTop}>
            <View style={[styles.referralIconWrap, { backgroundColor: thannigoPalette.infoSoft }]}>
              <Ionicons name="people" size={24} color={ACCENT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.referralTitle, { color: colors.text }]}>Invite & Earn Points</Text>
              <Text style={[styles.referralSub, { color: colors.muted }]}>Share your code and earn points on their first signup and order.</Text>
            </View>
          </View>
          {referralCode ? (
            <>
              <View style={[styles.codeBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Text style={[styles.codeLabel, { color: colors.muted }]}>YOUR REFERRAL CODE</Text>
                <Text style={styles.codeValue}>{referralCode}</Text>
                {referralData && (
                  <Text style={[styles.referralStats, { color: colors.muted }]}>
                    {referralData.total_referred} referred · ₹{referralData.total_earned} earned
                  </Text>
                )}
              </View>
              <View style={styles.referralActions}>
                <TouchableOpacity
                  style={[styles.copyBtn, { borderColor: colors.border }]}
                  onPress={async () => {
                    await Clipboard.setStringAsync(referralCode);
                    Toast.show({ type: 'success', text1: 'Copied!', text2: `${referralCode} copied to clipboard.` });
                  }}
                >
                  <Ionicons name="copy-outline" size={16} color={ACCENT} />
                  <Text style={styles.copyBtnText}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                  <LinearGradient colors={GRAD} style={styles.shareBtnGrad}>
                    <Ionicons name="share-social-outline" size={16} color="white" />
                    <Text style={styles.shareBtnText}>Share Invite</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.generateBtn, { backgroundColor: thannigoPalette.infoSoft, borderColor: colors.border }]}
              onPress={generateReferralCode}
              disabled={generatingCode}
            >
              {generatingCode ? (
                <ActivityIndicator color={ACCENT} size="small" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={18} color={ACCENT} />
                  <Text style={styles.generateBtnText}>Generate My Referral Code</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* VOUCHERS */}
        {(coupons || []).length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Coupons</Text>
            {coupons.map((v) => (
              <TouchableOpacity key={v.id} style={[styles.voucherCard, { backgroundColor: colors.surface }]} activeOpacity={0.8}>
                <View style={styles.voucherLeft}>
                  <Text style={styles.voucherValue}>{v.type === 'percentage' ? `${v.discount_value}%` : `₹${v.discount_value}`} OFF</Text>
                  <Text style={[styles.voucherMeta, { color: colors.muted }]}>Min order ₹{v.min_order_value} · Expires {new Date(v.valid_until).toLocaleDateString()}</Text>
                </View>
                <View style={styles.voucherCode}>
                  <Text style={[styles.voucherCodeText, { color: colors.text }]}>{v.code}</Text>
                  <Text style={styles.voucherApply}>Use at checkout →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* LOYALTY TIERS */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Loyalty Tiers</Text>
        <View style={[styles.tiersList, { backgroundColor: colors.surface }]}>
          {(tiers || []).map((tier) => (
            <View key={tier.id} style={[styles.tierRow, { borderBottomColor: colors.border }, tier.id === currentTier.id && { backgroundColor: colors.background, borderRadius: 14, paddingHorizontal: 8, marginHorizontal: -8 }]}>
              <View style={[styles.tierIcon, { backgroundColor: thannigoPalette.infoSoft }]}>
                <Ionicons name="medal-outline" size={18} color={ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.tierName, { color: colors.text }]}>{tier.name}</Text>
                <Text style={[styles.tierRange, { color: colors.muted }]}>{tier.min_points}+ lifetime points</Text>
              </View>
              <Text style={[styles.tierDiscount, { color: ACCENT }]}>{tier.discount_percent}% off</Text>
              {tier.id === currentTier.id && (
                <View style={[styles.currentChip, { backgroundColor: ACCENT + '18' }]}>
                  <Text style={[styles.currentChipText, { color: ACCENT }]}>CURRENT</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* POINTS HISTORY */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Points History</Text>
        <View style={[styles.historyCard, { backgroundColor: colors.surface }]}>
          {(history || []).length === 0 && (
            <Text style={{ textAlign: 'center', color: colors.muted, padding: 20 }}>No transactions yet</Text>
          )}
          {(history || []).map((h, i) => (
            <View key={h.id} style={[styles.historyRow, i < history.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={[styles.historyIcon, { backgroundColor: h.points > 0 ? thannigoPalette.successSoft : thannigoPalette.dangerSoft }]}>
                <Ionicons name={h.points > 0 ? 'arrow-up' : 'arrow-down'} size={14} color={h.points > 0 ? thannigoPalette.success : thannigoPalette.error} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.historyEvent, { color: colors.text }]}>{h.description || h.source}</Text>
                <Text style={[styles.historyDate, { color: colors.muted }]}>{new Date(h.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
              </View>
              <Text style={[styles.historyPoints, { color: h.points > 0 ? thannigoPalette.success : thannigoPalette.error }]}>
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
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  content: { padding: 20, gap: 16, paddingBottom: 120 },

  heroCard: {
    borderRadius: Radius.xl, padding: 24, overflow: 'hidden',
    ...Shadow.lg,
  },
  heroDecor: { position: 'absolute', bottom: -20, right: -20 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tierBadgeText: { color: 'white', fontSize: 12, fontWeight: '700' },
  discountChip: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, fontSize: 13, color: 'white', fontWeight: '800' },
  heroPoints: { fontSize: 52, fontWeight: '900', color: 'white', letterSpacing: -2, marginBottom: 2 },
  heroPointsLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  valueBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  valueBadgeText: { color: 'white', fontSize: 11, fontWeight: '800' },
  progressSection: { marginBottom: 20, marginTop: 18 },
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
    borderRadius: Radius.xl, padding: 18,
    borderWidth: 1, ...Shadow.xs,
  },
  referralTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  referralIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  referralTitle: { fontSize: 16, fontWeight: '800' },
  referralSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  codeBox: { borderRadius: 14, padding: 14, borderWidth: 1, borderStyle: 'dashed', marginBottom: 14 },
  codeLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  codeValue: { fontSize: 18, fontWeight: '900', color: ACCENT, letterSpacing: 1 },
  referralActions: { flexDirection: 'row', gap: 10 },
  copyBtn: { flex: 0.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5 },
  copyBtnText: { color: ACCENT, fontWeight: '700', fontSize: 13 },
  shareBtn: { flex: 0.6, borderRadius: 14, overflow: 'hidden' },
  shareBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  shareBtnText: { color: 'white', fontWeight: '800', fontSize: 13 },
  referralStats: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
  generateBtnText: { color: ACCENT, fontWeight: '700', fontSize: 14 },

  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },

  voucherCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.lg, padding: 16,
    borderLeftWidth: 4, borderLeftColor: ACCENT,
    ...Shadow.xs,
  },
  voucherLeft: { flex: 1 },
  voucherValue: { fontSize: 18, fontWeight: '900', color: ACCENT, marginBottom: 3 },
  voucherMeta: { fontSize: 11, fontWeight: '600' },
  voucherCode: { alignItems: 'flex-end' },
  voucherCodeText: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  voucherApply: { fontSize: 11, color: ACCENT, fontWeight: '700' },

  tiersList: {
    borderRadius: Radius.xl, paddingHorizontal: 16, paddingVertical: 8,
    ...Shadow.xs,
  },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, borderBottomWidth: 1 },
  tierIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tierName: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  tierRange: { fontSize: 11, fontWeight: '600' },
  tierDiscount: { fontSize: 14, fontWeight: '900' },
  currentChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 10 },
  currentChipText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  historyCard: {
    borderRadius: Radius.xl, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 40,
    ...Shadow.xs,
  },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  historyIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  historyEvent: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  historyDate: { fontSize: 11, fontWeight: '500' },
  historyPoints: { fontSize: 15, fontWeight: '800' },
});
