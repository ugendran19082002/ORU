import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';


const TIERS = [
  { name: 'Bronze', range: '1–9 orders', discount: '0%', minOrders: 1, color: '#b45309', bg: '#fef3c7', icon: 'medal-outline' },
  { name: 'Silver', range: '10–24 orders', discount: '5%', minOrders: 10, color: '#64748b', bg: '#f1f5f9', icon: 'medal-outline' },
  { name: 'Gold', range: '25–49 orders', discount: '10%', minOrders: 25, color: '#d97706', bg: '#fffbeb', icon: 'ribbon-outline' },
  { name: 'Diamond', range: '50+ orders', discount: '15%', minOrders: 50, color: '#7c3aed', bg: '#ede9fe', icon: 'diamond-outline' },
];

const HISTORY = [
  { id: '1', event: 'Referral Bonus — Priya joined', points: +250, date: 'Apr 9' },
  { id: '2', event: 'Order #9823 Completed', points: +15, date: 'Apr 8' },
  { id: '3', event: 'Subscription Month 2', points: +100, date: 'Apr 1' },
  { id: '4', event: 'Redeemed ₹50 voucher', points: -500, date: 'Mar 28' },
  { id: '5', event: 'Order #9790 Completed', points: +15, date: 'Mar 25' },
];

const VOUCHERS = [
  { code: 'LOYAL50', value: '₹50 off', expiry: 'Apr 30', minOrder: '₹200' },
  { code: 'FREE5L', value: '5L can free', expiry: 'May 15', minOrder: '₹300' },
];

export default function RewardsScreen() {
  const router = useRouter();
  const currentPoints = 1380;
  const totalOrders = 28;
  const currentTier = TIERS.find((t) => totalOrders >= t.minOrders && (TIERS.indexOf(t) === TIERS.length - 1 || totalOrders < TIERS[TIERS.indexOf(t) + 1].minOrders)) || TIERS[0];
  const nextTier = TIERS[TIERS.indexOf(currentTier) + 1];
  const ordersToNext = nextTier ? nextTier.minOrders - totalOrders : 0;
  const tierProgress = nextTier ? (totalOrders - currentTier.minOrders) / (nextTier.minOrders - currentTier.minOrders) : 1;
  const referralCode = 'THANNIGO-U238';

  const handleShare = async () => {
    await Share.share({
      message: `🌊 Join ThanniGo — pure water delivered in 15 mins!\nUse my code ${referralCode} and get ₹50 off your first order.\nhttps://thannigo.app`,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rewards & Referrals</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* HERO LOYALTY CARD */}
        <LinearGradient
          colors={[currentTier.color, currentTier.color + 'cc']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Ionicons name="ribbon" size={100} color="rgba(255,255,255,0.06)" style={styles.heroDecor} />
          <View style={styles.heroTop}>
            <View style={[styles.tierBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name={currentTier.icon as any} size={16} color="white" />
              <Text style={styles.tierBadgeText}>{currentTier.name} Member</Text>
            </View>
            <Text style={styles.discountChip}>{currentTier.discount} OFF</Text>
          </View>
          <Text style={styles.heroPoints}>{currentPoints.toLocaleString()}</Text>
          <Text style={styles.heroPointsLabel}>Total Points</Text>

          {nextTier && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>{ordersToNext} orders to {nextTier.name}</Text>
                <Text style={styles.progressPct}>{Math.round(tierProgress * 100)}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${tierProgress * 100}%` }]} />
              </View>
            </View>
          )}

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatVal}>{totalOrders}</Text>
              <Text style={styles.heroStatLabel}>Orders</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatVal}>₹320</Text>
              <Text style={styles.heroStatLabel}>Saved</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatVal}>3</Text>
              <Text style={styles.heroStatLabel}>Referred</Text>
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
              <Text style={styles.referralTitle}>Invite & Earn ₹250</Text>
              <Text style={styles.referralSub}>You get 250 points per referral. They get ₹50 off.</Text>
            </View>
          </View>
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
            <Text style={styles.codeValue}>{referralCode}</Text>
          </View>
          <View style={styles.referralActions}>
            <TouchableOpacity style={styles.copyBtn} onPress={() => Alert.alert('Copied!', `${referralCode} copied to clipboard.`)}>
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
        {VOUCHERS.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Your Vouchers</Text>
            {VOUCHERS.map((v) => (
              <TouchableOpacity key={v.code} style={styles.voucherCard} activeOpacity={0.8}>
                <View style={styles.voucherLeft}>
                  <Text style={styles.voucherValue}>{v.value}</Text>
                  <Text style={styles.voucherMeta}>Min order {v.minOrder} · Expires {v.expiry}</Text>
                </View>
                <View style={styles.voucherCode}>
                  <Text style={styles.voucherCodeText}>{v.code}</Text>
                  <Text style={styles.voucherApply}>Apply →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* LOYALTY TIERS */}
        <Text style={styles.sectionTitle}>Loyalty Tiers</Text>
        <View style={styles.tiersList}>
          {TIERS.map((tier) => (
            <View key={tier.name} style={[styles.tierRow, tier.name === currentTier.name && styles.tierRowActive]}>
              <View style={[styles.tierIcon, { backgroundColor: tier.bg }]}>
                <Ionicons name={tier.icon as any} size={18} color={tier.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
                <Text style={styles.tierRange}>{tier.range}</Text>
              </View>
              <Text style={[styles.tierDiscount, { color: tier.color }]}>{tier.discount} off</Text>
              {tier.name === currentTier.name && (
                <View style={[styles.currentChip, { backgroundColor: tier.color + '18' }]}>
                  <Text style={[styles.currentChipText, { color: tier.color }]}>CURRENT</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* POINTS HISTORY */}
        <Text style={styles.sectionTitle}>Points History</Text>
        <View style={styles.historyCard}>
          {HISTORY.map((h, i) => (
            <View key={h.id} style={[styles.historyRow, i < HISTORY.length - 1 && styles.historyDivider]}>
              <View style={[styles.historyIcon, { backgroundColor: h.points > 0 ? '#e8f5e9' : '#ffebee' }]}>
                <Ionicons name={h.points > 0 ? 'arrow-up' : 'arrow-down'} size={14} color={h.points > 0 ? '#2e7d32' : '#c62828'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyEvent}>{h.event}</Text>
                <Text style={styles.historyDate}>{h.date}</Text>
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
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
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
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tierRowActive: { backgroundColor: '#f8fafc', borderRadius: 14, paddingHorizontal: 8, marginHorizontal: -8 },
  tierIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tierName: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  tierRange: { fontSize: 11, color: '#707881', fontWeight: '600' },
  tierDiscount: { fontSize: 14, fontWeight: '900' },
  currentChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  currentChipText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  historyCard: {
    backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  historyDivider: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  historyIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  historyEvent: { fontSize: 13, fontWeight: '700', color: '#181c20', marginBottom: 2 },
  historyDate: { fontSize: 11, color: '#707881', fontWeight: '500' },
  historyPoints: { fontSize: 15, fontWeight: '800' },
});
