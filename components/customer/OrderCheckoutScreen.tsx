import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type CheckoutDraft, useAppState } from '@/hooks/use-app-state';
import type { DeliveryType, PaymentMethod } from '@/utils/mockData';

const slots = ['Today 6:00 PM - 8:00 PM', 'Tomorrow 7:00 AM - 9:00 AM', 'Tomorrow 11:00 AM - 1:00 PM'];

export default function OrderCheckoutScreen() {
  const router = useRouter();
  const { itemId, qty = '1', shopId = 'shop-1' } = useLocalSearchParams<{
    itemId?: string;
    qty?: string;
    shopId?: string;
  }>();
  const {
    getCartForShop,
    getDefaultAddress,
    getShopById,
    placeOrder,
    setCheckoutDraft,
    walletBalance,
  } = useAppState();

  const shop = getShopById(shopId) ?? getShopById('shop-1');
  const cartItems = getCartForShop(shop?.id ?? 'shop-1');
  const fallbackItem = shop?.inventory.find((item) => item.id === itemId) ?? shop?.inventory[0];
  const fallbackQuantity = Math.max(1, Number.parseInt(qty, 10) || 1);
  const lineItems =
    cartItems.length > 0
      ? cartItems.map(({ item, quantity }) => ({
          itemId: item.id,
          name: item.name,
          quantity,
          pricePerUnit: item.price,
        }))
      : fallbackItem
        ? [
            {
              itemId: fallbackItem.id,
              name: fallbackItem.name,
              quantity: fallbackQuantity,
              pricePerUnit: fallbackItem.price,
            },
          ]
        : [];
  const defaultAddress = getDefaultAddress();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('instant');
  const [scheduledFor, setScheduledFor] = useState(slots[0]);
  const [notes, setNotes] = useState(defaultAddress.note);

  const subtotal = lineItems.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0);
  const deliveryFee = 20;
  const total = subtotal + deliveryFee;
  const walletLocked = paymentMethod === 'wallet' && walletBalance < total;

  const handlePlaceOrder = async () => {
    if (!shop || lineItems.length === 0) {
      Alert.alert('Unavailable', 'The selected product could not be loaded.');
      return;
    }

    const draft: CheckoutDraft = {
      shopId: shop.id,
      items: lineItems.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
      })),
      paymentMethod,
      deliveryType,
      scheduledFor: deliveryType === 'scheduled' ? scheduledFor : undefined,
      notes,
      addressId: defaultAddress.id,
    };

    setCheckoutDraft(draft);
    const order = await placeOrder(draft);

    if (!order) {
      Alert.alert(
        'Unable to place order',
        walletLocked
          ? 'Wallet balance is not enough for this order.'
          : 'This shop or product is currently unavailable. Please review stock and try again.'
      );
      return;
    }

    router.replace(`/order/confirmation?orderId=${order.id}` as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#0077BE" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.iconSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.orderCard}>
          <View style={styles.orderCardHeader}>
            <Text style={styles.sectionLabel}>ORDER SUMMARY</Text>
            <TouchableOpacity onPress={() => router.push(`/cart?shopId=${shop?.id ?? 'shop-1'}` as any)}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.shopName}>{shop?.name}</Text>
          {lineItems.map((item) => (
            <View key={item.itemId} style={styles.orderLineRow}>
              <Text style={styles.orderLine}>
                {item.name} x {item.quantity}
              </Text>
              <Text style={styles.orderLineAmount}>
                {'\u20B9'}
                {item.pricePerUnit * item.quantity}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => router.push('/addresses' as any)}>
              <Text style={styles.editText}>Change</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.addressRow}>
            <Ionicons name="location" size={20} color="#0077BE" />
            <View style={styles.addressInfo}>
              <Text style={styles.addressTitle}>{defaultAddress.label}</Text>
              <Text style={styles.addressText}>
                {defaultAddress.line1}, {defaultAddress.line2}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Type</Text>
          <View style={styles.toggleRow}>
            {(['instant', 'scheduled'] as DeliveryType[]).map((option) => {
              const selected = deliveryType === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.toggleButton, selected && styles.toggleButtonActive]}
                  onPress={() => setDeliveryType(option)}>
                  <Text style={[styles.toggleText, selected && styles.toggleTextActive]}>
                    {option === 'instant' ? 'Instant ASAP' : 'Schedule'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {deliveryType === 'scheduled' ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotWrap}>
              {slots.map((slot) => {
                const selected = scheduledFor === slot;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.slotChip, selected && styles.slotChipActive]}
                    onPress={() => setScheduledFor(slot)}>
                    <Text style={[styles.slotText, selected && styles.slotTextActive]}>{slot}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {(['upi', 'cod', 'wallet'] as PaymentMethod[]).map((option) => {
            const selected = paymentMethod === option;
            const disabled = option === 'wallet' && walletBalance < total;

            return (
              <TouchableOpacity
                key={option}
                disabled={disabled}
                style={[
                  styles.paymentRow,
                  selected && styles.paymentRowActive,
                  disabled && styles.paymentRowDisabled,
                ]}
                onPress={() => setPaymentMethod(option)}>
                <View>
                  <Text style={styles.paymentTitle}>
                    {option === 'upi' ? 'UPI Apps' : option === 'cod' ? 'Cash on Delivery' : 'Wallet Balance'}
                  </Text>
                  <Text style={styles.paymentCopy}>
                    {option === 'wallet'
                      ? `Available balance: \u20B9${walletBalance}`
                      : option === 'cod'
                        ? 'Pay the delivery partner at handoff'
                        : 'GPay, PhonePe, Paytm, BHIM'}
                  </Text>
                </View>
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={disabled ? '#CBD5E1' : '#0077BE'}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery note</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            style={styles.noteInput}
            multiline
            placeholder="Gate code, landmark, floor, or call instructions"
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.billCard}>
          <Text style={styles.sectionTitle}>Bill details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billKey}>Item Total</Text>
            <Text style={styles.billValue}>
              {'\u20B9'}
              {subtotal}
            </Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billKey}>Delivery Fee</Text>
            <Text style={styles.billValue}>
              {'\u20B9'}
              {deliveryFee}
            </Text>
          </View>
          <View style={styles.billDivider} />
          <View style={styles.billRow}>
            <Text style={styles.billTotal}>Grand Total</Text>
            <Text style={styles.billTotal}>
              {'\u20B9'}
              {total}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomStickyBar}>
        <TouchableOpacity onPress={handlePlaceOrder} activeOpacity={0.9}>
          <LinearGradient colors={['#0077BE', '#34C4E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.swipeButton}>
            <Text style={styles.swipeText}>Swipe to Pay {'\u20B9'}{total} &gt;&gt;</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
  },
  iconSpacer: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 140,
  },
  orderCard: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: 'white',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  orderCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7C8C',
    letterSpacing: 0.8,
  },
  editText: {
    color: '#0077BE',
    fontSize: 13,
    fontWeight: '700',
  },
  shopName: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  orderLine: {
    marginTop: 4,
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  orderLineRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  orderLineAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0077BE',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  addressText: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7C8C',
  },
  toggleRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F5F9FF',
    padding: 4,
    borderRadius: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7C8C',
  },
  toggleTextActive: {
    color: '#0077BE',
  },
  slotWrap: {
    gap: 10,
    marginTop: 16,
  },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F5F9FF',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  slotChipActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0077BE',
  },
  slotText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  slotTextActive: {
    color: '#0077BE',
    fontWeight: '700',
  },
  paymentRow: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  paymentRowActive: {
    borderColor: '#0077BE',
    backgroundColor: '#F0F9FF',
  },
  paymentRowDisabled: {
    opacity: 0.5,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  paymentCopy: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7C8C',
  },
  noteInput: {
    marginTop: 14,
    minHeight: 80,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    color: '#1A1A2E',
    textAlignVertical: 'top',
  },
  billCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  billRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billKey: {
    fontSize: 14,
    color: '#6B7C8C',
    fontWeight: '500',
  },
  billValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#E5E9EC',
    marginTop: 16,
  },
  billTotal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0077BE',
  },
  bottomStickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  swipeButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
