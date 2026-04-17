import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, Linking,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useDeliveryStore } from '@/stores/deliveryStore';
import { useAppSession } from '@/hooks/use-app-session';
import { connectSocket, disconnectSocket, getSocket } from '@/utils/socket';
import * as ImagePicker from 'expo-image-picker';
import * as TaskManager from 'expo-task-manager';
import { Shadow, thannigoPalette, roleAccent, roleSurface, roleGradients } from '@/constants/theme';

const DELIVERY_ACCENT = roleAccent.delivery;
const DELIVERY_SURF = roleSurface.delivery;
const DELIVERY_GRAD: [string, string] = [roleGradients.delivery.start, roleGradients.delivery.end];

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
  const router = useRouter();
  const { user, signOut } = useAppSession();
  const { tasks, online, toggleOnline, assignCurrentTask, updateTaskStatus, removeTask } = useDeliveryStore();
 

  // ── Socket location push ─────────────────────────────────────────────────────
  // When the driver is online and has an active accepted task, broadcast GPS
  // position every 5 seconds through the socket connection.
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const activeTask = tasks.find((t) => t.status === 'accepted');

    if (!online || !activeTask) {
      // Not on duty — clear any running interval and disconnect socket
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
      // Request foreground location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[Socket] Location permission denied — skipping push');
        return;
      }

      // Connect socket (no-op if already connected)
      try {
        await connectSocket();
      } catch (err) {
        console.warn('[Socket] Connect failed in delivery push:', err);
        return;
      }

      if (!mounted) return;

      // Start background location updates
      try {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Update every 10 meters
          deferredUpdatesInterval: 5000, // Or every 5 seconds
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
  // ────────────────────────────────────────────────────────────────────────────

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
      // podImage = result.assets[0].uri;
      // router.push('/delivery/complete' as any); // Or show modal
      router.push({ pathname: '/delivery/complete' as any, params: { taskId: tasks.find(t => t.status === 'accepted')?.id, imageUri: result.assets[0].uri } });
    }
  };

  const totalEarnings = 284;
  const completedToday = 6;
  const activeTrips = tasks.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* HEADER — Gradient */}
      <LinearGradient
        colors={online ? DELIVERY_GRAD : ['#475569', '#334155'] as [string,string]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good morning, {user?.name ?? 'Agent'} 👋</Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: online ? '#4ade80' : '#f87171' }]} />
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
          <View style={styles.statBox}>
            <Text style={styles.statValue}>₹{totalEarnings}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{completedToday}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{activeTrips}</Text>
            <Text style={styles.statLabel}>In Queue</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* QUICK ACTIONS */}
        <View style={styles.quickRow}>
          {[
            { label: 'Security', icon: 'shield-checkmark-outline', color: '#005d90', bg: '#f0f9ff', path: '/privacy-security' },
            { label: 'My Earnings', icon: 'cash-outline', color: '#2e7d32', bg: '#e8f5e9', path: '/delivery/earnings' },
            { label: 'Trip History', icon: 'time-outline', color: '#b45309', bg: '#fef3c7', path: '/delivery/history' },
            { label: 'Emergency', icon: 'warning-outline', color: '#c62828', bg: '#ffebee', path: '/emergency-help' },
          ].map((q) => (
            <TouchableOpacity 
              key={q.label} 
              style={styles.quickBtn}
              onPress={() => {
                if (q.path) {
                  router.push(q.path as any);
                } else {
                  Toast.show({
                    type: 'info',
                    text1: 'Coming Soon',
                    text2: `${q.label} feature is currently being finalized.`
                  });
                }
              }}
            >
              <View style={[styles.quickIcon, { backgroundColor: q.bg }]}>
                <Ionicons name={q.icon as any} size={20} color={q.color} />
              </View>
              <Text style={styles.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ACTIVE TRIPS */}
        <Text style={styles.sectionTitle}>
          {online ? `Assigned Trips (${tasks.length})` : 'Go online to receive trips'}
        </Text>

        {!online && (
          <View style={styles.offlineCard}>
            <Ionicons name="moon-outline" size={40} color="#94a3b8" />
            <Text style={styles.offlineTitle}>You are offline</Text>
            <Text style={styles.offlineSub}>Toggle the switch above to start receiving delivery assignments.</Text>
          </View>
        )}

        {online && tasks.map((trip) => (
          <View key={trip.id} style={styles.tripCard}>
            {/* TRIP TOP */}
            <View style={styles.tripTop}>
              <Text style={styles.tripOrderId}>{trip.orderId}</Text>
              <View style={[styles.priorityChip, trip.priority === 'Urgent' && styles.urgentChip]}>
                {trip.priority === 'Urgent' && <Ionicons name="flash" size={11} color="#c62828" />}
                <Text style={[styles.priorityText, trip.priority === 'Urgent' && styles.urgentText]}>
                  {trip.priority}
                </Text>
              </View>
            </View>

            {/* CUSTOMER & ADDRESS */}
            <Text style={styles.tripCustomer}>{trip.customerName}</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={14} color="#707881" />
              <Text style={styles.tripAddress} numberOfLines={1}>{trip.address}</Text>
            </View>

            {/* TRIP META */}
            <View style={styles.tripMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="speedometer-outline" size={13} color={DELIVERY_ACCENT} />
                <Text style={styles.metaText}>{trip.distance}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={13} color={DELIVERY_ACCENT} />
                <Text style={styles.metaText}>ETA {trip.eta}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="water-outline" size={13} color={DELIVERY_ACCENT} />
                <Text style={styles.metaText}>{trip.cans} can{trip.cans > 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="cash-outline" size={13} color="#2e7d32" />
                <Text style={[styles.metaText, { color: '#2e7d32' }]}>{trip.amount}</Text>
              </View>
            </View>

            {/* ACTIONS */}
              <View style={styles.tripActions}>
              {trip.status === 'assigned' ? (
                <View style={{ flexDirection: 'row', flex: 1, gap: 10 }}>
                  <TouchableOpacity style={[styles.startBtn, { backgroundColor: '#f1f4f9', flex: 1 }]} onPress={() => handleReject(trip.id)}>
                    <Text style={[styles.startBtnText, { color: '#ba1a1a' }]}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.startBtn, { backgroundColor: '#005d90', flex: 1 }]} onPress={() => handleAccept(trip.id)}>
                    <Text style={styles.startBtnText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              ) : trip.status === 'picked' ? (
                <TouchableOpacity
                  style={styles.startBtn}
                  onPress={takePodPhoto}
                >
                  <LinearGradient
                    colors={['#2e7d32', '#388e3c']}
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
                style={styles.callBtn}
                onPress={() => {
                  const phone = trip.customerPhone ?? '+919876543210';
                  Linking.openURL(`tel:${phone}`).catch(() =>
                    Toast.show({
                      type: 'info',
                      text1: 'Call Customer',
                      text2: `Dial ${phone} manually.`
                    })
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
          <View style={styles.shiftCard}>
            <View style={styles.shiftRow}>
              <Ionicons name="time-outline" size={20} color={DELIVERY_ACCENT} />
              <View style={{ flex: 1 }}>
                <Text style={styles.shiftTitle}>Shift Active</Text>
                <Text style={styles.shiftSub}>Started at 9:00 AM · 4h 22m elapsed</Text>
              </View>
              <TouchableOpacity style={styles.endShiftBtn}>
                <Text style={styles.endShiftText}>End Shift</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: thannigoPalette.background },

  header: { paddingTop: 8, paddingBottom: 24, paddingHorizontal: 24 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 20, fontWeight: '900', color: 'white', marginBottom: 6 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  onlineStatus: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  headerRight: { alignItems: 'flex-end', gap: 12 },
  shopBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
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
  quickBtn: { flex: 1, backgroundColor: thannigoPalette.surface, borderRadius: 18, padding: 14, alignItems: 'center', gap: 8, ...Shadow.xs },
  quickIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 11, fontWeight: '700', color: thannigoPalette.darkText, textAlign: 'center' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: thannigoPalette.darkText, letterSpacing: -0.3 },

  offlineCard: { backgroundColor: thannigoPalette.surface, borderRadius: 20, padding: 32, alignItems: 'center', gap: 10, ...Shadow.xs },
  offlineTitle: { fontSize: 18, fontWeight: '800', color: thannigoPalette.darkText },
  offlineSub: { fontSize: 13, color: thannigoPalette.neutral, textAlign: 'center', lineHeight: 18 },

  tripCard: { backgroundColor: thannigoPalette.surface, borderRadius: 20, padding: 18, ...Shadow.sm },
  tripTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tripOrderId: { fontSize: 13, fontWeight: '800', color: DELIVERY_ACCENT },
  priorityChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: thannigoPalette.background, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  urgentChip: { backgroundColor: '#ffebee' },
  priorityText: { fontSize: 11, fontWeight: '700', color: thannigoPalette.neutral },
  urgentText: { color: '#c62828' },
  tripCustomer: { fontSize: 17, fontWeight: '800', color: thannigoPalette.darkText, marginBottom: 5 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 14 },
  tripAddress: { flex: 1, fontSize: 12, color: thannigoPalette.neutral, fontWeight: '500' },
  tripMeta: { flexDirection: 'row', gap: 12, marginBottom: 14, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: DELIVERY_ACCENT, fontWeight: '700' },
  tripActions: { flexDirection: 'row', gap: 10 },
  startBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  startBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 },
  startBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
  callBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: DELIVERY_SURF, alignItems: 'center', justifyContent: 'center' },

  shiftCard: { backgroundColor: thannigoPalette.surface, borderRadius: 18, padding: 16, ...Shadow.xs },
  shiftRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shiftTitle: { fontSize: 14, fontWeight: '800', color: thannigoPalette.darkText, marginBottom: 2 },
  shiftSub: { fontSize: 11, color: thannigoPalette.neutral, fontWeight: '500' },
  endShiftBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#ffebee' },
  endShiftText: { color: '#c62828', fontWeight: '800', fontSize: 12 },
});


