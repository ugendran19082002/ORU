import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { StitchScreenNote } from '@/components/stitch/StitchScreenNote';
import { useDeliveryStore } from '@/stores/deliveryStore';

export default function DeliveryNavigationScreen() {
  const router = useRouter();
  const { tasks, currentTaskId } = useDeliveryStore();
  const task = tasks.find((item) => item.id === currentTaskId) ?? tasks[0];
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="navigate-circle" size={72} color="#0077B6" />
        <Text style={styles.title}>Active Trip</Text>
        <StitchScreenNote screen="deliveryTrip" />
        <Text style={styles.copy}>{task?.customerName ?? 'Customer'} | {task?.address ?? 'Assigned address pending'}</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/notifications' as any)}>
            <Text style={styles.secondaryText}>Need Help</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/map-preview' as any)}>
            <Text style={styles.secondaryText}>Open Map</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/delivery/otp' as any)}>
          <Text style={styles.btnText}>I Arrived</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9FF', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 28, padding: 24, alignItems: 'center', gap: 12 },
  title: { fontSize: 26, fontWeight: '900', color: '#1A1A2E' },
  copy: { textAlign: 'center', color: '#74777C', lineHeight: 20 },
  actionRow: { flexDirection: 'row', gap: 10 },
  secondaryBtn: { backgroundColor: '#E8F4FD', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12 },
  secondaryText: { color: '#005D90', fontWeight: '800' },
  btn: { backgroundColor: '#0077B6', borderRadius: 18, paddingHorizontal: 24, paddingVertical: 16 },
  btnText: { color: '#fff', fontWeight: '800' },
});
