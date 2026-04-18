import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, Linking,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useDeliveryStore } from '@/stores/deliveryStore';
import { useAppSession } from '@/hooks/use-app-session';
import { connectSocket, disconnectSocket, getSocket } from '@/utils/socket';
import * as ImagePicker from 'expo-image-picker';
import * as TaskManager from 'expo-task-manager';
import { Shadow, roleAccent, roleSurface, roleGradients, Radius } from '@/constants/theme';
import { useAppTheme, ThemePreference } from '@/providers/ThemeContext';

const DELIVERY_ACCENT = roleAccent.delivery;
const DELIVERY_SURF = roleSurface.delivery;
const DELIVERY_GRAD: [string, string] = [roleGradients.delivery.start, roleGradients.delivery.end];
const DELIVERY_OFFLINE: [string, string] = ['#475569', '#334155'];

const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('[LocationTask] Error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const sock = getSocket();
    if (sock?.connected) {
      sock.emit('location_push', {
        latitude: locations[0].coords.latitude,
        longitude: locations[0].coords.longitude,
        timestamp: locations[0].timestamp,
      });
    }
  }
});

export default function DeliveryDashboardScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { user, signOut } = useAppSession();
  const { tasks, online, toggleOnline, assignCurrentTask, updateTaskStatus, removeTask } = useDeliveryStore();
  const { colors, isDark, themePreference, setThemePreference } = useAppTheme();

  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const activeTask = tasks.find((t) => t.status === 'accepted');

    if (!online || !activeTask) {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      disconnectSocket();
      return;
    }

    let mounted = true;

    const startLocationPush = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[Socket] Location permission denied — skipping push');
        return;
      }

      try {
        await connectSocket();
      } catch (err) {
        console.warn('[Socket] Connect failed in delivery push:', err);
        return;
      }

      if (!mounted) return;

      try {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
          deferredUpdatesInterval: 5000,
          foregroundService: {
            notificationTitle: 'ThanniGo Delivery',
            notificationBody: 'Your location is being tracked for the customer.',
          },
        });
      } catch (err) {
        console.warn('[LocationTask] Failed to start background updates:', err);
      }
    };

    startLocationPush();

    return () => {
      mounted = false;
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => {});
    };
  }, [online, tasks]);

  const handleAccept = (id: string) => {
    updateTaskStatus(id, 'accepted');
  };

  const handleReject = (id: string) => {
    removeTask(id);
  };

  const takePodPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Camera access is required for POD' });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });

    if (!result.canceled) {
      router.push({ pathname: '/delivery/complete' as any, params: { taskId: tasks.find(t => t.status === 'accepted')?.id, imageUri: result.assets[0].uri } });
    }
  };

  const totalEarnings = 284;
  const completedToday = 6;
  const activeTrips = tasks.length;

  const headerColors: [string, string] = online ? DELIVERY_GRAD : DELIVERY_OFFLINE;

  const QUICK_ACTIONS = [
    { label: 'Security',    icon: 'shield-checkmark-outline', color: colors.primary,        bg: colors.deliverySoft ?? colors.background, path: '/privacy-security' },
    { label: 'My Earnings', icon: 'cash-outline',             color: '#2e7d32',  bg: colors.deliverySoft ?? colors.background, path: '/delivery/earnings' },
    { label: 'Trip History',icon: 'time-outline',             color: '#b45309',                      bg: isDark ? '#1a1000' : '#fef3c7',            path: '/delivery/history' },
    { label: 'Emergency',   icon: 'warning-outline',          color: colors.error,          bg: isDark ? '#2D0A0A' : colors.adminSoft, path: '/emergency-help' },
    { label: isDark ? 'Light' : 'Dark', icon: isDark ? 'sunny-outline' : 'moon-outline', color: DELIVERY_ACCENT, bg: colors.surface, path: null as any },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style="light" />

      {/* HEADER — Gradient */}
      <LinearGradient colors={headerColors} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good morning, {user?.name ?? 'Agent'} 👋</Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: online ? colors.success : colors.error }]} />
              <Text style={styles.onlineStatus}>{online ? 'Online — ready for trips' : 'Offline'}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {user?.role === 'shop_owner' && (
              <TouchableOpacity
                style={styles.shopBackBtn}
                onPress={() => require('react-native').Alert.alert(
                  'Exit Delivery Mode',
                  'Return to the Shop Panel?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Go to Shop', onPress: () => router.replace('/shop' as any) },
                  ]
                )}
              >
                <Ionicons name="storefront-outline" size={14} color="rgba(255,255,255,0.85)" />
                <Text style={styles.shopBackBtnText}>Shop Panel</Text>
              </TouchableOpacity>
            )}
            {user?.role === 'delivery' && (
              <TouchableOpacity
                style={[styles.shopBackBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                onPress={async () => {
                  await signOut();
                  router.replace('/auth' as any);
                }}
              >
                <Ionicons name="log-out-outline" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.shopBackBtnText}>Sign Out</Text>
              </TouchableOpacity>
            )}
            <View style={styles.toggleWrap}>
              <Text style={styles.toggleLabel}>{online ? 'GO\nOFFLINE' : 'GO\nONLINE'}</Text>
              <Switch
                value={online}
                onValueChange={toggleOnline}
                trackColor={{ false: '#94a3b8', true: '#bfdbf7' }}
                thumbColor={online ? 'white' : '#94a3b8'}
              />
            </View>
          </View>
        </View>

        {/* TODAY'S STATS */}
        <View style={styles.statsRow}>
          {[
            { value: `₹${totalEarnings}`, label: "Today's Earnings" },
            { value: completedToday, label: 'Completed' },
            { value: activeTrips, label: 'In Queue' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={styles.statDivider} />}
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* QUICK ACTIONS */}
        <View style={styles.quickRow}>
          {QUICK_ACTIONS.map((q) => (
            <TouchableOpacity
              key={q.label}
              style={[styles.quickBtn, { backgroundColor: colors.surface }, Shadow.xs]}
              onPress={() => {
                if (q.label === (isDark ? 'Light' : 'Dark')) {
                  setThemePreference(isDark ? 'light' : 'dark');
                } else if (q.path) {
                  router.push(q.path as any);
                }
              }}
            >
              <View style={[styles.quickIcon, { backgroundColor: q.bg }]}>
                <Ionicons name={q.icon as any} size={20} color={q.color} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.text }]}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ACTIVE TRIPS */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {online ? `Assigned Trips (${tasks.length})` : 'Go online to receive trips'}
        </Text>

        {!online && (
          <View style={[styles.offlineCard, { backgroundColor: colors.surface }, Shadow.xs]}>
            <Ionicons name="moon-outline" size={40} color={colors.muted} />
            <Text style={[styles.offlineTitle, { color: colors.text }]}>You are offline</Text>
            <Text style={[styles.offlineSub, { color: colors.muted }]}>
              Toggle the switch above to start receiving delivery assignments.
            </Text>
          </View>
        )}

        {online && tasks.map((trip) => (
          <View key={trip.id} style={[styles.tripCard, { backgroundColor: colors.surface }, Shadow.sm]}>
            {/* TRIP TOP */}
            <View style={styles.tripTop}>
              <Text style={[styles.tripOrderId, { color: DELIVERY_ACCENT }]}>{trip.orderId}</Text>
              <View style={[
                styles.priorityChip,
                { backgroundColor: colors.background },
                trip.priority === 'Urgent' && { backgroundColor: colors.adminSoft },
              ]}>
                {trip.priority === 'Urgent' && <Ionicons name="flash" size={11} color={colors.error} />}
                <Text style={[
                  styles.priorityText,
                  { color: colors.muted },
                  trip.priority === 'Urgent' && { color: colors.error },
                ]}>
                  {trip.priority}
                </Text>
              </View>
            </View>

            <Text style={[styles.tripCustomer, { color: colors.text }]}>{trip.customerName}</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={14} color={colors.muted} />
              <Text style={[styles.tripAddress, { color: colors.muted }]} numberOfLines={1}>{trip.address}</Text>
            </View>

            <View style={styles.tripMeta}>
              {[
                { icon: 'speedometer-outline', text: trip.distance, color: DELIVERY_ACCENT },
                { icon: 'time-outline',        text: `ETA ${trip.eta}`, color: DELIVERY_ACCENT },
                { icon: 'water-outline',       text: `${trip.cans} can${trip.cans > 1 ? 's' : ''}`, color: DELIVERY_ACCENT },
                { icon: 'cash-outline',        text: trip.amount, color: '#2e7d32' },
              ].map((m) => (
                <View key={m.text} style={styles.metaItem}>
                  <Ionicons name={m.icon as any} size={13} color={m.color} />
                  <Text style={[styles.metaText, { color: m.color }]}>{m.text}</Text>
                </View>
              ))}
            </View>

            {/* ACTIONS */}
            <View style={styles.tripActions}>
              {trip.status === 'assigned' ? (
                <View style={{ flexDirection: 'row', flex: 1, gap: 10 }}>
                  <TouchableOpacity
                    style={[styles.startBtn, { backgroundColor: colors.background, flex: 1 }]}
                    onPress={() => handleReject(trip.id)}
                  >
                    <Text style={[styles.startBtnText, { color: colors.error }]}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.startBtn, { backgroundColor: DELIVERY_ACCENT, flex: 1 }]}
                    onPress={() => handleAccept(trip.id)}
                  >
                    <Text style={styles.startBtnText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              ) : trip.status === 'picked' ? (
                <TouchableOpacity style={styles.startBtn} onPress={takePodPhoto}>
                  <LinearGradient
                    colors={DELIVERY_GRAD}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.startBtnGrad}
                  >
                    <Ionicons name="camera" size={16} color="white" />
                    <Text style={styles.startBtnText}>Complete Delivery</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.startBtn}
                  onPress={() => {
                    assignCurrentTask(trip.id);
                    router.push('/delivery/navigation' as any);
                  }}
                >
                  <LinearGradient
                    colors={DELIVERY_GRAD}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.startBtnGrad}
                  >
                    <Ionicons name="navigate" size={16} color="white" />
                    <Text style={styles.startBtnText}>Start Trip</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.callBtn, { backgroundColor: DELIVERY_SURF }]}
                onPress={() => {
                  const phone = trip.customerPhone ?? '+919876543210';
                  Linking.openURL(`tel:${phone}`).catch(() =>
                    Toast.show({ type: 'info', text1: 'Call Customer', text2: `Dial ${phone} manually.` })
                  );
                }}
              >
                <Ionicons name="call-outline" size={18} color={DELIVERY_ACCENT} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* SHIFT SUMMARY */}
        {online && (
          <View style={[styles.shiftCard, { backgroundColor: colors.surface }, Shadow.xs]}>
            <View style={styles.shiftRow}>
              <Ionicons name="time-outline" size={20} color={DELIVERY_ACCENT} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.shiftTitle, { color: colors.text }]}>Shift Active</Text>
                <Text style={[styles.shiftSub, { color: colors.muted }]}>Started at 9:00 AM · 4h 22m elapsed</Text>
              </View>
              <TouchableOpacity style={[styles.endShiftBtn, { backgroundColor: colors.adminSoft }]}>
                <Text style={[styles.endShiftText, { color: colors.error }]}>End Shift</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1 },

  header: { paddingTop: 8, paddingBottom: 24, paddingHorizontal: 24 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 20, fontWeight: '900', color: 'white', marginBottom: 6 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  onlineStatus: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  headerRight: { alignItems: 'flex-end', gap: 12 },
  shopBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.md },
  shopBackBtnText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  toggleWrap: { alignItems: 'center', gap: 4 },
  toggleLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '800', letterSpacing: 0.5, textAlign: 'center' },

  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 18, padding: 16 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '900', color: 'white', marginBottom: 2 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

  content: { padding: 20, gap: 16, paddingBottom: 120 },

  quickRow: { flexDirection: 'row', gap: 10 },
  quickBtn: { flex: 1, borderRadius: Radius.xl, padding: 14, alignItems: 'center', gap: 8 },
  quickIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },

  offlineCard: { borderRadius: Radius.xl, padding: 32, alignItems: 'center', gap: 10 },
  offlineTitle: { fontSize: 18, fontWeight: '800' },
  offlineSub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },

  tripCard: { borderRadius: Radius.xl, padding: 18 },
  tripTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tripOrderId: { fontSize: 13, fontWeight: '800' },
  priorityChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  priorityText: { fontSize: 11, fontWeight: '700' },
  tripCustomer: { fontSize: 17, fontWeight: '800', marginBottom: 5 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 14 },
  tripAddress: { flex: 1, fontSize: 12, fontWeight: '500' },
  tripMeta: { flexDirection: 'row', gap: 12, marginBottom: 14, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontWeight: '700' },
  tripActions: { flexDirection: 'row', gap: 10 },
  startBtn: { flex: 1, borderRadius: Radius.md, overflow: 'hidden' },
  startBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 },
  startBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
  callBtn: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },

  shiftCard: { borderRadius: Radius.lg, padding: 16 },
  shiftRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shiftTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  shiftSub: { fontSize: 11, fontWeight: '500' },
  endShiftBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.sm },
  endShiftText: { fontWeight: '800', fontSize: 12 },
});
