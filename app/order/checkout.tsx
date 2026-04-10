import React, { useState } from 'react';
import { View, Text, ScrollView,
  RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCartStore } from '@/stores/cartStore';
import { useOrderStore } from '@/stores/orderStore';
import { useShopStore } from '@/stores/shopStore';

type PaymentType = 'upi' | 'cod';

export default function OrderCheckoutScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const router = useRouter();
  const { shopId = '1' } = useLocalSearchParams<{ shopId: string; qty: string }>();
  const { paymentMethod, setPaymentMethod, getSubtotal, getDeliveryFee, getTotal, items, note, clearCart } = useCartStore();
  const { shops } = useShopStore();
  const { placeOrder } = useOrderStore();
  const [payment, setPayment] = useState<PaymentType>(paymentMethod === 'wallet' ? 'upi' : paymentMethod);
  const shop = shops.find((item) => item.id === shopId) ?? shops[0];
  const quantity = Object.values(items).reduce((sum, qty) => sum + qty, 0);
  const subtotal = getSubtotal();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#005d90" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Summary</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 180 }}>
        
        {/* PAYMENT METHOD */}
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.paymentGrid}>
          <TouchableOpacity
            style={[styles.paymentOption, payment === 'upi' && styles.paymentOptionActive]}
            onPress={() => {
              setPayment('upi');
              setPaymentMethod('upi');
            }}
          >
            <View style={[styles.paymentIcon, payment === 'upi' && styles.paymentIconActive]}>
              <Ionicons name="phone-portrait-outline" size={22} color={payment === 'upi' ? '#005d90' : '#707881'} />
            </View>
            <Text style={[styles.paymentOptionLabel, payment === 'upi' && styles.paymentOptionLabelActive]}>
              UPI Payment
            </Text>
            <Text style={styles.paymentOptionSub}>Admin Auto-Splits</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, payment === 'cod' && styles.paymentOptionActive]}
            onPress={() => {
              setPayment('cod');
              setPaymentMethod('cod');
            }}
          >
            <View style={[styles.paymentIcon, payment === 'cod' && styles.paymentIconActive]}>
              <Ionicons name="cash-outline" size={22} color={payment === 'cod' ? '#005d90' : '#707881'} />
            </View>
            <Text style={[styles.paymentOptionLabel, payment === 'cod' && styles.paymentOptionLabelActive]}>
              Cash on Delivery
            </Text>
            <Text style={styles.paymentOptionSub}>Pay at Doorstep</Text>
          </TouchableOpacity>
        </View>

        {/* DELIVERY ADDRESS */}
        <View style={styles.addressCard}>
          <View style={styles.addressIconWrap}>
            <Ionicons name="location" size={22} color="#006878" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addressLabel}>DELIVER TO</Text>
            <Text style={styles.addressText}>Apartment 402, Serene Residency, 5th Block, Koramangala, Bangalore</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* ORDER TOTALS */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Mineral Water (×{quantity})</Text>
            <Text style={styles.summaryVal}>₹{subtotal}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Delivery Fee</Text>
            <Text style={styles.summaryVal}>₹{deliveryFee}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryDivider]}>
            <Text style={styles.summaryTotal}>Total to Pay</Text>
            <Text style={styles.summaryTotalVal}>₹{total}.00</Text>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.totalFloating}>
          <View>
            <Text style={styles.totalFloatingLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.totalFloatingValue}>₹{total}.00</Text>
          </View>
          <Text style={styles.totalFloatingSub}>via {payment === 'upi' ? 'UPI' : 'Cash'}</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            placeOrder({
              shopId: shop.id,
              customerName: 'Rahul Sharma',
              customerPhone: '+91 98765 43210',
              items: Object.entries(items).filter(([, qty]) => qty > 0).map(([productId, qty]) => ({ productId, quantity: qty })),
              address: 'Apartment 402, Serene Residency, Koramangala, Bangalore',
              paymentMethod: payment,
              eta: shop.eta,
              total,
              notes: note,
            });
            clearCart();
            router.replace('/order/confirmed');
          }}
        >
          <LinearGradient colors={['#005d90', '#0077b6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaBtn}>
            <Text style={styles.ctaBtnText}>Confirm Order</Text>
            <Ionicons name="checkmark-circle" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.95)' },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#ebeef4', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#181c20' },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#181c20', letterSpacing: -0.2, marginBottom: 12, marginTop: 10 },

  paymentGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  paymentOption: { flex: 1, backgroundColor: 'white', borderRadius: 22, padding: 18, alignItems: 'flex-start', gap: 8, borderWidth: 2, borderColor: '#f1f4f9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  paymentOptionActive: { borderColor: '#005d90', backgroundColor: 'white' },
  paymentIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center' },
  paymentIconActive: { backgroundColor: '#e0f0ff' },
  paymentOptionLabel: { fontSize: 13, fontWeight: '700', color: '#707881' },
  paymentOptionLabelActive: { color: '#181c20' },
  paymentOptionSub: { fontSize: 10, color: '#707881', fontWeight: '500' },

  addressCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#e0f7fa', borderRadius: 20, padding: 16, marginBottom: 24 },
  addressIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  addressLabel: { fontSize: 10, fontWeight: '700', color: '#006878', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 },
  addressText: { fontSize: 13, color: '#181c20', fontWeight: '500', lineHeight: 18 },
  editText: { fontSize: 13, color: '#005d90', fontWeight: '800' },

  summaryCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryKey: { fontSize: 14, color: '#707881', fontWeight: '500' },
  summaryVal: { fontSize: 14, color: '#181c20', fontWeight: '700' },
  summaryDivider: { borderTopWidth: 1, borderTopColor: '#f1f4f9', paddingTop: 12, marginTop: 6 },
  summaryTotal: { fontSize: 16, fontWeight: '900', color: '#181c20' },
  summaryTotalVal: { fontSize: 20, fontWeight: '900', color: '#005d90' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.07, shadowRadius: 20, elevation: 12, borderTopLeftRadius: 28, borderTopRightRadius: 28, gap: 12 },
  totalFloating: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalFloatingLabel: { fontSize: 9, fontWeight: '700', color: '#707881', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  totalFloatingValue: { fontSize: 24, fontWeight: '900', color: '#181c20', letterSpacing: -0.5 },
  totalFloatingSub: { fontSize: 11, color: '#707881' },
  ctaBtn: { borderRadius: 20, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#005d90', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6 },
  ctaBtnText: { color: 'white', fontSize: 17, fontWeight: '900', letterSpacing: -0.2 },
});
