import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

// Manual order entry for shop staff
export default function ManualOrderScreen() {
  const router = useRouter();
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [canType, setCanType] = useState('20L');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'wallet'>('cash');
  const [notes, setNotes] = useState('');

  const canTypes = ['5L', '10L', '20L', '50L'];
  const price = canType === '5L' ? 20 : canType === '10L' ? 40 : canType === '50L' ? 200 : 50;
  const total = price * parseInt(quantity || '1');

  const handlePlace = () => {
    if (!customerName.trim() || !address.trim() || !customerPhone.trim()) {
      Alert.alert('Required', 'Please fill in customer name, phone, and address.');
      return;
    }
    Alert.alert('Order Placed!', `Manual order for ${customerName} — ₹${total} (${paymentMode.toUpperCase()})`, [
      { text: 'OK', onPress: () => router.replace('/shop' as any) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manual Order Entry</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color="#005d90" />
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
          <TextInput style={styles.input} placeholder="+91 XXXXX XXXXX" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Delivery Address *</Text>
          <TextInput style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]} placeholder="Full delivery address" value={address} onChangeText={setAddress} multiline />
        </View>

        {/* ORDER DETAILS */}
        <Text style={styles.sectionTitle}>Order Details</Text>
        <Text style={styles.inputLabel}>Can Type</Text>
        <View style={styles.typeRow}>
          {canTypes.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typePill, canType === t && styles.typePillActive]}
              onPress={() => setCanType(t)}
            >
              <Text style={[styles.typePillText, canType === t && styles.typePillTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Quantity</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => Math.max(1, parseInt(q || '1') - 1).toString())}>
              <Ionicons name="remove" size={20} color="#005d90" />
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => (parseInt(q || '1') + 1).toString())}>
              <Ionicons name="add" size={20} color="#005d90" />
            </TouchableOpacity>
          </View>
        </View>

        {/* PAYMENT */}
        <Text style={styles.sectionTitle}>Payment Mode</Text>
        <View style={styles.paymentRow}>
          {(['cash', 'upi', 'wallet'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.paymentPill, paymentMode === p && styles.paymentPillActive]}
              onPress={() => setPaymentMode(p)}
            >
              <Ionicons
                name={p === 'cash' ? 'cash-outline' : p === 'upi' ? 'phone-portrait-outline' : 'wallet-outline'}
                size={16}
                color={paymentMode === p ? '#005d90' : '#707881'}
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
            <Text style={styles.summaryLabel}>{quantity}× {canType} Can</Text>
            <Text style={styles.summaryValue}>₹{price} × {quantity}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment</Text>
            <Text style={[styles.summaryValue, { color: '#005d90' }]}>{paymentMode.toUpperCase()}</Text>
          </View>
        </View>

        {/* PLACE ORDER */}
        <TouchableOpacity style={styles.placeBtn} onPress={handlePlace}>
          <LinearGradient colors={['#005d90', '#0077b6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.placeBtnGrad}>
            <Ionicons name="receipt-outline" size={20} color="white" />
            <Text style={styles.placeBtnText}>Place Order — ₹{total}</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  infoCard: { flexDirection: 'row', gap: 10, backgroundColor: '#e0f0ff', borderRadius: 14, padding: 14, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 12, color: '#005d90', lineHeight: 17, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#181c20', letterSpacing: -0.3 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#707881' },
  input: { backgroundColor: 'white', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontWeight: '600', color: '#181c20', borderWidth: 1, borderColor: '#e0e2e8' },
  typeRow: { flexDirection: 'row', gap: 8 },
  typePill: { flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, borderColor: '#e0e2e8', alignItems: 'center', backgroundColor: 'white' },
  typePillActive: { borderColor: '#005d90', backgroundColor: '#e0f0ff' },
  typePillText: { fontSize: 14, fontWeight: '700', color: '#707881' },
  typePillTextActive: { color: '#005d90' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 20, backgroundColor: 'white', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#e0e2e8', alignSelf: 'flex-start' },
  qtyBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  qtyValue: { fontSize: 22, fontWeight: '900', color: '#181c20', minWidth: 30, textAlign: 'center' },
  paymentRow: { flexDirection: 'row', gap: 10 },
  paymentPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, borderColor: '#e0e2e8', backgroundColor: 'white' },
  paymentPillActive: { borderColor: '#005d90', backgroundColor: '#e0f0ff' },
  paymentText: { fontSize: 12, fontWeight: '700', color: '#707881' },
  paymentTextActive: { color: '#005d90' },
  summaryCard: { backgroundColor: 'white', borderRadius: 18, padding: 18, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  summaryTitle: { fontSize: 14, fontWeight: '800', color: '#181c20', marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: '#707881', fontWeight: '600' },
  summaryValue: { fontSize: 13, fontWeight: '700', color: '#181c20' },
  divider: { height: 1, backgroundColor: '#f1f4f9' },
  totalLabel: { fontSize: 16, fontWeight: '800', color: '#181c20' },
  totalValue: { fontSize: 20, fontWeight: '900', color: '#005d90' },
  placeBtn: { borderRadius: 18, overflow: 'hidden' },
  placeBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  placeBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
});
