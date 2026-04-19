import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, TextInput,
  Image
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/providers/ThemeContext';
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
  const { colors, isDark } = useAppTheme();
  const router = useRouter();
  const styles = makeStyles(colors);
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
            address_line1: formData.address_line1 || 'Choose Location',
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
      <StatusBar style={isDark ? 'light' : 'dark'} />
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
                  <View style={styles.locationLabelRow}>
                    <Text style={styles.label}>Shop Location</Text>
                    {formData.latitude && formData.latitude !== 28.6139 && (
                      <View style={styles.locationSetBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#006878" />
                        <Text style={styles.locationSetBadgeText}>Set</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.locationCard}>
                    {/* Mini Map Preview */}
                    <View style={styles.miniMapWrap}>
                      {formData.latitude && formData.longitude ? (
                        <ExpoMap
                          ref={mapRef}
                          style={StyleSheet.absoluteFillObject}
                          initialRegion={region}
                          region={region}
                          mapType={mapType}
                          draggable={false}
                          markerTitle="Shop"
                          markers={[{
                            id: 'shop-pin',
                            latitude: formData.latitude,
                            longitude: formData.longitude,
                            title: formData.name || 'Your Shop',
                            color: '#006878',
                          }]}
                        />
                      ) : (
                        <View style={styles.miniMapPlaceholder}>
                          <Ionicons name="map-outline" size={36} color="#94a3b8" />
                          <Text style={styles.miniMapPlaceholderText}>No location set</Text>
                        </View>
                      )}

                      {/* Map type toggle */}
                      <TouchableOpacity
                        style={styles.mapTypeBtn}
                        onPress={() => {
                          const types: ('standard' | 'satellite' | 'terrain')[] = ['terrain', 'satellite', 'standard'];
                          setMapType(t => types[(types.indexOf(t) + 1) % 3]);
                        }}
                      >
                        <Ionicons
                          name={mapType === 'terrain' ? 'earth-outline' : mapType === 'satellite' ? 'images-outline' : 'map-outline'}
                          size={16} color="white"
                        />
                      </TouchableOpacity>

                      {/* Accuracy badge */}
                      {locating && (
                        <View style={styles.locatingOverlay}>
                          <ActivityIndicator size="small" color="white" />
                          <Text style={styles.locatingText}>Getting GPS…</Text>
                        </View>
                      )}
                      {accuracy !== null && !locating && (
                        <View style={[styles.accuracyBadge, { backgroundColor: accuracy < 15 ? '#16a34a' : accuracy < 50 ? '#d97706' : '#dc2626' }]}>
                          <View style={styles.accuracyDot} />
                          <Text style={styles.accuracyText}>±{Math.round(accuracy)}m</Text>
                        </View>
                      )}
                    </View>

                    {/* Address row */}
                    <View style={styles.locationInfo}>
                      <View style={styles.locationAddrRow}>
                        <View style={styles.locationIconCircle}>
                          <Ionicons name="location" size={18} color="#006878" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.locationAddrText} numberOfLines={2}>
                            {formData.address_line1 || (formData.latitude && formData.latitude !== 28.6139 ? 'Choose Location' : 'Choose Location')}
                          </Text>
                          {formData.latitude && formData.latitude !== 28.6139 && (
                            <Text style={styles.locationCoordsText}>
                              {Number(formData.latitude).toFixed(5)}, {Number(formData.longitude).toFixed(5)}
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Action buttons */}
                      <View style={styles.locationActions}>
                        <TouchableOpacity style={styles.locActionBtn} onPress={handleGetCurrentLocation} disabled={locating}>
                          {locating
                            ? <ActivityIndicator size="small" color="#006878" />
                            : <><Ionicons name="locate" size={16} color="#006878" /><Text style={styles.locActionText}>GPS</Text></>
                          }
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.locActionBtn, styles.locActionBtnPrimary]} onPress={handleOpenMap}>
                          <Ionicons name="expand-outline" size={16} color="white" />
                          <Text style={[styles.locActionText, { color: 'white' }]}>
                            {formData.latitude && formData.latitude !== 28.6139 ? 'Edit on Map' : 'Set on Map'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
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

const makeStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
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
    backgroundColor: colors.surface,
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

  // Location section
  locationLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationSetBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  locationSetBadgeText: { fontSize: 11, fontWeight: '700', color: '#16a34a' },

  locationCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginTop: 4,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },

  // Mini map
  miniMapWrap: { height: 160, position: 'relative', backgroundColor: '#e2e8f0' },
  miniMapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f8fafc' },
  miniMapPlaceholderText: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
  mapTypeBtn: {
    position: 'absolute', top: 10, right: 10,
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  locatingOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, gap: 8,
  },
  locatingText: { color: 'white', fontSize: 12, fontWeight: '700' },
  accuracyBadge: {
    position: 'absolute', bottom: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  accuracyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'white' },
  accuracyText: { color: 'white', fontSize: 11, fontWeight: '800' },

  // Address + actions below map
  locationInfo: { padding: 14, gap: 12 },
  locationAddrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  locationIconCircle: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#f0fdfa', alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  locationAddrText: { fontSize: 14, fontWeight: '700', color: '#134e4a', lineHeight: 20, flex: 1 },
  locationCoordsText: { fontSize: 11, color: '#0d9488', fontWeight: '700', marginTop: 3, opacity: 0.8 },

  locationActions: { flexDirection: 'row', gap: 10 },
  locActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: 14,
    backgroundColor: '#f0fdfa', borderWidth: 1, borderColor: '#ccfbf1',
  },
  locActionBtnPrimary: { backgroundColor: '#006878', borderColor: '#006878' },
  locActionText: { fontSize: 13, fontWeight: '800', color: '#006878' },
});
