import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { SkeletonCard, SkeletonLine } from '@/components/ui/Skeleton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { notificationApi } from '@/api/engagementApi';
import { Shadow, thannigoPalette, roleAccent, Radius } from '@/constants/theme';
import { useAppTheme } from '@/providers/ThemeContext';

const CUSTOMER_ACCENT = roleAccent.customer;

type NotifType = 'order' | 'promo' | 'system' | 'complaint';

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  icon: string;
}

const TYPE_CONFIG: Record<NotifType, { label: string; color: string; bg: string }> = {
  order:     { label: 'ORDER',   color: thannigoPalette.primary,    bg: thannigoPalette.infoSoft },
  promo:     { label: 'OFFER',   color: thannigoPalette.warning,    bg: '#FFF8E1' },
  system:    { label: 'SYSTEM',  color: thannigoPalette.neutral,    bg: thannigoPalette.borderSoft },
  complaint: { label: 'SUPPORT', color: '#7c3aed',                  bg: '#ede9fe' },
};

const ICON_MAP: Record<string, string> = {
  order:     'receipt-outline',
  promo:     'pricetag-outline',
  system:    'cog-outline',
  complaint: 'chatbubble-ellipses-outline',
};

const FILTERS = ['All', 'Orders', 'Offers', 'Support'];

function mapNotif(n: any): Notif {
  const type: NotifType = (['order', 'promo', 'system', 'complaint'].includes(n.type)
    ? n.type
    : 'system') as NotifType;
  return {
    id:   String(n.id),
    type,
    title: n.title ?? 'Notification',
    body:  n.body ?? n.message ?? '',
    time: n.created_at
      ? new Date(n.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      : '',
    read:  Boolean(n.is_read ?? n.read_at),
    icon:  ICON_MAP[type] ?? 'notifications-outline',
  };
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { safeBack } = useAppNavigation();
  useAndroidBackHandler(() => { safeBack('/(tabs)'); });

  const [notifs, setNotifs]       = useState<Notif[]>([]);
  const [filter, setFilter]       = useState('All');
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await notificationApi.getNotifications();
      const list: any[] = Array.isArray(data) ? data : (data?.notifications ?? data?.data ?? []);
      setNotifs(list.map(mapNotif));
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(true); }, [load]);

  const unreadCount = notifs.filter(n => !n.read).length;

  const markRead = useCallback(async (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try { await notificationApi.markRead(id); } catch { /* optimistic */ }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    try { await Promise.allSettled(notifs.filter(n => !n.read).map(n => notificationApi.markRead(n.id))); } catch { /* ignore */ }
  }, [notifs]);

  const deleteNotif = useCallback((id: string) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
  }, []);

  const filtered = notifs.filter(n => {
    if (filter === 'All')     return true;
    if (filter === 'Orders')  return n.type === 'order';
    if (filter === 'Offers')  return n.type === 'promo';
    if (filter === 'Support') return n.type === 'complaint';
    return true;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <BackButton fallback="/(tabs)" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
          {unreadCount > 0 && <Text style={[styles.headerSub, { color: CUSTOMER_ACCENT }]}>{unreadCount} unread</Text>}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={[styles.markAllBtn, { borderColor: CUSTOMER_ACCENT + '50', backgroundColor: thannigoPalette.infoSoft }]}
            onPress={markAllRead}
          >
            <Text style={[styles.markAllText, { color: CUSTOMER_ACCENT }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* FILTER ROW */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          keyboardShouldPersistTaps="handled"
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              activeOpacity={0.9}
              style={[
                styles.filterPill,
                { backgroundColor: colors.background, borderColor: 'transparent' },
                filter === f && { backgroundColor: CUSTOMER_ACCENT, borderColor: CUSTOMER_ACCENT },
              ]}
              onPress={() => setFilter(f)}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            >
              <Text style={[styles.filterText, { color: colors.muted }, filter === f && { color: 'white' }]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* CONTENT */}
      {loading ? (
        <View style={{ padding: 20, gap: 14 }}>
          {[1, 2, 3, 4].map(k => (
            <View key={k} style={[styles.skeletonCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.skeletonIcon, { backgroundColor: colors.background }]} />
              <View style={{ flex: 1, gap: 8 }}>
                <SkeletonLine width="60%" height={14} />
                <SkeletonLine width="90%" height={11} />
              </View>
            </View>
          ))}
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Ionicons name="cloud-offline-outline" size={56} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Failed to Load</Text>
          <Text style={[styles.emptySub, { color: colors.muted }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: CUSTOMER_ACCENT }]}
            onPress={() => load()}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[CUSTOMER_ACCENT]}
              tintColor={CUSTOMER_ACCENT}
            />
          }
        >
          {/* EMPTY */}
          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.surface }]}>
                <Ionicons name="notifications-off-outline" size={40} color={colors.muted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>All clear!</Text>
              <Text style={[styles.emptySub, { color: colors.muted }]}>
                No notifications in this category right now.
              </Text>
            </View>
          )}

          {/* NOTIFICATION CARDS */}
          {filtered.map(notif => {
            const cfg = TYPE_CONFIG[notif.type];
            return (
              <TouchableOpacity
                key={notif.id}
                style={[
                  styles.notifCard,
                  { backgroundColor: colors.surface },
                  Shadow.xs,
                  !notif.read && {
                    borderWidth: 1,
                    borderColor: CUSTOMER_ACCENT + '35',
                    backgroundColor: thannigoPalette.infoSoft,
                  },
                ]}
                activeOpacity={0.75}
                onPress={() => markRead(notif.id)}
              >
                {!notif.read && (
                  <View style={[styles.unreadDot, { backgroundColor: CUSTOMER_ACCENT }]} />
                )}
                <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={notif.icon as any} size={22} color={cfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.notifTop}>
                    <View style={[styles.typeChip, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.typeChipText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                    <Text style={[styles.timeText, { color: colors.muted }]}>{notif.time}</Text>
                  </View>
                  <Text style={[
                    styles.notifTitle,
                    { color: colors.muted },
                    !notif.read && { color: colors.text, fontWeight: '800' },
                  ]}>
                    {notif.title}
                  </Text>
                  <Text style={[styles.notifBody, { color: colors.muted }]} numberOfLines={2}>
                    {notif.body}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteNotif(notif.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={16} color={colors.muted} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}

          {/* COMPLAINT CTA */}
          <View style={styles.complaintCard}>
            <LinearGradient colors={['#7c3aed', '#5b21b6']} style={styles.complaintGrad}>
              <Ionicons
                name="chatbubble-ellipses"
                size={32}
                color="rgba(255,255,255,0.2)"
                style={styles.complaintDecor}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.complaintTitle}>Have a complaint?</Text>
                <Text style={styles.complaintSub}>We resolve issues within 24 hours.</Text>
              </View>
              <TouchableOpacity
                style={styles.complaintBtn}
                onPress={() => router.push('/report-issue' as any)}
              >
                <Text style={styles.complaintBtnText}>Report Issue</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  headerSub: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.md, borderWidth: 1 },
  markAllText: { fontSize: 12, fontWeight: '700' },

  filterContainer: { height: 64 },
  filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: '100%', gap: 10 },
  filterPill: {
    paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 22, borderWidth: 1.5,
  },
  filterText: { fontSize: 13, fontWeight: '800' },

  skeletonCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: Radius.xl, padding: 16 },
  skeletonIcon: { width: 44, height: 44, borderRadius: 14 },

  content: { padding: 20, gap: 12, paddingBottom: 100 },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyState: { paddingVertical: 60, alignItems: 'center', gap: 14 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.md },
  retryBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },

  notifCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderRadius: Radius.xl, padding: 16,
  },
  unreadDot: {
    position: 'absolute', top: 14, right: 46,
    width: 8, height: 8, borderRadius: 4,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  notifTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  typeChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeChipText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  timeText: { fontSize: 11, fontWeight: '500' },
  notifTitle: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  notifBody: { fontSize: 12, lineHeight: 17 },
  deleteBtn: { padding: 4, marginLeft: 4 },

  complaintCard: { borderRadius: Radius.xl, overflow: 'hidden', marginTop: 8 },
  complaintGrad: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, overflow: 'hidden' },
  complaintDecor: { position: 'absolute', right: 12, top: 0, opacity: 0.2 },
  complaintTitle: { fontSize: 15, fontWeight: '800', color: 'white', marginBottom: 4 },
  complaintSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 17 },
  complaintBtn: { backgroundColor: 'white', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginLeft: 'auto' },
  complaintBtnText: { color: '#7c3aed', fontWeight: '800', fontSize: 12 },
});
