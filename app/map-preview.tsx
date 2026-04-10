import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';

import { LinearGradient } from 'expo-linear-gradient';

import { ExpoMap, ExpoMarker } from '@/components/maps/ExpoMap';
import { emitGlobalLocation } from '@/utils/locationEvents';


// Fallback type for Region to avoid lint errors on web
type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export default function MapPreviewScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();

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
  const [parsedMarkers, setParsedMarkers] = React.useState<any[]>([]);
  const label = title || 'Location';

  React.useEffect(() => {
    if (markers) {
      try {
        setParsedMarkers(JSON.parse(markers));
      } catch (e) {
        console.error('Failed to parse markers:', e);
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

  console.log('=== [MAP PREVIEW START] ===');
  console.log('Incoming Raw Params:', { lat, lng, title });
  console.log('Parsed Coords:', { latitude: draftLat, longitude: draftLng, label });

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

  console.log('Is valid coordinate:', isValidCoord);

  const openInExternalMaps = () => {
    if (!isValidCoord) {
      Alert.alert("Error", "Invalid coordinates provided.");
      return;
    }

    Alert.alert(
      'Open Navigation',
      `Would you like to open directions to "${label}" in your device's maps app?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Maps',
          onPress: () => {
            const scheme = Platform.select({
              ios: 'maps:0,0?q=',
              android: 'geo:0,0?q=',
            });
            const latLng = `${draftLat},${draftLng}`;
            const url = Platform.select({
              ios: `maps:0,0?q=${label}@${latLng}`,
              android: `geo:0,0?q=${latLng}(${label})`,
              default: `https://www.openstreetmap.org/?mlat=${draftLat}&mlon=${draftLng}&zoom=15`,
            });

            console.log('Opening External Map URL:', url);

            if (url) {
              Linking.openURL(url).catch((err) => {
                console.error('❌ [MAP PREVIEW] External Map Fail:', err);
                Alert.alert("Error", "Could not open map application.");
              });
            }
          },
        },
      ]
    );
  };

  if (!isValidCoord) {
    console.warn('⛔ [MAP PREVIEW] Invalid coords detected, showing error UI');
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#f87171" />
          <Text style={styles.errorTitle}>Location Error</Text>
          <Text style={styles.errorSub}>
            The provided coordinates ({lat}, {lng}) are invalid or missing. Please re-pin the location in your profile or address book.
          </Text>
          <TouchableOpacity 
            style={styles.errorBackBtn} 
            onPress={() => {
              console.log('Error UI: Go Back clicked');
              safeBack('/(tabs)');
            }}
          >

            <Text style={styles.errorBackBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <BackButton fallback="/(tabs)" />
        <View style={{ flex: 1 }}>

          <Text style={styles.headerTitle}>Location Preview</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{label}</Text>
        </View>
        <TouchableOpacity style={styles.shareBtn}>
          <Ionicons name="share-outline" size={22} color="#005d90" />
        </TouchableOpacity>
      </View>

      <View style={styles.mapWrapper}>
        <ExpoMap
          style={styles.map}
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

        {/* FLOATING ACTION BOX */}
        <View style={styles.floatingActionBox}>
          <LinearGradient
            colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,1)']}
            style={styles.actionCard}
          >
            <View style={styles.locationInfo}>
              <View style={styles.iconCircle}>
                <Ionicons name="location" size={24} color="#005d90" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.locationTitle}>{target === 'select' ? "Confirm Location" : label}</Text>
                <Text style={styles.locationCoords}>
                  {draftLat.toFixed(6)}, {draftLng.toFixed(6)}
                </Text>
              </View>
            </View>

            {target === 'select' ? (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.navigateBtn}
                onPress={() => {
                  emitGlobalLocation(draftLat, draftLng);
                  safeBack('/(tabs)');
                }}

              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.navigateBtnGrad}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                  <Text style={styles.navigateBtnText}>Confirm Selected Location</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={{ gap: 10 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.navigateBtn}
                  onPress={openInExternalMaps}
                >
                  <LinearGradient
                    colors={['#005d90', '#0077b6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.navigateBtnGrad}
                  >
                    <Ionicons name="navigate" size={20} color="white" />
                    <Text style={styles.navigateBtnText}>Open in Google Maps</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.navigateBtn, { backgroundColor: '#f1f5f9' }]}
                  onPress={() => router.push('/search-map' as any)}
                >
                  <View style={[styles.navigateBtnGrad, { backgroundColor: 'transparent' }]}>
                    <Ionicons name="map-outline" size={20} color="#005d90" />
                    <Text style={[styles.navigateBtnText, { color: '#005d90' }]}>Explore Full Area Map</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  headerSub: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapWrapper: { flex: 1, position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject },
  
  customMarker: { alignItems: 'center' },
  markerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#005d90',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'white',
    marginTop: -2,
  },

  floatingActionBox: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  actionCard: {
    borderRadius: 28,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#e0f0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  locationCoords: { fontSize: 13, color: '#64748b', fontWeight: '500', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  
  navigateBtn: { borderRadius: 18, overflow: 'hidden' },
  navigateBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  navigateBtnText: { color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f8fafc',
  },
  errorTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 24,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  errorSub: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  errorBackBtn: {
    backgroundColor: '#005d90',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: '#005d90',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  errorBackBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
});
