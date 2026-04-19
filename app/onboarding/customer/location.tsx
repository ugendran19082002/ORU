import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Animated, Platform, Switch,
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

const CUSTOMER_ACCENT = roleAccent.customer;
const CUSTOMER_GRAD: [string, string] = [roleGradients.customer.start, roleGradients.customer.end];

export default function CustomerLocationScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors, isDark);
  const { user, updateUser, status, syncSession } = useAppSession();
  const mapRef = useRef<any>(null);

  useStepBackHandler('/onboarding/customer');

  // 0. Role Bouncer
  if (status === 'authenticated' && user?.role !== 'customer') return null;

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [region, setRegion] = useState({
    latitude: 12.9716,
    longitude: 80.2210,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [marker, setMarker] = useState({ latitude: 12.9716, longitude: 80.2210 });
  const [address, setAddress] = useState('Locating you…');
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'terrain'>('terrain');
  const [isFloor, setIsFloor] = useState(false);
  const [noOfFloor, setNoOfFloor] = useState(0);

  // Crosshair pulse animation on drag
  const crosshairScale = useRef(new Animated.Value(1)).current;
  const cardSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(cardSlide, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10, delay: 300 }).start();
    (async () => {
      try {
        let { status: pStatus } = await Location.requestForegroundPermissionsAsync();
        if (pStatus !== 'granted') {
          Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'We need location access to find nearby shops.' });
          setLocating(false);
          return;
        }
        let location = await Location.getCurrentPositionAsync({});
        const newCoords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
        setRegion(prev => ({ ...prev, ...newCoords }));
        setMarker(newCoords);
        reverseGeocode(newCoords.latitude, newCoords.longitude);
      } catch {}
      finally { setLocating(false); }
    })();
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (result.length > 0) {
        const item = result[0];
        const addr = `${item.name || ''} ${item.street || ''}, ${item.district || item.city || ''}`.trim().replace(/^,/, '');
        setAddress(addr || 'Custom Location');
      }
    } catch { setAddress('Pinned Location'); }
  };

  const handleMarkerDrag = (coords: { latitude: number; longitude: number }) => {
    setMarker(coords);
    setIsDragging(false);
    Animated.spring(crosshairScale, { toValue: 1, useNativeDriver: true }).start();
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
    try {
      setLoading(true);
      const res = await onboardingApi.completeCustomerStep('set_location', {
        latitude: marker.latitude,
        longitude: marker.longitude,
        address: address,
        is_floor: isFloor,
        no_of_floor: isFloor ? noOfFloor : 0,
      });
      if (res.status === 1) {
        await syncSession();
        router.replace('/onboarding/customer');
      }
    } catch (error: any) {
      if (error.response?.status === 404) return;
      Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.message || 'Failed to save location.' });
    } finally { setLoading(false); }
  };

  const cardTranslate = cardSlide.interpolate({ inputRange: [0, 1], outputRange: [120, 0] });

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ── FULL SCREEN MAP ── */}
      <View style={StyleSheet.absoluteFillObject}>
        {locating ? (
          <View style={styles.loader}>
            <View style={styles.loaderPill}>
              <ActivityIndicator size="small" color={CUSTOMER_ACCENT} />
              <Text style={styles.loaderText}>Finding your position…</Text>
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
            markerTitle="Delivery Point"
            onMarkerDragEnd={handleMarkerDrag}
            markers={[{
              id: 'delivery-pin',
              latitude: marker.latitude,
              longitude: marker.longitude,
              title: 'Deliver Here',
              color: CUSTOMER_ACCENT,
            }]}
          />
        )}
      </View>

      {/* ── MAP FABs (right column) ── */}
      <SafeAreaView style={styles.fabColumn} pointerEvents="box-none">
        <View style={styles.fabGroup}>
          <TouchableOpacity style={[styles.fab, { backgroundColor: colors.surface }]} onPress={handleMapTypeToggle}>
            <Ionicons name={MAP_TYPE_ICONS[mapType]} size={20} color={CUSTOMER_ACCENT} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.fab, { backgroundColor: colors.surface }]} onPress={handleLocate} disabled={locating}>
            {locating
              ? <ActivityIndicator size="small" color={CUSTOMER_ACCENT} />
              : <Ionicons name="locate" size={20} color={CUSTOMER_ACCENT} />}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── TOP HEADER CARD (floats over map) ── */}
      <SafeAreaView style={styles.headerSafe} pointerEvents="box-none" edges={['top']}>
        <View style={styles.headerWrap} pointerEvents="box-none">
          {Platform.OS === 'ios' ? (
            <BlurView intensity={isDark ? 70 : 60} tint={isDark ? 'dark' : 'light'} style={styles.headerCard}>
              <HeaderContent colors={colors} isDark={isDark} />
            </BlurView>
          ) : (
            <View style={[styles.headerCard, { backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.96)' }]}>
              <HeaderContent colors={colors} isDark={isDark} />
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* ── BOTTOM CONFIRM CARD ── */}
      <Animated.View style={[styles.bottomCard, { transform: [{ translateY: cardTranslate }] }]} pointerEvents="box-none">
        {Platform.OS === 'ios' ? (
          <BlurView intensity={isDark ? 80 : 70} tint={isDark ? 'dark' : 'light'} style={styles.bottomInner}>
            <BottomContent
              address={address}
              loading={loading}
              locating={locating}
              onConfirm={handleConfirm}
              colors={colors}
              isDark={isDark}
              accent={CUSTOMER_ACCENT}
              grad={CUSTOMER_GRAD}
              isFloor={isFloor}
              setIsFloor={setIsFloor}
              noOfFloor={noOfFloor}
              setNoOfFloor={setNoOfFloor}
            />
          </BlurView>
        ) : (
          <View style={[styles.bottomInner, { backgroundColor: isDark ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.97)' }]}>
            <BottomContent
              address={address}
              loading={loading}
              locating={locating}
              onConfirm={handleConfirm}
              colors={colors}
              isDark={isDark}
              accent={CUSTOMER_ACCENT}
              grad={CUSTOMER_GRAD}
              isFloor={isFloor}
              setIsFloor={setIsFloor}
              noOfFloor={noOfFloor}
              setNoOfFloor={setNoOfFloor}
            />
          </View>
        )}
      </Animated.View>
    </View>
  );
}

// ── Sub-components for BlurView / non-blur parity ─────────────────────────────

function HeaderContent({ colors, isDark }: { colors: ColorSchemeColors; isDark: boolean }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <BackButton fallback="/onboarding/customer" variant="transparent" />
        {/* Step indicator */}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border }} />
          <View style={{ flex: 1, height: 2, backgroundColor: isDark ? '#1e3a5f' : '#bfdbfe' }} />
          <LinearGradient colors={['#005d90', '#0077b6']} style={{ width: 24, height: 8, borderRadius: 4 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        </View>
        <View style={{ backgroundColor: isDark ? '#1e3a5f' : '#dbeafe', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: roleAccent.customer }}>STEP 2</Text>
        </View>
      </View>
      <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text, letterSpacing: -0.3 }}>📍 Set Delivery Address</Text>
      <Text style={{ fontSize: 13, color: colors.muted, marginTop: 3, fontWeight: '500' }}>
        Drag the pin or tap the map to pin your exact building
      </Text>
    </View>
  );
}

function BottomContent({ address, loading, locating, onConfirm, colors, isDark, accent, grad, isFloor, setIsFloor, noOfFloor, setNoOfFloor }:
  { address: string; loading: boolean; locating: boolean; onConfirm: () => void; colors: ColorSchemeColors; isDark: boolean; accent: string; grad: [string, string]; isFloor: boolean; setIsFloor: (v: boolean) => void; noOfFloor: number; setNoOfFloor: (v: number) => void }) {
  return (
    <View style={{ padding: 20, paddingBottom: Platform.OS === 'ios' ? 8 : 20 }}>
      {/* Handle */}
      <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 }} />

      {/* Address card */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12,
        backgroundColor: isDark ? 'rgba(30,58,138,0.2)' : 'rgba(0,93,144,0.06)',
        borderRadius: 16, padding: 14, borderWidth: 1, borderColor: isDark ? 'rgba(0,93,144,0.3)' : 'rgba(0,93,144,0.12)' }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: isDark ? '#1e3a5f' : '#dbeafe', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="location" size={22} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: accent, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>
            DELIVERY LOCATION
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, lineHeight: 19 }} numberOfLines={2}>
            {address}
          </Text>
        </View>
        <Ionicons name="checkmark-circle" size={20} color={accent} />
      </View>

      {/* Floor toggle row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, marginBottom: 10,
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        borderWidth: 1, borderColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="business-outline" size={18} color={accent} />
          <View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Multi-storey building?</Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginTop: 1 }}>Turn on to set your floor number</Text>
          </View>
        </View>
        <Switch
          value={isFloor}
          onValueChange={setIsFloor}
          trackColor={{ false: colors.border, true: accent }}
          thumbColor={Platform.OS === 'ios' ? undefined : '#fff'}
        />
      </View>

      {/* Floor picker — only when isFloor is on */}
      {isFloor && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, marginBottom: 10,
          backgroundColor: isDark ? 'rgba(30,58,138,0.15)' : `${accent}10`,
          borderWidth: 1, borderColor: `${accent}30` }}>
          <TouchableOpacity
            onPress={() => setNoOfFloor(Math.max(0, noOfFloor - 1))}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
          >
            <Ionicons name="remove" size={22} color={accent} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: accent }}>{noOfFloor}</Text>
            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.muted, letterSpacing: 0.5 }}>FLOOR</Text>
          </View>
          <TouchableOpacity
            onPress={() => setNoOfFloor(noOfFloor + 1)}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
          >
            <Ionicons name="add" size={22} color={accent} />
          </TouchableOpacity>
        </View>
      )}

      {/* CTA */}
      <TouchableOpacity onPress={onConfirm} disabled={loading || locating} activeOpacity={0.85}>
        <LinearGradient
          colors={grad}
          style={{ height: 58, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          {loading ? <ActivityIndicator color="white" /> : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 }}>
                Confirm Location
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

  loader: { ...StyleSheet.absoluteFillObject, backgroundColor: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(248,250,252,0.9)', justifyContent: 'center', alignItems: 'center' },
  loaderPill: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 30, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  loaderText: { fontSize: 14, fontWeight: '700', color: colors.text },

  fabColumn: { ...StyleSheet.absoluteFillObject, pointerEvents: 'box-none', alignItems: 'flex-end', justifyContent: 'center', paddingRight: 16, paddingTop: 160 },
  fabGroup: { gap: 12 },
  fab: {
    width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.4 : 0.15, shadowRadius: 12, elevation: 6,
  },

  headerSafe: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerWrap: { paddingHorizontal: 12, paddingTop: 8 },
  headerCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: isDark ? 0.4 : 0.12, shadowRadius: 20, elevation: 8 },

  bottomCard: { position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden', borderTopLeftRadius: 28, borderTopRightRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: isDark ? 0.4 : 0.1, shadowRadius: 20, elevation: 12 },
  bottomInner: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' },
});
