import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, TextInput,
  Image
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
import { BackButton } from '@/components/ui/BackButton';
import { ExpoMap, ExpoMarker } from "@/components/maps/ExpoMap";
import { useRef, useEffect } from "react";

export default function ShopBasicDetailsScreen() {
  const router = useRouter();
  const { user, refreshShopStatus } = useAppSession();
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
    latitude: 28.6139 as number | null, // Default New Delhi
    longitude: 77.2090 as number | null,
  });

  // Map & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'terrain'>('terrain');
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<any>(null);

  const [region, setRegion] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
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
          const lat = res.data.latitude ? Number(res.data.latitude) : 28.6139;
          const lng = res.data.longitude ? Number(res.data.longitude) : 77.2090;

          setFormData(p => ({
            ...p,
            name: res.data.name || '',
            owner_name: res.data.owner_name || '',
            phone: (res.data.phone || user?.phone || '').replace('+91', ''),
            shop_type: res.data.shop_type || 'individual',
            address_line1: res.data.address_line1 || '',
            city: res.data.city || '',
            latitude: lat,
            longitude: lng,
          }));

          setRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
        } else {
          setMode('CREATE');
          // Start fetching location for new user immediately
          handleGetCurrentLocation();
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          setMode('CREATE');
          handleGetCurrentLocation();
        }
      } finally {
        setFetchingShop(false);
      }
    })();
  }, []);

  // --- PORTED SEARCH & MAP LOGIC ---

  const handleOpenMap = () => {
    // If shop doesn't exist, create it first
    if (mode === 'CREATE') {
        handleContinue(true); // create then navigate
    } else {
        router.push('/onboarding/shop/location');
    }
  };

  const handleMarkerDragEnd = async (coords: { latitude: number; longitude: number }) => {
    const { latitude, longitude } = coords;
    setFormData(p => ({ ...p, latitude, longitude }));
    
    // Native Reverse Geocode (Aligned with customer flow)
    try {
      const result = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result.length > 0) {
        const item = result[0];
        const addr = `${item.name || ''} ${item.street || ''}, ${item.district || item.city || ''}`.trim().replace(/^,/, '');
        setFormData(p => ({ 
            ...p, 
            address_line1: addr || 'Custom Location', 
            city: item.city || item.district || p.city 
        }));
      }
    } catch (e) {
      console.error('[ShopBasicDetails] Geocode Error:', e);
    }
  };

  const handleGetCurrentLocation = async () => {
    setLocating(true);
    setAccuracy(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Toast.show({ type: 'info', text1: 'Permission', text2: 'Location required for precise setup.' });
        setLocating(false);
        return;
      }

      let best: Location.LocationObject | null = null;
      let count = 0;

      const watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 500,
          distanceInterval: 0,
        },
        (loc) => {
          count++;
          const currentAcc = loc.coords.accuracy ?? 1000;
          const bestAcc = best?.coords.accuracy ?? 1000;

          if (!best || currentAcc < bestAcc) {
            best = loc;
            setAccuracy(loc.coords.accuracy);
            const newRegion = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            };
            setRegion(newRegion);
            mapRef.current?.animateToRegion(newRegion, 500);
            setFormData(p => ({ ...p, latitude: loc.coords.latitude, longitude: loc.coords.longitude }));
          }

          if (count > 8 || currentAcc < 15) {
             watcher.remove();
             setLocating(false);
             handleMarkerDragEnd({ latitude: best!.coords.latitude, longitude: best!.coords.longitude });
          }
        }
      );

      setTimeout(() => {
        watcher.remove();
        setLocating(false);
      }, 6000);

    } catch (err) {
      setLocating(false);
    }
  };

  const handleContinue = async (thenGoToMap = false) => {
    if (!formData.name || !formData.phone || !formData.owner_name) {
      Toast.show({ type: 'error', text1: 'Required Fields', text2: 'Please fill name and contact.' });
      return;
    }

    try {
      setLoading(true);
      let currentShopId = shopId;

      if (mode === 'CREATE') {
        const createRes = await onboardingApi.createShop({
          name: formData.name,
          contact_number: `+91${formData.phone}`,
          shop_type: formData.shop_type,
        });
        if (createRes.status === 1) {
          currentShopId = createRes.data.id;
          setShopId(currentShopId);
          await refreshShopStatus();
          setMode('UPDATE');
        }
      }

      if (currentShopId) {
        const res = await onboardingApi.updateBasicDetails(currentShopId, {
            name: formData.name,
            owner_name: formData.owner_name,
            phone: `+91${formData.phone}`,
            shop_type: formData.shop_type,
            address_line1: formData.address_line1 || 'Pending Location',
            latitude: formData.latitude || 0,
            longitude: formData.longitude || 0,
            city: formData.city || 'Default'
        });
        
        if (res.status === 1) {
           if (thenGoToMap) {
               router.push('/onboarding/shop/location');
               return;
           }
           Toast.show({ type: 'success', text1: 'Success', text2: 'Basic details saved!' });
           router.replace('/onboarding/shop');
        }
      }
    } catch (error: any) {
       Toast.show({ type: 'error', text1: 'Error', text2: 'Could not save details.' });
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
                fallback="/onboarding/shop" 
                style={{ marginBottom: 16 }} 
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


                {/* Shop Location Section */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Shop Location</Text>
                  
                  {formData.latitude && formData.latitude !== 28.6139 ? (
                    <View style={styles.activeLocationCard}>
                        <View style={styles.locationIconWrap}>
                            <Ionicons name="location" size={24} color="#006878" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.locationAddr} numberOfLines={2}>{formData.address_line1 || 'Point selected on map'}</Text>
                            <Text style={styles.locationCoords}>
                                {Number(formData.latitude).toFixed(6)}, {Number(formData.longitude).toFixed(6)}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity style={styles.editLocBtn} onPress={handleOpenMap}>
                                <Ionicons name="expand-outline" size={18} color="#006878" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.editLocBtn} onPress={handleOpenMap}>
                                <Ionicons name="pencil" size={18} color="#006878" />
                            </TouchableOpacity>
                        </View>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.setLocBtn} onPress={handleOpenMap}>
                        <LinearGradient 
                            colors={['#f0fdfa', '#f8fafc']} 
                            style={styles.setLocInner}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.setLocIcon}>
                                <Ionicons name="map-outline" size={22} color="#0d9488" />
                            </View>
                            <View>
                                <Text style={styles.setLocTitle}>Set Location on Map</Text>
                                <Text style={styles.setLocSub}>Required for delivery radius</Text>
                            </View>
                            <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Ionicons name="expand-outline" size={16} color="#94a3b8" />
                                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>

              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => handleContinue()} disabled={loading} activeOpacity={0.8}>
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

  // Location Selector Styles
  suggestionsList: {
    backgroundColor: 'white',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: -8,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  suggestionItem: {
    flexDirection: 'row',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
    gap: 12,
  },
  suggestionTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  suggestionSub: { fontSize: 12, color: '#64748b', marginTop: 2 },

  mapContainer: {
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
    position: 'relative',
  },
  mapView: { flex: 1 },
  mapControls: {
    position: 'absolute',
    right: 12,
    top: 12,
    gap: 8,
  },
  mapActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accuracyOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  accuracyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  accuracyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  accuracyLabel: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
  },
  mapHint: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapHintText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  
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
  ctaText: { color: 'white', fontSize: 17, fontWeight: '800' },

  // New Location Picker Styles
  setLocBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#ccfbf1',
    marginTop: 4,
  },
  setLocInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  setLocIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  setLocTitle: { fontSize: 15, fontWeight: '800', color: '#134e4a' },
  setLocSub: { fontSize: 12, color: '#64748b', marginTop: 2 },

  activeLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdfa',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    gap: 16,
  },
  locationIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationAddr: { fontSize: 14, fontWeight: '700', color: '#134e4a', lineHeight: 20 },
  locationCoords: { fontSize: 11, color: '#0d9488', fontWeight: '800', marginTop: 4, opacity: 0.7 },
  editLocBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  }
});


