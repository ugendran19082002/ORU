import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppState } from '@/hooks/use-app-state';
import type { Shop } from '@/utils/mockData';

const FILTERS = ['🔥 Pure Mineral', '🏔️ Aqua Crystal', '⚡ Fast Delivery', '⭐ Verified', '💰 ₹35 & Below'] as const;

const shopImages = [
  require('@/assets/images/water_can_1.jpg'),
  require('@/assets/images/water_can_2.jpg'),
  require('@/assets/images/water_can_3.jpg'),
];

function filterShop(shop: Shop, activeFilter: string) {
  if (activeFilter === '⚡ Fast Delivery') return shop.etaMinutes <= 20;
  if (activeFilter === '⭐ Verified') return shop.rating >= 4.7;
  if (activeFilter === '💰 ₹35 & Below') return shop.inventory[0]?.price <= 35;
  return true;
}

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { getDefaultAddress, orders, shops } = useAppState();
  const [activeFilter, setActiveFilter] = useState<string>('🔥 Pure Mineral');

  const defaultAddress = getDefaultAddress();
  const lastDeliveredOrder = orders.find((order) => order.status === 'delivered') ?? orders[0];
  const activeOrders = orders.filter((order) =>
    ['placed', 'accepted', 'preparing', 'out_for_delivery'].includes(order.status)
  );
  const visibleShops = shops
    .filter((shop) => filterShop(shop, activeFilter))
    .sort((left, right) => left.distanceKm - right.distanceKm);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Ionicons name="water" size={24} color="#0077BE" />
          <Text style={styles.brandName}>Thannigo</Text>
        </View>

        <TouchableOpacity style={styles.locationContainer} onPress={() => router.push('/addresses' as any)}>
          <Ionicons name="location" size={14} color="#0077BE" />
          <View style={styles.locationTextWrap}>
            <Text style={styles.locationLabel}>Delivering to</Text>
            <Text style={styles.locationValue} numberOfLines={1}>
              {defaultAddress.line2 || defaultAddress.label}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={16} color="#6B7C8C" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.bellButton}>
          <Ionicons name="notifications-outline" size={24} color="#2E4049" />
          <View style={styles.bellBadge} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.searchBar} activeOpacity={0.9} onPress={() => router.push('/(tabs)/search' as any)}>
        <Ionicons name="search" size={20} color="#6B7C8C" />
        <Text style={styles.searchPlaceholder}>Find refreshing water near you...</Text>
      </TouchableOpacity>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map((filter) => {
          const selected = activeFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, selected && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}>
              <Text style={[styles.filterLabel, selected && styles.filterLabelActive]}>{filter}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#0077BE', '#34C4E5']} style={styles.featuredCard}>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>🎯 ACTIVE ITERATION</Text>
          </View>
          
          <View style={styles.featuredContent}>
            <View style={styles.featuredCopy}>
              <Text style={styles.featuredTitle}>One-Tap Refresh</Text>
              <Text style={styles.featuredSubtitle}>
                Quickly reorder {lastDeliveredOrder?.quantity || 2} cans of your favorite water from {lastDeliveredOrder?.shopName || 'Aqua Crystal Pure'}
              </Text>
              <TouchableOpacity
                style={styles.reorderButton}
                onPress={() => router.push(`/shop/${lastDeliveredOrder?.shopId || shops[0].id}` as any)}>
                <Text style={styles.reorderText}>Reorder Now</Text>
              </TouchableOpacity>
            </View>
            <Ionicons name="water" size={72} color="rgba(255,255,255,0.2)" style={styles.featuredIcon} />
          </View>
        </LinearGradient>

        <View style={styles.shopList}>
          {visibleShops.map((shop, index) => {
            const topItem = shop.inventory[0];
            
            return (
              <TouchableOpacity
                key={shop.id}
                style={styles.shopCard}
                activeOpacity={0.95}
                onPress={() => router.push(`/shop/${shop.id}` as any)}>
                
                <View style={styles.shopTopRow}>
                  <View style={styles.shopLogoPlaceholder}>
                    <Ionicons name="business" size={24} color="#0077BE" />
                  </View>
                  <View style={styles.shopHeaderCopy}>
                    <Text style={styles.shopName}>{shop.name}</Text>
                    <Text style={styles.shopDeliveryInfo}>{shop.etaMinutes - 5}-{shop.etaMinutes + 5} Mins delivery</Text>
                  </View>
                  <View style={styles.shopRating}>
                    <Text style={styles.shopRatingText}>{shop.rating.toFixed(1)} ⭐</Text>
                  </View>
                </View>

                <View style={styles.productSection}>
                  <Image source={shopImages[index % shopImages.length]} style={styles.productMainImage} contentFit="cover" />
                  <View style={styles.productBadge}>
                    <Text style={styles.productBadgeText}>PURE MINERAL</Text>
                  </View>
                </View>

                <View style={styles.productDetailsRow}>
                  <View>
                    <Text style={styles.productTitle}>{topItem?.name || '20L Mineral Water Can'}</Text>
                    <Text style={styles.productPrice}>₹{topItem?.price || 45}.00 per unit</Text>
                  </View>
                  <View style={styles.quantitySection}>
                    <Text style={styles.quantityLabel}>QUANTITY</Text>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity style={styles.qtyBtn}>
                        <Ionicons name="remove" size={16} color="white" />
                      </TouchableOpacity>
                      <Text style={styles.qtyDisplay}>02</Text>
                      <TouchableOpacity style={styles.qtyBtn}>
                        <Ionicons name="add" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.paymentMethodsRow}>
                  <View style={styles.paymentMethodLabel}>
                    <Ionicons name="qr-code-outline" size={12} color="#6B7C8C" />
                    <Text style={styles.paymentText}>UPI Payment</Text>
                  </View>
                  <View style={styles.paymentMethodLabel}>
                    <Ionicons name="cash-outline" size={12} color="#6B7C8C" />
                    <Text style={styles.paymentText}>Cash on Delivery</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      
      {/* Sticky Bottom Action */}
      <View style={styles.bottomDeliverySticky}>
        <View style={styles.bottomDeliveryCard}>
          <Ionicons name="location" size={20} color="#0077BE" />
          <View style={styles.bottomDeliveryCopy}>
            <Text style={styles.bottomDeliveryLabel}>DELIVER TO</Text>
            <Text style={styles.bottomDeliveryValue} numberOfLines={1}>{defaultAddress.line1}, {defaultAddress.line2}...</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/addresses' as any)}>
            <Text style={styles.bottomDeliveryEdit}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  header: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0077BE',
  },
  locationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  locationTextWrap: {
    alignItems: 'center',
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7C8C',
    textTransform: 'uppercase',
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E4049',
    maxWidth: 120,
  },
  bellButton: {
    padding: 4,
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: 'white',
  },
  searchBar: {
    marginHorizontal: 16,
    marginTop: 16,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0F9FF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  searchPlaceholder: {
    flex: 1,
    color: '#A8B6C1',
    fontSize: 14,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
    height: 64,
  },
  filterChip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E9EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#0077BE',
    borderColor: '#0077BE',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7C8C',
  },
  filterLabelActive: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100, // accommodate sticky bottom
  },
  featuredCard: {
    height: 160,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  featuredBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(45,212,191,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredBadgeText: {
    color: '#2DD4BF',
    fontSize: 10,
    fontWeight: '800',
  },
  featuredContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredCopy: {
    flex: 1,
    paddingRight: 16,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  featuredSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    marginBottom: 16,
  },
  reorderButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reorderText: {
    color: '#0077BE',
    fontSize: 14,
    fontWeight: '600',
  },
  featuredIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  shopList: {
    gap: 12,
  },
  shopCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  shopTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  shopLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shopHeaderCopy: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E4049',
  },
  shopDeliveryInfo: {
    fontSize: 12,
    color: '#6B7C8C',
    marginTop: 2,
  },
  shopRating: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  shopRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7C8C',
  },
  productSection: {
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productMainImage: {
    width: '100%',
    height: '100%',
  },
  productBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#2DD4BF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  productBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
  },
  productDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E4049',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0077BE',
    marginTop: 4,
  },
  quantitySection: {
    alignItems: 'flex-end',
  },
  quantityLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7C8C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0077BE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyDisplay: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E4049',
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E9EC',
  },
  paymentMethodLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E9EC',
    borderRadius: 6,
  },
  paymentText: {
    fontSize: 12,
    color: '#6B7C8C',
    fontWeight: '500',
  },
  bottomDeliverySticky: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: 'rgba(245, 249, 255, 0.95)',
  },
  bottomDeliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  bottomDeliveryCopy: {
    flex: 1,
    marginLeft: 12,
  },
  bottomDeliveryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7C8C',
  },
  bottomDeliveryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E4049',
    marginTop: 2,
  },
  bottomDeliveryEdit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0077BE',
    paddingHorizontal: 8,
  },
});
