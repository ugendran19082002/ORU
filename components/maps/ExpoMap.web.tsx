import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { ViewStyle } from 'react-native';
import { LeafletMap, LeafletMapRef, LeafletMarker } from './LeafletMap';

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
  draggable?: boolean;
  onMarkerDragEnd?: (coords: { latitude: number; longitude: number }) => void;
  markerTitle?: string;
  markers?: LeafletMarker[];
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

export const ExpoMap = forwardRef<any, ExpoMapProps>((props, ref) => {
  const {
    initialRegion,
    region,
    style,
    draggable,
    onMarkerDragEnd,
    markerTitle,
    markers,
    showRoute,
  } = props;

  const leafletRef = useRef<LeafletMapRef>(null);

  useImperativeHandle(ref, () => ({
    animateToRegion: (r: MapRegion, _duration?: number) => {
      leafletRef.current?.panTo(r.latitude, r.longitude);
    },
  }));

  const lat = region?.latitude ?? initialRegion?.latitude ?? 0;
  const lng = region?.longitude ?? initialRegion?.longitude ?? 0;

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
});
ExpoMap.displayName = 'ExpoMap';

export const ExpoMarker = (props: ExpoMarkerProps) => {
  return null;
};

export const PROVIDER_GOOGLE = null;
