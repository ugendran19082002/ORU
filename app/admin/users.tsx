import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/providers/ThemeContext';
import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { adminUsersApi, type AdminUser } from '@/api/adminUsersApi';
import type { AppRole } from '@/types/session';
import { Shadow, roleAccent, roleSurface } from '@/constants/theme';

const ADMIN_ACCENT = roleAccent.admin;
const ADMIN_SURF = roleSurface.admin;

// ─── Types & constants ────────────────────────────────────────────────────────

type RoleFilter = '' | 'customer' | 'shop_owner' | 'delivery' | 'admin';

const ROLE_TABS: { key: RoleFilter; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'customer', label: 'Customers' },
  { key: 'shop_owner', label: 'Shop Owners' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'admin', label: 'Admin' },
];

const ROLE_OPTIONS: { key: AppRole; label: string }[] = [
  { key: 'customer', label: 'Customer' },
  { key: 'shop_owner', label: 'Shop Owner' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'admin', label: 'Admin' },
];

const PAGE_SIZE = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso || '—';
  }
}

function getRoleBadgeTheme(role: AppRole | string, colors: ColorSchemeColors) {
  switch (role) {
    case 'admin':
      return { bg: ADMIN_SURF, text: ADMIN_ACCENT };
    case 'shop_owner':
      return { bg: ADMIN_SURF, text: ADMIN_ACCENT };
    case 'delivery':
      return { bg: '#fff3e0', text: '#e65100' };
    case 'customer':
    default:
      return { bg: colors.successSoft, text: colors.success };
  }
}

function getRoleLabel(role: AppRole | string): string {
  switch (role) {
    case 'shop_owner': return 'Shop Owner';
    case 'delivery': return 'Delivery';
    case 'admin': return 'Admin';
    case 'customer': return 'Customer';
    default: return role;
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AdminUsersScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [activeRole, setActiveRole] = useState<RoleFilter>('');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  // ─── Sub-components inside closure ──────────────────────────────────────────

  const UserCard = ({ user, onPress }: { user: AdminUser; onPress: (user: AdminUser) => void }) => {
    const roleBadge = getRoleBadgeTheme(user.role, colors);
    const isActive = user.status === 'active';

    return (
      <TouchableOpacity style={styles.card} onPress={() => onPress(user)} activeOpacity={0.75}>
        <View style={styles.cardRow}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>
              {(user.name || user.phone || '?').charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>
              {user?.name || '—'}
            </Text>
            <Text style={styles.cardPhone}>{user?.phone || 'No Phone'}</Text>
            {user?.email ? (
              <Text style={styles.cardEmail} numberOfLines={1}>{user.email}</Text>
            ) : null}
          </View>

          <View style={styles.cardBadges}>
            <View style={[styles.badge, { backgroundColor: roleBadge.bg }]}>
              <Text style={[styles.badgeText, { color: roleBadge.text }]}>
                {getRoleLabel(user?.role || 'customer')}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: isActive ? '#e8f5e9' : '#f5f5f5', marginTop: 4 }]}>
              <View style={[styles.statusDot, { backgroundColor: isActive ? colors.success : '#9e9e9e' }]} />
              <Text style={[styles.badgeText, { color: isActive ? colors.success : '#757575' }]}>
                {isActive ? 'Active' : (user?.status || 'inactive').charAt(0).toUpperCase() + (user?.status || 'inactive').slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Ionicons name="calendar-outline" size={11} color="#94a3b8" />
          <Text style={styles.cardFooterText}>Joined {formatDate(user.created_at)}</Text>
          <Ionicons name="chevron-forward" size={14} color="#c8d6e0" style={{ marginLeft: 'auto' }} />
        </View>
      </TouchableOpacity>
    );
  };

  const UserDetailModal = ({ user, visible, onClose, onUpdated }: {
    user: AdminUser | null;
    visible: boolean;
    onClose: () => void;
    onUpdated: (updated: AdminUser) => void;
  }) => {
    const [actionLoading, setActionLoading] = useState(false);
    const [roleLoading, setRoleLoading] = useState(false);
    const [showRolePicker, setShowRolePicker] = useState(false);

    if (!user) return null;

    const isActive = user.status === 'active';
    const roleBadge = getRoleBadgeTheme(user.role, colors);

    const handleToggleSuspend = () => {
      const nextStatus = isActive ? 'suspended' : 'active';
      const actionLabel = isActive ? 'Suspend' : 'Unsuspend';

      Alert.alert(
        `${actionLabel} User`,
        `Are you sure you want to ${actionLabel.toLowerCase()} ${user.name || user.phone}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: actionLabel,
            style: isActive ? 'destructive' : 'default',
            onPress: async () => {
              setActionLoading(true);
              try {
                const res = await adminUsersApi.updateUser(user.id, { status: nextStatus });
                if (res.status === 1 && res.data) {
                  onUpdated(res.data);
                  Toast.show({ type: 'success', text1: 'Done', text2: `User ${actionLabel.toLowerCase()}ed.` });
                  onClose();
                } else {
                  throw new Error(res.message || 'Update failed');
                }
              } catch (err: any) {
                Toast.show({ type: 'error', text1: 'Error', text2: err?.message ?? 'Action failed.' });
              } finally {
                setActionLoading(false);
              }
            },
          },
        ],
      );
    };

    const handleChangeRole = async (newRole: AppRole) => {
      if (newRole === user.role) {
        setShowRolePicker(false);
        return;
      }
      Alert.alert(
        'Change Role',
        `Change ${user.name || user.phone}'s role to ${getRoleLabel(newRole)}?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setShowRolePicker(false) },
          {
            text: 'Confirm',
            onPress: async () => {
              setShowRolePicker(false);
              setRoleLoading(true);
              try {
                const res = await adminUsersApi.updateUser(user.id, { role: newRole });
                if (res.status === 1 && res.data) {
                  onUpdated(res.data);
                  Toast.show({ type: 'success', text1: 'Role Updated', text2: `Role changed to ${getRoleLabel(newRole)}.` });
                  onClose();
                } else {
                  throw new Error(res.message || 'Update failed');
                }
              } catch (err: any) {
                Toast.show({ type: 'error', text1: 'Error', text2: err?.message ?? 'Role change failed.' });
              } finally {
                setRoleLoading(false);
              }
            },
          },
        ],
      );
    };

    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalAvatar}>
                <Text style={styles.modalAvatarText}>
                  {(user.name || user.phone || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalName} numberOfLines={1}>{user.name || '—'}</Text>
                <Text style={styles.modalPhone}>{user.phone}</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
                <Ionicons name="close" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInfo}>
              {user.email ? (
                <View style={styles.modalInfoRow}>
                  <Ionicons name="mail-outline" size={15} color={colors.muted} />
                  <Text style={styles.modalInfoText}>{user.email}</Text>
                </View>
              ) : null}
              <View style={styles.modalInfoRow}>
                <Ionicons name="person-outline" size={15} color={colors.muted} />
                <View style={[styles.badge, { backgroundColor: roleBadge.bg }]}>
                  <Text style={[styles.badgeText, { color: roleBadge.text }]}>
                    {getRoleLabel(user.role)}
                  </Text>
                </View>
              </View>
              <View style={styles.modalInfoRow}>
                <Ionicons name="calendar-outline" size={15} color={colors.muted} />
                <Text style={styles.modalInfoText}>Joined {formatDate(user.created_at)}</Text>
              </View>
              <View style={styles.modalInfoRow}>
                <Ionicons name="ellipse" size={10} color={user.status === 'active' ? '#2e7d32' : '#9e9e9e'} />
                <Text style={[styles.modalInfoText, { fontWeight: '700', color: user.status === 'active' ? '#2e7d32' : '#757575' }]}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.modalDivider} />

            {showRolePicker ? (
              <View style={styles.rolePicker}>
                <Text style={styles.rolePickerTitle}>Select New Role</Text>
                {ROLE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.roleOption, user.role === opt.key && styles.roleOptionActive]}
                    onPress={() => handleChangeRole(opt.key)}
                    disabled={roleLoading}
                  >
                    <Text style={[styles.roleOptionText, user.role === opt.key && styles.roleOptionTextActive]}>
                      {opt.label}
                    </Text>
                    {user.role === opt.key && (
                      <Ionicons name="checkmark" size={16} color={ADMIN_ACCENT} />
                    )}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.rolePickerCancel} onPress={() => setShowRolePicker(false)}>
                  <Text style={styles.rolePickerCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalActionBtnOutline]}
                  onPress={() => setShowRolePicker(true)}
                  disabled={roleLoading || actionLoading}
                >
                  {roleLoading ? (
                    <ActivityIndicator size="small" color={ADMIN_ACCENT} />
                  ) : (
                    <>
                      <Ionicons name="swap-horizontal-outline" size={16} color={ADMIN_ACCENT} />
                      <Text style={[styles.modalActionBtnText, { color: ADMIN_ACCENT }]}>Change Role</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalActionBtn,
                    isActive ? styles.modalActionBtnDanger : styles.modalActionBtnSuccess,
                  ]}
                  onPress={handleToggleSuspend}
                  disabled={actionLoading || roleLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons
                        name={isActive ? 'ban-outline' : 'checkmark-circle-outline'}
                        size={16}
                        color="white"
                      />
                      <Text style={[styles.modalActionBtnText, { color: 'white' }]}>
                        {isActive ? 'Suspend' : 'Unsuspend'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  const fetchUsers = useCallback(async (pageNum: number, reset: boolean) => {
    if (reset) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await adminUsersApi.listUsers({
        role: activeRole,
        search: debouncedSearch || undefined,
        page: pageNum,
        limit: PAGE_SIZE,
      });

      if (res.status === 1 && res.data) {
        const list = res.data.data ?? [];
        setUsers((prev) => (reset ? list : [...prev, ...list]));
        setTotalCount(res.data.total ?? 0);
      } else {
        throw new Error(res.message || 'Failed to fetch users');
      }
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to load users.';
      setError(msg);
      if (!reset) Toast.show({ type: 'error', text1: 'Load Error', text2: msg });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeRole, debouncedSearch]);

  // Reset and reload when filter/search changes
  useEffect(() => {
    setPage(1);
    fetchUsers(1, true);
  }, [fetchUsers]);

  const handleLoadMore = useCallback(() => {
    const hasMore = users.length < totalCount;
    if (loadingMore || loading || !hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchUsers(next, false);
  }, [users.length, totalCount, loadingMore, loading, page, fetchUsers]);

  const handleUserUpdated = useCallback((updated: AdminUser) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  }, []);

  const openDetail = useCallback((user: AdminUser) => {
    setSelectedUser(user);
    setModalVisible(true);
  }, []);

  const renderUser = useCallback(
    ({ item }: { item: AdminUser }) => <UserCard user={item} onPress={openDetail} />,
    [openDetail],
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator size="small" color={ADMIN_ACCENT} style={{ marginVertical: 20 }} />;
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="people-outline" size={64} color="#c8d6e0" />
        <Text style={styles.emptyTitle}>No Users Found</Text>
        <Text style={styles.emptySubtitle}>
          {debouncedSearch
            ? `No results for "${debouncedSearch}".`
            : activeRole
            ? `No ${getRoleLabel(activeRole).toLowerCase()}s yet.`
            : 'No users have registered yet.'}
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
              <Text style={styles.pageTitle}>User Management</Text>
              {!loading && (
                <Text style={styles.headerSub}>{totalCount} total users</Text>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>

      <View style={[styles.controlBar, isDesktop && { alignItems: 'center' }]}>
        <View style={{ width: '100%', maxWidth: 1200, paddingHorizontal: isDesktop ? 24 : 0 }}>
          {/* Search bar */}
          <View style={styles.searchInputWrap}>
            <Ionicons name="search-outline" size={18} color="#94a3b8" />
            <TextInput
              style={styles.searchField}
              placeholder="Search by name, phone or email…"
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>

          {/* Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
            {ROLE_TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeRole === tab.key && styles.tabActive]}
                onPress={() => setActiveRole(tab.key)}
              >
                <Text style={[styles.tabText, activeRole === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color={ADMIN_ACCENT} style={{ marginTop: 80 }} />
      ) : error ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="cloud-offline-outline" size={64} color="#c8d6e0" />
          <Text style={styles.emptyTitle}>Failed to Load</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchUsers(1, true)}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderUser}
          contentContainerStyle={[
            styles.listContent,
            isDesktop && { paddingHorizontal: width * 0.08 },
          ]}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onUpdated={handleUserUpdated}
      />
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
    backgroundColor: ADMIN_SURF,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: colors.muted, fontWeight: '600', marginTop: 2 },

  controlBar: { paddingVertical: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchField: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },

  tabContent: { gap: 8, paddingHorizontal: 0 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.border,
  },
  tabActive: { backgroundColor: ADMIN_ACCENT },
  tabText: { fontSize: 12, fontWeight: '800', color: colors.muted },
  tabTextActive: { color: 'white' },

  listContent: { padding: 20, paddingBottom: 100 },

  // User card
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ADMIN_SURF,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '900', color: ADMIN_ACCENT },
  cardInfo: { flex: 1, gap: 2 },
  cardName: { fontSize: 15, fontWeight: '800', color: colors.text },
  cardPhone: { fontSize: 13, color: colors.muted, fontWeight: '500' },
  cardEmail: { fontSize: 12, color: '#94a3b8', fontWeight: '400' },
  cardBadges: { alignItems: 'flex-end' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cardFooterText: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },

  // Empty / error states
  emptyWrap: { alignItems: 'center', marginTop: 100, gap: 12 },
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    minHeight: 300,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  modalAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: ADMIN_SURF,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarText: { fontSize: 22, fontWeight: '900', color: ADMIN_ACCENT },
  modalName: { fontSize: 18, fontWeight: '900', color: colors.text, letterSpacing: -0.3 },
  modalPhone: { fontSize: 14, color: colors.muted, fontWeight: '500', marginTop: 2 },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInfo: { gap: 10, marginBottom: 4 },
  modalInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalInfoText: { fontSize: 14, color: colors.muted, fontWeight: '500' },
  modalDivider: { height: 1, backgroundColor: colors.border, marginVertical: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  modalActionBtnText: { fontSize: 14, fontWeight: '800' },
  modalActionBtnOutline: {
    borderWidth: 1.5,
    borderColor: ADMIN_SURF,
    backgroundColor: '#fff8f7',
  },
  modalActionBtnDanger: { backgroundColor: ADMIN_ACCENT },
  modalActionBtnSuccess: { backgroundColor: colors.success },

  // Role picker
  rolePicker: { gap: 4 },
  rolePickerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 6,
  },
  roleOptionActive: {
    backgroundColor: ADMIN_SURF,
    borderColor: '#ffb4ab',
  },
  roleOptionText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  roleOptionTextActive: { color: ADMIN_ACCENT, fontWeight: '800' },
  rolePickerCancel: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  rolePickerCancelText: { fontSize: 14, fontWeight: '700', color: '#94a3b8' },
});
