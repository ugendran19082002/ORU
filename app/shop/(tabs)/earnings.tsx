import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Logo } from '@/components/ui/Logo';
import { EmptyState } from '@/components/ui/EmptyState';
import { useOrderStore } from '@/stores/orderStore';
import { useRouter } from 'expo-router';
import { payoutApi, ShopWallet, PayoutLog } from '@/api/payoutApi';
import { Shadow, thannigoPalette, roleAccent, roleSurface, roleGradients } from '@/constants/theme';

const SHOP_ACCENT = roleAccent.shop_owner;
const SHOP_SURF = roleSurface.shop_owner;
const SHOP_GRAD: [string, string] = [roleGradients.shop_owner.start, roleGradients.shop_owner.end];

const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function getTrxMeta(type: PayoutLog['type']) {
  if (type === 'credit') return { bg: '#e8f5e9', color: '#2e7d32', icon: 'arrow-down-outline' as const };
  if (type === 'commission') return { bg: '#fff3e0', color: '#e65100', icon: 'remove-outline' as const };
  return { bg: '#ffebee', color: '#c62828', icon: 'arrow-up-outline' as const };
}

function getTrxAmount(log: PayoutLog) {
  if (log.type === 'commission') return `-₹${(log.commission_amount ?? 0).toFixed(2)}`;
  return `${log.type === 'credit' ? '+' : '-'}₹${log.amount.toFixed(2)}`;
}

export default function ShopEarningsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState<ShopWallet | null>(null);
  const [payoutLogs, setPayoutLogs] = useState<PayoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const { orders } = useOrderStore();

  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.created_at ?? o.createdAt ?? Date.now()).toDateString() === today);
  const todayDelivered = todayOrders.filter((o) => o.status === 'delivered' || o.status === 'completed');
  const todayRevenue = todayDelivered.reduce((s, o) => s + (o.total ?? o.total_amount ?? 0), 0);
  const todayCans = todayDelivered.reduce((s, o) => s + (o.items?.reduce((q: number, i: any) => q + i.quantity, 0) ?? 0), 0);

  const fetchData = useCallback(async () => {
    try {
      const [walletRes, logsRes] = await Promise.all([
        payoutApi.getWallet(),
        payoutApi.getPayoutLogs(),
      ]);
      if (walletRes.status === 1) {
        setWallet(walletRes.data);
      }
      if (logsRes.status === 1) {
        setPayoutLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Load failed', text2: 'Pull down to retry.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleWithdraw = async () => {
    if (!wallet) return;
    if (!wallet.bank_account_verified) {
      Toast.show({ type: 'error', text1: 'Bank not verified', text2: 'Verify your bank account in profile settings.' });
      return;
    }
    if ((wallet.balance ?? 0) <= 0) {
      Toast.show({ type: 'info', text1: 'No balance', text2: 'Nothing to withdraw right now.' });
      return;
    }
    setIsWithdrawing(true);
    try {
      await payoutApi.requestInstantPayout(wallet.balance);
      Toast.show({ type: 'success', text1: 'Payout requested', text2: 'Funds will arrive within 24 hours.' });
      await fetchData();
    } catch {
      Toast.show({ type: 'error', text1: 'Withdrawal failed', text2: 'Please try again later.' });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const balance = wallet?.balance ?? 0;
  const totalCommission = wallet?.total_commission ?? 0;
  const canWithdraw = (wallet?.bank_account_verified ?? false) && balance > 0;

  // Group transactions
  const groupedTrxs = React.useMemo(() => {
    const groups: { title: string; data: PayoutLog[] }[] = [
      { title: 'Today', data: [] },
      { title: 'Yesterday', data: [] },
      { title: 'Earlier', data: [] }
    ];
    const now = new Date();
    const todayStr = now.toDateString();
    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    const yestStr = yest.toDateString();

    payoutLogs.forEach(log => {
      if (!log.created_at) return;
      const dStr = new Date(log.created_at).toDateString();
      if (dStr === todayStr) groups[0].data.push(log);
      else if (dStr === yestStr) groups[1].data.push(log);
      else groups[2].data.push(log);
    });

    return groups.filter(g => g.data.length > 0);
  }, [payoutLogs]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Logo size="md" />
          <View>
            <Text style={styles.brandName}>ThanniGo</Text>
            <Text style={styles.roleLabel}>WALLET & EARNINGS</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/notifications' as any)}>
            <Ionicons name="notifications-outline" size={22} color={SHOP_ACCENT} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/shop/payout-settings' as any)}>
            <Ionicons name="settings-outline" size={20} color={SHOP_ACCENT} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[SHOP_ACCENT]} tintColor={SHOP_ACCENT} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.pageTitle}>Earnings</Text>

        {loading ? (
          <ActivityIndicator size="large" color={SHOP_ACCENT} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Balance card */}
            <LinearGradient colors={SHOP_GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.balanceCard}>
              <View style={styles.glassOverlay} />
              <Ionicons name="card" size={160} color="rgba(255,255,255,0.08)" style={styles.balanceDecor} />

              <View style={styles.balanceTop}>
                <View>
                  <Text style={styles.balanceLabel}>SETTLED BALANCE</Text>
                  <Text style={styles.balanceAmount}>{fmt(balance)}</Text>
                </View>
                <View style={styles.balanceBadge}>
                  <Ionicons name="shield-checkmark" size={12} color={SHOP_ACCENT} />
                  <Text style={styles.balanceBadgeText}>SECURE</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.commissionRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.commissionLabel}>Total Platform Commission</Text>
                  <Text style={styles.commissionAmt}>{fmt(totalCommission)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.analyticsBtn}
                  onPress={() => router.push('/shop/analytics' as any)}
                >
                  <Text style={styles.analyticsBtnText}>Insights</Text>
                  <Ionicons name="chevron-forward" size={12} color={SHOP_ACCENT} />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Withdraw button */}
            <TouchableOpacity
              style={[styles.withdrawBtn, !canWithdraw && { opacity: 0.45 }]}
              onPress={handleWithdraw}
              disabled={!canWithdraw || isWithdrawing}
            >
              {isWithdrawing ? (
                <ActivityIndicator size="small" color={SHOP_ACCENT} />
              ) : (
                <Ionicons name="cash-outline" size={18} color={SHOP_ACCENT} />
              )}
              <Text style={styles.withdrawText}>
                {isWithdrawing ? 'Processing…' : `Withdraw ${fmt(balance)} to Bank`}
              </Text>
            </TouchableOpacity>

            {!wallet?.bank_account_verified && (
              <TouchableOpacity
                style={styles.verifyBanner}
                onPress={() => router.push('/shop/payout-settings' as any)}
              >
                <Ionicons name="alert-circle-outline" size={16} color="#b45309" />
                <Text style={styles.verifyBannerText}>Verify your bank account to enable withdrawals</Text>
                <Ionicons name="chevron-forward" size={14} color="#b45309" />
              </TouchableOpacity>
            )}

            {/* Today's stats */}
            <Text style={styles.sectionTitle}>Today's Overview</Text>
            <View style={styles.statsRow}>
              {[
                { icon: 'receipt-outline', val: String(todayOrders.length), label: 'Orders' },
                { icon: 'trending-up-outline', val: fmt(todayRevenue), label: 'Revenue' },
                { icon: 'water-outline', val: String(todayCans), label: 'Cans' },
              ].map((s) => (
                <View key={s.label} style={[styles.statBox, Shadow.xs]}>
                  <View style={[styles.statIconWrap, { backgroundColor: SHOP_SURF }]}>
                    <Ionicons name={s.icon as any} size={18} color={SHOP_ACCENT} />
                  </View>
                  <Text style={styles.statVal} numberOfLines={1} adjustsFontSizeToFit>{s.val}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
            {/* Transactions */}
            <View style={styles.sectionHeaderRow}>
               <Text style={styles.sectionTitle}>Transaction History</Text>
               <TouchableOpacity onPress={() => Toast.show({ type: 'info', text1: 'Feature coming soon', text2: 'Monthly statements will be available soon.' })}>
                  <Text style={styles.statementLink}>Statements</Text>
               </TouchableOpacity>
            </View>
            
            {payoutLogs.length === 0 ? (
              <EmptyState
                icon="receipt-outline"
                title="No transactions yet"
                subtitle="Your credits and payouts will appear here."
              />
            ) : (
              <View style={styles.trxContainer}>
                {groupedTrxs.map((group) => (
                  <View key={group.title} style={styles.trxGroup}>
                    <Text style={styles.groupHeader}>{group.title}</Text>
                    <View style={[styles.trxCard, Shadow.xs]}>
                      {group.data.map((log, i) => {
                        const { bg, color, icon } = getTrxMeta(log.type);
                        const amt = getTrxAmount(log);
                        const isPos = log.type === 'credit';
                        const isLast = i === group.data.length - 1;
                        return (
                          <View key={log.id} style={[styles.trxRow, !isLast && styles.trxBorder]}>
                            <View style={[styles.trxIconWrap, { backgroundColor: bg }]}>
                              <Ionicons name={icon} size={15} color={color} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.trxTitle} numberOfLines={1}>
                                {log.description ?? `${log.type.replace(/_/g, ' ')} #${log.id}`}
                              </Text>
                              <Text style={styles.trxTime}>
                                {log.created_at ? new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                              </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={[styles.trxAmt, { color: isPos ? '#2e7d32' : log.type === 'commission' ? '#e65100' : '#c62828' }]}>
                                {amt}
                              </Text>
                              {log.failed_reason && (
                                <Text style={styles.trxNote} numberOfLines={1}>{log.failed_reason}</Text>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            )}
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
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: thannigoPalette.surface,
    borderBottomWidth: 1, borderBottomColor: thannigoPalette.borderSoft,
  },
  brandName: { fontSize: 20, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5 },
  roleLabel: { fontSize: 9, fontWeight: '700', color: SHOP_ACCENT, letterSpacing: 1.5, marginTop: 2 },
  settingsBtn: { width: 42, height: 42, borderRadius: 13, backgroundColor: SHOP_SURF, alignItems: 'center', justifyContent: 'center' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  pageTitle: { fontSize: 32, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.8, marginTop: 10, marginBottom: 20 },

  balanceCard: {
    padding: 24, borderRadius: 28, overflow: 'hidden', position: 'relative', marginBottom: 16,
    shadowColor: SHOP_ACCENT, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  glassOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.05)' },
  balanceDecor: { position: 'absolute', bottom: -40, right: -40 },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5, marginBottom: 6 },
  balanceAmount: { fontSize: 40, fontWeight: '900', color: 'white', letterSpacing: -1.5 },
  balanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  balanceBadgeText: { fontSize: 10, fontWeight: '900', color: SHOP_ACCENT, letterSpacing: 1 },
  cardDivider: { height: 1.5, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 20 },
  commissionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  commissionLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.75)', marginBottom: 2 },
  commissionAmt: { fontSize: 20, fontWeight: '900', color: 'white' },
  analyticsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)'
  },
  analyticsBtnText: { fontSize: 13, fontWeight: '800', color: 'white' },

  withdrawBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: thannigoPalette.surface, borderRadius: 20, paddingVertical: 18,
    borderWidth: 1.5, borderColor: SHOP_ACCENT + '20', marginBottom: 12,
    ...Shadow.sm,
  },
  withdrawText: { color: SHOP_ACCENT, fontWeight: '900', fontSize: 15 },

  verifyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fffdf5', borderRadius: 14, padding: 14, marginBottom: 24,
    borderWidth: 1, borderColor: '#fef3c7',
  },
  verifyBannerText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#92400e' },

  sectionTitle: { fontSize: 17, fontWeight: '900', color: thannigoPalette.darkText, marginBottom: 16, letterSpacing: -0.4 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 16 },
  statementLink: { fontSize: 13, fontWeight: '700', color: SHOP_ACCENT },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  statBox: { flex: 1, backgroundColor: thannigoPalette.surface, borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: thannigoPalette.borderSoft },
  statIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statVal: { fontSize: 18, fontWeight: '900', color: thannigoPalette.darkText, marginBottom: 4, textAlign: 'center' },
  statLabel: { fontSize: 11, color: thannigoPalette.neutral, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },

  trxContainer: { gap: 20 },
  trxGroup: { gap: 12 },
  groupHeader: { fontSize: 12, fontWeight: '800', color: thannigoPalette.neutral, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 },
  trxCard: { backgroundColor: thannigoPalette.surface, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 4, borderWidth: 1, borderColor: thannigoPalette.borderSoft },
  trxRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  trxBorder: { borderBottomWidth: 1.5, borderBottomColor: thannigoPalette.borderSoft },
  trxIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  trxTitle: { fontSize: 14, fontWeight: '700', color: thannigoPalette.darkText, marginBottom: 3 },
  trxTime: { fontSize: 12, color: thannigoPalette.neutral, fontWeight: '500' },
  trxAmt: { fontSize: 16, fontWeight: '800' },
  trxNote: { fontSize: 10, color: '#ba1a1a', fontWeight: '600', maxWidth: 80, textAlign: 'right', marginTop: 2 },
});
