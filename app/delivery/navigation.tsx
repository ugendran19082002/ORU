import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { ExpoMap } from '@/components/maps/ExpoMap';

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

import { useDeliveryStore } from '@/stores/deliveryStore';
import { apiClient } from '@/api/client';
import { Shadow, thannigoPalette, roleAccent, roleSurface, roleGradients } from '@/constants/theme';

const DELIVERY_ACCENT = roleAccent.delivery;
const DELIVERY_SURF = roleSurface.delivery;
const DELIVERY_GRAD: [string, string] = [roleGradients.delivery.start, roleGradients.delivery.end];

export default function DeliveryNavigationScreen() {
  const router = useRouter();
  const { tasks, currentTaskId, updateTaskStatus } = useDeliveryStore();
  const task = tasks.find((item) => item.id === currentTaskId) ?? tasks[0];
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Start streaming GPS location to backend
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
          // Throttle: only send if 8s passed since last update
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
            // Silent — location update failure is non-critical
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Real Interactive Map */}
      <View style={styles.mapContainer}>
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
            }
          ]}
          onMarkerDragEnd={(coords) => {
            Toast.show({ type: 'info', text1: 'Location Tapped', text2: `${coords.latitude}, ${coords.longitude}` });
          }}
        />
      </View>

      {/* Floating Header */}
      <View style={styles.header}>
        <BackButton fallback="/delivery" />
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications' as any)}>
          <Ionicons name="help-buoy-outline" size={24} color="#181c20" />
        </TouchableOpacity>
      </View>

      {/* Navigation Card */}
      <View style={styles.sheetContent}>
        <View style={styles.sheetPill} />

        <View style={styles.tripHeaderRow}>
          <View>
            <Text style={styles.tripTime}>12 min</Text>
            <Text style={styles.tripDistance}>4.2 km • Dropoff</Text>
          </View>
          <View style={styles.etaBadge}>
            <Text style={styles.etaBadgeText}>ON TIME</Text>
          </View>
        </View>

        <View style={styles.customerCard}>
          <View style={styles.customerTop}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color={DELIVERY_ACCENT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.custName}>{task?.customerName ?? 'Customer'}</Text>
              <Text style={styles.custOrder}>Order #{task?.id ?? '—'}</Text>
            </View>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => {
                const phone = task?.customerPhone ?? null;
                if (!phone) return;
                Linking.openURL(`tel:${phone}`).catch(() =>
                  Toast.show({ type: 'error', text1: 'Error', text2: `Unable to call. Dial ${phone} manually.` })
                );
              }}
            >
              <Ionicons name="call" size={18} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.addressRow}>
            <Ionicons name="location-sharp" size={18} color="#ba1a1a" />
            <Text style={styles.addressText}>{task?.address ?? 'Customer address not available'}</Text>
          </View>
        </View>

        {/* ACTIONS */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.btnDanger}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: thannigoPalette.background, position: 'relative' },
  mapContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: thannigoPalette.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, position: 'absolute', top: 0, left: 0, right: 0 },
  iconBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: thannigoPalette.surface, alignItems: 'center', justifyContent: 'center', ...Shadow.md },
  sheetContent: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: thannigoPalette.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, ...Shadow.lg },
  sheetPill: { width: 40, height: 4, borderRadius: 2, backgroundColor: thannigoPalette.borderSoft, alignSelf: 'center', marginBottom: 20 },
  tripHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  tripTime: { fontSize: 28, fontWeight: '900', color: DELIVERY_ACCENT, letterSpacing: -0.5 },
  tripDistance: { fontSize: 13, color: thannigoPalette.neutral, fontWeight: '600', marginTop: 2 },
  etaBadge: { backgroundColor: DELIVERY_SURF, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  etaBadgeText: { color: DELIVERY_ACCENT, fontWeight: '800', fontSize: 11 },
  customerCard: { backgroundColor: thannigoPalette.background, borderRadius: 20, padding: 16, marginBottom: 20 },
  customerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: DELIVERY_SURF, alignItems: 'center', justifyContent: 'center' },
  custName: { fontSize: 16, fontWeight: '900', color: thannigoPalette.darkText },
  custOrder: { fontSize: 12, color: thannigoPalette.neutral, fontWeight: '500' },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: DELIVERY_ACCENT, alignItems: 'center', justifyContent: 'center' },
  addressRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderTopWidth: 1, borderTopColor: thannigoPalette.borderSoft, paddingTop: 12 },
  addressText: { flex: 1, fontSize: 13, color: thannigoPalette.darkText, lineHeight: 18, fontWeight: '500' },
  actionGrid: { flexDirection: 'row', gap: 12 },
  btnDanger: { width: 56, height: 56, borderRadius: 20, backgroundColor: '#ffdad6', alignItems: 'center', justifyContent: 'center' },
  arriveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 20, height: 56, shadowColor: DELIVERY_ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  arriveBtnText: { color: 'white', fontWeight: '900', fontSize: 16 },
});
