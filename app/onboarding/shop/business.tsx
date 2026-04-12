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

export default function ShopBusinessDetailsScreen() {
  const router = useRouter();
  const { user, status } = useAppSession();
  const [loading, setLoading] = useState(false);
  const [fetchingShop, setFetchingShop] = useState(true);
  const [shopId, setShopId] = useState<number | null>(null);

  // 0. Role Bouncer
  if (status === 'authenticated' && user?.role !== 'shop_owner' && user?.role !== 'admin') {
    return null;
  }

  const [formData, setFormData] = useState({
    legal_name: '',
    description: '',
    email: user?.email || '',
    website: '',
  });

  // 1. Resolve actual Shop ID
  React.useEffect(() => {
    (async () => {
      try {
        const res = await onboardingApi.getMerchantShop();
        if (res.data) {
          setShopId(res.data.id);
        } else {
          router.replace('/onboarding/shop/create');
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          router.replace('/onboarding/shop/create');
        } else {
          console.error('[Shop Details] ID Resolution Error:', err);
        }
      } finally {
        setFetchingShop(false);
      }
    })();
  }, []);

  const handleContinue = async () => {
    if (!shopId) {
      Alert.alert('Error', 'Shop context lost. Please try again.');
      return;
    }

    try {
      setLoading(true);
      
      const res = await onboardingApi.completeShopStep('business_details', shopId, formData);
      
      if (res.status === 1) {
        // Return to shop checklist
        router.replace('/onboarding/shop');
      }
    } catch (error: any) {
      console.error('[Shop Onboarding] Business Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Could not save details.');
    } finally {
      setLoading(false);
    }
  };

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
              <BackButton fallback="/onboarding/shop" style={{ marginBottom: 16 }} />
              <Text style={styles.title}>Business Identity</Text>
              <Text style={styles.subtitle}>Tell us more about your business to build trust with customers.</Text>
            </View>

            {fetchingShop ? (
              <ActivityIndicator size="large" color="#006878" style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Legal Business Name</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="ribbon-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Sree Murugan Enterprises"
                      value={formData.legal_name}
                      onChangeText={(v) => setFormData(p => ({ ...p, legal_name: v }))}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Business Description</Text>
                  <View style={[styles.inputWrap, styles.textAreaWrap]}>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Briefly describe your services..."
                      value={formData.description}
                      onChangeText={(v) => setFormData(p => ({ ...p, description: v }))}
                      multiline
                      numberOfLines={4}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Business Email</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="contact@business.com"
                      value={formData.email}
                      onChangeText={(v) => setFormData(p => ({ ...p, email: v }))}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleContinue} disabled={loading} activeOpacity={0.8}>
              <LinearGradient
                colors={['#006878', '#134e4a']}
                style={styles.cta}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? <ActivityIndicator color="white" /> : (
                  <>
                    <Text style={styles.ctaText}>Save Business Details</Text>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
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
  
  header: { marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '900', color: '#134e4a', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#64748b', marginTop: 12, lineHeight: 22 },

  form: { gap: 24 },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: '800', color: '#475569', marginLeft: 4, textTransform: 'uppercase' },
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
  textAreaWrap: { height: 120, alignItems: 'flex-start', paddingTop: 12 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1e293b', fontWeight: '600' },
  textArea: { textAlignVertical: 'top' },

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
