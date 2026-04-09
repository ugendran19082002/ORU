import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/ui/Logo';
import { useAppState } from '@/hooks/use-app-state';

const tabs = ['New', 'Active', 'Completed'] as const;
const rejectReasons = ['Out of stock', 'Outside radius', 'Capacity full', 'Wrong schedule'];

export default function ShopOrdersScreen() {
  const router = useRouter();
  const { acceptOrder, busyMode, orders, rejectOrder, toggleBusyMode, updateOrderStatus } = useAppState();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('New');
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState('');

  const newOrders = orders.filter((order) => order.status === 'placed');
  const activeOrders = orders.filter((order) =>
    ['accepted', 'preparing', 'out_for_delivery'].includes(order.status)
  );
  const completedOrders = orders.filter((order) =>
    ['delivered', 'cancelled'].includes(order.status)
  );

  const visibleOrders =
    activeTab === 'New' ? newOrders : activeTab === 'Active' ? activeOrders : completedOrders;

  const confirmReject = async () => {
    if (!rejectingOrderId || !selectedReason) {
      return;
    }

    await rejectOrder(rejectingOrderId, selectedReason);
    setRejectingOrderId(null);
    setSelectedReason('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View>
          <View style={styles.brandRow}>
            <Logo size="md" />
            <Text style={styles.brandName}>ThanniGo</Text>
          </View>
          <Text style={styles.roleLabel}>SHOP PANEL</Text>
        </View>

        <TouchableOpacity style={styles.busyButton} onPress={toggleBusyMode}>
          <Ionicons name={busyMode ? 'pause-circle' : 'play-circle'} size={18} color={busyMode ? '#C0392B' : '#0077B6'} />
          <Text style={[styles.busyText, busyMode && styles.busyTextActive]}>
            {busyMode ? 'Busy' : 'Open'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.banner, busyMode ? styles.bannerBusy : styles.bannerOpen]}>
          <Text style={styles.bannerLabel}>{busyMode ? 'BUSY MODE ENABLED' : 'SHOP IS LIVE'}</Text>
          <Text style={styles.bannerTitle}>
            {busyMode ? 'New customer orders will be routed away.' : 'Accept and dispatch orders from one queue.'}
          </Text>
          <Text style={styles.bannerCopy}>
            P0 operations now use shared order state, so accept, reject, and dispatch updates flow to customer and delivery screens.
          </Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{newOrders.length}</Text>
            <Text style={styles.metricLabel}>Waiting</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{activeOrders.length}</Text>
            <Text style={styles.metricLabel}>Dispatching</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{completedOrders.length}</Text>
            <Text style={styles.metricLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const selected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, selected && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabText, selected && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {visibleOrders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderTopRow}>
              <View style={styles.orderCopy}>
                <Text style={styles.orderCustomer}>{order.customerName}</Text>
                <Text style={styles.orderId}>{order.id}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{order.status.replaceAll('_', ' ')}</Text>
              </View>
            </View>

            <Text style={styles.orderMeta}>
              {order.quantity} x {order.itemName}
            </Text>
            <Text style={styles.orderMeta}>
              {order.paymentMethod.toUpperCase()}  ·  {order.total} total
            </Text>
            <Text style={styles.orderMeta}>{order.notes || 'No delivery note added'}</Text>

            {order.status === 'placed' ? (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.primaryAction}
                  onPress={() => acceptOrder(order.id)}>
                  <Text style={styles.primaryActionText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectAction}
                  onPress={() => setRejectingOrderId(order.id)}>
                  <Text style={styles.rejectActionText}>Reject</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {order.status === 'accepted' ? (
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={() => updateOrderStatus(order.id, 'preparing')}>
                <Text style={styles.secondaryActionText}>Mark preparing</Text>
              </TouchableOpacity>
            ) : null}

            {order.status === 'preparing' ? (
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={() => updateOrderStatus(order.id, 'out_for_delivery')}>
                <Text style={styles.secondaryActionText}>Send to delivery</Text>
              </TouchableOpacity>
            ) : null}

            {order.status === 'out_for_delivery' ? (
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={() => router.push(`/delivery/navigation?orderId=${order.id}` as any)}>
                <Text style={styles.secondaryActionText}>Open delivery view</Text>
              </TouchableOpacity>
            ) : null}

            {order.status === 'delivered' ? (
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={() => router.push(`/shop/order/${order.id}` as any)}>
                <Text style={styles.secondaryActionText}>View completion summary</Text>
              </TouchableOpacity>
            ) : null}

            {order.status === 'cancelled' ? (
              <Text style={styles.cancelReason}>Reject reason: {order.cancelReason}</Text>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <Modal visible={Boolean(rejectingOrderId)} transparent animationType="slide" onRequestClose={() => setRejectingOrderId(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select rejection reason</Text>
            {rejectReasons.map((reason) => {
              const selected = selectedReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  style={[styles.reasonRow, selected && styles.reasonRowActive]}
                  onPress={() => setSelectedReason(reason)}>
                  <Text style={[styles.reasonText, selected && styles.reasonTextActive]}>{reason}</Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              disabled={!selectedReason}
              style={[styles.modalPrimaryButton, !selectedReason && styles.modalPrimaryDisabled]}
              onPress={confirmReject}>
              <Text style={styles.modalPrimaryText}>Reject order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSecondaryButton}
              onPress={() => {
                setRejectingOrderId(null);
                setSelectedReason('');
              }}>
              <Text style={styles.modalSecondaryText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A2E',
  },
  roleLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '800',
    color: '#6A1B9A',
    letterSpacing: 1,
  },
  busyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
  },
  busyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0077B6',
  },
  busyTextActive: {
    color: '#C0392B',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  banner: {
    borderRadius: 24,
    padding: 20,
  },
  bannerOpen: {
    backgroundColor: '#F3E8FF',
  },
  bannerBusy: {
    backgroundColor: '#FFF1F2',
  },
  bannerLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#6A1B9A',
  },
  bannerTitle: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1A2E',
  },
  bannerCopy: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
  },
  metricsRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#6A1B9A',
  },
  metricLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  tabRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  tabButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#E9D5FF',
  },
  tabButtonActive: {
    backgroundColor: '#6A1B9A',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6A1B9A',
  },
  tabTextActive: {
    color: 'white',
  },
  orderCard: {
    marginTop: 16,
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'white',
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  orderCopy: {
    flex: 1,
  },
  orderCustomer: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A1A2E',
  },
  orderId: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F3E8FF',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6A1B9A',
    textTransform: 'capitalize',
  },
  orderMeta: {
    marginTop: 10,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  actionRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  primaryAction: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#6A1B9A',
  },
  primaryActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
  },
  rejectAction: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
  },
  rejectActionText: {
    color: '#C0392B',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryAction: {
    marginTop: 18,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
  },
  secondaryActionText: {
    color: '#6A1B9A',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelReason: {
    marginTop: 14,
    fontSize: 13,
    color: '#C0392B',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A1A2E',
    marginBottom: 14,
  },
  reasonRow: {
    marginTop: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
  },
  reasonRowActive: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#6A1B9A',
  },
  reasonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  reasonTextActive: {
    color: '#6A1B9A',
  },
  modalPrimaryButton: {
    marginTop: 20,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: '#C0392B',
  },
  modalPrimaryDisabled: {
    backgroundColor: '#CBD5E1',
  },
  modalPrimaryText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  modalSecondaryButton: {
    marginTop: 10,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  modalSecondaryText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '800',
  },
});
