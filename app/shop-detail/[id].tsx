import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { BackButton } from '@/components/ui/BackButton';
import { useCartStore } from '@/stores/cartStore';
import { Logo } from '@/components/ui/Logo';
import { apiClient } from '@/api/client';

interface ShopProduct {
  id: number;
  name: string;
  price: number;
  deposit_amount: number;
  stock_quantity: number;
  is_available: boolean;
  image_url: string | null;
  type: string;
}

interface ShopDetail {
  id: number;
  name: string;
  city: string;
  state: string;
  address_line1: string;
  phone: string;
  avg_rating: number;
  total_ratings: number;
  is_open: boolean;
  logo_url: string | null;
  banner_url: string | null;
  delivery_radius_km: number;
  min_order_value: number;
  Products: ShopProduct[];
}

export default function ShopDetailScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();

  useAndroidBackHandler(() => { safeBack('/(tabs)'); });

  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, setQuantity, getSubtotal } = useCartStore();

  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'info'>('products');

  const fetchShop = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const res = await apiClient.get(`/shops/${id}`);
      if (res.data.status === 1) {
        setShop(res.data.data);
      } else {
        setError('Shop not found');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load shop');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchShop(); }, [fetchShop]);

  const totalItems = Object.values(items).reduce((a, b) => a + b.quantity, 0);
  const subtotal = getSubtotal();

  const handleGoToCheckout = () => {
    if (totalItems === 0) {
      Toast.show({ type: 'error', text1: 'Empty Cart', text2: 'Please add at least one product before checking out.' });
      return;
    }
    router.push({ pathname: '/order/checkout', params: { shopId: String(id) } } as any);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#005d90" />
      </View>
    );
  }

  if (error || !shop) {
    return (
      <View style={styles.center}>
        <Ionicons name="storefront-outline" size={64} color="#bfc7d1" />
        <Text style={styles.errorText}>{error ?? 'Shop not found'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchShop}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
        <BackButton fallback="/(tabs)" style={styles.backBtnCenter} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* HERO HEADER */}
      <View style={styles.heroWrapper}>
        {shop.banner_url ? (
          <Image source={{ uri: shop.banner_url }} style={styles.heroImage} contentFit="cover" />
        ) : (
          <LinearGradient colors={['#003a5c', '#005d90']} style={styles.heroImage} />
        )}
        <LinearGradient colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFill} />

        <SafeAreaView edges={['top']} style={styles.headerOverlay}>
          <BackButton fallback="/(tabs)" variant="transparent" iconColor="white" style={styles.backBtn} />
          <View style={styles.brandRow}>
            <Logo size="sm" />
            <Text style={styles.brandName}>ThanniGo</Text>
          </View>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => Toast.show({ type: 'info', text1: 'Share', text2: 'Sharing shop link...' })}
          >
            <Ionicons name="share-social-outline" size={20} color="white" />
          </TouchableOpacity>
        </SafeAreaView>

        <View style={styles.heroBottom}>
          <Text style={styles.heroShopName}>{shop.name}</Text>
          <View style={styles.heroMeta}>
            <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.8)" />
            <Text style={styles.heroMetaText}>{shop.city}</Text>
            <View style={styles.heroMetaDot} />
            <Ionicons name="star" size={13} color="#fbbf24" />
            <Text style={styles.heroMetaText}>{shop.avg_rating?.toFixed(1) ?? '—'}</Text>
            {shop.total_ratings > 0 && (
              <Text style={styles.heroMetaText}>({shop.total_ratings})</Text>
            )}
          </View>
          <View style={[styles.openBadge, { backgroundColor: shop.is_open ? '#22c55e' : '#ef4444' }]}>
            <View style={styles.openDot} />
            <Text style={styles.openText}>{shop.is_open ? 'Open Now' : 'Closed'}</Text>
          </View>
        </View>
      </View>

      {/* TAB BAR */}
      <View style={styles.tabBar}>
        {(['products', 'info'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={tab === 'products' ? 'water-outline' : 'information-circle-outline'}
              size={16}
              color={activeTab === tab ? '#005d90' : '#9ca3af'}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'products' ? 'Products' : 'Shop Info'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: totalItems > 0 ? 120 : 40, paddingHorizontal: 20 }}
      >
        {activeTab === 'products' ? (
          <>
            <Text style={styles.sectionTitle}>Available Products</Text>
            {!shop.is_open && (
              <View style={styles.closedBanner}>
                <Ionicons name="time-outline" size={18} color="#b45309" />
                <Text style={styles.closedBannerText}>This shop is currently closed. You can still browse products.</Text>
              </View>
            )}
            {shop.Products?.length === 0 && (
              <View style={styles.emptyProducts}>
                <Ionicons name="water-outline" size={40} color="#bfc7d1" />
                <Text style={styles.emptyProductsText}>No products listed yet.</Text>
              </View>
            )}
            {shop.Products?.map((product) => {
              const qty = items[String(product.id)]?.quantity ?? 0;
              const inStock = product.is_available && product.stock_quantity > 0;
              return (
                <View key={product.id} style={styles.productCard}>
                  {product.image_url ? (
                    <Image source={{ uri: product.image_url }} style={styles.productImage} contentFit="cover" />
                  ) : (
                    <View style={[styles.productImage, styles.productImagePlaceholder]}>
                      <Ionicons name="water" size={28} color="#005d90" />
                    </View>
                  )}
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <View style={styles.productBottom}>
                      <View>
                        <Text style={styles.productPrice}>₹{product.price}</Text>
                        {product.deposit_amount > 0 && (
                          <Text style={styles.productUnit}>+₹{product.deposit_amount} deposit</Text>
                        )}
                      </View>
                      {inStock ? (
                        <View style={styles.stepper}>
                          {qty === 0 ? (
                            <TouchableOpacity
                              style={styles.addBtn}
                              onPress={() => setQuantity(String(product.id), 1, String(id), { name: product.name, price: product.price })}
                            >
                              <Ionicons name="add" size={18} color="white" />
                              <Text style={styles.addBtnText}>Add</Text>
                            </TouchableOpacity>
                          ) : (
                            <>
                              <TouchableOpacity
                                style={styles.stepperBtn}
                                onPress={() => setQuantity(String(product.id), qty - 1, String(id), { name: product.name, price: product.price })}
                              >
                                <Ionicons name="remove" size={18} color="#005d90" />
                              </TouchableOpacity>
                              <Text style={styles.stepperQty}>{qty}</Text>
                              <TouchableOpacity
                                style={styles.stepperBtn}
                                onPress={() => setQuantity(String(product.id), qty + 1, String(id), { name: product.name, price: product.price })}
                              >
                                <Ionicons name="add" size={18} color="#005d90" />
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      ) : (
                        <View style={styles.outOfStock}>
                          <Text style={styles.outOfStockText}>Out of Stock</Text>
                        </View>
                      )}
                    </View>
                    {product.stock_quantity < 20 && inStock && (
                      <View style={styles.lowStockRow}>
                        <Ionicons name="alert-circle-outline" size={12} color="#b45309" />
                        <Text style={styles.lowStockText}>Only {product.stock_quantity} left</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>About this Shop</Text>
            {[
              { icon: 'storefront-outline', label: 'Shop Name', value: shop.name },
              { icon: 'location-outline', label: 'Address', value: [shop.address_line1, shop.city, shop.state].filter(Boolean).join(', ') },
              { icon: 'star-outline', label: 'Rating', value: `${shop.avg_rating?.toFixed(1) ?? '—'} / 5.0 (${shop.total_ratings} reviews)` },
              { icon: 'arrow-down-circle-outline', label: 'Min. Order', value: `₹${shop.min_order_value ?? 0}` },
              { icon: 'navigate-outline', label: 'Delivery Radius', value: `${shop.delivery_radius_km ?? '—'} km` },
            ].map((item, idx) => (
              <View key={idx} style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name={item.icon as any} size={20} color="#005d90" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              </View>
            ))}

            {shop.phone ? (
              <View style={{ marginVertical: 20, gap: 12 }}>
                <TouchableOpacity
                  style={[styles.contactBtn, styles.callBtn]}
                  onPress={() => Linking.openURL(`tel:${shop.phone}`)}
                >
                  <Ionicons name="call" size={20} color="white" />
                  <Text style={styles.contactBtnText}>Call Shop Now</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* FLOATING CHECKOUT BAR */}
      {totalItems > 0 && (
        <View style={styles.checkoutBar}>
          <View style={styles.checkoutInfo}>
            <Text style={styles.checkoutQty}>{totalItems} item{totalItems > 1 ? 's' : ''}</Text>
            <Text style={styles.checkoutSubtotal}>₹{subtotal}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleGoToCheckout} activeOpacity={0.9}>
            <LinearGradient colors={['#005d90', '#0077b6']} style={styles.checkoutBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.checkoutBtnText}>Go to Checkout</Text>
              <Ionicons name="arrow-forward" size={18} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f9ff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: '#f7f9ff' },
  errorText: { fontSize: 17, fontWeight: '700', color: '#707881' },
  retryBtn: { backgroundColor: '#005d90', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  retryText: { color: 'white', fontWeight: '800' },
  backBtnCenter: { marginTop: 8 },
  heroWrapper: { height: 260, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 18, fontWeight: '900', color: 'white', letterSpacing: -0.5 },
  shareBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  heroBottom: { position: 'absolute', bottom: 16, left: 20, right: 20 },
  heroShopName: { fontSize: 26, fontWeight: '900', color: 'white', letterSpacing: -0.5, marginBottom: 6 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  heroMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  heroMetaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)' },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'white' },
  openText: { fontSize: 11, fontWeight: '700', color: 'white' },
  tabBar: { flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f4f9' },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13 },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: '#005d90' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#9ca3af' },
  tabTextActive: { color: '#005d90' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#181c20', marginTop: 20, marginBottom: 14, letterSpacing: -0.3 },
  closedBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#fef3c7', borderRadius: 14, padding: 14, marginBottom: 16 },
  closedBannerText: { flex: 1, fontSize: 13, color: '#92400e', fontWeight: '600' },
  emptyProducts: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyProductsText: { fontSize: 14, color: '#94a3b8', fontWeight: '600' },
  productCard: { backgroundColor: 'white', borderRadius: 18, marginBottom: 14, flexDirection: 'row', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  productImage: { width: 90, height: 110 },
  productImagePlaceholder: { backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  productInfo: { flex: 1, padding: 14 },
  productName: { fontSize: 14, fontWeight: '800', color: '#181c20', marginBottom: 8 },
  productBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  productPrice: { fontSize: 18, fontWeight: '900', color: '#005d90' },
  productUnit: { fontSize: 10, color: '#9ca3af', fontWeight: '600', marginTop: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepperBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  stepperQty: { fontSize: 16, fontWeight: '900', color: '#005d90', minWidth: 24, textAlign: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#005d90', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  addBtnText: { color: 'white', fontWeight: '800', fontSize: 13 },
  outOfStock: { backgroundColor: '#f1f4f9', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  outOfStockText: { fontSize: 11, color: '#9ca3af', fontWeight: '700' },
  lowStockRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  lowStockText: { fontSize: 11, color: '#b45309', fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  infoIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '800', color: '#181c20' },
  contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  callBtn: { backgroundColor: '#005d90' },
  contactBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
  checkoutBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderTopWidth: 1, borderTopColor: '#f1f4f9', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 10 },
  checkoutInfo: { gap: 2 },
  checkoutQty: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },
  checkoutSubtotal: { fontSize: 20, fontWeight: '900', color: '#181c20' },
  checkoutBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  checkoutBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  checkoutBtnText: { color: 'white', fontWeight: '900', fontSize: 15 },
});
