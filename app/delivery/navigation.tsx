import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { ExpoMap } from '@/components/maps/ExpoMap';

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

import { useDeliveryStore } from '@/stores/deliveryStore';
import { apiClient } from '@/api/client';
import { roleAccent, roleSurface, roleGradients, makeShadow } from '@/constants/theme';
import { useAppTheme } from '@/providers/ThemeContext';

const DELIVERY_ACCENT = roleAccent.delivery;
const DELIVERY_SURF = roleSurface.delivery;
const DELIVERY_GRAD: [string, string] = [roleGradients.delivery.start, roleGradients.delivery.end];

export default function DeliveryNavigationScreen() {
  const router = useRouter();
  const { tasks, currentTaskId, updateTaskStatus } = useDeliveryStore();
  const task = tasks.find((item) => item.id === currentTaskId) ?? tasks[0];
  const { colors, isDark } = useAppTheme();
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Location Access Denied', text2: 'Enable location to update your position.' });
        return;
      }

      locationSubRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 8000, distanceInterval: 20 },
        async (loc) => {
          if (!mounted) return;
          const now = Date.now();
          if (now - lastUpdateRef.current < 7500) return;
          lastUpdateRef.current = now;

          try {
            await apiClient.patch('/delivery/location', {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              heading: loc.coords.heading ?? null,
              speed: loc.coords.speed ?? null,
            });
          } catch {
            // silent — non-critical
          }
        }
      );
    };

    startTracking();

    return () => {
      mounted = false;
      locationSubRef.current?.remove();
    };
  }, []);

  const surf = colors.surface;
  const border = colors.border;
  const text = colors.text;
  const muted = colors.muted;
  const bg = colors.background;
  const inputBg = colors.inputBg;
  const shadow = makeShadow(isDark);

  const floatBg = isDark ? 'rgba(17,24,39,0.97)' : 'rgba(255,255,255,0.97)';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Full-screen map */}
      <ExpoMap
        hideControls={true}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: task?.lat ?? 12.9716,
          longitude: task?.lng ?? 80.2210,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showRoute={true}
        markers={[
          {
            latitude: task?.lat ?? 12.9716,
            longitude: task?.lng ?? 80.2210,
            title: 'Customer Location',
            color: '#ba1a1a',
            iconType: 'home' as const,
          },
        ]}
        onMarkerDragEnd={(coords) => {
          Toast.show({ type: 'info', text1: 'Location Tapped', text2: `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` });
        }}
      />

      {/* Floating Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafe} pointerEvents="box-none">
        <View style={styles.headerRow}>
          <View style={[styles.headerPill, { backgroundColor: floatBg, borderColor: border }]}>
            <BackButton fallback="/delivery" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: text }]} numberOfLines={1}>
                {task?.customerName ?? 'Navigation'}
              </Text>
              <Text style={[styles.headerSub, { color: muted }]}>Order #{task?.id ?? '—'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: inputBg }]}
              onPress={() => router.push('/notifications' as any)}
            >
              <Ionicons name="help-buoy-outline" size={20} color={text} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Navigation Bottom Sheet */}
      <SafeAreaView edges={['bottom']} style={styles.sheetSafe} pointerEvents="box-none">
        <View style={[styles.sheetContent, { backgroundColor: surf, borderTopColor: border }, shadow.lg]}>
          <View style={[styles.sheetPill, { backgroundColor: border }]} />

          {/* Trip summary row */}
          <View style={styles.tripHeaderRow}>
            <View>
              <Text style={[styles.tripTime, { color: DELIVERY_ACCENT }]}>12 min</Text>
              <Text style={[styles.tripDistance, { color: muted }]}>4.2 km · Dropoff</Text>
            </View>
            <View style={[styles.etaBadge, { backgroundColor: isDark ? '#071A0A' : DELIVERY_SURF }]}>
              <Ionicons name="checkmark-circle-outline" size={12} color={DELIVERY_ACCENT} />
              <Text style={[styles.etaBadgeText, { color: DELIVERY_ACCENT }]}>ON TIME</Text>
            </View>
          </View>

          {/* Customer card */}
          <View style={[styles.customerCard, { backgroundColor: bg, borderColor: border }]}>
            <View style={styles.customerTop}>
              <View style={[styles.avatar, { backgroundColor: isDark ? '#071A0A' : DELIVERY_SURF }]}>
                <Ionicons name="person" size={19} color={DELIVERY_ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.custName, { color: text }]}>{task?.customerName ?? 'Customer'}</Text>
                <Text style={[styles.custOrder, { color: muted }]}>Order #{task?.id ?? '—'}</Text>
              </View>
              <TouchableOpacity
                style={[styles.callBtn, { backgroundColor: DELIVERY_ACCENT }]}
                onPress={() => {
                  const phone = task?.customerPhone ?? null;
                  if (!phone) return;
                  Linking.openURL(`tel:${phone}`).catch(() =>
                    Toast.show({ type: 'error', text1: 'Error', text2: `Unable to call. Dial ${phone} manually.` })
                  );
                }}
              >
                <Ionicons name="call" size={17} color="white" />
              </TouchableOpacity>
            </View>

            <View style={[styles.addressRow, { borderTopColor: border }]}>
              <Ionicons name="location-sharp" size={17} color="#ba1a1a" />
              <Text style={[styles.addressText, { color: text }]}>{task?.address ?? 'Customer address not available'}</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.btnDanger, { backgroundColor: isDark ? '#2d0a0a' : '#ffdad6' }]}
              onPress={() => require('react-native').Alert.alert('Cancel Trip', 'Are you sure you want to cancel this trip?')}
            >
              <Ionicons name="close" size={20} color="#ba1a1a" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={{ flex: 1 }}
              onPress={() => {
                if (task?.status === 'accepted') {
                  updateTaskStatus(task.id, 'picked');
                  Toast.show({ type: 'success', text1: 'Picked up', text2: 'Order items successfully picked up from shop.' });
                } else if (task?.status === 'picked') {
                  updateTaskStatus(task.id, 'delivered');
                  router.push('/delivery/complete' as any);
                }
              }}
            >
              <LinearGradient
                colors={DELIVERY_GRAD}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.arriveBtn}
              >
                <Text style={styles.arriveBtnText}>
                  {task?.status === 'accepted' ? 'Confirm Pickup' : 'Slide When Arrived'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerSafe: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerRow: { paddingHorizontal: 16, paddingBottom: 8 },
  headerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 28, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
  },
  headerTitle: { fontSize: 15, fontWeight: '800' },
  headerSub: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

  sheetSafe: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheetContent: {
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, paddingBottom: 16,
    borderTopWidth: 1,
  },
  sheetPill: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },

  tripHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  tripTime: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  tripDistance: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  etaBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  etaBadgeText: { fontWeight: '800', fontSize: 11 },

  customerCard: { borderRadius: 20, padding: 16, marginBottom: 18, borderWidth: 1 },
  customerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  custName: { fontSize: 15, fontWeight: '900' },
  custOrder: { fontSize: 12, fontWeight: '500' },
  callBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  addressRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderTopWidth: 1, paddingTop: 12 },
  addressText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '500' },

  actionGrid: { flexDirection: 'row', gap: 12 },
  btnDanger: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  arriveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 20, height: 56,
    shadowColor: DELIVERY_ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  arriveBtnText: { color: 'white', fontWeight: '900', fontSize: 16 },
});
