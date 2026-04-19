import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Animated, Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { ExpoMap } from '@/components/maps/ExpoMap';
import { useStepBackHandler } from '@/hooks/use-step-back-handler';
import { onboardingApi } from '@/api/onboardingApi';
import { useAppSession } from '@/hooks/use-app-session';
import { BackButton } from '@/components/ui/BackButton';
import { useAppTheme } from '@/providers/ThemeContext';
import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { Radius, roleAccent, roleGradients } from '@/constants/theme';

const SHOP_ACCENT = roleAccent.shop_owner;
const SHOP_GRAD: [string, string] = [roleGradients.shop_owner.start, roleGradients.shop_owner.end];

export default function ShopLocationScreen() {
  const router = useRouter();
  const { user, status } = useAppSession();
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors, isDark);
  const mapRef = useRef<any>(null);

  useStepBackHandler('/onboarding/shop');

  // 0. Role Bouncer
  if (status === 'authenticated' && user?.role !== 'shop_owner') return null;

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(true);
  const [shopId, setShopId] = useState<number | null>(null);
  const [region, setRegion] = useState({ latitude: 12.9716, longitude: 80.2210, latitudeDelta: 0.01, longitudeDelta: 0.01 });
  const [marker, setMarker] = useState({ latitude: 12.9716, longitude: 80.2210 });
  const [address, setAddress] = useState('Locating your shop…');
  const [city, setCity] = useState('');
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'terrain'>('terrain');

  const cardSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(cardSlide, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10, delay: 400 }).start();
    (async () => {
      try {
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
        let { status: pStatus } = await Location.requestForegroundPermissionsAsync();
        if (pStatus !== 'granted') {
          Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'We need location access to find your shop.' });
          setLocating(false);
          return;
        }
        let location = await Location.getCurrentPositionAsync({});
        const newCoords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
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
    } catch { setAddress('Pinned Location'); }
  };

  const handleMarkerDrag = (coords: { latitude: number; longitude: number }) => {
    setMarker(coords);
    reverseGeocode(coords.latitude, coords.longitude);
  };

  const handleLocate = async () => {
    setLocating(true);
    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const newCoords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setRegion(prev => ({ ...prev, ...newCoords }));
      setMarker(newCoords);
      reverseGeocode(newCoords.latitude, newCoords.longitude);
      mapRef.current?.animateToRegion({ ...newCoords, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 800);
    } catch {
      Toast.show({ type: 'error', text1: 'GPS Error', text2: 'Could not fetch current position.' });
    } finally { setLocating(false); }
  };

  const handleMapTypeToggle = () => {
    const types: ('standard' | 'satellite' | 'terrain')[] = ['terrain', 'satellite', 'standard'];
    setMapType(t => types[(types.indexOf(t) + 1) % 3]);
  };

  const MAP_TYPE_ICONS: Record<string, any> = { terrain: 'earth-outline', satellite: 'images-outline', standard: 'map-outline' };

  const handleConfirm = async () => {
    if (!shopId) {
      Toast.show({ type: 'info', text1: 'Complete Basic Details First', text2: 'Please fill in your shop name and details before setting the location.' });
      router.replace('/onboarding/shop/basic-details');
      return;
    }
    try {
      setLoading(true);
      const res = await onboardingApi.updateBasicDetails(shopId, {
        latitude: marker.latitude,
        longitude: marker.longitude,
        address_line1: address,
        city: city || 'Default',
      });
      if (res.status === 1) {
        Toast.show({ type: 'success', text1: '📍 Location Set', text2: 'Shop location updated successfully.' });
        router.replace('/onboarding/shop/basic-details');
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.message || 'Failed to save location.' });
    } finally { setLoading(false); }
  };

  const cardTranslate = cardSlide.interpolate({ inputRange: [0, 1], outputRange: [140, 0] });

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ── FULL SCREEN MAP ── */}
      <View style={StyleSheet.absoluteFillObject}>
        {locating ? (
          <View style={styles.loader}>
            <View style={styles.loaderPill}>
              <ActivityIndicator size="small" color={SHOP_ACCENT} />
              <Text style={styles.loaderText}>Locating your shop…</Text>
            </View>
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
              title: 'Shop Here',
              color: SHOP_ACCENT,
            }]}
          />
        )}
      </View>

      {/* ── MAP FABs ── */}
      <SafeAreaView style={styles.fabColumn} pointerEvents="box-none">
        <View style={styles.fabGroup}>
          <TouchableOpacity style={[styles.fab, { backgroundColor: colors.surface }]} onPress={handleMapTypeToggle}>
            <Ionicons name={MAP_TYPE_ICONS[mapType]} size={20} color={SHOP_ACCENT} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.fab, { backgroundColor: colors.surface }]} onPress={handleLocate} disabled={locating}>
            {locating
              ? <ActivityIndicator size="small" color={SHOP_ACCENT} />
              : <Ionicons name="locate" size={20} color={SHOP_ACCENT} />}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── TOP HEADER CARD ── */}
      <SafeAreaView style={styles.headerSafe} pointerEvents="box-none" edges={['top']}>
        <View style={styles.headerWrap}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={isDark ? 75 : 65} tint={isDark ? 'dark' : 'light'} style={styles.headerCard}>
              <ShopHeaderContent colors={colors} isDark={isDark} />
            </BlurView>
          ) : (
            <View style={[styles.headerCard, { backgroundColor: isDark ? 'rgba(10,26,25,0.96)' : 'rgba(255,255,255,0.96)' }]}>
              <ShopHeaderContent colors={colors} isDark={isDark} />
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* ── BOTTOM CONFIRM CARD ── */}
      <Animated.View style={[styles.bottomCard, { transform: [{ translateY: cardTranslate }] }]}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={isDark ? 80 : 70} tint={isDark ? 'dark' : 'light'} style={styles.bottomInner}>
            <ShopBottomContent address={address} loading={loading} locating={locating} onConfirm={handleConfirm} colors={colors} isDark={isDark} />
          </BlurView>
        ) : (
          <View style={[styles.bottomInner, { backgroundColor: isDark ? 'rgba(10,26,25,0.97)' : 'rgba(255,255,255,0.97)' }]}>
            <ShopBottomContent address={address} loading={loading} locating={locating} onConfirm={handleConfirm} colors={colors} isDark={isDark} />
          </View>
        )}
      </Animated.View>
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ShopHeaderContent({ colors, isDark }: { colors: ColorSchemeColors; isDark: boolean }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <BackButton fallback="/onboarding/shop" variant="transparent" />
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <LinearGradient colors={[SHOP_ACCENT, '#134e4a']} style={{ width: 20, height: 8, borderRadius: 4 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <View style={{ flex: 1, height: 2, backgroundColor: isDark ? '#134e4a' : '#ccfbf1' }} />
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border }} />
        </View>
        <View style={{ backgroundColor: isDark ? '#134e4a' : '#ccfbf1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: SHOP_ACCENT }}>STEP 2 of 8</Text>
        </View>
      </View>
      <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text, letterSpacing: -0.3 }}>🏪 Pin Shop Location</Text>
      <Text style={{ fontSize: 13, color: colors.muted, marginTop: 3, fontWeight: '500' }}>
        Drag the pin or tap the map to set your exact shop position
      </Text>
    </View>
  );
}

function ShopBottomContent({ address, loading, locating, onConfirm, colors, isDark }:
  { address: string; loading: boolean; locating: boolean; onConfirm: () => void; colors: ColorSchemeColors; isDark: boolean }) {
  return (
    <View style={{ padding: 20, paddingBottom: Platform.OS === 'ios' ? 8 : 20 }}>
      <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 }} />
      {/* Address display */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16,
        backgroundColor: isDark ? 'rgba(0,104,120,0.2)' : 'rgba(0,104,120,0.07)',
        borderRadius: 16, padding: 14, borderWidth: 1, borderColor: isDark ? 'rgba(0,104,120,0.35)' : 'rgba(0,104,120,0.15)' }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: isDark ? '#134e4a' : '#ccfbf1', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="business" size={22} color={SHOP_ACCENT} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: SHOP_ACCENT, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>
            SHOP ADDRESS
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, lineHeight: 19 }} numberOfLines={2}>
            {address}
          </Text>
        </View>
        <Ionicons name="checkmark-circle" size={20} color={SHOP_ACCENT} />
      </View>

      <TouchableOpacity onPress={onConfirm} disabled={loading || locating} activeOpacity={0.85}>
        <LinearGradient
          colors={SHOP_GRAD}
          style={{ height: 58, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          {loading ? <ActivityIndicator color="white" /> : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 }}>
                Confirm Shop Location
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const makeStyles = (colors: ColorSchemeColors, isDark: boolean) => StyleSheet.create({
  container: { flex: 1 },
  loader: { ...StyleSheet.absoluteFillObject, backgroundColor: isDark ? 'rgba(10,26,25,0.85)' : 'rgba(240,253,250,0.9)', justifyContent: 'center', alignItems: 'center' },
  loaderPill: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 30, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  loaderText: { fontSize: 14, fontWeight: '700', color: colors.text },

  fabColumn: { ...StyleSheet.absoluteFillObject, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 16, paddingTop: 170 },
  fabGroup: { gap: 12 },
  fab: {
    width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.4 : 0.15, shadowRadius: 12, elevation: 6,
  },

  headerSafe: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerWrap: { paddingHorizontal: 12, paddingTop: 8 },
  headerCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: isDark ? 0.4 : 0.12, shadowRadius: 20, elevation: 8 },

  bottomCard: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: isDark ? 0.4 : 0.1, shadowRadius: 20, elevation: 12 },
  bottomInner: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', overflow: 'hidden' },
});
