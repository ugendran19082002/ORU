import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/providers/ThemeContext';
import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { BackButton } from '@/components/ui/BackButton';

import { useOrderStore } from '@/stores/orderStore';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { inventoryApi } from '@/api/inventoryApi';
import { shopApi } from '@/api/shopApi';

import { Shadow, roleAccent, roleSurface, roleGradients } from '@/constants/theme';

const SHOP_ACCENT = roleAccent.shop_owner;
const SHOP_SURF = roleSurface.shop_owner;
const SHOP_GRAD: [string, string] = [roleGradients.shop_owner.start, roleGradients.shop_owner.end];

// Manual order entry for shop staff
export default function ManualOrderScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const { placeOrder } = useOrderStore();

  useAndroidBackHandler(() => {
    safeBack('/shop');
  });

  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi'>('cash');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    try {
      setLoading(true);
      const [shopData, productsData] = await Promise.all([
        shopApi.getMyShop(),
        inventoryApi.getMyProducts()
      ]);
      setShop(shopData);
      setProducts(productsData);
      if (productsData.length > 0) {
        setSelectedProduct(productsData[0]);
      }
    } catch (error) {
      console.error('[ManualOrder] Init failed:', error);
      Toast.show({ type: 'error', text1: 'Initialization Failed' });
    } finally {
      setLoading(false);
    }
  };

  const price = selectedProduct?.price || 0;
  const total = price * parseInt(quantity || '1');

  const handlePlace = () => {
    if (!customerName.trim() || !address.trim() || !customerPhone.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Required',
        text2: 'Please fill in customer name, phone, and address.'
      });
      return;
    }

    if (!selectedProduct) {
      Toast.show({ type: 'error', text1: 'Product Required', text2: 'Please select a product.' });
      return;
    }

    const orderPayload = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      address: address.trim(),
      items: [{ productId: selectedProduct.id, quantity: parseInt(quantity || '1') }],
      total: total,
      shopId: shop?.id,
      paymentMethod: paymentMode as 'cash' | 'upi',
      eta: '30-45 mins',
      notes: notes,
    };

    placeOrder(orderPayload as any);

    Toast.show({
      type: 'success',
      text1: 'Order Placed!',
      text2: `Manual order for ${customerName} — ₹${total}`
    });
    router.replace('/shop');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={SHOP_ACCENT} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <BackButton fallback="/shop" />
          <View>
            <View style={styles.brandRow}>
              <Logo size="md" />
              <Text style={styles.brandName}>ThanniGo</Text>
            </View>
            <Text style={styles.roleLabel}>SHOP PANEL</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.notifBtnSub} 
          onPress={() => router.push('/notifications' as any)}
        >
          <Ionicons name="notifications-outline" size={22} color={SHOP_ACCENT} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Manual Order Entry</Text>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={SHOP_ACCENT} />
          <Text style={styles.infoText}>
            Use this to place orders for walk-in or phone customers directly from the shop panel.
          </Text>
        </View>

        {/* CUSTOMER DETAILS */}
        <Text style={styles.sectionTitle}>Customer Details</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Customer Name *</Text>
          <TextInput style={styles.input} placeholder="Full name" value={customerName} onChangeText={setCustomerName} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone Number *</Text>
          <TextInput style={styles.input} placeholder="Phone number" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Delivery Address *</Text>
          <TextInput style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]} placeholder="Full delivery address" value={address} onChangeText={setAddress} multiline />
        </View>

        {/* ORDER DETAILS */}
        <Text style={styles.sectionTitle}>Order Details</Text>
        <Text style={styles.inputLabel}>Select Product</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
          {products.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.productPill, selectedProduct?.id === p.id && styles.productPillActive]}
              onPress={() => setSelectedProduct(p)}
            >
              <Text style={[styles.typePillText, selectedProduct?.id === p.id && styles.typePillTextActive]}>{p.name}</Text>
              <Text style={[styles.priceTag, selectedProduct?.id === p.id && { color: SHOP_ACCENT }]}>₹{p.price}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Quantity</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q: string) => Math.max(1, parseInt(q || '1') - 1).toString())}>
              <Ionicons name="remove" size={20} color={SHOP_ACCENT} />
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q: string) => (parseInt(q || '1') + 1).toString())}>
              <Ionicons name="add" size={20} color={SHOP_ACCENT} />
            </TouchableOpacity>
          </View>
        </View>

        {/* PAYMENT */}
        <Text style={styles.sectionTitle}>Payment Mode</Text>
        <View style={styles.paymentRow}>
          {(['cash', 'upi'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.paymentPill, paymentMode === p && styles.paymentPillActive]}
              onPress={() => setPaymentMode(p)}
            >
              <Ionicons
                name={p === 'cash' ? 'cash-outline' : 'phone-portrait-outline'}
                size={16}
                color={paymentMode === p ? SHOP_ACCENT : colors.muted}
              />
              <Text style={[styles.paymentText, paymentMode === p && styles.paymentTextActive]}>
                {p.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* NOTES */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Delivery Notes</Text>
          <TextInput style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]} placeholder="e.g. Leave at gate, floor 3" value={notes} onChangeText={setNotes} multiline />
        </View>

        {/* ORDER SUMMARY */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{quantity}× {selectedProduct?.name}</Text>
            <Text style={styles.summaryValue}>₹{price} × {quantity}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment</Text>
            <Text style={[styles.summaryValue, { color: SHOP_ACCENT }]}>{paymentMode.toUpperCase()}</Text>
          </View>
        </View>

        {/* PLACE ORDER */}
        <TouchableOpacity style={styles.placeBtn} onPress={handlePlace}>
          <LinearGradient colors={[SHOP_ACCENT, SHOP_GRAD[1]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.placeBtnGrad}>
            <Ionicons name="receipt-outline" size={20} color="white" />
            <Text style={styles.placeBtnText}>Place Order — ₹{total}</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  notifBtnSub: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  roleLabel: { fontSize: 9, fontWeight: '700', color: SHOP_ACCENT, letterSpacing: 1.5, marginTop: 3 },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: -0.5, marginBottom: 4 },
  infoCard: { flexDirection: 'row', gap: 10, backgroundColor: '#e0f0ff', borderRadius: 14, padding: 14, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 12, color: SHOP_ACCENT, lineHeight: 17, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: colors.muted },
  input: { backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontWeight: '600', color: colors.text, borderWidth: 1, borderColor: colors.border },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  productPill: { minWidth: 100, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.surface, marginRight: 10 },
  productPillActive: { borderColor: SHOP_ACCENT, backgroundColor: '#e0f0ff' },
  priceTag: { fontSize: 11, fontWeight: '800', color: '#94a3b8', marginTop: 2 },
  typePillText: { fontSize: 14, fontWeight: '700', color: colors.muted },
  typePillTextActive: { color: SHOP_ACCENT },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 20, backgroundColor: colors.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-start' },
  qtyBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  qtyValue: { fontSize: 22, fontWeight: '900', color: colors.text, minWidth: 30, textAlign: 'center' },
  paymentRow: { flexDirection: 'row', gap: 10 },
  paymentPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  paymentPillActive: { borderColor: SHOP_ACCENT, backgroundColor: '#e0f0ff' },
  paymentText: { fontSize: 12, fontWeight: '700', color: colors.muted },
  paymentTextActive: { color: SHOP_ACCENT },
  summaryCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  summaryTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  summaryValue: { fontSize: 13, fontWeight: '700', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border },
  totalLabel: { fontSize: 16, fontWeight: '800', color: colors.text },
  totalValue: { fontSize: 20, fontWeight: '900', color: SHOP_ACCENT },
  placeBtn: { borderRadius: 18, overflow: 'hidden' },
  placeBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  placeBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
});


