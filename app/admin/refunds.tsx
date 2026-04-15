import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { adminRefundsApi, type AdminRefund } from '@/api/adminUsersApi';

// ─── Types & constants ────────────────────────────────────────────────────────

type StatusFilter = 'pending' | 'approved' | 'denied';

const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'denied', label: 'Denied' },
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

function getStatusTheme(status: AdminRefund['status']) {
  switch (status) {
    case 'pending':
      return { bg: '#fff3e0', text: '#e65100', label: 'Pending' };
    case 'approved':
      return { bg: '#e8f5e9', text: '#2e7d32', label: 'Approved' };
    case 'denied':
      return { bg: '#ffdad6', text: '#ba1a1a', label: 'Denied' };
    default:
      return { bg: '#f1f5f9', text: '#64748b', label: status };
  }
}

// ─── Deny Reason Modal ────────────────────────────────────────────────────────

interface DenyModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}

function DenyReasonModal({ visible, onClose, onConfirm, loading }: DenyModalProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason.trim());
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.denyOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.denySheet}>
          <Text style={styles.denyTitle}>Deny Refund</Text>
          <Text style={styles.denySubtitle}>
            Provide an optional reason for the customer.
          </Text>
          <TextInput
            style={styles.denyInput}
            placeholder="Reason for denial (optional)…"
            placeholderTextColor="#94a3b8"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            maxLength={300}
          />
          <View style={styles.denyActions}>
            <TouchableOpacity style={styles.denyCancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.denyCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.denyConfirmBtn}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.denyConfirmText}>Deny Refund</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Refund Card ──────────────────────────────────────────────────────────────

interface RefundCardProps {
  refund: AdminRefund;
  onApprove: (id: number) => void;
  onDeny: (id: number) => void;
  actionLoadingId: number | null;
}

function RefundCard({ refund, onApprove, onDeny, actionLoadingId }: RefundCardProps) {
  const statusTheme = getStatusTheme(refund.status);
  const isPending = refund.status === 'pending';
  const isActing = actionLoadingId === refund.id;

  return (
    <View style={styles.card}>
      {/* Top row: order ID + status */}
      <View style={styles.cardTopRow}>
        <View style={styles.cardMetaRow}>
          <Ionicons name="receipt-outline" size={13} color="#707881" />
          <Text style={styles.cardOrderId}>
            {refund.order_number ? `Order #${refund.order_number}` : `Order ID: ${refund.order_id}`}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
          <Text style={[styles.statusBadgeText, { color: statusTheme.text }]}>
            {statusTheme.label}
          </Text>
        </View>
      </View>

      {/* Customer + Amount */}
      <View style={styles.cardAmountRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardCustomer}>{refund.customer_name}</Text>
          <Text style={styles.cardReason} numberOfLines={2}>{refund.reason}</Text>
        </View>
        <Text style={styles.cardAmount}>₹{refund.amount.toFixed(2)}</Text>
      </View>

      {/* Deny reason if denied */}
      {refund.status === 'denied' && refund.deny_reason ? (
        <View style={styles.denyReasonRow}>
          <Ionicons name="information-circle-outline" size={13} color="#ba1a1a" />
          <Text style={styles.denyReasonText} numberOfLines={2}>
            Reason: {refund.deny_reason}
          </Text>
        </View>
      ) : null}

      {/* Footer: date */}
      <View style={styles.cardFooter}>
        <View style={styles.cardMetaRow}>
          <Ionicons name="time-outline" size={11} color="#94a3b8" />
          <Text style={styles.cardFooterText}>Requested {formatDate(refund.created_at)}</Text>
        </View>
        {refund.resolved_at && (
          <Text style={styles.cardFooterText}>
            Resolved {formatDate(refund.resolved_at)}
          </Text>
        )}
      </View>

      {/* Action buttons — only for pending */}
      {isPending && (
        <View style={styles.actionRow}>
          {isActing ? (
            <ActivityIndicator size="small" color="#005d90" style={{ marginVertical: 8 }} />
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, { flex: 1 }]}
                onPress={() => onApprove(refund.id)}
              >
                <LinearGradient colors={['#2e7d32', '#43a047']} style={styles.actionBtnGrad}>
                  <Ionicons name="checkmark-outline" size={15} color="white" />
                  <Text style={styles.actionBtnText}>Approve</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnReject, { flex: 1 }]}
                onPress={() => onDeny(refund.id)}
              >
                <View style={styles.actionBtnRejectInner}>
                  <Ionicons name="close-outline" size={15} color="#ba1a1a" />
                  <Text style={styles.actionBtnRejectText}>Deny</Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AdminRefundsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [activeTab, setActiveTab] = useState<StatusFilter>('pending');
  const [refunds, setRefunds] = useState<AdminRefund[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Deny modal state
  const [denyTargetId, setDenyTargetId] = useState<number | null>(null);
  const [denyLoading, setDenyLoading] = useState(false);

  const fetchRefunds = useCallback(async () => {
    try {
      const res = await adminRefundsApi.listRefunds({
        status: activeTab,
        page: 1,
        limit: 50,
      });

      if (res.status === 1 && res.data) {
        setRefunds(res.data.data ?? []);
        setError(null);
      } else {
        throw new Error(res.message || 'Failed to fetch refunds');
      }
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to load refunds.';
      setError(msg);
      Toast.show({ type: 'error', text1: 'Sync Error', text2: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchRefunds();
  }, [fetchRefunds]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRefunds();
  }, [fetchRefunds]);

  const handleApprove = useCallback(
    (id: number) => {
      Alert.alert(
        'Approve Refund',
        'This will approve the refund and initiate the payment back to the customer.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Approve',
            onPress: async () => {
              setActionLoadingId(id);
              try {
                const res = await adminRefundsApi.approveRefund(id);
                if (res.status === 1) {
                  Toast.show({ type: 'success', text1: 'Approved', text2: 'Refund has been approved.' });
                  fetchRefunds();
                } else {
                  throw new Error(res.message || 'Approval failed');
                }
              } catch (err: any) {
                Toast.show({ type: 'error', text1: 'Error', text2: err?.message ?? 'Approval failed.' });
              } finally {
                setActionLoadingId(null);
              }
            },
          },
        ],
      );
    },
    [fetchRefunds],
  );

  const handleDenyPress = useCallback((id: number) => {
    setDenyTargetId(id);
  }, []);

  const handleDenyConfirm = useCallback(
    async (reason: string) => {
      if (!denyTargetId) return;
      setDenyLoading(true);
      try {
        const res = await adminRefundsApi.denyRefund(denyTargetId, reason || undefined);
        if (res.status === 1) {
          Toast.show({ type: 'success', text1: 'Denied', text2: 'Refund request has been denied.' });
          setDenyTargetId(null);
          fetchRefunds();
        } else {
          throw new Error(res.message || 'Denial failed');
        }
      } catch (err: any) {
        Toast.show({ type: 'error', text1: 'Error', text2: err?.message ?? 'Denial failed.' });
      } finally {
        setDenyLoading(false);
      }
    },
    [denyTargetId, fetchRefunds],
  );

  const renderItem = useCallback(
    ({ item }: { item: AdminRefund }) => (
      <RefundCard
        refund={item}
        onApprove={handleApprove}
        onDeny={handleDenyPress}
        actionLoadingId={actionLoadingId}
      />
    ),
    [handleApprove, handleDenyPress, actionLoadingId],
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="cash-outline" size={64} color="#c8d6e0" />
        <Text style={styles.emptyTitle}>No Refunds</Text>
        <Text style={styles.emptySubtitle}>
          {activeTab === 'pending'
            ? 'No pending refund requests.'
            : activeTab === 'approved'
            ? 'No approved refunds yet.'
            : 'No denied refunds found.'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isDesktop && { paddingHorizontal: 40, height: 80 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#005d90" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, isDesktop && { fontSize: 28 }]}>Refund Management</Text>
          {!loading && (
            <Text style={styles.subtitle}>{refunds.length} {activeTab} refund{refunds.length !== 1 ? 's' : ''}</Text>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterBar, isDesktop && { paddingHorizontal: 40 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
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

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color="#005d90" style={{ marginTop: 80 }} />
      ) : error ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="cloud-offline-outline" size={64} color="#c8d6e0" />
          <Text style={styles.emptyTitle}>Failed to Load</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchRefunds(); }}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={refunds}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            isDesktop && { paddingHorizontal: width * 0.08 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#005d90']}
              tintColor="#005d90"
            />
          }
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Deny reason modal */}
      <DenyReasonModal
        visible={denyTargetId !== null}
        onClose={() => setDenyTargetId(null)}
        onConfirm={handleDenyConfirm}
        loading={denyLoading}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e0f0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 22, fontWeight: '900', color: '#181c20', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 2 },

  filterBar: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabContent: { gap: 8, paddingRight: 24 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  tabActive: { backgroundColor: '#005d90' },
  tabText: { fontSize: 12, fontWeight: '800', color: '#64748b' },
  tabTextActive: { color: 'white' },

  listContent: { padding: 20, paddingBottom: 100 },

  // Refund card
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardOrderId: { fontSize: 13, fontWeight: '700', color: '#505860' },
  cardAmountRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  cardCustomer: { fontSize: 15, fontWeight: '800', color: '#181c20', marginBottom: 4 },
  cardReason: { fontSize: 13, color: '#64748b', lineHeight: 19 },
  cardAmount: { fontSize: 22, fontWeight: '900', color: '#005d90', letterSpacing: -0.5 },
  denyReasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#fff8f7',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  denyReasonText: { flex: 1, fontSize: 12, color: '#ba1a1a', fontWeight: '500' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cardFooterText: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionBtn: { borderRadius: 12, overflow: 'hidden' },
  actionBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 12,
  },
  actionBtnText: { color: 'white', fontWeight: '800', fontSize: 13 },
  actionBtnReject: {
    borderWidth: 1.5,
    borderColor: '#ffdad6',
    backgroundColor: '#fff8f7',
    borderRadius: 12,
  },
  actionBtnRejectInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  actionBtnRejectText: { color: '#ba1a1a', fontWeight: '800', fontSize: 13 },

  // Empty / error
  emptyWrap: { alignItems: 'center', marginTop: 100, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#181c20' },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: '#005d90',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },

  // Deny modal
  denyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  denySheet: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  denyTitle: { fontSize: 18, fontWeight: '900', color: '#181c20', marginBottom: 6 },
  denySubtitle: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  denyInput: {
    backgroundColor: '#f7f9ff',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: '#181c20',
    borderWidth: 1,
    borderColor: '#e0e2e8',
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 20,
  },
  denyActions: { flexDirection: 'row', gap: 12 },
  denyCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e0e2e8',
    alignItems: 'center',
  },
  denyCancelText: { fontSize: 14, fontWeight: '800', color: '#707881' },
  denyConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#ba1a1a',
    alignItems: 'center',
  },
  denyConfirmText: { fontSize: 14, fontWeight: '800', color: 'white' },
});
