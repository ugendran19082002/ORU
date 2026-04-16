import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { BackButton } from '@/components/ui/BackButton';
import { shopApi } from '@/api/shopApi';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

export default function ShopOperationalSettingsScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [minOrderAmount, setMinOrderAmount] = useState('0');
  const [deliveryCharge, setDeliveryCharge] = useState('0');
  const [taxPercentage, setTaxPercentage] = useState('0');

  useAndroidBackHandler(() => {
    safeBack('/shop/settings');
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const settings = await shopApi.getShopSettings();
      if (settings) {
        setMinOrderAmount(String(settings.min_order_amount || '0'));
        setDeliveryCharge(String(settings.base_delivery_charge || '0'));
        setTaxPercentage(String(settings.tax_percentage || '0'));
      }
    } catch (error) {
      console.error('[OperationalSettings] Fetch failed:', error);
      Toast.show({ type: 'error', text1: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      await shopApi.updateShopSettings({
        min_order_amount: parseFloat(minOrderAmount) || 0,
        base_delivery_charge: parseFloat(deliveryCharge) || 0,
        tax_percentage: parseFloat(taxPercentage) || 0
      });
      
      Toast.show({ type: 'success', text1: 'Settings Saved', text2: 'Your operational rules have been updated.' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('[OperationalSettings] Save failed:', error);
      Toast.show({ type: 'error', text1: 'Save Failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <BackButton fallback="/shop/settings" />
          <View>
            <View style={styles.brandRow}>
              <Logo size="md" />
              <Text style={styles.brandName}>ThanniGo</Text>
            </View>
            <Text style={styles.roleLabel}>SHOP PANEL</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.titleRow}>
            <Text style={styles.pageTitle}>Operational Rules</Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color="#005d90" />
            <Text style={styles.infoText}>
              These rules define your shop's pricing and compliance standards. Updates apply immediately to all new orders.
            </Text>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#005d90" />
              <Text style={styles.loadingText}>Loading configurations...</Text>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="cart-outline" size={16} color="#64748b" />
                  <Text style={styles.inputLabel}>Minimum Order Amount</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={minOrderAmount}
                  onChangeText={setMinOrderAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
                <Text style={styles.hintText}>Orders below this amount will not be accepted. (₹)</Text>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="bicycle-outline" size={16} color="#64748b" />
                  <Text style={styles.inputLabel}>Base Delivery Charge</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={deliveryCharge}
                  onChangeText={setDeliveryCharge}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
                <Text style={styles.hintText}>Starting delivery fee added to every order. (₹)</Text>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="receipt-outline" size={16} color="#64748b" />
                  <Text style={styles.inputLabel}>Tax / GST Percentage</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={taxPercentage}
                  onChangeText={setTaxPercentage}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
                <Text style={styles.hintText}>Calculated as a percentage of the subtotal. (%)</Text>
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={20} color="white" />
                    <Text style={styles.saveBtnText}>Update Rules</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.92)',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 22, fontWeight: '900', color: '#003a5c', letterSpacing: -0.5 },
  roleLabel: { fontSize: 9, fontWeight: '700', color: '#006878', letterSpacing: 1.5, marginTop: 3 },
  content: { paddingHorizontal: 24, paddingVertical: 20, paddingBottom: 100 },
  titleRow: { marginBottom: 18 },
  pageTitle: { fontSize: 32, fontWeight: '900', color: '#181c20', letterSpacing: -0.5 },
  infoCard: {
    flexDirection: 'row', backgroundColor: '#e0f0ff', padding: 16, borderRadius: 16,
    marginBottom: 24, alignItems: 'center', gap: 12,
  },
  infoText: { flex: 1, fontSize: 13, color: '#005d90', lineHeight: 18, fontWeight: '600' },
  centered: { padding: 40, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#94a3b8', fontWeight: '600' },
  form: { gap: 24 },
  inputGroup: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 4 },
  inputLabel: { fontSize: 13, fontWeight: '800', color: '#475569' },
  input: {
    backgroundColor: 'white', borderRadius: 14, height: 56, paddingHorizontal: 16,
    fontSize: 18, fontWeight: '700', color: '#1e293b',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  hintText: { fontSize: 12, color: '#94a3b8', fontWeight: '500', marginLeft: 4 },
  saveBtn: {
    backgroundColor: '#005d90', height: 60, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginTop: 20, shadowColor: '#005d90', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
  },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },
});
