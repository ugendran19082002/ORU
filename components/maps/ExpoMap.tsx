import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Platform, ViewStyle } from 'react-native';
import Constants from 'expo-constants';
import { LeafletMap, LeafletMapRef, LeafletMarker } from './LeafletMap';


// ─── Types ────────────────────────────────────────────────────────────────────

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface ExpoMapProps {
  region?: MapRegion;
  initialRegion?: MapRegion;
  onRegionChangeComplete?: (region: MapRegion) => void;
  style?: ViewStyle;
  children?: React.ReactNode;
  showsUserLocation?: boolean;
  /** Enables drag + tap-to-move on the primary pin */
  draggable?: boolean;
  /** Called by Leaflet when user drags/taps the pin */
  onMarkerDragEnd?: (coords: { latitude: number; longitude: number }) => void;
  /** Label shown on the primary marker popup */
  markerTitle?: string;
  /** Multiple markers for tracking view (overrides single pin) */
  markers?: LeafletMarker[];
  /** Draw a dashed route polyline between markers */
  showRoute?: boolean;
}


export interface ExpoMarkerProps {
  coordinate: { latitude: number; longitude: number };
  title?: string;
  description?: string;
  draggable?: boolean;
  onDragEnd?: (e: any) => void;
  pinColor?: string;
  children?: React.ReactNode;
}

// ─── Native lazy-load ─────────────────────────────────────────────────────────

let NativeMapView: any = null;
let NativeMarker: any = null;
let PROVIDER_GOOGLE_NATIVE: any = null;
let UrlTile: any = null;

if (Platform.OS !== 'web') {
  try {
    const RNMaps = require('react-native-maps');
    NativeMapView   = RNMaps.default;
    NativeMarker    = RNMaps.Marker;
    PROVIDER_GOOGLE_NATIVE = RNMaps.PROVIDER_GOOGLE;
    UrlTile         = RNMaps.UrlTile;
    console.log('✅ [ExpoMap] react-native-maps loaded');
  } catch (e) {
    console.warn('⚠️ [ExpoMap] react-native-maps unavailable → Leaflet fallback');
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const hasValidGoogleKey = (): boolean => {
  const key = Constants.expoConfig?.android?.config?.googleMaps?.apiKey;
  return !!(
    key &&
    key !== 'PASTE_YOUR_GOOGLE_MAPS_API_KEY_HERE' &&
    key.length > 10
  );
};

// ─── ExpoMap ──────────────────────────────────────────────────────────────────

export const ExpoMap = forwardRef<any, ExpoMapProps>((props, ref) => {
  const {
    initialRegion,
    region,
    onRegionChangeComplete,
    style,
    showsUserLocation,
    children,
    draggable,
    onMarkerDragEnd,
    markerTitle,
    markers,
    showRoute,
  } = props;


  const leafletRef = useRef<LeafletMapRef>(null);
  const nativeRef  = useRef<any>(null);

  /** Expose animateToRegion so callers (e.g. addresses.tsx GPS) can pan the map */
  useImperativeHandle(ref, () => ({
    animateToRegion: (r: MapRegion, _duration?: number) => {
      if (nativeRef.current?.animateToRegion) {
        nativeRef.current.animateToRegion(r, _duration ?? 500);
      } else {
        leafletRef.current?.panTo(r.latitude, r.longitude);
      }
    },
  }));

  const useNative =
    Platform.OS !== 'web' && !!NativeMapView && hasValidGoogleKey();

  const lat = region?.latitude  ?? initialRegion?.latitude  ?? 0;
  const lng = region?.longitude ?? initialRegion?.longitude ?? 0;

  // ── Leaflet (no Google key / web) ────────────────────────────────────────
  if (!useNative) {
    console.log(
      `[ExpoMap] Leaflet path  platform=${Platform.OS}  googleKey=${hasValidGoogleKey()}`
    );
    return (
      <LeafletMap
        ref={leafletRef}
        latitude={lat}
        longitude={lng}
        style={style}
        title={markerTitle ?? 'Location'}
        draggable={draggable}
        onMarkerDragEnd={onMarkerDragEnd}
        markers={markers}
        showRoute={showRoute}
      />
    );

  }

  // ── Native react-native-maps (Google key present) ────────────────────────
  console.log('[ExpoMap] Native MapView path');
  return (
    <NativeMapView
      ref={nativeRef}
      provider={PROVIDER_GOOGLE_NATIVE}
      style={style}
      initialRegion={initialRegion}
      region={region}
      onRegionChangeComplete={onRegionChangeComplete}
      showsUserLocation={showsUserLocation}
      mapType="none"
    >
      <UrlTile
        urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maximumZ={19}
        flipY={false}
      />
      {children}
    </NativeMapView>
  );
});

// ─── ExpoMarker ───────────────────────────────────────────────────────────────
/**
 * Only renders in native-maps mode.
 * In Leaflet mode the marker lives inside the WebView HTML — no JSX needed.
 */
export const ExpoMarker = (props: ExpoMarkerProps) => {
  if (!NativeMarker || !hasValidGoogleKey() || Platform.OS === 'web') return null;

  const { coordinate, title, description, draggable, onDragEnd, pinColor, children } = props;
  return (
    <NativeMarker
      coordinate={coordinate}
      title={title}
      description={description}
      draggable={draggable}
      onDragEnd={onDragEnd}
      pinColor={pinColor}
    >
      {children}
    </NativeMarker>
  );
};

export const PROVIDER_GOOGLE = Platform.OS === 'web' ? 'google' : PROVIDER_GOOGLE_NATIVE;
