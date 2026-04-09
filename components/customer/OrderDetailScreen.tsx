import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppState } from '@/hooks/use-app-state';

const gallery = [
  require('@/assets/images/water_can_1.jpg'),
  require('@/assets/images/water_can_2.jpg'),
  require('@/assets/images/water_can_3.jpg'),
];

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getCartForShop, getShopById, setCartItemQuantity, shops } = useAppState();
  const shop = getShopById(id ?? 'shop-1') ?? shops[0];
  const cartItems = getCartForShop(shop.id);

  const canOrder = shop.status === 'open';
  const totalQuantity = cartItems.reduce((sum, entry) => sum + entry.quantity, 0);
  const totalPrice = cartItems.reduce((sum, entry) => sum + entry.lineTotal, 0);

  const handleCallShop = async () => {
    await Linking.openURL(`tel:${shop.phone}`);
  };

  const updateCart = (itemId: string, delta: number, maxStock: number) => {
    const current = cartItems.find((entry) => entry.itemId === itemId)?.quantity ?? 0;
    const next = Math.max(0, Math.min(maxStock, current + delta));
    setCartItemQuantity(shop.id, itemId, next);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#0077BE" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shop Profile</Text>
        <TouchableOpacity style={styles.iconButton} onPress={handleCallShop}>
          <Ionicons name="call-outline" size={20} color="#0077BE" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* PARALLAX HEADER STYLE */}
        <View style={styles.parallaxHeaderWrapper}>
          <Image source={gallery[0]} style={styles.parallaxImage} contentFit="cover" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.parallaxOverlay} />
        </View>

        {/* FLOATING CARD */}
        <View style={styles.floatingCard}>
          <View style={styles.floatingCardHeader}>
            <Text style={styles.shopName}>{shop.name}</Text>
            <View style={styles.openBadge}>
              <Text style={styles.openBadgeText}>🟢 Open Now</Text>
            </View>
          </View>
          <Text style={styles.shopMetaInfo}>
            {shop.rating.toFixed(1)} ⭐  |  {shop.distanceKm.toFixed(1)} km  |  {shop.etaMinutes - 5}-{shop.etaMinutes + 5} min
          </Text>
          
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtnOutline} onPress={handleCallShop}>
              <Ionicons name="call-outline" size={16} color="#0077BE" />
              <Text style={styles.actionBtnText}>Call Shop</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnOutline} onPress={() => router.push('/(tabs)/search' as any)}>
              <Ionicons name="map-outline" size={16} color="#0077BE" />
              <Text style={styles.actionBtnText}>View Map</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Products</Text>
          
          {shop.inventory.map((item, index) => {
            const inStock = item.stock > 0;
            const qty = cartItems.find((entry) => entry.itemId === item.id)?.quantity ?? 0;

            return (
              <View key={item.id} style={styles.productCard}>
                <Image source={gallery[index % gallery.length]} style={styles.productThumbnail} contentFit="cover" />
                
                <View style={styles.productMiddle}>
                  {index === 0 && (
                     <View style={styles.bestSellerBadge}><Text style={styles.bestSellerText}>Best Seller</Text></View>
                  )}
                  <Text style={styles.productLabel}>{item.name}</Text>
                  <Text style={styles.productPriceText}>₹{item.price.toFixed(2)} / can</Text>
                </View>

                {inStock ? (
                  qty === 0 ? (
                    <TouchableOpacity style={styles.addButton} onPress={() => updateCart(item.id, 1, item.stock)}>
                      <Text style={styles.addButtonText}>ADD</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.quantityWidget}>
                      <TouchableOpacity style={styles.qtyControl} onPress={() => updateCart(item.id, -1, item.stock)}>
                        <Ionicons name="remove" size={14} color="#0077BE" />
                      </TouchableOpacity>
                      <Text style={styles.qtyNumber}>{qty}</Text>
                      <TouchableOpacity style={styles.qtyControl} onPress={() => updateCart(item.id, 1, item.stock)}>
                        <Ionicons name="add" size={14} color="#0077BE" />
                      </TouchableOpacity>
                    </View>
                  )
                ) : (
                  <View style={styles.outOfStockBadge}>
                    <Text style={styles.outOfStockText}>Out</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* STICKY BOTTOM CART */}
      {totalQuantity > 0 && canOrder && (
        <View style={styles.stickyCartWrapper}>
          <LinearGradient colors={['#0077BE', '#0096C7']} style={styles.stickyCartBar}>
            <View style={styles.cartLeftBox}>
              <Text style={styles.cartCountText}>{totalQuantity} Items</Text>
              <Text style={styles.cartTotalText}>₹{totalPrice.toFixed(2)}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push(`/cart?shopId=${shop.id}` as any)}
              style={styles.cartRightBox}
            >
              <Text style={styles.cartCheckoutText}>View Cart</Text>
              <Ionicons name="arrow-forward" size={18} color="white" />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.96)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  content: {
    paddingBottom: 160,
  },
  parallaxHeaderWrapper: {
    width: '100%',
    height: 220,
    position: 'relative',
  },
  parallaxImage: {
    width: '100%',
    height: '100%',
  },
  parallaxOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  floatingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: -60,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shopName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    flex: 1,
  },
  openBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  openBadgeText: {
    color: '#27AE60',
    fontSize: 11,
    fontWeight: '700',
  },
  shopMetaInfo: {
    marginTop: 8,
    color: '#6B7C8C',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#0077BE',
    borderRadius: 8,
    paddingVertical: 12,
  },
  actionBtnText: {
    color: '#0077BE',
    fontSize: 14,
    fontWeight: '700',
  },
  productsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  productThumbnail: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  productMiddle: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  bestSellerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  bestSellerText: {
    color: '#C2410C',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  productLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E4049',
    marginBottom: 4,
  },
  productPriceText: {
    fontSize: 14,
    color: '#6B7C8C',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#0077BE',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '800',
  },
  quantityWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0077BE',
  },
  qtyControl: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  qtyNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0077BE',
    minWidth: 14,
    textAlign: 'center',
  },
  outOfStockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  outOfStockText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  stickyCartWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0077BE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  stickyCartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cartLeftBox: {
    flexDirection: 'column',
  },
  cartCountText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  cartTotalText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  cartRightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cartCheckoutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
});
