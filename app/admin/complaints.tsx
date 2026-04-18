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
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/providers/ThemeContext';
import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { complaintApi } from '@/api/complaintApi';
import type { Complaint } from '@/types/api';

import { Shadow, roleAccent, roleSurface } from '@/constants/theme';

const ADMIN_ACCENT = roleAccent.admin;
const ADMIN_SURF = roleSurface.admin;

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

function getStatusTheme(status: Complaint['status'], colors: ColorSchemeColors) {
  switch (status) {
    case 'open':
      return { bg: ADMIN_SURF, text: ADMIN_ACCENT, label: 'Open' };
    case 'in_progress':
      return { bg: '#fff3e0', text: '#e65100', label: 'In Progress' };
    case 'resolved':
      return { bg: '#e8f5e9', text: colors.success, label: 'Resolved' };
    case 'closed':
      return { bg: colors.border, text: colors.muted, label: 'Closed' };
    default:
      return { bg: colors.border, text: colors.muted, label: status };
  }
}

/* ---- Screen ---- */
export default function AdminComplaintsScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);
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

  /* ---- Sub-components inside closure ---- */
  const ComplaintCard = ({ complaint, expanded, onToggle, onAction, actionLoading }: {
    complaint: Complaint;
    expanded: boolean;
    onToggle: () => void;
    onAction: (id: number, action: 'refund' | 'replacement' | 'reject') => void;
    actionLoading: boolean;
  }) => {
    const statusTheme = getStatusTheme(complaint.status, colors);
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
                { backgroundColor: complaint.priority === 'urgent' ? ADMIN_SURF : colors.border },
              ]}>
                <Text style={[
                  styles.priorityText,
                  { color: complaint.priority === 'urgent' ? ADMIN_ACCENT : colors.muted },
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
                <Text style={[styles.expandedValue, { color: colors.success, fontWeight: '700' }]}>
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
                  color={complaint.admin_action === 'approved' ? colors.success : ADMIN_ACCENT}
                />
                <Text style={styles.expandedLabel}>Admin Action:</Text>
                <Text style={[
                  styles.expandedValue,
                  { fontWeight: '700', color: complaint.admin_action === 'approved' ? colors.success : ADMIN_ACCENT },
                ]}>
                  {complaint.admin_action.charAt(0).toUpperCase() + complaint.admin_action.slice(1)}
                </Text>
              </View>
            )}

            {/* Action buttons — only for unreviewed complaints */}
            {canAction && (
              <View style={styles.actionRow}>
                {actionLoading ? (
                  <ActivityIndicator size="small" color={ADMIN_ACCENT} style={{ marginVertical: 8 }} />
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, { flex: 1, minWidth: 120 }]}
                      onPress={() => onAction(complaint.id, 'refund')}
                    >
                      <LinearGradient colors={[ADMIN_ACCENT, ADMIN_ACCENT]} style={styles.actionBtnGrad}>
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
                        <Ionicons name="close-outline" size={14} color={ADMIN_ACCENT} />
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
  };

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
      let list = result.data ?? [];

      if (showSosOnly) {
        list = list.filter((c) => c.is_sos);
      }

      setComplaints(list);

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
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={20} color={ADMIN_ACCENT} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.pageTitle}>Complaints</Text>
                {totalSos > 0 && (
                  <View style={styles.sosHeaderBadge}>
                    <Ionicons name="warning" size={11} color="white" />
                    <Text style={styles.sosHeaderBadgeText}>{totalSos} SOS</Text>
                  </View>
                )}
              </View>
              <Text style={styles.headerSub}>{complaints.length} active complaints</Text>
            </View>
            <TouchableOpacity
              style={[styles.sosToggle, showSosOnly && styles.sosToggleActive]}
              onPress={() => setShowSosOnly((v) => !v)}
            >
              <Ionicons
                name="warning"
                size={14}
                color={showSosOnly ? 'white' : ADMIN_ACCENT}
              />
              <Text style={[styles.sosToggleText, showSosOnly && { color: 'white' }]}>SOS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <View style={[styles.filterBar, isDesktop && { alignItems: 'center' }]}>
        <View style={{ width: '100%', maxWidth: 1200, paddingHorizontal: isDesktop ? 24 : 0 }}>
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
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[ADMIN_ACCENT]}
            tintColor={ADMIN_ACCENT}
          />
        }
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { alignItems: 'center', paddingBottom: 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth: 1200 }}>
        {loading ? (
          <ActivityIndicator size="large" color={ADMIN_ACCENT} style={{ marginTop: 80 }} />
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
        </View>
      </ScrollView>
    </View>
  );
}

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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
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
  sosHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ADMIN_ACCENT,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sosHeaderBadgeText: { color: 'white', fontWeight: '800', fontSize: 11 },
  sosToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ADMIN_SURF,
    backgroundColor: ADMIN_SURF,
  },
  sosToggleActive: { backgroundColor: ADMIN_ACCENT, borderColor: ADMIN_ACCENT },
  sosToggleText: { fontSize: 13, fontWeight: '800', color: ADMIN_ACCENT },
  filterBar: {
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabContent: { gap: 8, paddingRight: 24 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.border,
  },
  tabActive: { backgroundColor: ADMIN_ACCENT },
  tabText: { fontSize: 12, fontWeight: '800', color: colors.muted },
  tabTextActive: { color: 'white' },
  scrollContent: { padding: 20, paddingBottom: 100 },
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
  cardSos: {
    borderColor: ADMIN_SURF,
    borderWidth: 1.5,
    borderLeftWidth: 4,
    borderLeftColor: ADMIN_ACCENT,
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
    backgroundColor: ADMIN_ACCENT,
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
  cardMetaText: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  issueType: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  issueDesc: { fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: 10 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  expandedSection: { marginTop: 4 },
  expandedDivider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 8,
  },
  expandedLabel: { fontSize: 12, color: colors.muted, fontWeight: '700', minWidth: 96 },
  expandedValue: { fontSize: 12, color: colors.text, fontWeight: '500', flex: 1 },
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
    borderColor: ADMIN_SURF,
    backgroundColor: ADMIN_SURF,
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
  actionBtnRejectText: { color: ADMIN_ACCENT, fontWeight: '800', fontSize: 12 },
  emptyWrap: { alignItems: 'center', marginTop: 100, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
