import React, { useRef } from 'react';
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

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export default function MapPreviewScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const { colors, isDark } = useAppTheme();

  useAndroidBackHandler(() => {
    safeBack('/(tabs)');
  });

  const { lat, lng, title, target, markers } = useLocalSearchParams<{
    lat: string;
    lng: string;
    title: string;
    target?: string;
    markers?: string;
  }>();

  const [draftLat, setDraftLat] = React.useState(parseFloat(lat || '0'));
  const [draftLng, setDraftLng] = React.useState(parseFloat(lng || '0'));
  const [mapType, setMapType] = React.useState<'standard' | 'satellite' | 'hybrid' | 'terrain' | 'none'>('terrain');
  const [parsedMarkers, setParsedMarkers] = React.useState<any[]>([]);
  const label = title || 'Location';

  React.useEffect(() => {
    if (markers) {
      try {
        setParsedMarkers(JSON.parse(markers));
      } catch (e) {
        // ignore parse error
      }
    }
  }, [markers]);

  const handleMarkerDragEnd = (coords: { latitude: number; longitude: number }) => {
    setDraftLat(coords.latitude);
    setDraftLng(coords.longitude);
  };

  const handleNativeMarkerDragEnd = (e: any) => {
    setDraftLat(e.nativeEvent.coordinate.latitude);
    setDraftLng(e.nativeEvent.coordinate.longitude);
  };

  const isValidCoord = (
    draftLat !== 0 &&
    draftLng !== 0 &&
    !isNaN(draftLat) &&
    !isNaN(draftLng) &&
    draftLat >= -90 &&
    draftLat <= 90 &&
    draftLng >= -180 &&
    draftLng <= 180
  );

  const openInExternalMaps = () => {
    if (!isValidCoord) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Invalid coordinates provided.' });
      return;
    }

    require('react-native').Alert.alert(
      'Open Navigation',
      `Would you like to open directions to "${label}" in your device's maps app?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Maps',
          onPress: () => {
            const latLng = `${draftLat},${draftLng}`;
            const url = Platform.select({
              ios: `maps:0,0?q=${label}@${latLng}`,
              android: `geo:0,0?q=${latLng}(${label})`,
              default: `https://www.openstreetmap.org/?mlat=${draftLat}&mlon=${draftLng}&zoom=15`,
            });
            if (url) {
              Linking.openURL(url).catch(() =>
                Toast.show({ type: 'error', text1: 'Error', text2: 'Could not open map application.' })
              );
            }
          },
        },
      ]
    );
  };

  const bg = colors.background;
  const surf = colors.surface;
  const border = colors.border;
  const text = colors.text;
  const muted = colors.muted;
  const inputBg = colors.inputBg;

  if (!isValidCoord) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: bg }]} edges={['top']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View style={[styles.errorIconWrap, { backgroundColor: isDark ? '#2d1010' : '#fff0f0' }]}>
            <Ionicons name="alert-circle-outline" size={56} color="#f87171" />
          </View>
          <Text style={[styles.errorTitle, { color: text }]}>Invalid Location</Text>
          <Text style={[styles.errorSub, { color: muted }]}>
            The coordinates ({lat}, {lng}) are invalid or missing. Re-pin the location in your profile.
          </Text>
          <TouchableOpacity
            style={[styles.errorBackBtn, { backgroundColor: '#005d90' }]}
            onPress={() => safeBack('/(tabs)')}
          >
            <Ionicons name="arrow-back" size={18} color="white" />
            <Text style={styles.errorBackBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const cardBg = isDark ? 'rgba(17,24,39,0.97)' : 'rgba(255,255,255,0.97)';
  const typeBg = isDark ? 'rgba(17,24,39,0.95)' : 'rgba(255,255,255,0.95)';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: surf, borderBottomColor: border }]}>
        <BackButton fallback="/(tabs)" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: text }]}>Location Preview</Text>
          <Text style={[styles.headerSub, { color: muted }]} numberOfLines={1}>{label}</Text>
        </View>
        <TouchableOpacity
          style={[styles.headerIconBtn, { backgroundColor: inputBg }]}
          onPress={openInExternalMaps}
        >
          <Ionicons name="navigate-outline" size={20} color="#005d90" />
        </TouchableOpacity>
      </View>

      <View style={styles.mapWrapper}>
        <ExpoMap
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: draftLat,
            longitude: draftLng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          showsUserLocation
          draggable={target === 'select'}
          markerTitle={label}
          onMarkerDragEnd={handleMarkerDragEnd}
          markers={parsedMarkers.length > 0 ? parsedMarkers : undefined}
          showRoute={parsedMarkers.length > 1}
          mapType={mapType}
          showsTraffic={true}
        >
          {parsedMarkers.length === 0 && (
            <ExpoMarker
              coordinate={{ latitude: draftLat, longitude: draftLng }}
              draggable={target === 'select'}
              onDragEnd={handleNativeMarkerDragEnd}
              title={label}
            />
          )}
        </ExpoMap>

        {/* MAP TYPE SELECTOR */}
        <View style={[styles.typeSelectorWrap, { backgroundColor: typeBg, borderColor: border }]}>
          {([
            { type: 'standard', icon: 'map-outline', label: 'Standard' },
            { type: 'satellite', icon: 'images-outline', label: 'Satellite' },
            { type: 'terrain', icon: 'earth-outline', label: 'Terrain' },
          ] as const).map((opt) => {
            const active = mapType === opt.type;
            return (
              <TouchableOpacity
                key={opt.type}
                style={[styles.typeBtn, active && styles.typeBtnActive]}
                onPress={() => setMapType(opt.type)}
              >
                <Ionicons name={opt.icon} size={16} color={active ? 'white' : muted} />
                <Text style={[styles.typeBtnText, { color: active ? 'white' : muted }]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* FLOATING ACTION CARD */}
        <View style={styles.floatingActionBox}>
          <View style={[styles.actionCard, { backgroundColor: cardBg, borderColor: border }]}>
            {/* Location info row */}
            <View style={styles.locationInfo}>
              <View style={[styles.miniMapWrap, { borderColor: border }]}>
                <ExpoMap
                  style={{ width: '100%', height: '100%' }}
                  initialRegion={{
                    latitude: draftLat,
                    longitude: draftLng,
                    latitudeDelta: 0.002,
                    longitudeDelta: 0.002,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                  hideControls={true}
                  mapType="satellite"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.locationTitle, { color: text }]} numberOfLines={1}>
                  {target === 'select' ? 'Confirm Location' : label}
                </Text>
                <Text style={[styles.locationCoords, { color: muted }]}>
                  {draftLat.toFixed(6)}, {draftLng.toFixed(6)}
                </Text>
              </View>
            </View>

            {/* Action buttons */}
            {target === 'select' ? (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.actionBtnWrap}
                onPress={() => {
                  emitGlobalLocation(draftLat, draftLng);
                  safeBack('/(tabs)');
                }}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionBtnGrad}
                >
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.actionBtnText}>Confirm Selected Location</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={{ gap: 10 }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.actionBtnWrap}
                  onPress={openInExternalMaps}
                >
                  <LinearGradient
                    colors={['#005d90', '#0077b6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionBtnGrad}
                  >
                    <Ionicons name="navigate" size={20} color="white" />
                    <Text style={styles.actionBtnText}>Open in Maps</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.actionBtnWrap, { backgroundColor: inputBg, borderRadius: 16 }]}
                  onPress={() => router.push('/search-map' as any)}
                >
                  <View style={[styles.actionBtnGrad, { backgroundColor: 'transparent' }]}>
                    <Ionicons name="map-outline" size={20} color="#005d90" />
                    <Text style={[styles.actionBtnText, { color: '#005d90' }]}>Explore Full Area Map</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  headerSub: { fontSize: 13, fontWeight: '500', marginTop: 1 },
  headerIconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  mapWrapper: { flex: 1, position: 'relative' },

  typeSelectorWrap: {
    position: 'absolute', top: 16, right: 16,
    borderRadius: 16, padding: 6, gap: 4,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 5,
  },
  typeBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  typeBtnActive: { backgroundColor: '#005d90' },
  typeBtnText: { fontSize: 12, fontWeight: '700' },

  floatingActionBox: { position: 'absolute', bottom: 28, left: 16, right: 16 },
  actionCard: {
    borderRadius: 28, padding: 20, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 10,
  },
  locationInfo: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  miniMapWrap: { width: 58, height: 58, borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  locationTitle: { fontSize: 17, fontWeight: '800', marginBottom: 3 },
  locationCoords: { fontSize: 12, fontWeight: '500', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  actionBtnWrap: { borderRadius: 16, overflow: 'hidden' },
  actionBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 15,
  },
  actionBtnText: { color: 'white', fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },

  errorIconWrap: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  errorTitle: { fontSize: 24, fontWeight: '900', marginBottom: 8, letterSpacing: -0.4 },
  errorSub: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  errorBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 15, borderRadius: 16 },
  errorBackBtnText: { color: 'white', fontSize: 15, fontWeight: '800' },
});
