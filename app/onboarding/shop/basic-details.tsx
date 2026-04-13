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
  const { user, refreshShopStatus } = useAppSession();
  const { handleAuthBack } = useLogoutBackHandler();
  const [loading, setLoading] = useState(false);
  const [fetchingShop, setFetchingShop] = useState(true);
  const [locating, setLocating] = useState(false);
  const [shopId, setShopId] = useState<number | null>(null);
  const [mode, setMode] = useState<'CREATE' | 'UPDATE'>('UPDATE');

  const [formData, setFormData] = useState({
    name: '',
    owner_name: '',
    phone: user?.phone?.replace('+91', '') || '',
    shop_type: 'individual' as any,
    address_line1: '',
    city: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  // 1. Resolve actual Shop ID & Mode
  React.useEffect(() => {
    (async () => {
      try {
        const res = await onboardingApi.getMerchantShop();
        if (res.data) {
          setShopId(res.data.id);
          setMode('UPDATE');
          // Pre-fill existing data
          setFormData(p => ({
            ...p,
            name: res.data.name || '',
            owner_name: res.data.owner_name || '',
            phone: (res.data.phone || user?.phone || '').replace('+91', ''),
            shop_type: res.data.shop_type || 'individual',
            address_line1: res.data.address_line1 || '',
            city: res.data.city || '',
            latitude: res.data.latitude || null,
            longitude: res.data.longitude || null,
          }));
        } else {
          setMode('CREATE');
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          setMode('CREATE');
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
    if (!formData.name || !formData.phone || !formData.address_line1 || !formData.owner_name) {
      Toast.show({ type: 'error', text1: 'Required Fields', text2: 'Please fill in all mandatory fields.' });
      return;
    }

    try {
      setLoading(true);
      let currentShopId = shopId;

      // 1. Handle Creation if needed
      if (mode === 'CREATE') {
        const createRes = await onboardingApi.createShop({
          name: formData.name,
          contact_number: `+91${formData.phone}`,
          shop_type: formData.shop_type
        });
        if (createRes.status === 1) {
          currentShopId = createRes.data.id;
          setShopId(currentShopId);
          await refreshShopStatus();
        } else {
          throw new Error('Failed to create shop profile');
        }
      }

      // 2. Compelete/Update basic details step
      if (currentShopId) {
        const res = await onboardingApi.updateBasicDetails(currentShopId, {
            name: formData.name,
            owner_name: formData.owner_name,
            phone: `+91${formData.phone}`,
            shop_type: formData.shop_type,
            address_line1: formData.address_line1,
            latitude: formData.latitude,
            longitude: formData.longitude,
            city: formData.city || 'Default'
        });
        
        if (res.status === 1) {
          Toast.show({ type: 'success', text1: 'Success', text2: 'Basic details saved!' });
          router.replace('/onboarding/shop');
        }
      }
    } catch (error: any) {
      console.error('[Basic Details] Submit Error:', error);
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
              <BackButton 
                fallback={mode === 'CREATE' ? "/auth/role" : "/onboarding/shop"} 
                style={{ marginBottom: 16 }} 
                onPress={mode === 'CREATE' ? handleAuthBack : undefined} 
              />
              <Text style={styles.title}>{mode === 'CREATE' ? 'Register Your Shop' : 'Basic Details'}</Text>
              <Text style={styles.subtitle}>
                {mode === 'CREATE' 
                  ? 'Start by creating your business profile. This will be visible to customers.'
                  : 'Update your shop info and precise location for better delivery accuracy.'}
              </Text>
            </View>

            {fetchingShop ? (
              <ActivityIndicator size="large" color="#006878" style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.form}>
                
                {/* Shop Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Shop / Business Name</Text>
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

                {/* Owner Name */}
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

                {/* Contact Number */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Contact Number</Text>
                  <View style={styles.inputWrap}>
                    <Text style={styles.prefix}>+91</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="9876543210"
                      keyboardType="number-pad"
                      maxLength={10}
                      value={formData.phone}
                      onChangeText={(v) => setFormData(p => ({ ...p, phone: v }))}
                    />
                  </View>
                </View>

                {/* Business Type */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Business Type</Text>
                  <View style={styles.typeRow}>
                    {['individual', 'agency', 'distributor'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeBtn,
                          formData.shop_type === type && styles.typeBtnActive
                        ]}
                        onPress={() => setFormData(p => ({ ...p, shop_type: type as any }))}
                      >
                        <Text style={[
                          styles.typeText,
                          formData.shop_type === type && styles.typeTextActive
                        ]}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Shop Address */}
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

                {/* GPS Location */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>GPS Location</Text>
                  <TouchableOpacity onPress={handleGetCurrentLocation} disabled={locating}>
                    <View style={[styles.inputWrap, formData.latitude && { borderColor: '#10b981', backgroundColor: '#f0fdf4' }] as any}>
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
                    <Text style={styles.ctaText}>{mode === 'CREATE' ? 'Register & Continue' : 'Save and Continue'}</Text>
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
  scrollContent: { paddingHorizontal: 32, paddingTop: 40, paddingBottom: 40 },
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
  prefix: { fontSize: 16, fontWeight: '700', color: '#64748b', marginRight: 8 },
  input: { flex: 1, fontSize: 16, color: '#1e293b', fontWeight: '600' },
  textArea: { textAlignVertical: 'top' },
  
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeBtnActive: { backgroundColor: '#006878', borderColor: '#006878' },
  typeText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  typeTextActive: { color: 'white' },
  
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
