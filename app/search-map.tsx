import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';


import { ExpoMap } from '@/components/maps/ExpoMap';
import { useShopStore } from '@/stores/shopStore';

export default function SearchMapScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const { shops } = useShopStore();

  useAndroidBackHandler(() => {
    safeBack('/(tabs)');
  });

  const [query, setQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState({ latitude: 12.9716, longitude: 80.2210 });
  const [showSearchBtn, setShowSearchBtn] = useState(false);

  const handleMapTap = (coords: { latitude: number; longitude: number }) => {
    setSearchLocation(coords);
    setShowSearchBtn(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Real Interactive Map */}
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
        markers={[
          // Current search pin
          { 
            latitude: searchLocation.latitude, 
            longitude: searchLocation.longitude, 
            title: 'Search Area', 
            color: '#ef4444' 
          },
          // Shop markers
          ...shops.map((shop) => ({
            latitude: shop.lat, 
            longitude: shop.lng,
            title: shop.name,
            color: '#005d90',
            iconType: 'shop' as const,
          }))
        ]}
      />

      {showSearchBtn && (
        <TouchableOpacity 
          style={styles.searchThisArea} 
          onPress={() => setShowSearchBtn(false)}
        >
          <Ionicons name="search" size={16} color="white" />
          <Text style={styles.searchThisAreaText}>Search this area</Text>
        </TouchableOpacity>
      )}

      {/* Floating Header */}
      <View style={styles.header}>
        <BackButton fallback="/(tabs)" />

        
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#707881" />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search this area..."
            placeholderTextColor="#94a3b8"
          />
        </View>

        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options" size={24} color="#181c20" />
        </TouchableOpacity>
      </View>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fabBtn}>
          <Ionicons name="locate" size={22} color="#005d90" />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet UI - Horizontal Scroll for Shops */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{shops.length} shops nearby</Text>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
        >
          {shops.map((shop) => (
            <TouchableOpacity 
              key={shop.id} 
              style={styles.shopCard}
              onPress={() => router.push(`/shop-detail/${shop.id}` as any)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.shopName} numberOfLines={1}>{shop.name}</Text>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={10} color="#f59e0b" />
                  <Text style={styles.ratingText}>{shop.rating}</Text>
                </View>
              </View>
              <Text style={styles.shopSub}>{shop.area} • {shop.distanceKm} km</Text>
              
              <View style={styles.cardBottom}>
                <Text style={styles.priceText}>From ₹{shop.pricePerCan}</Text>
                <View style={[styles.statusBadge, { backgroundColor: shop.isOpen ? '#e8f5e9' : '#ffebee' }]}>
                  <Text style={[styles.statusText, { color: shop.isOpen ? '#2e7d32' : '#c62828' }]}>{shop.isOpen ? 'OPEN' : 'CLOSED'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfdfd' },
  
  mapBackground: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f4f9' },
  mapBgText: { fontSize: 24, fontWeight: '900', color: '#bfdbf7', marginTop: 16, letterSpacing: -0.5 },
  
  header: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  filterBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 24, paddingHorizontal: 16, height: 48, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  input: { flex: 1, fontSize: 15, fontWeight: '600', color: '#181c20' },
  
  fabContainer: { position: 'absolute', bottom: 220, right: 20 },
  fabBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },

  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 40 },
  sheetHeader: { paddingHorizontal: 24, marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '900', color: '#181c20', backgroundColor: 'rgba(255,255,255,0.9)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, overflow: 'hidden' },
  
  shopCard: { width: 280, backgroundColor: 'white', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 4 },
  shopName: { flex: 1, fontSize: 18, fontWeight: '900', color: '#181c20' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fffbe6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  ratingText: { fontSize: 12, fontWeight: '800', color: '#b45309' },
  
  shopSub: { fontSize: 13, color: '#707881', fontWeight: '500', marginBottom: 16 },
  
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f4f9' },
  priceText: { fontSize: 15, fontWeight: '800', color: '#005d90' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  
  searchThisArea: { 
    position: 'absolute', top: 120, alignSelf: 'center', 
    backgroundColor: '#005d90', flexDirection: 'row', alignItems: 'center', 
    gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 
  },
  searchThisAreaText: { color: 'white', fontWeight: '800', fontSize: 13 },
});
