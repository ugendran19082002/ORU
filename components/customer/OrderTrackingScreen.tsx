import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExpoMap } from '@/components/maps/ExpoMap';
import { useAppState } from '@/hooks/use-app-state';

const cancelReasons = ['Changed plan', 'Wrong quantity', 'Found another shop', 'Need later delivery'];
const timelineKeys = ['placed', 'accepted', 'preparing', 'out_for_delivery', 'delivered'] as const;

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { addresses, cancelOrder, getShopById, orders, updateOrderAddress } = useAppState();
  const order = orders.find((item) => item.id === orderId) ?? orders[0];
  const shop = getShopById(order.shopId);
  const address = addresses.find((item) => item.id === order.addressId) ?? addresses[0];
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');

  const currentTimelineIndex = timelineKeys.indexOf(
    order.status === 'cancelled' ? 'placed' : (order.status as (typeof timelineKeys)[number])
  );
  const driverPhone = order.deliveryPartner?.phone ?? '+91 98765 43210';
  const shopPhone = shop?.phone ?? '+91 98765 43210';
  const canModifyOrder = ['placed', 'accepted'].includes(order.status);

  const handleCall = async (phone: string) => {
    await Linking.openURL(`tel:${phone}`);
  };

  const handleCancelOrder = async () => {
    if (!selectedReason) {
      return;
    }

    await cancelOrder(order.id, selectedReason);
    setCancelModalVisible(false);
    setSelectedReason('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#0077B6" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Track Order</Text>
          <Text style={styles.headerSubtitle}>#{order.id}</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={() => handleCall(shopPhone)}>
          <Ionicons name="call-outline" size={20} color="#0077B6" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {order.status !== 'cancelled' ? (
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
                  color: '#0077B6',
                  iconType: 'home',
                },
                {
                  latitude: address.latitude + 0.002,
                  longitude: address.longitude + 0.002,
                  title: order.deliveryPartner?.name ?? 'Driver',
                  color: '#27AE60',
                  iconType: 'bicycle',
                },
              ]}
              showRoute
            />
            <View style={styles.etaChip}>
              <Ionicons name="time-outline" size={14} color="#0077B6" />
              <Text style={styles.etaText}>{order.etaLabel}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.cancelledCard}>
            <Ionicons name="close-circle" size={40} color="#C0392B" />
            <Text style={styles.cancelledTitle}>Order cancelled</Text>
            <Text style={styles.cancelledCopy}>
              Reason: {order.cancelReason ?? 'Cancelled before dispatch'}
            </Text>
          </View>
        )}

        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View>
              <Text style={styles.shopName}>{order.shopName}</Text>
              <Text style={styles.itemText}>
                {order.quantity} x {order.itemName}
              </Text>
            </View>
            <View style={styles.paymentBadge}>
              <Text style={styles.paymentText}>{order.paymentMethod.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.addressLabel}>Delivering to</Text>
          <Text style={styles.addressText}>
            {address.line1}, {address.line2}
          </Text>

          {order.status !== 'cancelled' ? (
            <View style={styles.otpCard}>
              <Text style={styles.otpLabel}>DELIVERY OTP</Text>
              <Text style={styles.otpValue}>{order.otp}</Text>
              <Text style={styles.otpHelp}>Share only with the delivery person at handoff.</Text>
            </View>
          ) : null}

          {canModifyOrder ? (
            <View style={styles.modifierRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setAddressModalVisible(true)}>
                <Text style={styles.secondaryButtonText}>Edit address</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dangerButton} onPress={() => setCancelModalVisible(true)}>
                <Text style={styles.dangerButtonText}>Cancel order</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {order.status !== 'cancelled' ? (
          <View style={styles.timelineCard}>
            <Text style={styles.sectionTitle}>Order status</Text>
            {timelineKeys.map((step, index) => {
              const state =
                index < currentTimelineIndex ? 'done' : index === currentTimelineIndex ? 'active' : 'pending';

              return (
                <View key={step} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineDot,
                        state === 'done'
                          ? styles.timelineDotDone
                          : state === 'active'
                            ? styles.timelineDotActive
                            : styles.timelineDotPending,
                      ]}>
                      <Ionicons
                        name={state === 'pending' ? 'ellipse-outline' : 'checkmark'}
                        size={12}
                        color={state === 'pending' ? '#94A3B8' : 'white'}
                      />
                    </View>
                    {index < timelineKeys.length - 1 ? <View style={styles.timelineLine} /> : null}
                  </View>
                  <View style={styles.timelineCopy}>
                    <Text style={styles.timelineTitle}>{step.replaceAll('_', ' ')}</Text>
                    <Text style={styles.timelineSub}>
                      {step === order.status ? order.etaLabel : step === 'placed' ? order.createdAt : 'Waiting for next update'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => handleCall(shopPhone)}>
            <Ionicons name="storefront-outline" size={20} color="#0077B6" />
            <Text style={styles.actionText}>Call shop</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => handleCall(driverPhone)}>
            <Ionicons name="bicycle-outline" size={20} color="#0077B6" />
            <Text style={styles.actionText}>Call driver</Text>
          </TouchableOpacity>
        </View>

        {order.status === 'delivered' ? (
          <TouchableOpacity
            style={styles.ratingButton}
            onPress={() => router.push(`/order/rating?orderId=${order.id}` as any)}>
            <Text style={styles.ratingText}>Rate delivery</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <Modal visible={cancelModalVisible} transparent animationType="slide" onRequestClose={() => setCancelModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Why are you cancelling?</Text>
            {cancelReasons.map((reason) => {
              const selected = selectedReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  style={[styles.reasonRow, selected && styles.reasonRowSelected]}
                  onPress={() => setSelectedReason(reason)}>
                  <Text style={[styles.reasonText, selected && styles.reasonTextSelected]}>{reason}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.modalPrimaryButton, !selectedReason && styles.modalPrimaryButtonDisabled]}
              disabled={!selectedReason}
              onPress={handleCancelOrder}>
              <Text style={styles.modalPrimaryText}>Confirm cancellation</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSecondaryButton} onPress={() => setCancelModalVisible(false)}>
              <Text style={styles.modalSecondaryText}>Keep order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={addressModalVisible} transparent animationType="slide" onRequestClose={() => setAddressModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose a saved address</Text>
            {addresses.map((savedAddress) => (
              <TouchableOpacity
                key={savedAddress.id}
                style={styles.addressRow}
                onPress={async () => {
                  await updateOrderAddress(order.id, savedAddress.id);
                  setAddressModalVisible(false);
                }}>
                <View>
                  <Text style={styles.savedAddressTitle}>{savedAddress.label}</Text>
                  <Text style={styles.savedAddressCopy}>
                    {savedAddress.line1}, {savedAddress.line2}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#0077B6" />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalSecondaryButton} onPress={() => setAddressModalVisible(false)}>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F4FD',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 40,
  },
  mapCard: {
    height: 220,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 18,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  etaChip: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  etaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0077B6',
  },
  cancelledCard: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    marginBottom: 18,
  },
  cancelledTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '900',
    color: '#C0392B',
  },
  cancelledCopy: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#7F1D1D',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  shopName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A1A2E',
  },
  itemText: {
    marginTop: 6,
    fontSize: 13,
    color: '#64748B',
  },
  paymentBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#E8F4FD',
  },
  paymentText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0077B6',
  },
  addressLabel: {
    marginTop: 18,
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  addressText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },
  otpCard: {
    marginTop: 18,
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#E8F4FD',
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0077B6',
    letterSpacing: 0.8,
  },
  otpValue: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '900',
    color: '#0077B6',
    letterSpacing: 4,
  },
  otpHelp: {
    marginTop: 8,
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
  },
  modifierRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0077B6',
  },
  dangerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
  },
  dangerButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C0392B',
  },
  timelineCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 14,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineLeft: {
    alignItems: 'center',
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: {
    backgroundColor: '#27AE60',
  },
  timelineDotActive: {
    backgroundColor: '#0077B6',
  },
  timelineDotPending: {
    backgroundColor: '#E2E8F0',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 30,
    backgroundColor: '#E2E8F0',
  },
  timelineCopy: {
    flex: 1,
    paddingBottom: 18,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A2E',
    textTransform: 'capitalize',
  },
  timelineSub: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  actionText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '800',
    color: '#0077B6',
  },
  ratingButton: {
    marginTop: 18,
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: '#0077B6',
  },
  ratingText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.4)',
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
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    marginTop: 10,
  },
  reasonRowSelected: {
    backgroundColor: '#E8F4FD',
    borderWidth: 1,
    borderColor: '#0077B6',
  },
  reasonText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '700',
  },
  reasonTextSelected: {
    color: '#0077B6',
  },
  modalPrimaryButton: {
    marginTop: 20,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: '#C0392B',
  },
  modalPrimaryButtonDisabled: {
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
  addressRow: {
    marginTop: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  savedAddressTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  savedAddressCopy: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
  },
});
