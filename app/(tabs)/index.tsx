import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { ExpoMap } from '@/components/maps/ExpoMap';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Logo } from '@/components/ui/Logo';
import { useShopStore } from '@/stores/shopStore';

/* ---------- UTILS ---------- */
// Haversine formula to calculate distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/* ---------- SAMPLE DATA ---------- */
const SAMPLE_SHOPS = [
  {
    id: '1',
    name: 'Blue Spring Aquatics',
    price: 45,
    rating: 4.8,
    lat: 12.9716,
    lng: 80.2210,
    image: require('@/assets/images/water_can_1.jpg')
  },
  {
    id: '2',
    name: 'Aqua Pure Water',
    price: 50,
    rating: 4.5,
    lat: 12.9725,
    lng: 80.2230,
    image: require('@/assets/images/water_can_2.jpg')
  },
  {
    id: '3',
    name: 'Clear Drop Deliveries',
    price: 40,
    rating: 4.6,
    lat: 12.9730,
    lng: 80.2190,
    image: require('@/assets/images/water_can_3.jpg')
  },
  {
    id: '4',
    name: 'H2O Essentials',
    price: 55,
    rating: 4.9,
    lat: 12.9690,
    lng: 80.2240,
    image: require('@/assets/images/water_can_1.jpg') // reused
  },
  {
    id: '5',
    name: 'Crystal Flow Cans',
    price: 60,
    rating: 4.7,
    lat: 12.9705,
    lng: 80.2185,
    image: require('@/assets/images/water_can_2.jpg') // reused
  }
];

export default function HomeScreen() {
  const router = useRouter();
  const { setSelectedShop, loadShops } = useShopStore();
  const [search, setSearch] = useState('');
  
  const [loadingLoc, setLoadingLoc] = useState(true);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);
  const [nearbyShops, setNearbyShops] = useState<any[]>([]);
  const [requestedShopIds, setRequestedShopIds] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [isMapView, setIsMapView] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [favouriteIds, setFavouriteIds] = useState<string[]>([]);
  const [pendingShopId, setPendingShopId] = useState<string | null>(null);
  const [currentAddress, setCurrentAddress] = useState('Locating...');
  const [userAddresses] = useState([
    { id: '1', type: 'Home', title: 'Home', fullAddress: '82nd Floor, Azure Heights, Cyber City...' },
    { id: '2', type: 'Office', title: 'Office', fullAddress: 'Floor 12, Tech Park Central, Sector 44...' }
  ]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadShops();
    await checkLocation();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadShops();
    checkLocation();
  }, []);

  const handleRequestLink = (shopId: string) => {
    setPendingShopId(shopId);
    setIsAddressModalVisible(true);
  };

  const confirmConnectionRequest = (addressId: string) => {
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
      const location = await Location.getCurrentPositionAsync({});
      const currentLat = location.coords.latitude;
      const currentLng = location.coords.longitude;
      setUserLoc({ lat: currentLat, lng: currentLng });

      // Dynamic naming based on standard GPS proximity
      if (Math.abs(currentLat - 12.97) < 0.1 && Math.abs(currentLng - 80.22) < 0.1) {
        setCurrentAddress('Koramangala, Bangalore');
      } else {
        setCurrentAddress(`${currentLat.toFixed(2)}, ${currentLng.toFixed(2)}`);
      }

      // Calculate distances & filter <= 3km
      // NOTE: Because simulators might be thousands of miles away from 12.97/80.22,
      // we will inject a fallback spoofed location matching Chennai/BLR area if real distance is > 3km.
      let processedShops = SAMPLE_SHOPS.map(shop => {
         const distance = calculateDistance(currentLat, currentLng, shop.lat, shop.lng);
         return { ...shop, calculatedDistance: distance };
      });

      // Simulation fallback: If everything is > 3km, spoof it for the demo
      if (processedShops.every(s => s.calculatedDistance > 3.0)) {
         processedShops = processedShops.map((shop, idx) => ({
             ...shop, calculatedDistance: 1.2 + (idx * 0.5) // spoof logic
         }));
      }

      setNearbyShops(processedShops);

    } catch (err) {
      console.warn("Could not fetch location, falling back to mock locations", err);
      // Fallback for emulators where location services might be disabled or fail
      setUserLoc({ lat: 12.9716, lng: 80.2210 });
      let fallbackShops = SAMPLE_SHOPS.map((shop, idx) => ({
         ...shop, calculatedDistance: 1.2 + (idx * 0.5)
      }));
      setNearbyShops(fallbackShops);
    } finally {
      setLoadingLoc(false);
    }
  };

  // Filter and sort the shops for rendering
  const filteredShops = nearbyShops
    .filter(s => s.calculatedDistance <= 3.0)
    .filter(s => search.trim() === '' ? true : s.name.toLowerCase().includes(search.toLowerCase()))
    .filter(s => {
      if (activeFilter === 'Rating 4.5+') return s.rating >= 4.5;
      if (activeFilter === '< 2km') return s.calculatedDistance < 2.0;
      if (activeFilter === 'Under Rs.50') return s.price < 50;
      return true;
    })
    .sort((a,b) => a.calculatedDistance - b.calculatedDistance);

  if (loadingLoc) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7f9ff' }}>
         <ActivityIndicator size="large" color="#005d90" />
         <Text style={{ marginTop: 10, color: '#707881', fontWeight: '600' }}>Locating nearby shops...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <View style={styles.brandRow}>
            <Logo size="md" />
            <Text style={styles.brandName}>ThanniGo</Text>
          </View>
          <TouchableOpacity
            style={styles.locationRow}
            onPress={() => router.push('/addresses' as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="location" size={13} color="#005d90" />
            <Text style={styles.locationText}>{currentAddress}</Text>
            <Ionicons name="chevron-down" size={11} color="#005d90" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/notifications' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={22} color="#005d90" />
            <View style={styles.notifDot} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/(tabs)/orders' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="cart-outline" size={22} color="#005d90" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>1</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />}
      >
        
        {/* HERO BANNER (REORDER) */}
        <LinearGradient
          colors={['#005d90', '#0077b6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroPill}>
              <Ionicons name="water" size={12} color="white" />
              <Text style={styles.heroPillText}>DEFAULT SHOP</Text>
            </View>
            <Text style={styles.heroTitle}>One-Tap Refresh</Text>
            <Text style={styles.heroSubtitle}>
              Quickly reorder 2 cans of Mineral Water securely from your saved favorite shop.
            </Text>
            <TouchableOpacity 
              activeOpacity={0.88} 
              style={styles.reorderBtn} 
              onPress={() => {
                const shopId = '1'; // Default shop for reorder hero
                setSelectedShop(shopId);
                router.push(`/order/checkout?shopId=${shopId}&qty=2` as any);
              }}
            >
              <Ionicons name="refresh" size={18} color="#005d90" />
              <Text style={styles.reorderBtnText}>Reorder Now</Text>
            </TouchableOpacity>
          </View>
          <Ionicons name="water" size={180} color="rgba(255,255,255,0.08)" style={styles.heroDecor} />
        </LinearGradient>

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search shops..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
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
               style={{ backgroundColor: activeFilter === f ? '#005d90' : '#e0f0ff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 }}
               onPress={() => setActiveFilter(activeFilter === f ? null : f)}
             >
                <Text style={{ color: activeFilter === f ? 'white' : '#005d90', fontSize: 13, fontWeight: '700' }}>{f}</Text>
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
              <Ionicons name={isMapView ? "list" : "map"} size={22} color="#005d90" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search' as any)}>
              <Ionicons name="options" size={22} color="#005d90" />
            </TouchableOpacity>
          </View>
        </View>

        {filteredShops.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="sad-outline" size={40} color="#94a3b8" />
            <Text style={styles.emptyText}>
              {search.trim() !== '' ? `No shops found matching "${search}"` : 'No shops found within 3km of your location.'}
            </Text>
          </View>
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
                   color: '#005d90',
                   iconType: 'shop' as const
                 }))
               ]}
            />
            <View style={{ position: 'absolute', bottom: 12, left: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.9)', padding: 8, borderRadius: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#005d90' }}>Tap map to search alternative areas</Text>
            </View>
          </View>
        ) : (
          filteredShops.map((shop) => {
             const isLinked = shop.id === '1'; // Demo: Only Shop 1 is approved
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
                   <Image source={shop.image} style={styles.shopImage} contentFit="cover" transition={300} />
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
                     <Ionicons name="navigate" size={12} color="#005d90" />
                     <Text style={styles.distText}>{shop.calculatedDistance.toFixed(1)} km</Text>
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
                      <Text style={styles.shopPrice}>Rs. {shop.price}</Text>
                       <Text style={styles.shopPriceLabel}>PER CAN</Text>
                     </View>
                   </View>
                   
                   {/* ACTION BUTTON */}
                   {isLinked ? (
                     <TouchableOpacity style={styles.orderBtn} onPress={() => {
                       setSelectedShop(shop.id);
                       router.push(`/order/${shop.id}`);
                     }}>
                       <Text style={styles.orderBtnText}>Order Details</Text>
                     </TouchableOpacity>
                   ) : isRequested ? (
                     <View style={[styles.orderBtn, { backgroundColor: '#e0f0ff', borderColor: '#e0f0ff' }]}>
                       <Text style={[styles.orderBtnText, { color: '#005d90' }]}>Request Pending...</Text>
                     </View>
                   ) : (
                     <TouchableOpacity style={[styles.orderBtn, { backgroundColor: '#005d90', borderColor: '#005d90' }]} onPress={() => handleRequestLink(shop.id)}>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Delivery Address</Text>
                <Text style={styles.modalSubtitle}>Where should this shop deliver?</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAddressModalVisible(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.addressList}>
              {userAddresses.map((addr) => (
                <TouchableOpacity 
                  key={addr.id} 
                  style={styles.addressItem}
                  onPress={() => confirmConnectionRequest(addr.id)}
                >
                  <View style={[styles.addrIcon, { backgroundColor: addr.type === 'Home' ? '#ecfeff' : '#eff6ff' }]}>
                    <Ionicons 
                      name={addr.type === 'Home' ? 'home' : 'briefcase'} 
                      size={18} 
                      color={addr.type === 'Home' ? '#0891b2' : '#2563eb'} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addrTitle}>{addr.title}</Text>
                    <Text style={styles.addrText} numberOfLines={1}>{addr.fullAddress}</Text>
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
                <Ionicons name="add-circle-outline" size={20} color="#005d90" />
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
  container: { flex: 1, backgroundColor: '#f7f9ff' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.92)',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 22, fontWeight: '900', color: '#003a5c', letterSpacing: -0.5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  locationText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  headerRight: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 10, right: 10,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1.5, borderColor: '#f1f4f9',
  },
  cartBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 17, height: 17, borderRadius: 8.5,
    backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#f7f9ff',
  },
  cartBadgeText: { color: 'white', fontSize: 9, fontWeight: '900' },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 120 },

  heroBanner: { borderRadius: 24, padding: 28, marginBottom: 32, overflow: 'hidden', position: 'relative' },
  heroContent: { position: 'relative', zIndex: 1 },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12 },
  heroPillText: { color: 'white', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { color: 'white', fontSize: 28, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 20, marginBottom: 20, maxWidth: 240 },
  reorderBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'white', alignSelf: 'flex-start', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4 },
  reorderBtnText: { color: '#005d90', fontWeight: '800', fontSize: 15 },
  heroDecor: { position: 'absolute', right: -40, bottom: -40, zIndex: 0 },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#f1f4f9' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#181c20', fontWeight: '500' },

  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#181c20', letterSpacing: -0.3, marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: '#707881' },

  shopCard: { backgroundColor: 'white', borderRadius: 24, marginBottom: 20, overflow: 'hidden', shadowColor: '#003a5c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3 },
  shopImageContainer: { height: 160, width: '100%', position: 'relative', backgroundColor: '#e2e8f0' },
  shopImage: { width: '100%', height: '100%' },
  favBtn: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.3)', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  distBadge: { position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  distText: { color: '#005d90', fontWeight: '800', fontSize: 12 },
  
  shopInfo: { padding: 18 },
  shopInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  shopName: { fontSize: 18, fontWeight: '800', color: '#0c2d48', marginBottom: 4 },
  shopMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shopRating: { fontSize: 13, fontWeight: '700', color: '#181c20' },
  shopPrice: { fontSize: 22, fontWeight: '900', color: '#005d90' },
  shopPriceLabel: { fontSize: 9, color: '#707881', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 0 },
  
  orderBtn: { backgroundColor: '#f1f4f9', alignItems: 'center', borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: '#e0e2e8' },
  orderBtnText: { color: '#005d90', fontWeight: '800', fontSize: 14 },

  emptyCard: { backgroundColor: 'white', borderRadius: 20, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  emptyText: { textAlign: 'center', color: '#707881', marginTop: 10, lineHeight: 20, fontWeight: '500' },

  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,58,92,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#64748b' },
  addressList: { gap: 12 },
  addressItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  addrIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addrTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  addrText: { fontSize: 12, color: '#64748b' },
  addAddrBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginTop: 8 },
  addAddrText: { fontSize: 14, fontWeight: '700', color: '#005d90' },
});

