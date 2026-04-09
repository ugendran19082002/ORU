import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppState } from '@/hooks/use-app-state';

export default function DeliveryCompleteScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { orders } = useAppState();
  const order = orders.find((item) => item.id === orderId) ?? orders[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={72} color="#0f766e" />
        </View>
        <Text style={styles.title}>Delivery completed</Text>
        <Text style={styles.copy}>
          {order.id} has been marked delivered. Customer and shop timelines are now updated.
        </Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/delivery' as any)}>
          <Text style={styles.primaryText}>Back to Assigned Orders</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  iconWrap: { width: 120, height: 120, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ccfbf1', marginBottom: 24 },
  title: { fontSize: 30, fontWeight: '900', color: '#0f172a', textAlign: 'center' },
  copy: { marginTop: 12, fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22, maxWidth: 320 },
  primaryBtn: { marginTop: 28, backgroundColor: '#0f766e', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 16 },
  primaryText: { color: 'white', fontWeight: '900', fontSize: 15 },
});
