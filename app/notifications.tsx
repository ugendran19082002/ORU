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
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';


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

const NOTIFS: Notif[] = [
  { id: '1', type: 'order', title: 'Order Delivered', body: 'Your 20L water can from Blue Spring Aquatics was delivered. Rate your experience!', time: '2 min ago', read: false, icon: 'checkmark-circle' },
  { id: '2', type: 'promo', title: '🎉 Limited Offer: BULK20', body: 'Get 20% off on bulk orders above ₹500 this weekend. Tap to apply.', time: '1 hr ago', read: false, icon: 'pricetag' },
  { id: '3', type: 'complaint', title: 'Complaint Update', body: 'Your complaint #C-2231 about delayed delivery has been acknowledged. Resolution in 24 hrs.', time: '3 hrs ago', read: true, icon: 'chatbubble-ellipses' },
  { id: '4', type: 'order', title: 'Order #9823 Out for Delivery', body: 'Your water can is on the way. Expected in 12 mins. Track live.', time: 'Yesterday', read: true, icon: 'bicycle' },
  { id: '5', type: 'system', title: 'System Maintenance', body: 'ThanniGo will undergo a brief maintenance window on Apr 12, 2–3 AM IST.', time: '2 days ago', read: true, icon: 'cog' },
  { id: '6', type: 'promo', title: 'Loyalty Upgraded 🥇', body: 'Congratulations! You\'ve reached Gold tier. Enjoy 10% off on all future orders.', time: '3 days ago', read: true, icon: 'ribbon' },
  { id: '7', type: 'complaint', title: 'Refund Processed', body: '₹45 has been credited to your original payment method for order #9780. Resolution within 24–48 hrs.', time: '5 days ago', read: true, icon: 'cash' },
];

const TYPE_CONFIG: Record<NotifType, { label: string; color: string; bg: string }> = {
  order: { label: 'ORDER', color: '#005d90', bg: '#e0f0ff' },
  promo: { label: 'OFFER', color: '#b45309', bg: '#fef3c7' },
  system: { label: 'SYSTEM', color: '#64748b', bg: '#f1f5f9' },
  complaint: { label: 'SUPPORT', color: '#7c3aed', bg: '#ede9fe' },
};

const FILTERS = ['All', 'Orders', 'Offers', 'Support'];

export default function NotificationsScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();

  useAndroidBackHandler(() => {
    safeBack('/(tabs)');
  });

  const [notifs, setNotifs] = useState<Notif[]>(NOTIFS);
  const [filter, setFilter] = useState('All');

  const unreadCount = notifs.filter((n) => !n.read).length;

  const markAllRead = () => setNotifs(notifs.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifs(notifs.map((n) => n.id === id ? { ...n, read: true } : n));
  const deleteNotif = (id: string) => setNotifs(notifs.filter((n) => n.id !== id));

  const filtered = notifs.filter((n) => {
    if (filter === 'All') return true;
    if (filter === 'Orders') return n.type === 'order';
    if (filter === 'Offers') return n.type === 'promo';
    if (filter === 'Support') return n.type === 'complaint';
    return true;
  });


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <BackButton fallback="/(tabs)" />
        <View style={{ flex: 1, marginLeft: 12 }}>

          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              activeOpacity={0.7}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
              onPress={() => setFilter(f)}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={56} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>All clear!</Text>
            <Text style={styles.emptySub}>No notifications in this category right now.</Text>
          </View>
        )}

        {filtered.map((notif) => {
          const cfg = TYPE_CONFIG[notif.type];
          return (
            <TouchableOpacity
              key={notif.id}
              style={[styles.notifCard, !notif.read && styles.notifCardUnread]}
              activeOpacity={0.75}
              onPress={() => markRead(notif.id)}
            >
              {/* UNREAD DOT */}
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

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteNotif(notif.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={16} color="#94a3b8" />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        {/* COMPLAINT SECTION */}
        <View style={styles.complaintCard}>
          <LinearGradient colors={['#7c3aed', '#5b21b6']} style={styles.complaintGrad}>
            <Ionicons name="chatbubble-ellipses" size={32} color="rgba(255,255,255,0.2)" style={styles.complaintDecor} />
            <View style={{ flex: 1 }}>
              <Text style={styles.complaintTitle}>Have a complaint?</Text>
              <Text style={styles.complaintSub}>We resolve issues within 24 hours. Your satisfaction matters.</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  headerSub: { fontSize: 12, color: '#005d90', fontWeight: '600', marginTop: 1 },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: '#bfdbf7' },
  markAllText: { fontSize: 12, color: '#005d90', fontWeight: '700' },

  filterContainer: {
    backgroundColor: 'white',
    height: 64,
  },
  filterRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    paddingHorizontal: 20, 
    height: '100%',
    gap: 12, 
  },
  filterPill: { 
    paddingHorizontal: 20, 
    paddingVertical: 9, 
    borderRadius: 22, 
    backgroundColor: '#f1f5f9', 
    borderWidth: 1.5, 
    borderColor: 'transparent' 
  },
  filterPillActive: { 
    backgroundColor: '#005d90', 
    borderColor: '#005d90',
    shadowColor: '#005d90',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  filterText: { fontSize: 13, fontWeight: '800', color: '#64748b' },
  filterTextActive: { color: 'white' },

  content: { padding: 20, gap: 12, paddingBottom: 100 },

  emptyState: { paddingVertical: 60, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#181c20' },
  emptySub: { fontSize: 13, color: '#707881', textAlign: 'center' },

  notifCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: 'white', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  notifCardUnread: { borderWidth: 1, borderColor: '#bfdbf7', backgroundColor: '#f0f7ff' },
  unreadDot: {
    position: 'absolute', top: 14, right: 46,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#005d90',
  },
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
