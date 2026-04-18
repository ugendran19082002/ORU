import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/providers/ThemeContext';
import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { adminPayoutsApi, type AdminPayout, type AdminPayoutSummary } from '@/api/adminUsersApi';

import { Shadow, roleAccent, roleSurface } from '@/constants/theme';

const ADMIN_ACCENT = roleAccent.admin;
const ADMIN_SURF = roleSurface.admin;

// ─── Types & constants ────────────────────────────────────────────────────────

type StatusFilter = 'pending' | 'processed' | '';

const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'processed', label: 'Processed' },
  { key: '', label: 'All' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatAmount(amount: number): string {
  if (amount >= 100000) return '₹' + (amount / 100000).toFixed(1) + 'L';
  if (amount >= 1000) return '₹' + (amount / 1000).toFixed(1) + 'K';
  return '₹' + amount.toFixed(2);
}

// ─── Summary Banner ───────────────────────────────────────────────────────────

interface SummaryBannerProps {
  summary: AdminPayoutSummary | null;
  loading: boolean;
}

function SummaryBanner({ summary, loading }: SummaryBannerProps) {
  return (
    <LinearGradient
      colors={[ADMIN_ACCENT, ADMIN_ACCENT]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.summaryBanner}
    >
      {loading || !summary ? (
        <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
      ) : (
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <View style={styles.summaryIconBox}>
              <Ionicons name="time-outline" size={20} color={ADMIN_ACCENT} />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Pending Amount</Text>
              <Text style={styles.summaryValue}>
                {formatAmount(summary.total_pending_amount)}
              </Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <View style={styles.summaryIconBox}>
              <Ionicons name="business-outline" size={20} color={ADMIN_ACCENT} />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Shops Waiting</Text>
              <Text style={styles.summaryValue}>{summary.pending_shop_count}</Text>
            </View>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

// ─── Payout Card ──────────────────────────────────────────────────────────────

interface PayoutCardProps {
  payout: AdminPayout;
  onProcess: (id: number) => void;
  actionLoadingId: number | null;
}

function PayoutCard({ payout, onProcess, actionLoadingId }: PayoutCardProps) {
  const isPending = payout.status === 'pending';
  const isActing = actionLoadingId === payout.id;

  return (
    <View style={[styles.card, isPending && styles.cardPending]}>
      {/* Top row: shop name + status */}
      <View style={styles.cardTopRow}>
        <View style={styles.shopIconBox}>
          <Ionicons name="business" size={20} color={ADMIN_ACCENT} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardShopName} numberOfLines={1}>{payout.shop_name}</Text>
          <Text style={styles.cardPeriod}>
            {formatDate(payout.period_from)} — {formatDate(payout.period_to)}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: isPending ? '#fff3e0' : '#e8f5e9' },
        ]}>
          <Text style={[
            styles.statusBadgeText,
            { color: isPending ? '#e65100' : colors.success },
          ]}>
            {isPending ? 'Pending' : 'Processed'}
          </Text>
        </View>
      </View>

      {/* Amount */}
      <Text style={styles.cardAmount}>{formatAmount(payout.amount)}</Text>

      {/* Processed date */}
      {payout.processed_at && (
        <View style={styles.processedRow}>
          <Ionicons name="checkmark-circle-outline" size={13} color="#2e7d32" />
          <Text style={styles.processedText}>
            Processed on {formatDate(payout.processed_at)}
          </Text>
        </View>
      )}

      {/* Created date footer */}
      <View style={styles.cardFooter}>
        <View style={styles.cardMetaRow}>
          <Ionicons name="calendar-outline" size={11} color="#94a3b8" />
          <Text style={styles.cardFooterText}>Created {formatDate(payout.created_at)}</Text>
        </View>

        {/* Mark Processed button — only for pending */}
        {isPending && (
          isActing ? (
            <ActivityIndicator size="small" color={ADMIN_ACCENT} />
          ) : (
            <TouchableOpacity
              style={styles.processBtn}
              onPress={() => onProcess(payout.id)}
            >
              <Ionicons name="checkmark-done-outline" size={14} color={ADMIN_ACCENT} />
              <Text style={styles.processBtnText}>Mark Processed</Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AdminPayoutsScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [activeTab, setActiveTab] = useState<StatusFilter>('pending');
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [summary, setSummary] = useState<AdminPayoutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await adminPayoutsApi.getPayoutSummary();
      if (res.status === 1 && res.data) {
        setSummary(res.data);
      }
    } catch {
      // Non-critical — banner just stays empty
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchPayouts = useCallback(async () => {
    try {
      const res = await adminPayoutsApi.listPayouts({
        status: activeTab || undefined,
        page: 1,
        limit: 50,
      });

      if (res.status === 1 && res.data) {
        setPayouts(res.data.data ?? []);
        setError(null);
      } else {
        throw new Error(res.message || 'Failed to fetch payouts');
      }
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to load payouts.';
      setError(msg);
      Toast.show({ type: 'error', text1: 'Sync Error', text2: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  // Initial load — fetch summary + payouts together
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchPayouts();
  }, [fetchPayouts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSummary();
    fetchPayouts();
  }, [fetchSummary, fetchPayouts]);

  const handleProcess = useCallback(
    (id: number) => {
      const payout = payouts.find((p) => p.id === id);
      Alert.alert(
        'Mark as Processed',
        `Mark the payout of ${payout ? formatAmount(payout.amount) : 'this amount'} for ${payout?.shop_name ?? 'this shop'} as processed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: async () => {
              setActionLoadingId(id);
              try {
                const res = await adminPayoutsApi.processPayout(id);
                if (res.status === 1) {
                  Toast.show({ type: 'success', text1: 'Processed', text2: 'Payout marked as processed.' });
                  // Refresh list and summary
                  fetchPayouts();
                  fetchSummary();
                } else {
                  throw new Error(res.message || 'Process failed');
                }
              } catch (err: any) {
                Toast.show({ type: 'error', text1: 'Error', text2: err?.message ?? 'Process failed.' });
              } finally {
                setActionLoadingId(null);
              }
            },
          },
        ],
      );
    },
    [payouts, fetchPayouts, fetchSummary],
  );

  const renderItem = useCallback(
    ({ item }: { item: AdminPayout }) => (
      <PayoutCard
        payout={item}
        onProcess={handleProcess}
        actionLoadingId={actionLoadingId}
      />
    ),
    [handleProcess, actionLoadingId],
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="wallet-outline" size={64} color="#c8d6e0" />
        <Text style={styles.emptyTitle}>No Payouts</Text>
        <Text style={styles.emptySubtitle}>
          {activeTab === 'pending'
            ? 'No pending payouts. All shops are up to date!'
            : activeTab === 'processed'
            ? 'No processed payouts yet.'
            : 'No payout records found.'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={20} color={ADMIN_ACCENT} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.pageTitle}>Payouts</Text>
              {!loading && (
                <Text style={styles.headerSub}>{payouts.length} total records</Text>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>

      <View style={[styles.filterBarWrap, isDesktop && { alignItems: 'center' }]}>
        <View style={{ width: '100%', maxWidth: 1200 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={String(tab.key)}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color={ADMIN_ACCENT} style={{ marginTop: 80 }} />
      ) : error ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="cloud-offline-outline" size={64} color="#c8d6e0" />
          <Text style={styles.emptyTitle}>Failed to Load</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchPayouts(); }}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={payouts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            isDesktop && { paddingHorizontal: width * 0.08 },
          ]}
          ListHeaderComponent={
            <SummaryBanner summary={summary} loading={summaryLoading} />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[ADMIN_ACCENT]}
              tintColor={ADMIN_ACCENT}
            />
          }
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  headerSafe: { 
    backgroundColor: colors.surface, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  headerContent: {
    width: '100%',
    maxWidth: 1200,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: colors.muted, fontWeight: '600', marginTop: 2 },

  filterBarWrap: { paddingVertical: 18, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabContent: { gap: 10, paddingHorizontal: 24 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.border,
  },
  tabActive: { backgroundColor: ADMIN_ACCENT },
  tabText: { fontSize: 13, fontWeight: '800', color: colors.muted },
  tabTextActive: { color: 'white' },

  listContent: { padding: 20, paddingBottom: 100 },

  // Summary banner
  summaryBanner: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -0.5,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: 20,
  },

  // Payout card
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPending: {
    borderLeftWidth: 4,
    borderLeftColor: '#e65100',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  shopIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: ADMIN_SURF,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardShopName: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 2 },
  cardPeriod: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },
  cardAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  processedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  processedText: { fontSize: 12, color: colors.success, fontWeight: '600' },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cardFooterText: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },

  // Mark Processed button
  processBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: ADMIN_SURF,
    borderWidth: 1,
    borderColor: '#ffb4ab',
  },
  processBtnText: { fontSize: 12, fontWeight: '800', color: ADMIN_ACCENT },

  // Empty / error
  emptyWrap: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: ADMIN_ACCENT,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
});
