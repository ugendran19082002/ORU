import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { notificationApi } from '@/api/engagementApi';
import Toast from 'react-native-toast-message';

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
  order:     { label: 'ORDER',   color: '#005d90', bg: '#e0f0ff' },
  promo:     { label: 'OFFER',   color: '#b45309', bg: '#fef3c7' },
  system:    { label: 'SYSTEM',  color: '#64748b', bg: '#f1f5f9' },
  complaint: { label: 'SUPPORT', color: '#7c3aed', bg: '#ede9fe' },
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
    time:  n.created_at
      ? new Date(n.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      : '',
    read:  Boolean(n.is_read ?? n.read_at),
    icon:  ICON_MAP[type] ?? 'notifications-outline',
  };
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  useAndroidBackHandler(() => { safeBack('/(tabs)'); });

  const [notifs, setNotifs]     = useState<Notif[]>([]);
  const [filter, setFilter]     = useState('All');
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);

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
    try { await notificationApi.markRead(id); } catch { /* optimistic — ignore */ }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await Promise.allSettled(notifs.filter(n => !n.read).map(n => notificationApi.markRead(n.id)));
    } catch { /* ignore */ }
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <BackButton fallback="/(tabs)" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && <Text style={styles.headerSub}>{unreadCount} unread</Text>}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} keyboardShouldPersistTaps="handled">
          {FILTERS.map(f => (
            <TouchableOpacity key={f} activeOpacity={0.9} style={[styles.filterPill, filter === f && styles.filterPillActive]} onPress={() => setFilter(f)} hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#005d90" style={{ marginTop: 80 }} />
      ) : error ? (
        <View style={styles.errorWrap}>
          <Ionicons name="cloud-offline-outline" size={56} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Failed to Load</Text>
          <Text style={styles.emptySub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />}
        >
          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={56} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>All clear!</Text>
              <Text style={styles.emptySub}>No notifications in this category right now.</Text>
            </View>
          )}

          {filtered.map(notif => {
            const cfg = TYPE_CONFIG[notif.type];
            return (
              <TouchableOpacity key={notif.id} style={[styles.notifCard, !notif.read && styles.notifCardUnread]} activeOpacity={0.75} onPress={() => markRead(notif.id)}>
                {!notif.read && <View style={styles.unreadDot} />}
                <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={notif.icon as any} size={22} color={cfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.notifTop}>
                    <View style={[styles.typeChip, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.typeChipText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                    <Text style={styles.timeText}>{notif.time}</Text>
                  </View>
                  <Text style={[styles.notifTitle, !notif.read && styles.notifTitleUnread]}>{notif.title}</Text>
                  <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteNotif(notif.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={16} color="#94a3b8" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}

          <View style={styles.complaintCard}>
            <LinearGradient colors={['#7c3aed', '#5b21b6']} style={styles.complaintGrad}>
              <Ionicons name="chatbubble-ellipses" size={32} color="rgba(255,255,255,0.2)" style={styles.complaintDecor} />
              <View style={{ flex: 1 }}>
                <Text style={styles.complaintTitle}>Have a complaint?</Text>
                <Text style={styles.complaintSub}>We resolve issues within 24 hours.</Text>
              </View>
              <TouchableOpacity style={styles.complaintBtn} onPress={() => router.push('/report-issue' as any)}>
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
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  headerSub: { fontSize: 12, color: '#005d90', fontWeight: '600', marginTop: 1 },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: '#bfdbf7' },
  markAllText: { fontSize: 12, color: '#005d90', fontWeight: '700' },
  filterContainer: { backgroundColor: 'white', height: 64 },
  filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: '100%', gap: 12 },
  filterPill: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 22, backgroundColor: '#f1f5f9', borderWidth: 1.5, borderColor: 'transparent' },
  filterPillActive: { backgroundColor: '#005d90', borderColor: '#005d90', shadowColor: '#005d90', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  filterText: { fontSize: 13, fontWeight: '800', color: '#64748b' },
  filterTextActive: { color: 'white' },
  content: { padding: 20, gap: 12, paddingBottom: 100 },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyState: { paddingVertical: 60, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#181c20' },
  emptySub: { fontSize: 13, color: '#707881', textAlign: 'center' },
  retryBtn: { backgroundColor: '#005d90', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  retryBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: 'white', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  notifCardUnread: { borderWidth: 1, borderColor: '#bfdbf7', backgroundColor: '#f0f7ff' },
  unreadDot: { position: 'absolute', top: 14, right: 46, width: 8, height: 8, borderRadius: 4, backgroundColor: '#005d90' },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  notifTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  typeChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeChipText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  timeText: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  notifTitle: { fontSize: 14, fontWeight: '700', color: '#64748b', marginBottom: 3 },
  notifTitleUnread: { color: '#0f172a', fontWeight: '800' },
  notifBody: { fontSize: 12, color: '#707881', lineHeight: 17 },
  deleteBtn: { padding: 4, marginLeft: 4 },
  complaintCard: { borderRadius: 20, overflow: 'hidden', marginTop: 8 },
  complaintGrad: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, overflow: 'hidden' },
  complaintDecor: { position: 'absolute', right: 12, top: 0, opacity: 0.2 },
  complaintTitle: { fontSize: 15, fontWeight: '800', color: 'white', marginBottom: 4 },
  complaintSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 17 },
  complaintBtn: { backgroundColor: 'white', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginLeft: 'auto' },
  complaintBtnText: { color: '#7c3aed', fontWeight: '800', fontSize: 12 },
});
