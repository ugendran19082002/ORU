import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { useAppTheme } from '@/providers/ThemeContext';
import { ExpoMap } from '@/components/maps/ExpoMap';
import { useShopStore } from '@/stores/shopStore';

export default function SearchMapScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const { shops } = useShopStore();
  const { colors, isDark } = useAppTheme();

  useAndroidBackHandler(() => {
    safeBack('/(tabs)');
  });

  const [query, setQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState({ latitude: 12.9716, longitude: 80.2210 });
  const [showSearchBtn, setShowSearchBtn] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleMapTap = (coords: { latitude: number; longitude: number }) => {
    setSearchLocation(coords);
    setShowSearchBtn(true);
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
      setSearchLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not get your location.' });
    } finally {
      setLocating(false);
    }
  };

  const bg = colors.background;
  const surf = colors.surface;
  const border = colors.border;
  const text = colors.text;
  const muted = colors.muted;
  const inputBg = colors.inputBg;
  const placeholder = colors.placeholder;

  const floatBg = isDark ? 'rgba(17,24,39,0.96)' : 'rgba(255,255,255,0.97)';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Full-screen map */}
      <ExpoMap
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: 12.9716,
          longitude: 80.2210,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        region={{
          ...searchLocation,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showRoute={false}
        hideControls={true}
        draggable={true}
        onMarkerDragEnd={handleMapTap}
        onMarkerPress={(m) => router.push(`/shop-detail/${m.id}` as any)}
        markers={[
          {
            latitude: searchLocation.latitude,
            longitude: searchLocation.longitude,
            title: 'Search Area',
            color: '#ef4444',
          },
          ...shops.map((shop) => ({
            id: shop.id,
            latitude: shop.lat,
            longitude: shop.lng,
            title: shop.name,
            color: '#005d90',
            iconType: 'shop' as const,
          })),
        ]}
      />

      {/* "Search this area" pill */}
      {showSearchBtn && (
        <TouchableOpacity
          style={styles.searchThisArea}
          onPress={() => setShowSearchBtn(false)}
        >
          <Ionicons name="search" size={15} color="white" />
          <Text style={styles.searchThisAreaText}>Search this area</Text>
        </TouchableOpacity>
      )}

      {/* Floating Header — safe-area inset handled by paddingTop on parent */}
      <SafeAreaView edges={['top']} style={styles.headerSafe} pointerEvents="box-none">
        <View style={styles.header}>
          <View style={[styles.headerPill, { backgroundColor: floatBg, borderColor: border }]}>
            <BackButton fallback="/(tabs)" />
            <View style={[styles.searchBox, { backgroundColor: inputBg }]}>
              <Ionicons name="search" size={17} color={muted} />
              <TextInput
                style={[styles.input, { color: text }]}
                value={query}
                onChangeText={setQuery}
                placeholder="Search shops, areas..."
                placeholderTextColor={placeholder}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <Ionicons name="close-circle" size={17} color={muted} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={[styles.filterBtn, { backgroundColor: inputBg }]}>
              <Ionicons name="options" size={20} color={text} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Locate me FAB */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fabBtn, { backgroundColor: floatBg, borderColor: border }]}
          onPress={handleLocateMe}
          disabled={locating}
        >
          <Ionicons name={locating ? 'radio-button-on' : 'locate'} size={22} color="#005d90" />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <View style={[styles.bottomSheet, { backgroundColor: floatBg, borderTopColor: border }]}>
        <View style={[styles.sheetPill, { backgroundColor: border }]} />
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: text }]}>{shops.length} shops nearby</Text>
          <Text style={[styles.sheetSub, { color: muted }]}>Tap a card to view details</Text>
        </View>

        {shops.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={36} color={muted} />
            <Text style={[styles.emptyText, { color: muted }]}>No shops found in this area</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardScroll}
          >
            {shops.map((shop) => (
              <TouchableOpacity
                key={shop.id}
                style={[styles.shopCard, { backgroundColor: colors.surfaceElevated ?? surf, borderColor: border }]}
                onPress={() => router.push(`/shop-detail/${shop.id}` as any)}
                activeOpacity={0.85}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.shopName, { color: text }]} numberOfLines={1}>{shop.name}</Text>
                  <View style={[styles.ratingBadge, { backgroundColor: isDark ? '#2d2000' : '#fffbe6' }]}>
                    <Ionicons name="star" size={10} color="#f59e0b" />
                    <Text style={[styles.ratingText, { color: '#b45309' }]}>{shop.rating}</Text>
                  </View>
                </View>
                <Text style={[styles.shopSub, { color: muted }]}>{shop.area} · {shop.distanceKm} km</Text>

                <View style={[styles.cardBottom, { borderTopColor: border }]}>
                  <Text style={[styles.priceText, { color: '#005d90' }]}>From ₹{shop.pricePerCan}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: shop.isOpen ? (isDark ? '#052e16' : '#e8f5e9') : (isDark ? '#2d0a0a' : '#ffebee') },
                  ]}>
                    <Text style={[styles.statusText, { color: shop.isOpen ? '#2e7d32' : '#c62828' }]}>
                      {shop.isOpen ? 'OPEN' : 'CLOSED'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerSafe: { position: 'absolute', top: 0, left: 0, right: 0 },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  headerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 28, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
  },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 20, paddingHorizontal: 14, height: 40 },
  input: { flex: 1, fontSize: 14, fontWeight: '600' },
  filterBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  searchThisArea: {
    position: 'absolute', top: 120, alignSelf: 'center',
    backgroundColor: '#005d90', flexDirection: 'row', alignItems: 'center',
    gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  searchThisAreaText: { color: 'white', fontWeight: '800', fontSize: 13 },

  fabContainer: { position: 'absolute', bottom: 240, right: 16 },
  fabBtn: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5,
  },

  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1, paddingTop: 12, paddingBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 10,
  },
  sheetPill: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  sheetHeader: { paddingHorizontal: 20, marginBottom: 14 },
  sheetTitle: { fontSize: 18, fontWeight: '900' },
  sheetSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },

  cardScroll: { paddingHorizontal: 16, gap: 14 },
  shopCard: {
    width: 260, borderRadius: 24, padding: 18,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 4 },
  shopName: { flex: 1, fontSize: 16, fontWeight: '900' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
  ratingText: { fontSize: 11, fontWeight: '800' },
  shopSub: { fontSize: 12, fontWeight: '500', marginBottom: 14 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTopWidth: 1 },
  priceText: { fontSize: 14, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },

  emptyState: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: '600' },
});
