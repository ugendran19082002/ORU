import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { complaintApi } from '@/api/complaintApi';
import type { Complaint } from '@/types/api';

/* ---- Filter tab types ---- */
type FilterTab = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

/* ---- Helpers ---- */
function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function getStatusTheme(status: Complaint['status']) {
  switch (status) {
    case 'open':
      return { bg: '#e0f0ff', text: '#005d90', label: 'Open' };
    case 'in_progress':
      return { bg: '#fff3e0', text: '#e65100', label: 'In Progress' };
    case 'resolved':
      return { bg: '#e8f5e9', text: '#2e7d32', label: 'Resolved' };
    case 'closed':
      return { bg: '#f1f5f9', text: '#64748b', label: 'Closed' };
    default:
      return { bg: '#f1f5f9', text: '#64748b', label: status };
  }
}

/* ---- Complaint Card ---- */
interface ComplaintCardProps {
  complaint: Complaint;
  expanded: boolean;
  onToggle: () => void;
  onAction: (id: number, action: 'refund' | 'replacement' | 'reject') => void;
  actionLoading: boolean;
}

function ComplaintCard({ complaint, expanded, onToggle, onAction, actionLoading }: ComplaintCardProps) {
  const statusTheme = getStatusTheme(complaint.status);
  const canAction = complaint.admin_action === 'pending_review' || complaint.admin_action === null;

  return (
    <View style={[styles.card, complaint.is_sos && styles.cardSos]}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.75}>
        {/* Top row: badges + status */}
        <View style={styles.cardTopRow}>
          <View style={styles.cardBadgeRow}>
            {complaint.is_sos && (
              <View style={styles.sosBadge}>
                <Ionicons name="warning" size={10} color="white" />
                <Text style={styles.sosBadgeText}>SOS</Text>
              </View>
            )}
            <View style={[
              styles.priorityBadge,
              { backgroundColor: complaint.priority === 'urgent' ? '#ffdad6' : '#f1f5f9' },
            ]}>
              <Text style={[
                styles.priorityText,
                { color: complaint.priority === 'urgent' ? '#ba1a1a' : '#64748b' },
              ]}>
                {complaint.priority.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusTheme.text }]}>
              {statusTheme.label}
            </Text>
          </View>
        </View>

        {/* Order + Customer meta */}
        <View style={styles.cardMeta}>
          <View style={styles.cardMetaRow}>
            <Ionicons name="receipt-outline" size={13} color="#707881" />
            <Text style={styles.cardMetaText}>
              {complaint.Order?.order_number
                ? `Order #${complaint.Order.order_number}`
                : `Order ID: ${complaint.order_id}`}
              {complaint.Order?.total_amount
                ? `  •  ₹${complaint.Order.total_amount}`
                : ''}
            </Text>
          </View>
          {complaint.Shop && (
            <View style={styles.cardMetaRow}>
              <Ionicons name="water-outline" size={13} color="#707881" />
              <Text style={styles.cardMetaText} numberOfLines={1}>
                {complaint.Shop.name}
              </Text>
            </View>
          )}
        </View>

        {/* Issue type + description */}
        <Text style={styles.issueType}>
          {complaint.issue_type ?? complaint.type}
        </Text>
        <Text style={styles.issueDesc} numberOfLines={expanded ? undefined : 2}>
          {complaint.description}
        </Text>

        {/* Card footer: timestamp + expand toggle */}
        <View style={styles.cardFooter}>
          <View style={styles.cardMetaRow}>
            <Ionicons name="time-outline" size={12} color="#94a3b8" />
            <Text style={styles.timeText}>{formatTime(complaint.created_at)}</Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#94a3b8"
          />
        </View>
      </TouchableOpacity>

      {/* Expanded section */}
      {expanded && (
        <View style={styles.expandedSection}>
          <View style={styles.expandedDivider} />

          {complaint.admin_notes ? (
            <View style={styles.expandedRow}>
              <Ionicons name="document-text-outline" size={14} color="#707881" />
              <Text style={styles.expandedLabel}>Admin Notes:</Text>
              <Text style={styles.expandedValue}>{complaint.admin_notes}</Text>
            </View>
          ) : null}

          {complaint.resolution_type ? (
            <View style={styles.expandedRow}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#2e7d32" />
              <Text style={styles.expandedLabel}>Resolution:</Text>
              <Text style={[styles.expandedValue, { color: '#2e7d32', fontWeight: '700' }]}>
                {complaint.resolution_type.charAt(0).toUpperCase() + complaint.resolution_type.slice(1)}
              </Text>
            </View>
          ) : null}

          {complaint.resolution_notes ? (
            <View style={styles.expandedRow}>
              <Ionicons name="chatbubble-outline" size={14} color="#707881" />
              <Text style={styles.expandedLabel}>Notes:</Text>
              <Text style={styles.expandedValue}>{complaint.resolution_notes}</Text>
            </View>
          ) : null}

          {complaint.admin_action && complaint.admin_action !== 'pending_review' && (
            <View style={styles.expandedRow}>
              <Ionicons
                name={complaint.admin_action === 'approved' ? 'checkmark-circle' : 'close-circle'}
                size={14}
                color={complaint.admin_action === 'approved' ? '#2e7d32' : '#ba1a1a'}
              />
              <Text style={styles.expandedLabel}>Admin Action:</Text>
              <Text style={[
                styles.expandedValue,
                { fontWeight: '700', color: complaint.admin_action === 'approved' ? '#2e7d32' : '#ba1a1a' },
              ]}>
                {complaint.admin_action.charAt(0).toUpperCase() + complaint.admin_action.slice(1)}
              </Text>
            </View>
          )}

          {/* Action buttons — only for unreviewed complaints */}
          {canAction && (
            <View style={styles.actionRow}>
              {actionLoading ? (
                <ActivityIndicator size="small" color="#005d90" style={{ marginVertical: 8 }} />
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.actionBtn, { flex: 1, minWidth: 120 }]}
                    onPress={() => onAction(complaint.id, 'refund')}
                  >
                    <LinearGradient colors={['#005d90', '#0077b6']} style={styles.actionBtnGrad}>
                      <Ionicons name="cash-outline" size={14} color="white" />
                      <Text style={styles.actionBtnText}>Approve + Refund</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { flex: 1, minWidth: 120 }]}
                    onPress={() => onAction(complaint.id, 'replacement')}
                  >
                    <LinearGradient colors={['#006878', '#00838f']} style={styles.actionBtnGrad}>
                      <Ionicons name="swap-horizontal-outline" size={14} color="white" />
                      <Text style={styles.actionBtnText}>Approve + Replace</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnReject]}
                    onPress={() => onAction(complaint.id, 'reject')}
                  >
                    <View style={styles.actionBtnRejectInner}>
                      <Ionicons name="close-outline" size={14} color="#ba1a1a" />
                      <Text style={styles.actionBtnRejectText}>Reject</Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

/* ---- Screen ---- */
export default function AdminComplaintsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [showSosOnly, setShowSosOnly] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [totalSos, setTotalSos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchComplaints = useCallback(async () => {
    try {
      const params: Parameters<typeof complaintApi.adminListComplaints>[0] = {
        page: 1,
        limit: 20,
      };
      if (activeTab !== 'all') {
        params.status = activeTab as Complaint['status'];
      }

      const result = await complaintApi.adminListComplaints(params);
      // result is PaginatedData<Complaint>: { data, total, page, per_page }
      let list = result.data ?? [];

      if (showSosOnly) {
        list = list.filter((c) => c.is_sos);
      }

      setComplaints(list);

      // Tally SOS in the full unfiltered fetch (cheap approximation from returned data)
      const allRes = await complaintApi.adminListComplaints({ page: 1, limit: 100 });
      setTotalSos((allRes.data ?? []).filter((c) => c.is_sos).length);
    } catch (err: any) {
      console.error('[AdminComplaints] Fetch error:', err);
      Toast.show({ type: 'error', text1: 'Sync Error', text2: 'Failed to load complaints.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, showSosOnly]);

  useEffect(() => {
    setLoading(true);
    setExpandedId(null);
    fetchComplaints();
  }, [fetchComplaints]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchComplaints();
  }, [fetchComplaints]);

  const handleAction = useCallback(
    (id: number, action: 'refund' | 'replacement' | 'reject') => {
      const titles = {
        refund: 'Approve with Refund',
        replacement: 'Approve with Replacement',
        reject: 'Reject Complaint',
      } as const;
      const messages = {
        refund: 'This will approve the complaint and issue a refund to the customer. Continue?',
        replacement: 'This will approve the complaint and arrange a replacement order. Continue?',
        reject: 'This will reject the complaint. The customer will be notified. Continue?',
      } as const;

      Alert.alert(titles[action], messages[action], [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: action === 'reject' ? 'destructive' : 'default',
          onPress: async () => {
            setActionLoadingId(id);
            try {
              await complaintApi.adminReviewComplaint(id, {
                action: action === 'reject' ? 'rejected' : 'approved',
                resolution_type: action === 'reject' ? undefined : action,
                admin_notes: action === 'reject' ? '' : undefined,
              });
              Toast.show({
                type: 'success',
                text1: 'Done',
                text2:
                  action === 'reject'
                    ? 'Complaint rejected.'
                    : `Complaint approved — ${action} initiated.`,
              });
              setExpandedId(null);
              fetchComplaints();
            } catch (err: any) {
              console.error('[AdminComplaints] Action error:', err);
              Toast.show({
                type: 'error',
                text1: 'Action Failed',
                text2: err?.message ?? 'Please try again.',
              });
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]);
    },
    [fetchComplaints],
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isDesktop && { paddingHorizontal: 40, height: 80 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/admin')}>
            <Ionicons name="chevron-back" size={20} color="#005d90" />
          </TouchableOpacity>
          <View>
            <View style={styles.headerTitleRow}>
              <Text style={[styles.pageTitle, isDesktop && { fontSize: 28 }]}>
                Complaint Management
              </Text>
              {totalSos > 0 && (
                <View style={styles.sosHeaderBadge}>
                  <Ionicons name="warning" size={11} color="white" />
                  <Text style={styles.sosHeaderBadgeText}>{totalSos} SOS</Text>
                </View>
              )}
            </View>
            <Text style={styles.subtitle}>{complaints.length} complaints shown</Text>
          </View>
        </View>

        {/* SOS toggle */}
        <TouchableOpacity
          style={[styles.sosToggle, showSosOnly && styles.sosToggleActive]}
          onPress={() => setShowSosOnly((v) => !v)}
        >
          <Ionicons
            name="warning"
            size={14}
            color={showSosOnly ? 'white' : '#ba1a1a'}
          />
          <Text style={[styles.sosToggleText, showSosOnly && { color: 'white' }]}>SOS Only</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterBar, isDesktop && { paddingHorizontal: 40 }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContent}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#005d90']}
            tintColor="#005d90"
          />
        }
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && { paddingHorizontal: width * 0.08 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#005d90" style={{ marginTop: 80 }} />
        ) : complaints.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#c8d6e0" />
            <Text style={styles.emptyTitle}>No Complaints</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'all' && !showSosOnly
                ? 'There are no complaints to review.'
                : showSosOnly
                ? 'No SOS complaints found.'
                : `No ${activeTab.replace('_', ' ')} complaints found.`}
            </Text>
          </View>
        ) : (
          complaints.map((complaint) => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint}
              expanded={expandedId === complaint.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === complaint.id ? null : complaint.id))
              }
              onAction={handleAction}
              actionLoading={actionLoadingId === complaint.id}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

/* ---- Styles ---- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e0f0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageTitle: { fontSize: 22, fontWeight: '900', color: '#181c20', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 2 },

  sosHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ba1a1a',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sosHeaderBadgeText: { color: 'white', fontWeight: '800', fontSize: 11 },

  sosToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ffdad6',
    backgroundColor: '#fff8f7',
  },
  sosToggleActive: { backgroundColor: '#ba1a1a', borderColor: '#ba1a1a' },
  sosToggleText: { fontSize: 12, fontWeight: '700', color: '#ba1a1a' },

  filterBar: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabContent: { gap: 8, paddingRight: 24 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  tabActive: { backgroundColor: '#005d90' },
  tabText: { fontSize: 12, fontWeight: '800', color: '#64748b' },
  tabTextActive: { color: 'white' },

  scrollContent: { padding: 20, paddingBottom: 100 },

  /* Card */
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
  cardSos: {
    borderColor: '#ffdad6',
    borderWidth: 1.5,
    borderLeftWidth: 4,
    borderLeftColor: '#ba1a1a',
  },

  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  sosBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ba1a1a',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  sosBadgeText: { color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  priorityBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  priorityText: { fontSize: 10, fontWeight: '700' },

  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },

  cardMeta: { gap: 4, marginBottom: 8 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardMetaText: { fontSize: 12, color: '#707881', fontWeight: '500' },

  issueType: {
    fontSize: 15,
    fontWeight: '800',
    color: '#181c20',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  issueDesc: { fontSize: 13, color: '#64748b', lineHeight: 19, marginBottom: 10 },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },

  /* Expanded */
  expandedSection: { marginTop: 4 },
  expandedDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 8,
  },
  expandedLabel: { fontSize: 12, color: '#707881', fontWeight: '700', minWidth: 96 },
  expandedValue: { fontSize: 12, color: '#181c20', fontWeight: '500', flex: 1 },

  /* Action buttons */
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: { borderRadius: 12, overflow: 'hidden' },
  actionBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  actionBtnText: { color: 'white', fontWeight: '800', fontSize: 12 },
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionBtnRejectText: { color: '#ba1a1a', fontWeight: '800', fontSize: 12 },

  /* Empty */
  emptyWrap: { alignItems: 'center', marginTop: 100, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#181c20' },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
