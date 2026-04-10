import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeafletMapRef {
  panTo: (lat: number, lng: number) => void;
}

export interface LeafletMarker {
  latitude: number;
  longitude: number;
  title?: string;
  /** Leaflet color name or hex e.g. '#005d90' */
  color?: string;
  /** Built-in icon types */
  iconType?: "pin" | "bicycle" | "home" | "shop";
}

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  title?: string;
  style?: any;
  draggable?: boolean;
  onMarkerDragEnd?: (coords: { latitude: number; longitude: number }) => void;
  /** Pass multiple markers for tracking views (overrides single pin when set) */
  markers?: LeafletMarker[];
  /** Draw a polyline route between all marker positions */
  showRoute?: boolean;
  /** 'standard' or 'satellite' */
  mapType?: 'standard' | 'satellite' | 'hybrid' | 'terrain' | 'none';
  /** Hide internal MapType switcher and zoom buttons */
  hideControls?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const LeafletMap = forwardRef<LeafletMapRef, LeafletMapProps>(
  (
    {
      latitude,
      longitude,
      zoom = 15,
      title = "Location",
      style,
      draggable = false,
      onMarkerDragEnd,
      markers,
      showRoute = false,
      mapType = 'terrain',
      hideControls = false,
    },
    ref,
  ) => {
    const webviewRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      panTo: (lat: number, lng: number) => {
        webviewRef.current?.injectJavaScript(`panTo(${lat}, ${lng}); true;`);
      },
    }));

    // Sync mapType prop to internal WebView
    React.useEffect(() => {
      let internalMode = 'std';
      if (mapType === 'satellite' || mapType === 'hybrid') internalMode = 'sat';
      if (mapType === 'terrain') internalMode = 'ter';
      
      webviewRef.current?.injectJavaScript(`if(typeof switchLayer === 'function') switchLayer('${internalMode}'); true;`);
    }, [mapType]);

    const handleMessage = useCallback(
      (event: any) => {
        try {
          const msg = JSON.parse(event.nativeEvent.data);
          if (
            (msg.type === "markerDragEnd" || msg.type === "mapPress") &&
            onMarkerDragEnd
          ) {
            onMarkerDragEnd({
              latitude: msg.payload.latitude,
              longitude: msg.payload.longitude,
            });
          }
        } catch (e) {}
      },
      [onMarkerDragEnd],
    );

    // Build JS arrays for multi-marker mode
    const markersJs = markers
      ? JSON.stringify(markers)
      : JSON.stringify([
          { latitude, longitude, title, color: "#005d90", iconType: "pin" },
        ]);

    const mapHtml = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{height:100%;width:100%;overflow:hidden;background:#f8fafc}
    #map{height:100vh;width:100vw}
    .leaflet-control-attribution{display:none!important}
    /* ThanniGo Zoom Controls */
    /* Layer Toggle */
    .layer-ctrl { position: absolute; bottom: 24px; right: 16px; background: white; border-radius: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.2); display: flex; flex-direction: column; overflow: hidden; z-index: 1000; border: 1.5px solid #e2e8f0; }
    .layer-btn { padding: 10px 14px; font-size: 11px; font-weight: 800; color: #64748b; text-align: center; border: none; background: white; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; }
    .layer-btn.active { background: #005d90; color: white; }
    .layer-btn:not(:last-child) { border-bottom: 1.5px solid #f1f4f9; }
    /* Pin marker */
    .cpw{display:flex;flex-direction:column;align-items:center}
    .cpc{width:38px;height:38px;border-radius:50%;border:3px solid white;box-shadow:0 4px 14px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center}
    .cpa{width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid white;margin-top:-2px}
    /* Driver marker */
    .drv{width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:16px}
    /* Drag hint */
    .drag-label{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);background:rgba(0,93,144,.88);color:white;padding:7px 16px;border-radius:20px;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;white-space:nowrap;pointer-events:none;z-index:9999;animation:fadeit 4s ease forwards}
    @keyframes fadeit{0%,60%{opacity:1}100%{opacity:0}}
  </style>
</head>
<body>
<div id="map"></div>
<div class="layer-ctrl" style="\${HIDE_CONTROLS ? 'display:none' : ''}">
  <button id="btn-std" class="layer-btn \${INITIAL_MODE === 'std' ? 'active' : ''}" onclick="switchLayer('std')">Map</button>
  <button id="btn-sat" class="layer-btn \${INITIAL_MODE === 'sat' ? 'active' : ''}" onclick="switchLayer('sat')">Sat</button>
  <button id="btn-ter" class="layer-btn \${INITIAL_MODE === 'ter' ? 'active' : ''}" onclick="switchLayer('ter')">Terr</button>
</div>
<script>
  var MARKERS = ${markersJs};
  var DRAGGABLE = ${draggable ? "true" : "false"};
  var SHOW_ROUTE = ${showRoute ? "true" : "false"};
  var LAT = ${latitude};
  var LNG = ${longitude};
  var ZOOM = ${zoom};
  var HIDE_CONTROLS = ${hideControls};
  var INITIAL_MODE = 'std';
  if ('${mapType}' === 'satellite' || '${mapType}' === 'hybrid') INITIAL_MODE = 'sat';
  if ('${mapType}' === 'terrain') INITIAL_MODE = 'ter';

  var map = L.map('map',{attributionControl:false,tap:true,zoomControl:false}).setView([LAT,LNG],ZOOM);
  if (!HIDE_CONTROLS) {
    L.control.zoom({ position: 'topleft' }).addTo(map);
  }

  var standardLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,subdomains:['a','b','c']});
  var satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri'
  });
  var terrainLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri'
  });

  if (INITIAL_MODE === 'sat') {
    satelliteLayer.addTo(map);
  } else if (INITIAL_MODE === 'ter') {
    terrainLayer.addTo(map);
  } else {
    standardLayer.addTo(map);
  }

  function switchLayer(type) {
    map.removeLayer(standardLayer);
    map.removeLayer(satelliteLayer);
    map.removeLayer(terrainLayer);
    
    document.getElementById('btn-std').classList.remove('active');
    document.getElementById('btn-sat').classList.remove('active');
    document.getElementById('btn-ter').classList.remove('active');

    if (type === 'sat') {
      satelliteLayer.addTo(map);
      document.getElementById('btn-sat').classList.add('active');
    } else if (type === 'ter') {
      terrainLayer.addTo(map);
      document.getElementById('btn-ter').classList.add('active');
    } else {
      standardLayer.addTo(map);
      document.getElementById('btn-std').classList.add('active');
    }
  }

  function makeIcon(m) {
    var color = m.color || '#005d90';
    var type = m.iconType || 'pin';
    var html = '';
    if (type === 'bicycle') {
      html = '<div class="drv" style="background:'+color+'">🚲</div>';
      return L.divIcon({className:'',iconSize:[36,36],iconAnchor:[18,18],popupAnchor:[0,-18],html:html});
    }
    if (type === 'home') {
      html = '<div class="drv" style="background:'+color+'">🏠</div>';
      return L.divIcon({className:'',iconSize:[36,36],iconAnchor:[18,18],popupAnchor:[0,-18],html:html});
    }
    if (type === 'shop') {
      html = '<div class="drv" style="background:'+color+'">🏪</div>';
      return L.divIcon({className:'',iconSize:[36,36],iconAnchor:[18,18],popupAnchor:[0,-18],html:html});
    }
    // default: custom pin
    html = '<div class="cpw">'
      +'<div class="cpc" style="background:'+color+'">'
      +'<svg viewBox="0 0 24 24" width="18" height="18" fill="white" xmlns="http://www.w3.org/2000/svg">'
      +'<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z"/>'
      +'</svg></div>'
      +'<div class="cpa"></div></div>';
    return L.divIcon({className:'',iconSize:[38,48],iconAnchor:[19,48],popupAnchor:[0,-48],html:html});
  }

  var mainMarker = null;
  var latLngs = [];

  MARKERS.forEach(function(m, idx) {
    var icon = makeIcon(m);
    var lm = L.marker([m.latitude, m.longitude], {
      icon: icon,
      draggable: DRAGGABLE && idx === 0,
      autoPan: true
    }).addTo(map);
    if (m.title) lm.bindPopup('<b style="font-family:-apple-system,sans-serif;font-size:13px">'+m.title+'</b>').openPopup();
    if (idx === 0) mainMarker = lm;
    latLngs.push([m.latitude, m.longitude]);
  });

  if (SHOW_ROUTE && latLngs.length > 1) {
    L.polyline(latLngs, {
      color: '#005d90',
      weight: 4,
      opacity: 0.7,
      dashArray: '8, 6'
    }).addTo(map);
    // Fit map to show all markers
    map.fitBounds(latLngs, {padding:[40,40]});
  }

  if (DRAGGABLE && mainMarker) {
    var hint = document.createElement('div');
    hint.className = 'drag-label';
    hint.textContent = 'Drag pin or tap to move';
    document.body.appendChild(hint);
    setTimeout(function(){if(hint.parentNode)hint.parentNode.removeChild(hint);},4500);

    mainMarker.on('dragend', function(e){
      var ll = e.target.getLatLng();
      send('markerDragEnd',{latitude:ll.lat,longitude:ll.lng});
    });
    map.on('click', function(e){
      mainMarker.setLatLng(e.latlng);
      send('mapPress',{latitude:e.latlng.lat,longitude:e.latlng.lng});
    });
  }

  function send(type,payload){
    var msg = JSON.stringify({type:type,payload:payload});
    if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
  }

  function panTo(lat,lng){
    map.setView([lat,lng],map.getZoom(),{animate:true});
    if(mainMarker) mainMarker.setLatLng([lat,lng]);
  }

  document.addEventListener('message',function(e){try{var m=JSON.parse(e.data);if(m.type==='panTo')panTo(m.payload.latitude,m.payload.longitude);}catch(x){}});
  window.addEventListener('message',function(e){try{var m=JSON.parse(e.data);if(m.type==='panTo')panTo(m.payload.latitude,m.payload.longitude);}catch(x){}});
</script>
</body>
</html>`;

    return (
      <View style={[styles.container, style]}>
        <WebView
          ref={webviewRef}
          originWhitelist={["*"]}
          source={{ html: mapHtml }}
          style={styles.webview}
          startInLoadingState
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          allowFileAccess
          mixedContentMode="always"
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#005d90" />
            </View>
          )}
          onError={(e) => console.warn("[LEAFLET] error:", e.nativeEvent)}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden" },
  webview: { flex: 1, backgroundColor: "#f8fafc" },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
});
