import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCartStore } from '@/stores/cartStore';
import { useOrderStore } from '@/stores/orderStore';
import { useShopStore } from '@/stores/shopStore';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';

type PaymentType = 'upi' | 'cod' | 'wallet';

const INITIAL_ADDRESSES = [
  { id: "1", type: "Home", title: "Home", fullAddress: "82nd Floor, Azure Heights, Cyber City, Sector 56...", isDefault: true },
  { id: "2", type: "Office", title: "Office", fullAddress: "Floor 12, Tech Park Central, Sector 44...", isDefault: false },
  { id: "3", type: "Recent", title: "Grand Hotel Lobby", fullAddress: "Main St, Near City Square fountain...", isDefault: false },
];

export default function OrderCheckoutScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const router = useRouter();
  const { shopId = '1' } = useLocalSearchParams<{ shopId: string; qty: string }>();
  const { paymentMethod, setPaymentMethod, getSubtotal, getDeliveryFee, getTotal, items, note, clearCart } = useCartStore();
  const { shops } = useShopStore();
  const { placeOrder, isSubmitting } = useOrderStore();
  
  const [payment, setPayment] = useState<PaymentType>(paymentMethod as PaymentType || 'upi');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(INITIAL_ADDRESSES[0]);

  useAndroidBackHandler(() => {
    if (showAddressModal) {
      setShowAddressModal(false);
    } else {
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)');
    }
  });

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
        <BackButton fallback="/(tabs)" />
        <Text style={styles.headerTitle}>Order Summary</Text>
        <View style={{ width: 40 }} />
      </View>


      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} />} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 180 }}>
        
        {/* PAYMENT METHOD */}
        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Payment Method</Text>
        </View>
        <View style={styles.paymentGrid}>
          <TouchableOpacity
            style={[styles.paymentOption, payment === 'upi' && styles.paymentOptionActive]}
            onPress={() => { setPayment('upi'); setPaymentMethod('upi'); }}
          >
            <View style={[styles.paymentIcon, payment === 'upi' && styles.paymentIconActive]}>
              <Ionicons name="phone-portrait-outline" size={20} color={payment === 'upi' ? '#005d90' : '#707881'} />
            </View>
            <Text style={[styles.paymentOptionLabel, payment === 'upi' && styles.paymentOptionLabelActive]}>UPI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, payment === 'wallet' && styles.paymentOptionActive]}
            onPress={() => { setPayment('wallet'); setPaymentMethod('wallet'); }}
          >
            <View style={[styles.paymentIcon, payment === 'wallet' && styles.paymentIconActive]}>
              <Ionicons name="wallet-outline" size={20} color={payment === 'wallet' ? '#005d90' : '#707881'} />
            </View>
            <Text style={[styles.paymentOptionLabel, payment === 'wallet' && styles.paymentOptionLabelActive]}>Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, payment === 'cod' && styles.paymentOptionActive]}
            onPress={() => { setPayment('cod'); setPaymentMethod('cod'); }}
          >
            <View style={[styles.paymentIcon, payment === 'cod' && styles.paymentIconActive]}>
              <Ionicons name="cash-outline" size={20} color={payment === 'cod' ? '#005d90' : '#707881'} />
            </View>
            <Text style={[styles.paymentOptionLabel, payment === 'cod' && styles.paymentOptionLabelActive]}>Cash</Text>
          </TouchableOpacity>
        </View>

        {/* DELIVERY ADDRESS */}
        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Delivery Address</Text>
        </View>
        <TouchableOpacity style={styles.addressCard} activeOpacity={0.8} onPress={() => setShowAddressModal(true)}>
          <View style={styles.addressIconWrap}>
            <Ionicons name={selectedAddress.type === 'Home' ? 'home' : selectedAddress.type === 'Office' ? 'briefcase' : 'location'} size={22} color="#006878" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addressLabel}>{selectedAddress.title.toUpperCase()}</Text>
            <Text style={styles.addressText} numberOfLines={2}>{selectedAddress.fullAddress}</Text>
          </View>
          <View style={styles.editWrap}>
            <Text style={styles.editText}>Change</Text>
          </View>
        </TouchableOpacity>

        {/* ORDER TOTALS */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Products (×{quantity})</Text>
            <Text style={styles.summaryVal}>₹{subtotal}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Delivery Fee</Text>
            <Text style={styles.summaryVal}>₹{deliveryFee}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryDivider]}>
            <Text style={styles.summaryTotal}>Total Pay</Text>
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
          <Text style={styles.totalFloatingSub}>via {payment.toUpperCase()}</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={isSubmitting}
          onPress={async () => {
            await placeOrder({
              shopId: shop.id,
              customerName: 'Rahul Sharma',
              customerPhone: '+91 98765 43210',
              items: Object.entries(items).filter(([, qty]) => qty > 0).map(([productId, qty]) => ({ productId, quantity: qty })),
              address: selectedAddress.fullAddress,
              paymentMethod: payment,
              eta: shop.eta,
              total,
              notes: note,
            });
            clearCart();
            router.push('/order/confirmed' as any);
          }}
        >
          <LinearGradient colors={['#005d90', '#0077b6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.ctaBtn, { opacity: isSubmitting ? 0.7 : 1 }]}>
            <Text style={styles.ctaBtnText}>{isSubmitting ? 'Processing...' : 'Pay & Confirm'}</Text>
            {!isSubmitting && <Ionicons name="checkmark-circle" size={20} color="white" />}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ADDRESS SELECTOR MODAL */}
      <Modal visible={showAddressModal} transparent animationType="slide" onRequestClose={() => setShowAddressModal(false)}>
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Delivery Address</Text>
                  <TouchableOpacity onPress={() => setShowAddressModal(false)} style={styles.modalClose}>
                     <Ionicons name="close" size={24} color="#64748b" />
                  </TouchableOpacity>
               </View>
               <ScrollView style={{ maxHeight: 300, width: '100%' }} showsVerticalScrollIndicator={false}>
                  {INITIAL_ADDRESSES.map((addr) => (
                     <TouchableOpacity 
                        key={addr.id} 
                        style={[styles.modalAddrCard, selectedAddress.id === addr.id && styles.modalAddrCardActive]}
                        onPress={() => {
                           setSelectedAddress(addr);
                           setShowAddressModal(false);
                        }}
                     >
                        <Ionicons name={addr.type === 'Home' ? 'home' : addr.type === 'Office' ? 'briefcase' : 'time'} size={20} color={selectedAddress.id === addr.id ? '#005d90' : '#64748b'} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                           <Text style={[styles.modalAddrTitle, selectedAddress.id === addr.id && { color: '#005d90' }]}>{addr.title}</Text>
                           <Text style={styles.modalAddrText} numberOfLines={2}>{addr.fullAddress}</Text>
                        </View>
                        {selectedAddress.id === addr.id && <Ionicons name="checkmark-circle" size={22} color="#005d90" />}
                     </TouchableOpacity>
                  ))}
               </ScrollView>
               <TouchableOpacity style={styles.addNewAddrBtn} onPress={() => {
                  setShowAddressModal(false);
                  router.push('/addresses' as any);
               }}>
                  <Ionicons name="add" size={20} color="#005d90" />
                  <Text style={styles.addNewAddrText}>Add New Address</Text>
               </TouchableOpacity>
            </View>
         </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.95)' },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#ebeef4', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#181c20' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#181c20', letterSpacing: -0.2 },

  paymentGrid: { flexDirection: 'row', gap: 12, marginBottom: 26 },
  paymentOption: { flex: 1, backgroundColor: 'white', borderRadius: 20, paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center', gap: 8, borderWidth: 2, borderColor: '#f1f4f9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  paymentOptionActive: { borderColor: '#005d90', backgroundColor: '#f4fafe' },
  paymentIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center' },
  paymentIconActive: { backgroundColor: '#e0f0ff' },
  paymentOptionLabel: { fontSize: 12, fontWeight: '800', color: '#707881' },
  paymentOptionLabelActive: { color: '#005d90' },

  addressCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#e0f7fa', borderRadius: 20, padding: 16, marginBottom: 28 },
  addressIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  addressLabel: { fontSize: 10, fontWeight: '800', color: '#006878', letterSpacing: 1, marginBottom: 3 },
  addressText: { fontSize: 13, color: '#181c20', fontWeight: '500', lineHeight: 18 },
  editWrap: { backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  editText: { fontSize: 12, color: '#005d90', fontWeight: '800' },

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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, alignItems: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  modalClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  modalAddrCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 2, borderColor: '#f1f5f9', marginBottom: 12, width: '100%' },
  modalAddrCardActive: { borderColor: '#e0f0ff', backgroundColor: '#f8fcff' },
  modalAddrTitle: { fontSize: 14, fontWeight: '800', color: '#181c20', marginBottom: 2 },
  modalAddrText: { fontSize: 12, color: '#64748b' },
  addNewAddrBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e0f0ff', width: '100%', padding: 16, borderRadius: 16, marginTop: 8 },
  addNewAddrText: { fontSize: 14, fontWeight: '800', color: '#005d90', marginLeft: 8 },
});
