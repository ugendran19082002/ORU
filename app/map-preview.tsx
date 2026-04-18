import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { useAppTheme } from '@/providers/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ExpoMap, ExpoMarker } from '@/components/maps/ExpoMap';
import { emitGlobalLocation } from '@/utils/locationEvents';

type MapMode = 'standard' | 'satellite' | 'terrain';

const MAP_TYPES: { type: MapMode; icon: string; label: string }[] = [
  { type: 'standard',  icon: 'map-outline',    label: 'Map' },
  { type: 'satellite', icon: 'images-outline',  label: 'Sat' },
  { type: 'terrain',   icon: 'earth-outline',   label: 'Terrain' },
];

export default function MapPreviewScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const { colors, isDark } = useAppTheme();

  useAndroidBackHandler(() => { safeBack('/(tabs)'); });

  const { lat, lng, title, target, markers } = useLocalSearchParams<{
    lat: string; lng: string; title: string; target?: string; markers?: string;
  }>();

  const [draftLat, setDraftLat] = useState(parseFloat(lat ?? 'NaN'));
  const [draftLng, setDraftLng] = useState(parseFloat(lng ?? 'NaN'));
  const [mapType, setMapType] = useState<MapMode>('terrain');
  const [parsedMarkers, setParsedMarkers] = useState<any[]>([]);
  const [currentAddress, setCurrentAddress] = useState('');
  const [loadingAddr, setLoadingAddr] = useState(false);

  const label = title || 'Location';
  const isSelectMode = target === 'select';

  const isValidCoord = (
    !isNaN(draftLat) && !isNaN(draftLng) &&
    draftLat !== 0 && draftLng !== 0 &&
    draftLat >= -90 && draftLat <= 90 &&
    draftLng >= -180 && draftLng <= 180
  );

  // Reverse geocode whenever coords change
  useEffect(() => {
    if (!isValidCoord) return;
    let cancelled = false;
    setLoadingAddr(true);
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${draftLat}&lon=${draftLng}&format=json&zoom=18&addressdetails=1`,
      { headers: { 'User-Agent': 'ThanniGoApp/1.0' } }
    )
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data?.address) {
          const a = data.address;
          const parts = [
            a.road || a.pedestrian || a.neighbourhood,
            a.suburb || a.quarter,
            a.city || a.town || a.village || a.county,
          ].filter(Boolean);
          setCurrentAddress(parts.join(', ') || data.display_name || '');
        } else if (data?.display_name) {
          setCurrentAddress(data.display_name);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingAddr(false); });
    return () => { cancelled = true; };
  }, [draftLat, draftLng]);

  useEffect(() => {
    if (markers) {
      try { setParsedMarkers(JSON.parse(markers)); } catch { /* ignore */ }
    }
  }, [markers]);

  const openInMaps = () => {
    if (!isValidCoord) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Invalid coordinates.' });
      return;
    }
    const latLng = `${draftLat},${draftLng}`;
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latLng}`,
      android: `geo:0,0?q=${latLng}(${label})`,
      default: `https://www.openstreetmap.org/?mlat=${draftLat}&mlon=${draftLng}&zoom=15`,
    });
    if (url) Linking.openURL(url).catch(() =>
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not open maps app.' })
    );
  };

  // ── Invalid location ──────────────────────────────────────────────────────────
  if (!isValidCoord) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.errorWrap}>
          <View style={[styles.errorIcon, { backgroundColor: isDark ? '#2d1010' : '#fff0f0' }]}>
            <Ionicons name="alert-circle-outline" size={52} color="#f87171" />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Invalid Location</Text>
          <Text style={[styles.errorSub, { color: colors.muted }]}>
            The coordinates ({lat}, {lng}) are missing or invalid.{'\n'}Re-pin the location in your profile.
          </Text>
          <TouchableOpacity style={styles.errorBack} onPress={() => safeBack('/(tabs)')}>
            <Ionicons name="arrow-back" size={16} color="white" />
            <Text style={styles.errorBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const floatBg = isDark ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.97)';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Full-screen map */}
      <ExpoMap
        style={StyleSheet.absoluteFillObject}
        initialRegion={{ latitude: draftLat, longitude: draftLng, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
        showsUserLocation
        draggable={isSelectMode}
        markerTitle={label}
        onMarkerDragEnd={c => { setDraftLat(c.latitude); setDraftLng(c.longitude); }}
        markers={parsedMarkers.length > 0 ? parsedMarkers : undefined}
        showRoute={parsedMarkers.length > 1}
        mapType={mapType}
        showsTraffic={!isSelectMode}
      >
        {parsedMarkers.length === 0 && (
          <ExpoMarker
            coordinate={{ latitude: draftLat, longitude: draftLng }}
            draggable={isSelectMode}
            onDragEnd={e => {
              setDraftLat(e.nativeEvent.coordinate.latitude);
              setDraftLng(e.nativeEvent.coordinate.longitude);
            }}
            title={label}
          />
        )}
      </ExpoMap>

      {/* ── TOP OVERLAY: Back + Title + Nav button ── */}
      <SafeAreaView edges={['top']} style={styles.topBar} pointerEvents="box-none">
        <View style={[styles.topPill, { backgroundColor: floatBg, borderColor: colors.border }]}>
          <BackButton fallback="/(tabs)" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.topTitle, { color: colors.text }]} numberOfLines={1}>
              {isSelectMode ? 'Pin Your Location' : label}
            </Text>
            {currentAddress ? (
              <Text style={[styles.topSub, { color: colors.muted }]} numberOfLines={1}>{currentAddress}</Text>
            ) : null}
          </View>
          {!isSelectMode && (
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: '#005d90' }]}
              onPress={openInMaps}
            >
              <Ionicons name="navigate" size={16} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* ── MAP TYPE SELECTOR (horizontal, top-right below header) ── */}
      <SafeAreaView edges={['top']} style={styles.typeBarWrap} pointerEvents="box-none">
        <View style={[styles.typeBar, { backgroundColor: floatBg, borderColor: colors.border }]}>
          {MAP_TYPES.map(opt => {
            const active = mapType === opt.type;
            return (
              <TouchableOpacity
                key={opt.type}
                style={[styles.typeChip, active && { backgroundColor: '#005d90' }]}
                onPress={() => setMapType(opt.type)}
              >
                <Ionicons name={opt.icon as any} size={13} color={active ? 'white' : colors.muted} />
                <Text style={[styles.typeChipText, { color: active ? 'white' : colors.muted }]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>

      {/* ── DRAG HINT (select mode only) ── */}
      {isSelectMode && (
        <View style={[styles.dragHint, { backgroundColor: 'rgba(0,93,144,0.85)' }]}>
          <Ionicons name="move-outline" size={14} color="white" />
          <Text style={styles.dragHintText}>Drag the pin to adjust location</Text>
        </View>
      )}

      {/* ── BOTTOM ACTION CARD ── */}
      <View style={styles.bottomWrap}>
        <View style={[styles.card, { backgroundColor: floatBg, borderColor: colors.border }]}>
          {/* Location row */}
          <View style={styles.locationRow}>
            <View style={[styles.locIconWrap, { backgroundColor: isSelectMode ? '#dcfce7' : '#e0f0ff' }]}>
              <Ionicons
                name={isSelectMode ? 'pin' : 'location'}
                size={20}
                color={isSelectMode ? '#16a34a' : '#005d90'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.locTitle, { color: colors.text }]} numberOfLines={1}>
                {isSelectMode ? 'Selected Location' : label}
              </Text>
              {currentAddress ? (
                <Text style={[styles.locAddr, { color: colors.muted }]} numberOfLines={2}>{currentAddress}</Text>
              ) : (
                <Text style={[styles.locCoords, { color: colors.muted }]}>
                  {draftLat.toFixed(5)}, {draftLng.toFixed(5)}
                </Text>
              )}
            </View>
            {loadingAddr && (
              <Ionicons name="sync-outline" size={16} color={colors.muted} />
            )}
          </View>

          {/* Coords row */}
          <View style={[styles.coordsRow, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Ionicons name="navigate-circle-outline" size={14} color={colors.muted} />
            <Text style={[styles.coordsText, { color: colors.muted }]}>
              {draftLat.toFixed(6)}, {draftLng.toFixed(6)}
            </Text>
          </View>

          {/* Actions */}
          {isSelectMode ? (
            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.confirmBtn}
              onPress={() => {
                emitGlobalLocation(draftLat, draftLng);
                safeBack('/(tabs)');
              }}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.confirmGrad}
              >
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.confirmText}>Confirm This Location</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#005d90' }]}
                activeOpacity={0.88}
                onPress={openInMaps}
              >
                <Ionicons name="navigate" size={16} color="white" />
                <Text style={styles.actionBtnText}>Directions</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border }]}
                activeOpacity={0.88}
                onPress={() => router.push('/search-map' as any)}
              >
                <Ionicons name="search" size={16} color="#005d90" />
                <Text style={[styles.actionBtnText, { color: '#005d90' }]}>Explore Area</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Top overlay ──
  topBar: { position: 'absolute', top: 0, left: 0, right: 0 },
  topPill: {
    margin: 12, flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 6,
  },
  topTitle: { fontSize: 15, fontWeight: '800' },
  topSub: { fontSize: 11, marginTop: 1 },
  navBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // ── Map type selector ──
  typeBarWrap: { position: 'absolute', top: 80, left: 0, right: 0, alignItems: 'center' },
  typeBar: {
    flexDirection: 'row', borderRadius: 20, padding: 4, borderWidth: 1, gap: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16 },
  typeChipText: { fontSize: 12, fontWeight: '700' },

  // ── Drag hint ──
  dragHint: {
    position: 'absolute', top: 150, alignSelf: 'center',
    left: '50%', transform: [{ translateX: -110 }],
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  dragHintText: { color: 'white', fontSize: 12, fontWeight: '700' },

  // ── Bottom card ──
  bottomWrap: { position: 'absolute', bottom: 28, left: 16, right: 16 },
  card: {
    borderRadius: 24, padding: 18, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 12,
  },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  locIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  locTitle: { fontSize: 16, fontWeight: '800', marginBottom: 3 },
  locAddr: { fontSize: 12, fontWeight: '500', lineHeight: 17 },
  locCoords: { fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  coordsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, marginBottom: 14,
  },
  coordsText: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontWeight: '500' },

  confirmBtn: { borderRadius: 16, overflow: 'hidden' },
  confirmGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 15,
  },
  confirmText: { color: 'white', fontSize: 15, fontWeight: '900' },

  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, borderRadius: 14, paddingVertical: 13,
  },
  actionBtnText: { color: 'white', fontSize: 14, fontWeight: '800' },

  // ── Error state ──
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  errorTitle: { fontSize: 22, fontWeight: '900', marginBottom: 8, letterSpacing: -0.4 },
  errorSub: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  errorBack: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#005d90', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  errorBackText: { color: 'white', fontSize: 14, fontWeight: '800' },
});
