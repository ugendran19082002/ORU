import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppSession } from '@/hooks/use-app-session';
import { onboardingApi } from '@/api/onboardingApi';
import { BackButton } from '@/components/ui/BackButton';

export default function ShopBankDetailsScreen() {
  const router = useRouter();
  const { user, status } = useAppSession();
  const [loading, setLoading] = useState(false);
  const [fetchingShop, setFetchingShop] = useState(true);
  const [shopId, setShopId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    bank_name: '',
    account_holder: '',
    bank_account_no: '',
    bank_ifsc: '',
  });

  // 1. Resolve actual Shop ID
  React.useEffect(() => {
    (async () => {
      try {
        const res = await onboardingApi.getMerchantShop();
        if (res.data) {
          setShopId(res.data.id);
          // Pre-fill if exists
          if (res.data.bank_account_no) {
            setFormData({
              bank_name: res.data.metadata?.bank_name || '',
              account_holder: res.data.metadata?.account_holder || '',
              bank_account_no: res.data.bank_account_no,
              bank_ifsc: res.data.bank_ifsc || '',
            });
          }
        } else {
          router.replace('/onboarding/shop/create');
        }
      } catch (err: any) {
        console.error('[Bank Details] ID Resolution Error:', err);
        if (err.response?.status === 404) {
          router.replace('/onboarding/shop/create');
        }
      } finally {
        setFetchingShop(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!shopId) return;
    
    // Basic Validation
    if (!formData.bank_account_no || !formData.bank_ifsc || !formData.account_holder) {
      Alert.alert('Required', 'Please fill in all mandatory fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await onboardingApi.updateBankDetails(shopId, {
        bank_name: formData.bank_name,
        account_holder: formData.account_holder,
        bank_account_no: formData.bank_account_no,
        bank_ifsc: formData.bank_ifsc,
      } as any);

      if (res.status === 1) {
        router.replace('/onboarding/shop');
      }
    } catch (error: any) {
      console.error('[Bank Details] Save Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Could not save bank details.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'authenticated' && user?.role !== 'shop_owner' && user?.role !== 'admin') {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <BackButton fallback="/onboarding/shop" />
              <View style={{ marginTop: 24 }}>
                <Text style={styles.title}>Payout Settings</Text>
                <Text style={styles.subtitle}>Where should we send your earnings? Please provide your business bank account details.</Text>
              </View>
            </View>

            {fetchingShop ? (
              <ActivityIndicator size="large" color="#005d90" style={{ marginTop: 60 }} />
            ) : (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Account Holder Name</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="As per bank records"
                      value={formData.account_holder}
                      onChangeText={(v) => setFormData(p => ({ ...p, account_holder: v }))}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Bank Name</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="business-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. HDFC Bank"
                      value={formData.bank_name}
                      onChangeText={(v) => setFormData(p => ({ ...p, bank_name: v }))}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Account Number</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="card-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="0000 0000 0000"
                      value={formData.bank_account_no}
                      onChangeText={(v) => setFormData(p => ({ ...p, bank_account_no: v }))}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>IFSC Code</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="barcode-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="HDFC0000123"
                      value={formData.bank_ifsc}
                      onChangeText={(v) => setFormData(p => ({ ...p, bank_ifsc: v.toUpperCase() }))}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <View style={styles.infoBox}>
                  <Ionicons name="shield-checkmark" size={20} color="#005d90" />
                  <Text style={styles.infoText}>Your bank details are encrypted and stored securely. Payouts are traditionally processed within 24-48 hours of sale.</Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleSave} disabled={loading || fetchingShop} activeOpacity={0.8}>
              <LinearGradient
                colors={['#005d90', '#003a5c']}
                style={styles.cta}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? <ActivityIndicator color="white" /> : (
                  <>
                    <Text style={styles.ctaText}>Verify & Save</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  safe: { flex: 1 },
  scrollContent: { paddingHorizontal: 32, paddingBottom: 40 },
  
  header: { marginBottom: 30, paddingTop: 20 },
  title: { fontSize: 32, fontWeight: '900', color: '#003a5c', letterSpacing: -1 },
  subtitle: { fontSize: 15, color: '#64748b', marginTop: 12, lineHeight: 22 },

  form: { gap: 24 },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: '800', color: '#475569', marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    height: 60,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1e293b', fontWeight: '700' },

  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e0f0ff',
    padding: 16,
    borderRadius: 20,
    gap: 12,
    marginTop: 10,
    alignItems: 'flex-start'
  },
  infoText: { flex: 1, fontSize: 12, color: '#005d90', lineHeight: 18, fontWeight: '600' },

  footer: { padding: 32, backgroundColor: 'white' },
  cta: {
    height: 64,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#005d90',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  ctaText: { color: 'white', fontSize: 18, fontWeight: '800' }
});
