import React, { useState, useEffect, useCallback } from 'react';
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
import { ExpoMap } from '@/components/maps/ExpoMap';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useShopStore } from '@/stores/shopStore';
import { useCartStore } from '@/stores/cartStore';
import { useOrderStore } from '@/stores/orderStore';
import { addressApi } from '@/api/addressApi';
import { apiClient } from '@/api/client';
import { Shadow, thannigoPalette, roleAccent, roleSurface, roleGradients, Radius } from '@/constants/theme';
import { SkeletonShopCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppTheme } from '@/providers/ThemeContext';

const CUSTOMER_ACCENT = roleAccent.customer;
const CUSTOMER_SURF = roleSurface.customer;
const CUSTOMER_GRAD: [string, string] = [roleGradients.customer.start, roleGradients.customer.end];


const getShopImage = (hero: string) => {
  switch (hero) {
    case 'water_can_1': return require('@/assets/images/water_can_1.jpg');
    case 'water_can_2': return require('@/assets/images/water_can_2.jpg');
    case 'water_can_3': return require('@/assets/images/water_can_3.jpg');
    default: return require('@/assets/images/water_can_1.jpg');
  }
};




export default function HomeScreen() {
  const router = useRouter();
  const { setSelectedShop, loadShops, searchShops, fetchPersonalized, shops } = useShopStore();
  const { items: cartItems } = useCartStore();
  const { fetchOrders } = useOrderStore();
  const [search, setSearch] = useState('');
  
  const [loadingLoc, setLoadingLoc] = useState(true);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
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

  const cartCount = Object.values(cartItems).reduce((sum, q) => sum + q.quantity, 0);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      checkLocation(),
      fetchLoyaltyBalance()
    ]);
    setRefreshing(false);
  }, []);

  const fetchLoyaltyBalance = async () => {
    try {
      await apiClient.get('/promotion/loyalty/ledger');
      // Calculate total points from ledger or if balance is in user session use that
      // Assuming user metadata or ledger has balance. For simplicity, we can also fetch /users/me
      const profileRes = await apiClient.get('/users/me');
      if (profileRes.data?.status === 1) {
        setLoyaltyPoints(profileRes.data.data.loyalty_points || 0);
      }
    } catch (e) {
      console.error('Failed to fetch loyalty balance', e);
    }
  };

  useEffect(() => {
    // Initial fetch handled by checkLocation() on focus or mount
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkLocation();
      fetchLoyaltyBalance();
      fetchOrders(); // Ensure history is fresh for personalization fallbacks
    }, [])
  );

  const handleRequestLink = (shopId: string) => {
    setPendingShopId(shopId);
    setIsAddressModalVisible(true);
  };

  const confirmConnectionRequest = (_addressId: string) => {
    if (pendingShopId) {
      setRequestedShopIds(prev => [...prev, pendingShopId]);
      setIsAddressModalVisible(false);
      setPendingShopId(null);
    }
  };

  const checkLocation = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      router.replace('/location' as any);
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const currentLat = location.coords.latitude;
      const currentLng = location.coords.longitude;
      setUserLoc({ lat: currentLat, lng: currentLng });

      // 1. Fetch real addresses from backend
      let addresses: any[] = [];
      try {
        const addrRes = await addressApi.getAddresses();
        addresses = addrRes.data.data || [];
        setUserAddresses(addresses);
      } catch (addrErr) {
        console.warn("Failed to fetch saved addresses:", addrErr);
      }

      // 2. Logic: Prioritize Default Address > GPS Reverse Geocode > Coordinates
      const defaultAddr = addresses.find(a => a.is_default);
      
      if (defaultAddr) {
        setCurrentAddressTitle(defaultAddr.label || 'Home');
        setCurrentAddress(`${defaultAddr.address_line1}, ${defaultAddr.city}`);
        setUserLoc({ lat: Number(defaultAddr.latitude), lng: Number(defaultAddr.longitude) });
      } else {
        setCurrentAddressTitle('Current Location');
        
        // Dynamic naming using Reverse Geocoding
        try {
          const rev = await Location.reverseGeocodeAsync({ 
            latitude: currentLat, 
            longitude: currentLng 
          });
          
          if (rev && rev[0]) {
            const place = rev[0];
            const readable = place.district || place.name || place.city || 'Near You';
            setCurrentAddress(`${readable}, ${place.city || ''}`);
          } else {
            setCurrentAddress(`${currentLat.toFixed(2)}, ${currentLng.toFixed(2)}`);
          }
        } catch (revErr) {
          setCurrentAddress(`${currentLat.toFixed(2)}, ${currentLng.toFixed(2)}`);
        }
      }

      // 3. Fetch approved shops from backend using these coordinates
      await loadShops({ lat: currentLat, lng: currentLng });

      // 4. Fetch personalization hero content
      const hero = await fetchPersonalized(currentLat, currentLng);
      setPersonalizedShop(hero);

    } catch (err) {
      console.warn("Could not fetch location, falling back to mock area", err);
      // Fallback for emulators: Use Chennai coordinates and load shops
      const fallbackLat = 12.9716;
      const fallbackLng = 80.2210;
      setUserLoc({ lat: fallbackLat, lng: fallbackLng });
      await loadShops({ lat: fallbackLat, lng: fallbackLng });
    } finally {
      setLoadingLoc(false);
    }
  };

  // Filter and sort the shops for rendering
  // Filter and sort the shops for rendering
  const filteredShops = shops
    .filter(s => s.distanceKm <= 3.0)
    .filter(s => search.trim() === '' ? true : s.name.toLowerCase().includes(search.toLowerCase()))
    .filter(s => {
      if (activeFilter === 'Rating 4.5+') return s.rating >= 4.5;
      if (activeFilter === '< 2km') return s.distanceKm < 2.0;
      if (activeFilter === 'Under Rs.50') return s.pricePerCan < 50;
      return true;
    })
    .sort((a,b) => a.distanceKm - b.distanceKm);

  const { colors, isDark } = useAppTheme();

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

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={{ gap: 2 }}>
          <Text style={[styles.brandName, { color: colors.text }]}>ThanniGo</Text>
          <TouchableOpacity
            style={styles.locationRow}
            onPress={() => router.push('/addresses' as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="location" size={12} color={CUSTOMER_ACCENT} />
            <Text style={[styles.locationLabel, { color: CUSTOMER_ACCENT }]}>{currentAddressTitle}</Text>
            <Text style={[styles.locationText, { color: colors.muted }]} numberOfLines={1}>· {currentAddress}</Text>
            <Ionicons name="chevron-down" size={10} color={CUSTOMER_ACCENT} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.pointsChip}
            onPress={() => router.push('/rewards' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="gift" size={14} color={CUSTOMER_ACCENT} />
            <Text style={styles.pointsText}>{loyaltyPoints}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/notifications' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={22} color={CUSTOMER_ACCENT} />
            <View style={[styles.notifDot, { backgroundColor: thannigoPalette.error, borderColor: colors.surface }]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/order/checkout' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="cart-outline" size={22} color={CUSTOMER_ACCENT} />
            {cartCount > 0 && (
              <View style={[styles.cartBadge, { backgroundColor: thannigoPalette.error, borderColor: colors.background }]}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[CUSTOMER_ACCENT]} tintColor={CUSTOMER_ACCENT} />}
        keyboardShouldPersistTaps="handled"
      >
        
        {/* HERO BANNER (REORDER OR DISCOVERY) */}
        <LinearGradient
          colors={CUSTOMER_GRAD}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroPill}>
              <Ionicons name={personalizedShop ? "flash" : "compass"} size={12} color="white" />
              <Text style={styles.heroPillText}>{personalizedShop ? 'ONE-TAP REORDER' : 'DISCOVER SHOPS'}</Text>
            </View>
            <Text style={styles.heroTitle}>{personalizedShop ? 'Welcome Back!' : 'Fresh Water, Fast'}</Text>
            <Text style={styles.heroSubtitle}>
              {personalizedShop 
                ? `Ready to reorder from ${personalizedShop.name}? Get your 20L cans delivered in 30 mins.`
                : 'ThanniGo delivers high-quality mineral water to your doorstep in 15-45 minutes.'}
            </Text>
            <TouchableOpacity 
              activeOpacity={0.88} 
              style={styles.reorderBtn} 
              onPress={() => {
                const shopId = personalizedShop?.id || (shops[0]?.id);
                if (shopId) {
                  setSelectedShop(shopId);
                  router.push(`/shop-detail/${shopId}` as any);
                }
              }}
            >
              <Ionicons name={personalizedShop ? "refresh" : "search"} size={18} color={CUSTOMER_ACCENT} />
              <Text style={styles.reorderBtnText}>{personalizedShop ? 'Reorder Now' : 'Find Shops'}</Text>
            </TouchableOpacity>
          </View>
          <Ionicons name="water" size={180} color="rgba(255,255,255,0.08)" style={styles.heroDecor} />
        </LinearGradient>

        {/* SEARCH BAR */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search shops..."
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={(v) => {
              setSearch(v);
              if (v.trim().length > 2) {
                searchShops(v, userLoc?.lat, userLoc?.lng);
              } else if (v.trim().length === 0) {
                checkLocation(); // Reset to nearby shops
              }
            }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* FILTER CHIPS API */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginBottom: 20, paddingHorizontal: 2 }}>
           {['Rating 4.5+', '< 2km', 'Under Rs.50'].map(f => (
             <TouchableOpacity
               key={f}
               style={{ backgroundColor: activeFilter === f ? CUSTOMER_ACCENT : CUSTOMER_SURF, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 }}
               onPress={() => setActiveFilter(activeFilter === f ? null : f)}
             >
                <Text style={{ color: activeFilter === f ? 'white' : CUSTOMER_ACCENT, fontSize: 13, fontWeight: '700' }}>{f}</Text>
             </TouchableOpacity>
           ))}
        </ScrollView>

        {/* SHOPS SECTION */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Shops Near You</Text>
            <Text style={styles.sectionSubtitle}>Within 3km radius</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setIsMapView(!isMapView)}>
              <Ionicons name={isMapView ? "list" : "map"} size={22} color={CUSTOMER_ACCENT} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search' as any)}>
              <Ionicons name="options" size={22} color={CUSTOMER_ACCENT} />
            </TouchableOpacity>
          </View>
        </View>

        {filteredShops.length === 0 ? (
          <EmptyState
            icon="sad-outline"
            title={search.trim() !== '' ? `No shops found matching "${search}"` : 'No shops nearby'}
            subtitle={search.trim() !== '' ? 'Try searching different keywords.' : 'No shops found within 3km of your location.'}
          />
        ) : isMapView ? (
          <View style={{ height: 400, borderRadius: 20, overflow: 'hidden', marginTop: 10, borderColor: '#e2e8f0', borderWidth: 1 }}>
            <ExpoMap 
               hideControls={true}
               style={{ flex: 1 }} 
               initialRegion={{ 
                 latitude: userLoc?.lat ?? 12.9716, 
                 longitude: userLoc?.lng ?? 80.2210, 
                 latitudeDelta: 0.1, 
                 longitudeDelta: 0.1 
               }}
               draggable={true}
               onMarkerDragEnd={(coords) => {
                 router.push({ pathname: '/search-map', params: { lat: coords.latitude, lng: coords.longitude } } as any);
               }}
               markers={[
                 ...(userLoc ? [{ latitude: userLoc.lat, longitude: userLoc.lng, title: 'You are here', color: 'blue' }] : []),
                 ...filteredShops.map((s) => ({
                   latitude: s.lat,
                   longitude: s.lng,
                   title: s.name,
                   color: CUSTOMER_ACCENT,
                   iconType: 'shop' as const
                 }))
               ]}
            />
            <View style={{ position: 'absolute', bottom: 12, left: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.9)', padding: 8, borderRadius: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: CUSTOMER_ACCENT }}>Tap map to search alternative areas</Text>
            </View>
          </View>
        ) : (
          filteredShops.map((shop) => {
             const isLinked = shop.verified; // Verified shops are orderable in this view
             const isRequested = requestedShopIds.includes(shop.id);

             return (
                <TouchableOpacity 
                 key={shop.id} 
                 activeOpacity={0.92} 
                 style={styles.shopCard}
                 onPress={() => {
                   setSelectedShop(shop.id);
                   router.push(`/shop-detail/${shop.id}` as any);
                 }}
               >
                 <View style={styles.shopImageContainer}>
                   <Image source={getShopImage(shop.heroImage)} style={styles.shopImage} contentFit="cover" transition={300} />
                   <TouchableOpacity 
                     style={styles.favBtn} 
                     onPress={(e) => {
                       e.stopPropagation();
                       setFavouriteIds(prev => 
                         prev.includes(shop.id) 
                           ? prev.filter(id => id !== shop.id) 
                           : [...prev, shop.id]
                       );
                     }}
                   >
                     <Ionicons name={favouriteIds.includes(shop.id) ? "heart" : "heart-outline"} size={20} color={favouriteIds.includes(shop.id) ? "#ef4444" : "white"} />
                   </TouchableOpacity>
                   <View style={styles.distBadge}>
                     <Ionicons name="navigate" size={12} color={CUSTOMER_ACCENT} />
                     <Text style={styles.distText}>{shop.distanceKm.toFixed(1)} km</Text>
                   </View>
                 </View>
                 <View style={styles.shopInfo}>
                   <View style={styles.shopInfoRow}>
                     <View style={{ flex: 1 }}>
                       <Text style={styles.shopName}>{shop.name}</Text>
                       <View style={styles.shopMeta}>
                         <Ionicons name="star" size={14} color="#f59e0b" />
                         <Text style={styles.shopRating}>{shop.rating}</Text>
                       </View>
                     </View>
                     <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                      <Text style={styles.shopPrice}>Rs. {shop.pricePerCan}</Text>
                       <Text style={styles.shopPriceLabel}>PER CAN</Text>
                     </View>
                   </View>
                   
                   {/* ACTION BUTTON */}
                   {isLinked ? (
                     <TouchableOpacity style={styles.orderBtn} onPress={() => {
                       setSelectedShop(shop.id);
                       router.push(`/shop-detail/${shop.id}` as any);
                     }}>
                       <Text style={styles.orderBtnText}>View Details</Text>
                     </TouchableOpacity>
                   ) : isRequested ? (
                     <View style={[styles.orderBtn, { backgroundColor: '#e0f0ff', borderColor: '#e0f0ff' }]}>
                       <Text style={[styles.orderBtnText, { color: CUSTOMER_ACCENT }]}>Request Pending...</Text>
                     </View>
                   ) : (
                     <TouchableOpacity style={[styles.orderBtn, { backgroundColor: CUSTOMER_ACCENT, borderColor: CUSTOMER_ACCENT }]} onPress={() => handleRequestLink(shop.id)}>
                       <Text style={[styles.orderBtnText, { color: 'white' }]}>Request Connection</Text>
                     </TouchableOpacity>
                   )}

                 </View>
               </TouchableOpacity>
             );
          })
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ADDRESS SELECTION MODAL */}
      <Modal
        visible={isAddressModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setIsAddressModalVisible(false)} 
          />
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Select Delivery Address</Text>
                <Text style={[styles.modalSubtitle, { color: colors.muted }]}>Where should this shop deliver?</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAddressModalVisible(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.addressList}>
              {userAddresses.map((addr) => (
                <TouchableOpacity 
                  key={addr.id} 
                  style={[styles.addressItem, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => confirmConnectionRequest(addr.id)}
                >
                  <View style={[styles.addrIcon, { backgroundColor: addr.label?.toLowerCase() === 'home' ? thannigoPalette.infoSoft : thannigoPalette.deliveryGreenLight }]}>
                    <Ionicons 
                      name={addr.label?.toLowerCase() === 'home' ? 'home' : 'briefcase'} 
                      size={18} 
                      color={addr.label?.toLowerCase() === 'home' ? CUSTOMER_ACCENT : thannigoPalette.deliveryGreen} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addrTitle}>{addr.label}</Text>
                    <Text style={styles.addrText} numberOfLines={1}>{addr.address_line1}, {addr.city}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity 
                style={styles.addAddrBtn}
                onPress={() => {
                  setIsAddressModalVisible(false);
                  router.push('/addresses');
                }}
              >
                <Ionicons name="add-circle-outline" size={20} color={CUSTOMER_ACCENT} />
                <Text style={styles.addAddrText}>Add New Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 12,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 20, fontWeight: '900', letterSpacing: -0.8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationLabel: { fontSize: 11, fontWeight: '700' },
  locationText: { fontSize: 12, fontWeight: '600', maxWidth: 160 },
  headerRight: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  pointsChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: CUSTOMER_SURF, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: thannigoPalette.borderSoft,
  },
  pointsText: { fontSize: 13, fontWeight: '800', color: CUSTOMER_ACCENT },
  iconBtn: {
    width: 42, height: 42, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', ...Shadow.xs,
  },
  notifDot: {
    position: 'absolute', top: 10, right: 10,
    width: 8, height: 8, borderRadius: 4,
    borderWidth: 1.5,
  },
  cartBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 17, height: 17, borderRadius: 8.5,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  cartBadgeText: { color: 'white', fontSize: 9, fontWeight: '900' },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 120 },

  heroBanner: { borderRadius: 24, padding: 28, marginBottom: 32, overflow: 'hidden', position: 'relative' },
  heroContent: { position: 'relative', zIndex: 1 },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12 },
  heroPillText: { color: 'white', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { color: 'white', fontSize: 28, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 20, marginBottom: 20, maxWidth: 240 },
  reorderBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'white', alignSelf: 'flex-start', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, ...Shadow.md },
  reorderBtnText: { color: CUSTOMER_ACCENT, fontWeight: '800', fontSize: 15 },
  heroDecor: { position: 'absolute', right: -40, bottom: -40, zIndex: 0 },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: thannigoPalette.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 24, ...Shadow.xs, borderWidth: 1, borderColor: thannigoPalette.borderSoft },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: thannigoPalette.darkText, fontWeight: '500' },

  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: thannigoPalette.darkText, letterSpacing: -0.3, marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: thannigoPalette.neutral },

  shopCard: { borderRadius: Radius.xl, marginBottom: 20, overflow: 'hidden', ...Shadow.sm },
  shopImageContainer: { height: 160, width: '100%', position: 'relative', backgroundColor: thannigoPalette.borderSoft },
  shopImage: { width: '100%', height: '100%' },
  favBtn: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.3)', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  distBadge: { position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  distText: { color: CUSTOMER_ACCENT, fontWeight: '800', fontSize: 12 },

  shopInfo: { padding: 18 },
  shopInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  shopName: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  shopMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shopRating: { fontSize: 13, fontWeight: '700' },
  shopPrice: { fontSize: 22, fontWeight: '900', color: CUSTOMER_ACCENT },
  shopPriceLabel: { fontSize: 9, color: thannigoPalette.neutral, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },

  orderBtn: { alignItems: 'center', borderRadius: Radius.md, paddingVertical: 12, borderWidth: 1, borderColor: thannigoPalette.borderSoft },
  orderBtnText: { color: CUSTOMER_ACCENT, fontWeight: '800', fontSize: 14 },

  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,58,92,0.4)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  modalSubtitle: { fontSize: 13 },
  addressList: { gap: 12 },
  addressItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: Radius.lg, borderWidth: 1 },
  addrIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addrTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  addrText: { fontSize: 12 },
  addAddrBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginTop: 8 },
  addAddrText: { fontSize: 14, fontWeight: '700', color: CUSTOMER_ACCENT },
});



