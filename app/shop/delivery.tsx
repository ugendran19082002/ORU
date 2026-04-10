import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { StitchScreenShell } from '@/components/stitch/StitchScreenShell';
import { StitchSectionCard } from '@/components/stitch/StitchSectionCard';
import { useDeliveryStore } from '@/stores/deliveryStore';

export default function ShopDeliveryManagementScreen() {
  const router = useRouter();
  const { tasks } = useDeliveryStore();
  return (
    <StitchScreenShell
      title="Delivery Management"
      subtitle="Review assigned trips, operational load, and stitched delivery workflows."
      accent="#006878"
      screen="shopDelivery"
      onBack={() => router.back()}
      rightAction={
        <TouchableOpacity style={styles.headerAction} onPress={() => Alert.alert('Dispatch Center', 'Dispatcher handoff can branch from this screen.')}>
          <Text style={styles.headerActionText}>Dispatch</Text>
        </TouchableOpacity>
      }
    >
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Open Trips</Text>
            <Text style={styles.summaryValue}>{tasks.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Priority Jobs</Text>
            <Text style={styles.summaryValue}>{tasks.filter((task) => task.priority === 'Urgent').length}</Text>
          </View>
        </View>

        <StitchSectionCard
          title="Operational clarity"
          copy="Use this view to assign drivers, check urgent deliveries, and jump into the delivery route group when a rider starts the trip."
          accent="#006878"
        />

        {tasks.map((task) => (
          <TouchableOpacity key={task.id} style={styles.card} onPress={() => router.push('/delivery' as any)}>
            <View style={styles.cardTop}>
              <Text style={styles.orderId}>{task.orderId}</Text>
              <View style={[styles.priorityChip, task.priority === 'Urgent' && styles.priorityChipUrgent]}>
                <Text style={[styles.priorityText, task.priority === 'Urgent' && styles.priorityTextUrgent]}>{task.priority}</Text>
              </View>
            </View>
            <Text style={styles.customer}>{task.customerName}</Text>
            <Text style={styles.address}>{task.address}</Text>
            <TouchableOpacity style={styles.inlineBtn} onPress={() => router.push('/delivery/navigation' as any)}>
              <Text style={styles.inlineBtnText}>Open Trip</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
    </StitchScreenShell>
  );
}

const styles = StyleSheet.create({
  headerAction: {
    minWidth: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  headerActionText: { color: '#006878', fontWeight: '800' },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 6 },
  summaryLabel: { color: '#74777C', fontSize: 12, fontWeight: '700' },
  summaryValue: { color: '#1A1A2E', fontSize: 26, fontWeight: '900' },
  card: { backgroundColor: '#fff', borderRadius: 22, padding: 18, gap: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { color: '#006878', fontWeight: '800' },
  customer: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  address: { color: '#74777C', lineHeight: 20 },
  priorityChip: { alignSelf: 'flex-start', backgroundColor: '#E8F4FD', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  priorityChipUrgent: { backgroundColor: '#FFF3E0' },
  priorityText: { color: '#005D90', fontWeight: '800', fontSize: 10 },
  priorityTextUrgent: { color: '#E67E22' },
  inlineBtn: { marginTop: 8, backgroundColor: '#006878', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  inlineBtnText: { color: '#fff', fontWeight: '800' },
});
