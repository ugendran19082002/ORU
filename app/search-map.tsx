import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { useAppTheme } from '@/providers/ThemeContext';
import { ExpoMap } from '@/components/maps/ExpoMap';
import { useShopStore } from '@/stores/shopStore';
import { roleAccent } from '@/constants/theme';
import { addressApi } from '@/api/addressApi';

const ACCENT = roleAccent.customer;

type FilterKey = 'open' | 'topRated' | 'nearest' | 'cheap';

const FILTERS: { key: FilterKey; label: string; icon: string }[] = [
  { key: 'open',     label: 'Open Now',  icon: 'time-outline' },
  { key: 'topRated', label: 'Top Rated', icon: 'star-outline' },
  { key: 'nearest',  label: 'Near 2km',  icon: 'navigate-outline' },
  { key: 'cheap',    label: 'Under ₹50', icon: 'pricetag-outline' },
];

// Sheet snap heights as fractions of screen height
const SHEET_COLLAPSED = 72;   // just the handle bar
const SHEET_PEEK      = 0.38; // 38% of screen — shows 2 cards
const SHEET_FULL      = 0.72; // 72% of screen

export default function SearchMapScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const { shops, loadShops } = useShopStore();
  const { colors, isDark } = useAppTheme();
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const { height: screenH, width: screenW } = useWindowDimensions();

  useAndroidBackHandler(() => { safeBack('/(tabs)'); });

  const defaultLat = parseFloat(params.lat ?? 'NaN') || 12.9716;
  const defaultLng = parseFloat(params.lng ?? 'NaN') || 80.2210;

  const [query, setQuery] = useState('');
  const [locating, setLocating] = useState(false);
  const [snapIndex, setSnapIndex] = useState(1); // 0=collapsed, 1=peek, 2=full
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());
  const [searchCenter, setSearchCenter] = useState({ latitude: defaultLat, longitude: defaultLng });
  const [showSearchHere, setShowSearchHere] = useState(false);
  const [pendingCenter, setPendingCenter] = useState<{ latitude: number; longitude: number } | null>(null);

  const sheetAnim = useRef(new Animated.Value(screenH * SHEET_PEEK)).current;

  // On mount: center on default address → GPS → fallback
  useEffect(() => {
    const init = async () => {
      // If params were passed (from home screen), use them directly
      if (params.lat && params.lng) {
        await loadShops({ lat: defaultLat, lng: defaultLng });
        return;
      }

      let lat = defaultLat;
      let lng = defaultLng;

      // 1. Try default saved address first
      try {
        const res = await addressApi.getAddresses();
        const addresses: any[] = res.data.data || [];
        const defaultAddr = addresses.find(a => a.is_default);
        if (defaultAddr?.latitude && defaultAddr?.longitude) {
          lat = Number(defaultAddr.latitude);
          lng = Number(defaultAddr.longitude);
          setSearchCenter({ latitude: lat, longitude: lng });
          await loadShops({ lat, lng });
          return;
        }
      } catch { /* fall through to GPS */ }

      // 2. GPS fallback
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
          setSearchCenter({ latitude: lat, longitude: lng });
        }
      } catch { /* use hardcoded fallback */ }

      await loadShops({ lat, lng });
    };
    init();
  }, []);

  const snapHeights = [SHEET_COLLAPSED, screenH * SHEET_PEEK, screenH * SHEET_FULL];

  const snapTo = (index: number) => {
    setSnapIndex(index);
    Animated.spring(sheetAnim, {
      toValue: snapHeights[index],
      tension: 65, friction: 11,
      useNativeDriver: false,
    }).start();
  };

  const cycleSnap = () => snapTo(snapIndex === 2 ? 0 : snapIndex + 1);

  const toggleFilter = (key: FilterKey) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleLocateMe = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Enable location to use this feature.' });
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setSearchCenter(coords);
      setShowSearchHere(false);
      await loadShops({ lat: coords.latitude, lng: coords.longitude });
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not get your location.' });
    } finally {
      setLocating(false);
    }
  };

  const handleMapDrag = useCallback((coords: { latitude: number; longitude: number }) => {
    setPendingCenter(coords);
    setShowSearchHere(true);
  }, []);

  const handleSearchHere = async () => {
    if (!pendingCenter) return;
    setSearchCenter(pendingCenter);
    setShowSearchHere(false);
    setPendingCenter(null);
    await loadShops({ lat: pendingCenter.latitude, lng: pendingCenter.longitude });
  };

  const filteredShops = shops
    .filter(s => query.trim() === '' || s.name.toLowerCase().includes(query.toLowerCase()))
    .filter(s => !activeFilters.has('open')     || s.isOpen)
    .filter(s => !activeFilters.has('topRated') || s.rating >= 4.5)
    .filter(s => !activeFilters.has('nearest')  || s.distanceKm <= 2)
    .filter(s => !activeFilters.has('cheap')    || s.pricePerCan < 50)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const floatBg = isDark ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.97)';
  const { border, text, muted, inputBg, placeholder } = colors;

  // FAB sits just above sheet peek height
  const fabBottom = snapHeights[1] + 12;

  // "Search here" pill sits below the header (~top safe area + header pill + filter row)
  const searchHereTop = 58 + 52 + 44; // approx: safe inset + header + filters

  const snapIcon =
    snapIndex === 0 ? 'chevron-up' :
    snapIndex === 1 ? 'chevron-up' : 'chevron-down';

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ── Full-screen map ── */}
      <ExpoMap
        style={StyleSheet.absoluteFillObject}
        initialRegion={{ ...searchCenter, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        region={{ ...searchCenter, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        showRoute={false}
        hideControls={true}
        draggable={true}
        onMarkerDragEnd={handleMapDrag}
        onMarkerPress={m => m.id && router.push(`/shop-detail/${m.id}` as any)}
        markers={[
          { latitude: searchCenter.latitude, longitude: searchCenter.longitude, title: 'Search Area', color: ACCENT },
          ...filteredShops.map(shop => ({
            id: shop.id,
            latitude: shop.lat,
            longitude: shop.lng,
            title: shop.name,
            color: shop.isOpen ? '#16a34a' : '#dc2626',
            iconType: 'shop' as const,
          })),
        ]}
      />

      {/* ── "Search this area" pill — centered ── */}
      {showSearchHere && (
        <View style={[styles.searchHereWrap, { top: searchHereTop }]} pointerEvents="box-none">
          <TouchableOpacity style={styles.searchHerePill} onPress={handleSearchHere}>
            <Ionicons name="search" size={14} color="white" />
            <Text style={styles.searchHereText}>Search this area</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Floating header ── */}
      <SafeAreaView edges={['top']} style={styles.headerSafe} pointerEvents="box-none">
        <View style={[styles.headerPill, { backgroundColor: floatBg, borderColor: border }]}>
          <BackButton fallback="/(tabs)" />
          <View style={[styles.searchBox, { backgroundColor: inputBg }]}>
            <Ionicons name="search" size={15} color={muted} />
            <TextInput
              style={[styles.searchInput, { color: text }]}
              value={query}
              onChangeText={setQuery}
              placeholder="Search shops..."
              placeholderTextColor={placeholder}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={15} color={muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          pointerEvents="box-none"
        >
          {FILTERS.map(f => {
            const active = activeFilters.has(f.key);
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.chip, { backgroundColor: active ? ACCENT : floatBg, borderColor: active ? ACCENT : border }]}
                onPress={() => toggleFilter(f.key)}
              >
                <Ionicons name={f.icon as any} size={12} color={active ? 'white' : muted} />
                <Text style={[styles.chipText, { color: active ? 'white' : text }]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
          {activeFilters.size > 0 && (
            <TouchableOpacity
              style={[styles.chip, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}
              onPress={() => setActiveFilters(new Set())}
            >
              <Ionicons name="close" size={12} color="#dc2626" />
              <Text style={[styles.chipText, { color: '#dc2626' }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* ── Locate me FAB ── */}
      <TouchableOpacity
        style={[styles.fab, { bottom: fabBottom, backgroundColor: floatBg, borderColor: border }]}
        onPress={handleLocateMe}
        disabled={locating}
      >
        <Ionicons name={locating ? 'radio-button-on' : 'locate'} size={20} color={ACCENT} />
      </TouchableOpacity>

      {/* ── Shop count badge ── */}
      <View style={[styles.countBadge, { bottom: fabBottom + 4, backgroundColor: ACCENT }]}>
        <Ionicons name="storefront-outline" size={12} color="white" />
        <Text style={styles.countText}>{filteredShops.length} shops</Text>
      </View>

      {/* ── Bottom sheet ── */}
      <Animated.View style={[styles.sheet, { backgroundColor: floatBg, borderTopColor: border, height: sheetAnim }]}>
        {/* Handle */}
        <TouchableOpacity style={styles.handle} onPress={cycleSnap} activeOpacity={0.7}>
          <View style={[styles.handlePill, { backgroundColor: border }]} />
          <View style={styles.handleRow}>
            <View>
              <Text style={[styles.sheetTitle, { color: text }]}>{filteredShops.length} shops nearby</Text>
              {snapIndex > 0 && <Text style={[styles.sheetSub, { color: muted }]}>Tap card to view · Drag to explore</Text>}
            </View>
            <TouchableOpacity
              style={[styles.snapBtn, { backgroundColor: `${ACCENT}15`, borderColor: `${ACCENT}30` }]}
              onPress={cycleSnap}
            >
              <Ionicons name={snapIcon} size={14} color={ACCENT} />
              <Text style={[styles.snapBtnText, { color: ACCENT }]}>
                {snapIndex === 0 ? 'Show' : snapIndex === 1 ? 'Expand' : 'Collapse'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Cards */}
        {snapIndex > 0 && (
          filteredShops.length === 0 ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIconWrap, { backgroundColor: `${ACCENT}15` }]}>
                <Ionicons name="storefront-outline" size={28} color={ACCENT} />
              </View>
              <Text style={[styles.emptyTitle, { color: text }]}>No shops found</Text>
              <Text style={[styles.emptySub, { color: muted }]}>Try moving the map or clearing filters.</Text>
              {activeFilters.size > 0 && (
                <TouchableOpacity
                  style={[styles.clearBtn, { backgroundColor: ACCENT }]}
                  onPress={() => setActiveFilters(new Set())}
                >
                  <Text style={styles.clearBtnText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardScroll}
              decelerationRate="fast"
              snapToInterval={screenW * 0.72 + 14}
              snapToAlignment="start"
            >
              {filteredShops.map(shop => (
                <TouchableOpacity
                  key={shop.id}
                  style={[styles.card, { width: screenW * 0.72, backgroundColor: colors.surface, borderColor: border }]}
                  onPress={() => router.push(`/shop-detail/${shop.id}` as any)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.statusStrip, { backgroundColor: shop.isOpen ? '#16a34a' : '#dc2626' }]} />
                  <View style={styles.cardInner}>
                    {/* Top row */}
                    <View>
                      <View style={styles.cardTop}>
                        <Text style={[styles.cardName, { color: text }]} numberOfLines={1}>{shop.name}</Text>
                        <View style={[styles.ratingBadge, { backgroundColor: isDark ? '#2d2000' : '#fffbe6' }]}>
                          <Ionicons name="star" size={10} color="#f59e0b" />
                          <Text style={[styles.ratingText, { color: '#b45309' }]}>{Number(shop.rating).toFixed(1)}</Text>
                        </View>
                      </View>
                      <Text style={[styles.cardArea, { color: muted }]} numberOfLines={1}>{shop.area}</Text>
                    </View>

                    {/* Meta pills */}
                    <View style={styles.metaRow}>
                      <View style={[styles.metaPill, { backgroundColor: `${ACCENT}12` }]}>
                        <Ionicons name="navigate-outline" size={11} color={ACCENT} />
                        <Text style={[styles.metaPillText, { color: ACCENT }]}>{shop.distanceKm.toFixed(1)} km</Text>
                      </View>
                      <View style={[styles.metaPill, { backgroundColor: colors.inputBg }]}>
                        <Ionicons name="pricetag-outline" size={11} color={muted} />
                        <Text style={[styles.metaPillText, { color: muted }]}>₹{shop.pricePerCan}/can</Text>
                      </View>
                      {shop.eta ? (
                        <View style={[styles.metaPill, { backgroundColor: colors.inputBg }]}>
                          <Ionicons name="time-outline" size={11} color={muted} />
                          <Text style={[styles.metaPillText, { color: muted }]}>{shop.eta}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Footer */}
                    <View style={[styles.cardFooter, { borderTopColor: border }]}>
                      <View style={[styles.statusTag, { backgroundColor: shop.isOpen ? '#dcfce7' : '#fee2e2' }]}>
                        <View style={[styles.statusDot, { backgroundColor: shop.isOpen ? '#16a34a' : '#dc2626' }]} />
                        <Text style={[styles.statusTagText, { color: shop.isOpen ? '#16a34a' : '#dc2626' }]}>
                          {shop.isOpen ? 'Open Now' : 'Closed'}
                        </Text>
                      </View>
                      <View style={[styles.viewBtn, { backgroundColor: ACCENT }]}>
                        <Text style={styles.viewBtnText}>View</Text>
                        <Ionicons name="arrow-forward" size={11} color="white" />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Header ──
  headerSafe: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerPill: {
    marginHorizontal: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 22, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
  },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 16, paddingHorizontal: 10, height: 36 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },

  filterRow: { paddingHorizontal: 14, paddingBottom: 6, gap: 7 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  chipText: { fontSize: 11, fontWeight: '700' },

  // ── Search here pill ──
  searchHereWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  searchHerePill: {
    backgroundColor: ACCENT, flexDirection: 'row', alignItems: 'center',
    gap: 7, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  searchHereText: { color: 'white', fontWeight: '800', fontSize: 13 },

  // ── FAB & count ──
  fab: {
    position: 'absolute', right: 16,
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5,
  },
  countBadge: {
    position: 'absolute', left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18,
  },
  countText: { color: 'white', fontWeight: '800', fontSize: 12 },

  // ── Sheet ──
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 10,
  },
  handle: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8 },
  handlePill: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 10 },
  handleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { fontSize: 16, fontWeight: '900' },
  sheetSub: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  snapBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  snapBtnText: { fontSize: 11, fontWeight: '700' },

  // ── Empty ──
  empty: { alignItems: 'center', paddingVertical: 24, gap: 8, paddingHorizontal: 24 },
  emptyIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '900' },
  emptySub: { fontSize: 13, textAlign: 'center' },
  clearBtn: { marginTop: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  clearBtnText: { color: 'white', fontWeight: '800', fontSize: 13 },

  // ── Cards ──
  cardScroll: { paddingHorizontal: 14, paddingBottom: 20, paddingTop: 4, gap: 12 },
  card: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, height: 168, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  statusStrip: { height: 3, width: '100%' },
  cardInner: { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardName: { flex: 1, fontSize: 14, fontWeight: '900', letterSpacing: -0.2 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  ratingText: { fontSize: 11, fontWeight: '800' },
  cardArea: { fontSize: 11, marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 6, flexWrap: 'nowrap' },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  metaPillText: { fontSize: 11, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1 },
  statusTag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTagText: { fontSize: 11, fontWeight: '700' },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  viewBtnText: { color: 'white', fontSize: 12, fontWeight: '800' },
});
