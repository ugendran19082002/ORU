import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, TextInput
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppSession } from '@/hooks/use-app-session';
import { onboardingApi } from '@/api/onboardingApi';
import { BackButton } from '@/components/ui/BackButton';

const SHOP_TYPES = [
  { id: 'individual', label: 'Individual', icon: 'person-outline' },
  { id: 'agency', label: 'Agency / Dealer', icon: 'business-outline' },
  { id: 'distributor', label: 'Distributor', icon: 'cube-outline' },
  { id: 'water_tanker', label: 'Water Tanker', icon: 'car-outline' },
  { id: 'ro_plant', label: 'RO Plant', icon: 'water-outline' },
  { id: 'both', label: 'Others', icon: 'ellipsis-horizontal-outline' },
];

export default function ShopBusinessInfoScreen() {
  const router = useRouter();
  const { user, status } = useAppSession();
  const [loading, setLoading] = useState(false);
  const [fetchingShop, setFetchingShop] = useState(true);
  const [shopId, setShopId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    shop_type: 'individual',
    brand_name: '',
    business_experience: '',
  });

  // 1. Resolve actual Shop ID
  React.useEffect(() => {
    (async () => {
      try {
        const res = await onboardingApi.getMerchantShop();
        if (res.data) {
          setShopId(res.data.id);
          setFormData(p => ({
            ...p,
            shop_type: res.data.shop_type || 'individual',
            brand_name: res.data.brand_name || '',
            business_experience: res.data.business_experience || '',
          }));
        } else {
          router.replace('/onboarding/shop/basic-details');
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          router.replace('/onboarding/shop/basic-details');
        }
      } finally {
        setFetchingShop(false);
      }
    })();
  }, []);

  const handleContinue = async () => {
    if (!shopId) return;

    if (!formData.shop_type || !formData.business_experience) {
      Toast.show({ type: 'error', text1: 'Required', text2: 'Please provide shop type and experience.' });
      return;
    }

    try {
      setLoading(true);
      const res = await onboardingApi.completeShopStep('business_info', shopId, formData);
      if (res.status === 1) {
        router.replace('/onboarding/shop');
      }
    } catch (error: any) {
      if (error.response?.status === 404) return;
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Could not save details.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <BackButton fallback="/onboarding/shop" style={{ marginBottom: 16 }} />
              <Text style={styles.title}>Business Info</Text>
              <Text style={styles.subtitle}>Help us categorize your business and verify your experience.</Text>
            </View>

            {fetchingShop ? (
              <ActivityIndicator size="large" color="#006878" style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Shop Type</Text>
                  <View style={styles.typeGrid}>
                    {SHOP_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type.id}
                        style={[
                          styles.typeCard,
                          formData.shop_type === type.id && styles.typeCardActive
                        ]}
                        onPress={() => setFormData(p => ({ ...p, shop_type: type.id }))}
                      >
                        <Ionicons 
                          name={type.icon as any} 
                          size={24} 
                          color={formData.shop_type === type.id ? '#006878' : '#64748b'} 
                        />
                        <Text style={[
                          styles.typeLabel,
                          formData.shop_type === type.id && styles.typeLabelActive
                        ]}>
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Brand Name (Optional)</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="ribbon-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Bisleri, Kinley, etc."
                      value={formData.brand_name}
                      onChangeText={(v) => setFormData(p => ({ ...p, brand_name: v }))}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Total Experience</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="time-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 5 years"
                      value={formData.business_experience}
                      onChangeText={(v) => setFormData(p => ({ ...p, business_experience: v }))}
                    />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleContinue} disabled={loading} activeOpacity={0.8}>
              <LinearGradient colors={['#006878', '#134e4a']} style={styles.cta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading ? <ActivityIndicator color="white" /> : (
                  <>
                    <Text style={styles.ctaText}>Save and Continue</Text>
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
  scrollContent: { paddingHorizontal: 32, paddingTop: 40 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '900', color: '#134e4a', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#64748b', marginTop: 12, lineHeight: 22 },
  form: { gap: 24, marginBottom: 40 },
  inputGroup: { gap: 12 },
  label: { fontSize: 13, fontWeight: '800', color: '#475569', marginLeft: 4, textTransform: 'uppercase' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  typeCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  typeCardActive: {
    borderColor: '#006878',
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
  },
  typeLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', textAlign: 'center' },
  typeLabelActive: { color: '#006878' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    height: 60,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1e293b', fontWeight: '600' },
  footer: { padding: 32 },
  cta: {
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  ctaText: { color: 'white', fontSize: 17, fontWeight: '800' }
});
