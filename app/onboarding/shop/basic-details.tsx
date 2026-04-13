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
import * as Location from 'expo-location';
import { useAppSession } from '@/hooks/use-app-session';
import { onboardingApi } from '@/api/onboardingApi';
import { useLogoutBackHandler } from '@/hooks/use-logout-back-handler';
import { BackButton } from '@/components/ui/BackButton';

export default function ShopBasicDetailsScreen() {
  const router = useRouter();
  const { user, status } = useAppSession();
  const { handleAuthBack } = useLogoutBackHandler();
  const [loading, setLoading] = useState(false);
  const [fetchingShop, setFetchingShop] = useState(true);
  const [locating, setLocating] = useState(false);
  const [shopId, setShopId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    owner_name: '',
    address_line1: '',
    city: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  // 1. Resolve actual Shop ID
  React.useEffect(() => {
    (async () => {
      try {
        const res = await onboardingApi.getMerchantShop();
        if (res.data) {
          setShopId(res.data.id);
          // Pre-fill existing data if any
          setFormData(p => ({
            ...p,
            name: res.data.name || '',
            owner_name: res.data.owner_name || '',
            address_line1: res.data.address_line1 || '',
            city: res.data.city || '',
            latitude: res.data.latitude || null,
            longitude: res.data.longitude || null,
          }));
        } else {
          router.replace('/onboarding/shop/create');
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          router.replace('/onboarding/shop/create');
        } else {
          console.error('[Basic Details] ID Resolution Error:', err);
        }
      } finally {
        setFetchingShop(false);
      }
    })();
  }, []);

  const handleGetCurrentLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permission denied', text2: 'Location access is required for GPS coordinates.' });
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setFormData(p => ({
        ...p,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }));
      Toast.show({ type: 'success', text1: 'Location Captured', text2: `Lat: ${location.coords.latitude.toFixed(4)}, Lng: ${location.coords.longitude.toFixed(4)}` });
    } catch (error) {
      console.error('[Location Error]', error);
      Toast.show({ type: 'error', text1: 'Location Error', text2: 'Could not fetch your current coordinates.' });
    } finally {
      setLocating(false);
    }
  };

  const handleContinue = async () => {
    if (!shopId) return;

    if (!formData.name || !formData.owner_name || !formData.address_line1) {
      Toast.show({ type: 'error', text1: 'Required Fields', text2: 'Please fill in shop name, owner name and address.' });
      return;
    }

    try {
      setLoading(true);
      const res = await onboardingApi.completeShopStep('basic_details', shopId, formData);
      if (res.status === 1) {
        router.replace('/onboarding/shop');
      }
    } catch (error: any) {
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
              <BackButton fallback="/onboarding/shop" style={{ marginBottom: 16 }} onPress={handleAuthBack} />
              <Text style={styles.title}>Basic Details</Text>
              <Text style={styles.subtitle}>Provide your shop name, owner info and precise location for deliveries.</Text>
            </View>

            {fetchingShop ? (
              <ActivityIndicator size="large" color="#006878" style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Shop Name</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="business-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Sree Murugan Water Supply"
                      value={formData.name}
                      onChangeText={(v) => setFormData(p => ({ ...p, name: v }))}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Owner Full Name</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.owner_name}
                      onChangeText={(v) => setFormData(p => ({ ...p, owner_name: v }))}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Shop Address</Text>
                  <View style={[styles.inputWrap, styles.textAreaWrap]}>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Street name, landmark..."
                      value={formData.address_line1}
                      onChangeText={(v) => setFormData(p => ({ ...p, address_line1: v }))}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>GPS Location</Text>
                  <TouchableOpacity onPress={handleGetCurrentLocation} disabled={locating}>
                    <View style={[styles.inputWrap, formData.latitude && { borderColor: '#10b981', backgroundColor: '#f0fdf4' }]}>
                      <Ionicons name="location-outline" size={20} color={formData.latitude ? "#10b981" : "#94a3b8"} style={styles.inputIcon} />
                      <Text style={[styles.input, { color: formData.latitude ? '#065f46' : '#94a3b8', paddingTop: 18 }]}>
                        {locating ? 'Fetching Location...' : formData.latitude ? 'Location Captured ✓' : 'Tap to capture GPS location'}
                      </Text>
                      {locating && <ActivityIndicator size="small" color="#006878" />}
                    </View>
                  </TouchableOpacity>
                  {formData.latitude && (
                    <Text style={styles.coordsLabel}>
                      {formData.latitude.toFixed(6)}, {formData.longitude?.toFixed(6)}
                    </Text>
                  )}
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
  header: { marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '900', color: '#134e4a', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#64748b', marginTop: 12, lineHeight: 22 },
  form: { gap: 24, marginBottom: 40 },
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
  textAreaWrap: { height: 100, alignItems: 'flex-start', paddingTop: 12 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1e293b', fontWeight: '600' },
  textArea: { textAlignVertical: 'top' },
  coordsLabel: { fontSize: 12, color: '#94a3b8', marginLeft: 4, marginTop: -4 },
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
