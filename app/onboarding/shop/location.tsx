import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Dimensions, Platform
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { ExpoMap } from '@/components/maps/ExpoMap';
import { onboardingApi } from '@/api/onboardingApi';
import { useAppSession } from '@/hooks/use-app-session';
import { BackButton } from '@/components/ui/BackButton';
import { useAppTheme } from '@/providers/ThemeContext';

const { width } = Dimensions.get('window');

export default function ShopLocationScreen() {
  const router = useRouter();
  const { user, status } = useAppSession();
  const { colors, isDark } = useAppTheme();
  const mapRef = useRef<any>(null);

  // 0. Role Bouncer
  if (status === 'authenticated' && user?.role !== 'shop_owner') {
    return null;
  }

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(true);
  const [shopId, setShopId] = useState<number | null>(null);

  const [region, setRegion] = useState({
    latitude: 12.9716, // Default
    longitude: 80.2210,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [marker, setMarker] = useState({
    latitude: 12.9716,
    longitude: 80.2210,
  });
  const [address, setAddress] = useState('Locating your shop...');
  const [city, setCity] = useState('');
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'terrain'>('terrain');

  // 1. Initial Data Fetch
  useEffect(() => {
    (async () => {
      try {
        // Find existing shop id first
        const shopRes = await onboardingApi.getMerchantShop();
        if (shopRes.data) {
            setShopId(shopRes.data.id);
            if (shopRes.data.latitude && shopRes.data.longitude) {
                const existingCoords = {
                    latitude: Number(shopRes.data.latitude),
                    longitude: Number(shopRes.data.longitude),
                };
                setRegion(prev => ({ ...prev, ...existingCoords }));
                setMarker(existingCoords);
                setAddress(shopRes.data.address_line1 || '');
                setCity(shopRes.data.city || '');
                setLocating(false);
                return;
            }
        }

        // Otherwise get GPS
        let { status: pStatus } = await Location.requestForegroundPermissionsAsync();
        if (pStatus !== 'granted') {
          Toast.show({
            type: 'error',
            text1: 'Permission Denied',
            text2: 'We need location access to find your shop.'
          });
          setLocating(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const newCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setRegion(prev => ({ ...prev, ...newCoords }));
        setMarker(newCoords);
        reverseGeocode(newCoords.latitude, newCoords.longitude);
      } catch (error: any) {
        console.error('[ShopLocation] Init Error:', error);
      } finally {
        setLocating(false);
      }
    })();
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (result.length > 0) {
        const item = result[0];
        const addr = `${item.name || ''} ${item.street || ''}, ${item.district || item.city || ''}`.trim().replace(/^,/, '');
        setAddress(addr || 'Custom Location');
        setCity(item.city || item.district || '');
      }
    } catch (e) {
      setAddress('Pinned Location');
    }
  };

  const handleMarkerDrag = (coords: { latitude: number; longitude: number }) => {
    setMarker(coords);
    reverseGeocode(coords.latitude, coords.longitude);
  };

  const handleLocate = async () => {
    setLocating(true);
    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const newCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setRegion(prev => ({ ...prev, ...newCoords }));
      setMarker(newCoords);
      reverseGeocode(newCoords.latitude, newCoords.longitude);
      mapRef.current?.animateToRegion({
        ...newCoords,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'GPS Error', text2: 'Could not fetch current position.' });
    } finally {
      setLocating(false);
    }
  };

  const handleConfirm = async () => {
    if (!shopId) {
        Toast.show({ type: 'error', text1: 'Shop not found', text2: 'Please start from basic details.' });
        return;
    }

    try {
      setLoading(true);

      const res = await onboardingApi.updateBasicDetails(shopId, {
        latitude: marker.latitude,
        longitude: marker.longitude,
        address_line1: address,
        city: city || 'Default'
      });

      if (res.status === 1) {
        Toast.show({ type: 'success', text1: 'Location Set', text2: 'Shop location updated.' });
        router.replace('/onboarding/shop/basic-details');
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to save location.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.mapContainer}>
        {locating ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#006878" />
            <Text style={styles.loaderText}>Centering map...</Text>
          </View>
        ) : (
          <ExpoMap
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            initialRegion={region}
            region={region}
            mapType={mapType}
            draggable={true}
            markerTitle="Shop Location"
            onMarkerDragEnd={handleMarkerDrag}
            markers={[{
                id: 'shop-pin',
                latitude: marker.latitude,
                longitude: marker.longitude,
                title: 'Shop Position',
                color: '#006878'
            }]}
          />
        )}

        {/* MAP CONTROLS */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.mapActionBtn}
            onPress={() => {
              const types: any[] = ['standard', 'satellite', 'terrain'];
              setMapType(types[(types.indexOf(mapType) + 1) % 3]);
            }}
          >
            <Ionicons name={mapType === 'satellite' ? 'images' : 'map'} size={20} color="#006878" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.mapActionBtn} onPress={handleLocate} disabled={locating}>
            {locating ? <ActivityIndicator size="small" color="#006878" /> : <Ionicons name="locate" size={20} color="#006878" />}
          </TouchableOpacity>
        </View>
      </View>

      <SafeAreaView style={[styles.overlay, { pointerEvents: 'box-none' }]}>
        <View style={[styles.header, { backgroundColor: isDark ? 'rgba(18,18,18,0.95)' : 'rgba(255,255,255,0.95)' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 }}>
                <BackButton fallback="/onboarding/shop/basic-details" variant="transparent" />
                <View style={[styles.stepContainer, { marginBottom: 0, flex: 1 }]}>
                    <View style={styles.stepDot} />
                    <View style={styles.stepLine} />
                    <View style={[styles.stepDot, styles.stepDotActive]} />
                </View>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Pin Shop Location</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Help customers find you accurately</Text>
        </View>

        <View style={styles.footer}>
          <View style={[styles.addressCard, { backgroundColor: colors.surface }]}>
            <View style={styles.addressIcon}>
                <Ionicons name="business" size={24} color="#006878" />
            </View>
            <View style={styles.addressInfo}>
                <Text style={[styles.addressLabel, { color: colors.muted }]}>Shop Address</Text>
                <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={2}>{address}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleConfirm} disabled={loading || locating} activeOpacity={0.8}>
            <LinearGradient
              colors={['#006878', '#134e4a']}
              style={styles.cta}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? <ActivityIndicator color="white" /> : (
                <>
                  <Text style={styles.ctaText}>Confirm Shop Location</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapContainer: { flex: 1 },
  loader: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 12, color: '#64748b', fontWeight: '600' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  header: {
    padding: 24,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 4 }
    })
  },
  stepContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e2e8f0' },
  stepDotActive: { backgroundColor: '#006878', width: 20 },
  stepLine: { width: 20, height: 2, backgroundColor: '#f1f5f9', marginHorizontal: 6 },
  title: { fontSize: 22, fontWeight: '900' },
  subtitle: { fontSize: 13, marginTop: 4 },
  footer: { padding: 24, paddingBottom: 40, backgroundColor: 'transparent' },
  addressCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
  },
  addressIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0fdfa', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  addressInfo: { flex: 1 },
  addressLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  addressText: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  cta: {
    height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    shadowColor: '#006878', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8,
  },
  ctaText: { color: 'white', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 200, // Below header
    gap: 12,
  },
  mapActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
