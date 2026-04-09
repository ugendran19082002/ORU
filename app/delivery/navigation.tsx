import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppHeader from '@/components/ui/AppHeader';
import { ExpoMap } from '@/components/maps/ExpoMap';
import { useAppState } from '@/hooks/use-app-state';

export default function DeliveryNavigationScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { orders, addresses, updateOrderStatus } = useAppState();
  const order = orders.find((item) => item.id === orderId) ?? orders[0];
  const address = addresses.find((item) => item.id === order.addressId) ?? addresses[0];

  const handleStart = async () => {
    await updateOrderStatus(order.id, 'out_for_delivery');
    Alert.alert('Trip started', 'Customer has been notified that you are on the way.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <AppHeader title="Delivery Navigation" subtitle={order.id} onBackPress={() => router.back()} />

      <View style={styles.mapCard}>
        <ExpoMap
          style={styles.map}
          initialRegion={{
            latitude: address.latitude,
            longitude: address.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          markers={[
            {
              latitude: address.latitude,
              longitude: address.longitude,
              title: address.label,
              color: '#0f766e',
              iconType: 'home',
            },
          ]}
        />
      </View>

      <View style={styles.sheet}>
        <Text style={styles.customer}>{order.customerName}</Text>
        <Text style={styles.address}>{address.line1}, {address.line2}</Text>
        <Text style={styles.note}>Notes: {order.notes || 'No delivery notes'}</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleStart}>
            <Ionicons name="navigate-outline" size={18} color="#0f766e" />
            <Text style={styles.secondaryText}>Start Trip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push(`/delivery/otp?orderId=${order.id}` as any)}>
            <Text style={styles.primaryText}>Arrived at Drop</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  mapCard: { flex: 1, margin: 20, marginBottom: 0, borderRadius: 24, overflow: 'hidden' },
  map: { flex: 1 },
  sheet: {
    backgroundColor: 'white',
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  customer: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  address: { fontSize: 15, color: '#475569', marginTop: 8, lineHeight: 21 },
  note: { fontSize: 13, color: '#64748b', marginTop: 12 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 22 },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: '#ccfbf1',
  },
  secondaryText: { color: '#0f766e', fontWeight: '800' },
  primaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: '#0f766e',
  },
  primaryText: { color: 'white', fontWeight: '900' },
});
