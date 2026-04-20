import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useShopStore } from '@/stores/shopStore';
import { useCartStore } from '@/stores/cartStore';
import { useOrderStore } from '@/stores/orderStore';
import { addressApi } from '@/api/addressApi';
import { apiClient } from '@/api/client';
import { systemApi } from '@/api/systemApi';
import { Shadow, roleAccent, roleSurface, roleGradients, Radius } from '@/constants/theme';
import { SkeletonShopCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppTheme } from '@/providers/ThemeContext';
import { ExpoMap } from '@/components/maps/ExpoMap';

const ACCENT = roleAccent.customer;
const SURF = roleSurface.customer;
const GRAD: [string, string] = [roleGradients.customer.start, roleGradients.customer.end];
const DEFAULT_MAX_DISTANCE_KM = 100;

const FILTERS = [
  { key: 'Open Now',    icon: 'time-outline',     check: (s: any) => s.isOpen && !s.isBusy },
  { key: 'Top Rated',   icon: 'star-outline',      check: (s: any) => s.rating >= 4.5 },
  { key: 'Under ₹50',  icon: 'pricetag-outline',   check: (s: any) => s.pricePerCan < 50 },
];

const getShopImage = (hero: string) => {
  switch (hero) {
    case 'water_can_2': return require('@/assets/images/water_can_2.jpg');
    case 'water_can_3': return require('@/assets/images/water_can_3.jpg');
    default: return require('@/assets/images/water_can_1.jpg');
  }
};

export default function HomeScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { setSelectedShop, loadShops, searchShops, fetchPersonalized, shops } = useShopStore();
  const { items: cartItems } = useCartStore();
  const { fetchOrders } = useOrderStore();

  const [search, setSearch] = useState('');
  const [loadingLoc, setLoadingLoc] = useState(true);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [requestedShopIds, setRequestedShopIds] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [isMapView, setIsMapView] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [favouriteIds, setFavouriteIds] = useState<string[]>([]);
  const [pendingShopId, setPendingShopId] = useState<string | null>(null);
  const [currentAddress, setCurrentAddress] = useState('Locating...');
  const [currentAddressTitle, setCurrentAddressTitle] = useState('Location');
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [personalizedShop, setPersonalizedShop] = useState<any>(null);
  const [maxDistanceKm, setMaxDistanceKm] = useState(DEFAULT_MAX_DISTANCE_KM);

  const cartCount = Object.values(cartItems).reduce((sum, q) => sum + q.quantity, 0);

  const fetchLoyaltyBalance = async () => {
    try {
      const res = await apiClient.get('/users/me');
      if (res.data?.status === 1) setLoyaltyPoints(res.data.data.loyalty_points || 0);
    } catch { /* silent */ }
  };

  const fetchMaxDistanceKm = async () => {
    try {
      const res = await systemApi.getSetting('max_distance_km');
      const parsed = Number(res.data?.setting_value);
      if (Number.isFinite(parsed) && parsed > 0) {
        setMaxDistanceKm(parsed);
        return parsed;
      }
    } catch { /* keep default */ }
    return DEFAULT_MAX_DISTANCE_KM;
  };

  const checkLocation = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') { router.replace('/location' as any); return; }
    let listingMaxDistanceKm = maxDistanceKm;
    try {
      listingMaxDistanceKm = await fetchMaxDistanceKm();
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setUserLoc({ lat, lng });

      let addresses: any[] = [];
      try {
        const res = await addressApi.getAddresses();
        addresses = res.data.data || [];
        setUserAddresses(addresses);
      } catch { /* silent */ }

      const defaultAddr = addresses.find(a => a.is_default);
      let shopLat = lat;
      let shopLng = lng;

      if (defaultAddr) {
        setCurrentAddressTitle(defaultAddr.label || 'Home');
        setCurrentAddress(`${defaultAddr.address_line1}, ${defaultAddr.city}`);
        shopLat = Number(defaultAddr.latitude);
        shopLng = Number(defaultAddr.longitude);
        setUserLoc({ lat: shopLat, lng: shopLng });
      } else {
        setCurrentAddressTitle('Current Location');
        try {
          const rev = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (rev?.[0]) {
            const p = rev[0];
            setCurrentAddress(`${p.district || p.name || p.city || 'Near You'}, ${p.city || ''}`);
          } else {
            setCurrentAddress(`${lat.toFixed(2)}, ${lng.toFixed(2)}`);
          }
        } catch { setCurrentAddress(`${lat.toFixed(2)}, ${lng.toFixed(2)}`); }
      }

      await loadShops({ lat: shopLat, lng: shopLng, limit: 100, max_distance_km: listingMaxDistanceKm });
      const hero = await fetchPersonalized(shopLat, shopLng);
      setPersonalizedShop(hero);
    } catch {
      const lat = 12.9716; const lng = 80.2210;
      setUserLoc({ lat, lng });
      await loadShops({ lat, lng, limit: 100, max_distance_km: listingMaxDistanceKm });
    } finally {
      setLoadingLoc(false);
    }
  };

  useFocusEffect(useCallback(() => {
    checkLocation();
    fetchLoyaltyBalance();
    fetchOrders();
  }, []));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([checkLocation(), fetchLoyaltyBalance()]);
    setRefreshing(false);
  }, []);

  const activeFilterDef = FILTERS.find(f => f.key === activeFilter);
  const filteredShops = shops
    .filter(s => search.trim() === '' || s.name.toLowerCase().includes(search.toLowerCase()))
    .filter(s => activeFilterDef ? activeFilterDef.check(s) : true)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  if (loadingLoc) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
          {[1, 2, 3].map(k => <SkeletonShopCard key={k} />)}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ── HEADER ── */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.locationBtn} onPress={() => router.push('/addresses' as any)} activeOpacity={0.7}>
          <View style={[styles.locationIconWrap, { backgroundColor: `${ACCENT}15` }]}>
            <Ionicons name="location" size={14} color={ACCENT} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.locationTitle, { color: colors.text }]}>
              {currentAddressTitle}
              <Text style={[styles.locationChevron, { color: ACCENT }]}> ›</Text>
            </Text>
            <Text style={[styles.locationSub, { color: colors.muted }]} numberOfLines={1}>{currentAddress}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: `${ACCENT}12` }]} onPress={() => router.push('/rewards' as any)}>
            <Ionicons name="gift-outline" size={18} color={ACCENT} />
            {loyaltyPoints > 0 && (
              <View style={[styles.badge, { backgroundColor: ACCENT }]}>
                <Text style={styles.badgeText}>{loyaltyPoints}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: `${ACCENT}12` }]} onPress={() => router.push('/notifications' as any)}>
            <Ionicons name="notifications-outline" size={18} color={ACCENT} />
            <View style={[styles.dot, { backgroundColor: colors.error }]} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: ACCENT }]} onPress={() => {
            const cartShopId = useCartStore.getState().shopId;
            if (cartShopId) {
              router.push({ pathname: '/order/checkout', params: { shopId: cartShopId } } as any);
            } else {
              router.push('/order/checkout' as any);
            }
          }}>
            <Ionicons name="cart-outline" size={18} color="white" />
            {cartCount > 0 && (
              <View style={[styles.badge, { backgroundColor: 'white' }]}>
                <Text style={[styles.badgeText, { color: ACCENT }]}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ACCENT]} tintColor={ACCENT} />}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── SEARCH BAR ── */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/(tabs)/search' as any)}
        >
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search shops, areas..."
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={v => {
              setSearch(v);
              if (v.trim().length > 2) searchShops(v, userLoc?.lat, userLoc?.lng);
              else if (v.trim().length === 0) checkLocation();
            }}
          />
          {search.length > 0
            ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color={colors.muted} /></TouchableOpacity>
            : <TouchableOpacity
                style={[styles.mapSearchBtn, { backgroundColor: `${ACCENT}15` }]}
                onPress={() => router.push({ pathname: '/search-map', params: { lat: userLoc?.lat, lng: userLoc?.lng } } as any)}
              >
                <Ionicons name="map-outline" size={15} color={ACCENT} />
                <Text style={[styles.mapSearchBtnText, { color: ACCENT }]}>Map</Text>
              </TouchableOpacity>
          }
        </TouchableOpacity>

        {/* ── FILTER CHIPS ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map(f => {
            const active = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.chip, { backgroundColor: active ? ACCENT : colors.surface, borderColor: active ? ACCENT : colors.border }]}
                onPress={() => setActiveFilter(active ? null : f.key)}
              >
                <Ionicons name={f.icon as any} size={13} color={active ? 'white' : ACCENT} />
                <Text style={[styles.chipText, { color: active ? 'white' : colors.text }]}>{f.key}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── REORDER / PROMO STRIP ── */}
        {personalizedShop ? (
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.reorderStrip}
            onPress={() => { setSelectedShop(personalizedShop.id); router.push(`/shop-detail/${personalizedShop.id}` as any); }}
          >
            <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.reorderGrad}>
              <View style={[styles.reorderIconWrap, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="flash" size={18} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reorderLabel}>ONE-TAP REORDER</Text>
                <Text style={styles.reorderName} numberOfLines={1}>{personalizedShop.name}</Text>
              </View>
              <View style={styles.reorderBtn}>
                <Text style={[styles.reorderBtnText, { color: ACCENT }]}>Order Again</Text>
                <Ionicons name="arrow-forward" size={13} color={ACCENT} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : null}

        {/* ── SECTION HEADER ── */}
        <View style={styles.sectionRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Shops Near You</Text>
            <Text style={[styles.sectionSub, { color: colors.muted }]}>
              {filteredShops.length} shops within {maxDistanceKm} km
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.viewToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setIsMapView(!isMapView)}
          >
            <Ionicons name={isMapView ? 'list-outline' : 'map-outline'} size={16} color={ACCENT} />
            <Text style={[styles.viewToggleText, { color: ACCENT }]}>{isMapView ? 'List' : 'Map'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── CONTENT ── */}
        {filteredShops.length === 0 ? (
          <EmptyState
            icon="sad-outline"
            title={search.trim() !== '' ? `No shops matching "${search}"` : 'No shops nearby'}
            subtitle={search.trim() !== '' ? 'Try different keywords.' : `No shops found within ${maxDistanceKm} km.`}
          />
        ) : isMapView ? (
          <View style={[styles.mapCard, { borderColor: colors.border }]}>
            <ExpoMap
              hideControls={true}
              style={{ flex: 1 }}
              initialRegion={{ latitude: userLoc?.lat ?? 12.9716, longitude: userLoc?.lng ?? 80.2210, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
              draggable={true}
              onMarkerDragEnd={coords => router.push({ pathname: '/search-map', params: { lat: coords.latitude, lng: coords.longitude } } as any)}
              markers={[
                ...(userLoc ? [{ latitude: userLoc.lat, longitude: userLoc.lng, title: 'You', color: 'blue' }] : []),
                ...filteredShops.map(s => ({ id: s.id, latitude: s.lat, longitude: s.lng, title: s.name, color: !s.isOpen ? '#dc2626' : s.isBusy ? '#f59e0b' : '#16a34a', iconType: 'shop' as const })),
              ]}
            />
            <TouchableOpacity
              style={[styles.expandMapBtn, { backgroundColor: ACCENT }]}
              onPress={() => router.push({ pathname: '/search-map', params: { lat: userLoc?.lat, lng: userLoc?.lng } } as any)}
            >
              <Ionicons name="expand-outline" size={14} color="white" />
              <Text style={styles.expandMapText}>Full Screen</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredShops.map(shop => {
            const isFav = favouriteIds.includes(shop.id);
            const isRequested = requestedShopIds.includes(shop.id);

            return (
              <TouchableOpacity
                key={shop.id}
                style={[styles.shopCard, { backgroundColor: colors.surface }]}
                activeOpacity={0.92}
                onPress={() => { setSelectedShop(shop.id); router.push(`/shop-detail/${shop.id}` as any); }}
              >
                {/* Image */}
                <View style={styles.shopImgWrap}>
                  <Image source={getShopImage(shop.heroImage)} style={styles.shopImg} contentFit="cover" transition={250} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} style={styles.shopImgGrad} />

                  {/* Top overlays */}
                  <TouchableOpacity
                    style={styles.favBtn}
                    onPress={e => { e.stopPropagation(); setFavouriteIds(p => p.includes(shop.id) ? p.filter(x => x !== shop.id) : [...p, shop.id]); }}
                  >
                    <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={18} color={isFav ? '#ef4444' : 'white'} />
                  </TouchableOpacity>

                  <View style={[styles.openBadge, {
                    backgroundColor: !shop.isOpen ? '#dc2626' : shop.isBusy ? '#f59e0b' : '#16a34a'
                  }]}>
                    <View style={styles.openDot} />
                    <Text style={styles.openBadgeText}>
                      {!shop.isOpen ? 'Closed' : shop.isBusy ? 'Busy' : 'Open'}
                    </Text>
                  </View>

                  {/* Bottom overlays */}
                  <View style={styles.imgBottom}>
                    <View style={styles.distPill}>
                      <Ionicons name="navigate" size={11} color={ACCENT} />
                      <Text style={[styles.distText, { color: ACCENT }]}>{shop.distanceKm.toFixed(1)} km</Text>
                    </View>
                    {shop.couponCount > 0 && (
                      <View style={styles.couponPill}>
                        <Ionicons name="pricetag" size={11} color="#fbbf24" />
                        <Text style={styles.couponPillText}>{shop.couponCount} offer{shop.couponCount > 1 ? 's' : ''}</Text>
                      </View>
                    )}
                    {shop.eta ? (
                      <View style={styles.etaPill}>
                        <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.9)" />
                        <Text style={styles.etaText}>{shop.eta}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Info */}
                <View style={styles.shopInfo}>
                  <View style={styles.shopInfoTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.shopName, { color: colors.text }]} numberOfLines={1}>{shop.name}</Text>
                      <View style={styles.ratingRow}>
                        {[1,2,3,4,5].map(i => (
                          <Ionicons key={i} name={shop.rating >= i ? 'star' : shop.rating >= i - 0.5 ? 'star-half' : 'star-outline'} size={12} color="#f59e0b" />
                        ))}
                        <Text style={[styles.ratingNum, { color: colors.muted }]}> {shop.rating}</Text>
                      </View>
                    </View>
                    <View style={styles.priceBox}>
                      {shop.pricePerCan > 0 ? (
                        <>
                          <Text style={[styles.priceVal, { color: ACCENT }]}>₹{shop.pricePerCan}</Text>
                          <Text style={[styles.priceLabel, { color: colors.muted }]}>min. price</Text>
                        </>
                      ) : (
                        <>
                          <Text style={[styles.priceVal, { color: colors.muted }]}>—</Text>
                          <Text style={[styles.priceLabel, { color: colors.muted }]}>no products</Text>
                        </>
                      )}
                      {shop.minOrderValue > 0 && (
                        <Text style={[styles.priceLabel, { color: colors.muted, marginTop: 2 }]}>
                          min ₹{shop.minOrderValue}
                        </Text>
                      )}
                    </View>
                  </View>

                  {shop.tags?.length > 0 && (
                    <View style={styles.tagRow}>
                      {shop.tags.slice(0, 3).map(t => (
                        <View key={t} style={[styles.tag, { backgroundColor: `${ACCENT}12` }]}>
                          <Text style={[styles.tagText, { color: ACCENT }]}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {shop.verified ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: ACCENT }]}
                      onPress={() => { setSelectedShop(shop.id); router.push(`/shop-detail/${shop.id}` as any); }}
                    >
                      <Text style={styles.actionBtnText}>View & Order</Text>
                      <Ionicons name="arrow-forward" size={15} color="white" />
                    </TouchableOpacity>
                  ) : isRequested ? (
                    <View style={[styles.actionBtn, { backgroundColor: `${ACCENT}15`, borderWidth: 1, borderColor: `${ACCENT}40` }]}>
                      <Ionicons name="time-outline" size={15} color={ACCENT} />
                      <Text style={[styles.actionBtnText, { color: ACCENT }]}>Request Pending</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.background, borderWidth: 1.5, borderColor: ACCENT }]}
                      onPress={() => { setPendingShopId(shop.id); setIsAddressModalVisible(true); }}
                    >
                      <Ionicons name="add-circle-outline" size={15} color={ACCENT} />
                      <Text style={[styles.actionBtnText, { color: ACCENT }]}>Request Connection</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── ADDRESS MODAL ── */}
      <Modal visible={isAddressModalVisible} transparent animationType="slide" onRequestClose={() => setIsAddressModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setIsAddressModalVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.sheetPill, { backgroundColor: colors.border }]} />
            <View style={styles.modalHead}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Delivery Address</Text>
                <Text style={[styles.modalSub, { color: colors.muted }]}>Where should this shop deliver?</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAddressModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <View style={{ gap: 10 }}>
              {userAddresses.map(addr => (
                <TouchableOpacity
                  key={addr.id}
                  style={[styles.addrRow, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => { if (pendingShopId) setRequestedShopIds(p => [...p, pendingShopId]); setIsAddressModalVisible(false); setPendingShopId(null); }}
                >
                  <View style={[styles.addrIcon, { backgroundColor: `${ACCENT}15` }]}>
                    <Ionicons name={addr.label?.toLowerCase() === 'home' ? 'home' : 'briefcase'} size={18} color={ACCENT} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.addrLabel, { color: colors.text }]}>{addr.label}</Text>
                    <Text style={[styles.addrText, { color: colors.muted }]} numberOfLines={1}>{addr.address_line1}, {addr.city}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.addAddrBtn} onPress={() => { setIsAddressModalVisible(false); router.push('/addresses'); }}>
                <Ionicons name="add-circle-outline" size={20} color={ACCENT} />
                <Text style={[styles.addAddrText, { color: ACCENT }]}>Add New Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 12 },
  locationIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  locationTitle: { fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
  locationChevron: { fontSize: 16, fontWeight: '900' },
  locationSub: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerIconBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { fontSize: 9, fontWeight: '900', color: 'white' },
  dot: { position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: 3.5 },

  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },

  reorderStrip: { borderRadius: 16, overflow: 'hidden', marginBottom: 16, ...Shadow.xs },
  reorderGrad: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  reorderIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  reorderLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 },
  reorderName: { color: 'white', fontSize: 14, fontWeight: '900' },
  reorderBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'white', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  reorderBtnText: { fontSize: 12, fontWeight: '800' },

  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, borderWidth: 1.5, gap: 10, ...Shadow.xs },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },
  mapSearchBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  mapSearchBtnText: { fontSize: 13, fontWeight: '700' },

  filterRow: { gap: 8, marginBottom: 20, paddingVertical: 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, ...Shadow.xs },
  chipText: { fontSize: 12, fontWeight: '700' },

  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  sectionSub: { fontSize: 12, marginTop: 2 },
  sectionActions: { flexDirection: 'row', gap: 8 },
  viewToggle: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1 },
  viewToggleText: { fontSize: 12, fontWeight: '700' },

  mapCard: { height: 380, borderRadius: 20, overflow: 'hidden', marginBottom: 20, borderWidth: 1, position: 'relative' },
  expandMapBtn: { position: 'absolute', bottom: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  expandMapText: { color: 'white', fontWeight: '800', fontSize: 12 },

  shopCard: { borderRadius: 20, marginBottom: 18, overflow: 'hidden', ...Shadow.sm },
  shopImgWrap: { height: 170, position: 'relative' },
  shopImg: { width: '100%', height: '100%' },
  shopImgGrad: { ...StyleSheet.absoluteFillObject },
  favBtn: { position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  openBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.7)' },
  openBadgeText: { color: 'white', fontSize: 11, fontWeight: '700' },
  imgBottom: { position: 'absolute', bottom: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  distPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  distText: { fontSize: 12, fontWeight: '800' },
  etaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  etaText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
  couponPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  couponPillText: { color: '#fbbf24', fontSize: 12, fontWeight: '700' },

  shopInfo: { padding: 16 },
  shopInfoTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  shopName: { fontSize: 17, fontWeight: '900', letterSpacing: -0.3, marginBottom: 5 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingNum: { fontSize: 12, fontWeight: '600' },
  priceBox: { alignItems: 'flex-end' },
  priceVal: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  priceLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  tagRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: '700' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 12 },
  actionBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 40 },
  sheetPill: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalSub: { fontSize: 13, marginTop: 2 },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  addrIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addrLabel: { fontSize: 14, fontWeight: '700' },
  addrText: { fontSize: 12, marginTop: 2 },
  addAddrBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  addAddrText: { fontSize: 14, fontWeight: '700' },
});
