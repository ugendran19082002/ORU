import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppHeader from '@/components/ui/AppHeader';
import { useAppState } from '@/hooks/use-app-state';

export default function DeliveryAssignedOrdersScreen() {
  const router = useRouter();
  const { orders } = useAppState();
  const assignedOrders = orders.filter((order) =>
    ['accepted', 'preparing', 'out_for_delivery'].includes(order.status)
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <AppHeader title="Assigned Orders" subtitle="Delivery mode" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>ONLINE NOW</Text>
          <Text style={styles.summaryValue}>{assignedOrders.length} active drops</Text>
          <Text style={styles.summaryCopy}>Start navigation, contact the customer, and verify OTP at handoff.</Text>
        </View>

        {assignedOrders.map((order) => (
          <TouchableOpacity
            key={order.id}
            onPress={() => router.push(`/delivery/navigation?orderId=${order.id}` as any)}
            style={styles.card}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.cardTitle}>{order.shopName}</Text>
                <Text style={styles.cardSubtitle}>{order.customerName}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{order.status.replaceAll('_', ' ')}</Text>
              </View>
            </View>

            <Text style={styles.meta}>{order.quantity} x {order.itemName}</Text>
            <Text style={styles.meta}>{order.etaLabel}</Text>

            <View style={styles.footerRow}>
              <Text style={styles.otp}>OTP {order.otp}</Text>
              <Ionicons name="arrow-forward" size={18} color="#005d90" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  content: { padding: 24, paddingBottom: 80 },
  summaryCard: {
    backgroundColor: '#0f766e',
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
  },
  summaryLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  summaryValue: { color: 'white', fontSize: 28, fontWeight: '900', marginTop: 10, marginBottom: 8 },
  summaryCopy: { color: 'rgba(255,255,255,0.82)', lineHeight: 20 },
  card: { backgroundColor: 'white', borderRadius: 24, padding: 18, marginBottom: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cardTitle: { fontSize: 17, fontWeight: '900', color: '#0f172a' },
  cardSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  badge: { backgroundColor: '#ccfbf1', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#0f766e', textTransform: 'capitalize' },
  meta: { fontSize: 13, color: '#334155', marginTop: 10 },
  footerRow: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  otp: { fontSize: 13, fontWeight: '800', color: '#005d90' },
});
