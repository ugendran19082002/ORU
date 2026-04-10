import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar as RNStatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { useShopStore } from '@/stores/shopStore';
import { useCartStore } from '@/stores/cartStore';
import { Logo } from '@/components/ui/Logo';

const ASSET_IMAGES: Record<string, any> = {
  water_can_1: require('@/assets/images/water_can_1.jpg'),
  water_can_2: require('@/assets/images/water_can_2.jpg'),
  water_can_3: require('@/assets/images/water_can_3.jpg'),
};

export default function ShopDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { shops } = useShopStore();
  const { items, setQuantity, getSubtotal, getTotal } = useCartStore();

  const shop = shops.find((s) => s.id === id) ?? shops[0];
  const [activeTab, setActiveTab] = useState<'products' | 'info'>('products');

  const totalItems = Object.values(items).reduce((a, b) => a + b, 0);
  const subtotal = getSubtotal();

  const handleGoToCheckout = () => {
    if (totalItems === 0) {
      Alert.alert('Empty Cart', 'Please add at least one product before checking out.');
      return;
    }
    router.push({ pathname: '/order/checkout', params: { shopId: shop.id } } as any);
  };

  if (!shop) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="storefront-outline" size={64} color="#bfc7d1" />
        <Text style={styles.errorText}>Shop not found</Text>
        <Ionicons name="storefront-outline" size={64} color="#bfc7d1" />
        <Text style={styles.errorText}>Shop not found</Text>
        <BackButton fallback="/(tabs)" style={styles.errorBack} />
      </View>

    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* HERO HEADER */}
      <View style={styles.heroWrapper}>
        <Image
          source={ASSET_IMAGES[shop.heroImage] ?? ASSET_IMAGES.water_can_1}
          style={styles.heroImage}
          contentFit="cover"
          transition={400}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.7)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Header Row */}
        <SafeAreaView edges={['top']} style={styles.headerOverlay}>
          <BackButton 
            fallback="/(tabs)" 
            variant="transparent" 
            iconColor="white" 
            style={styles.backBtn} 
          />
          <View style={styles.brandRow}>

            <Logo size="sm" />
            <Text style={styles.brandName}>ThanniGo</Text>
          </View>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => Alert.alert('Share', 'Sharing this shop link...')}
          >
            <Ionicons name="share-social-outline" size={20} color="white" />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Shop Identity */}
        <View style={styles.heroBottom}>
          <View style={styles.heroTags}>
            {shop.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {shop.verified && (
              <View style={[styles.tag, styles.tagVerified]}>
                <Ionicons name="shield-checkmark" size={10} color="#2e7d32" />
                <Text style={[styles.tagText, { color: '#2e7d32' }]}>Verified</Text>
              </View>
            )}
          </View>
          <Text style={styles.heroShopName}>{shop.name}</Text>
          <View style={styles.heroMeta}>
            <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.8)" />
            <Text style={styles.heroMetaText}>{shop.area}</Text>
            <View style={styles.heroMetaDot} />
            <Ionicons name="star" size={13} color="#fbbf24" />
            <Text style={styles.heroMetaText}>{shop.rating}</Text>
            <View style={styles.heroMetaDot} />
            <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.8)" />
            <Text style={styles.heroMetaText}>{shop.eta}</Text>
          </View>

          {/* Open status */}
          <View style={[styles.openBadge, { backgroundColor: shop.isOpen ? '#22c55e' : '#ef4444' }]}>
            <View style={styles.openDot} />
            <Text style={styles.openText}>{shop.isOpen ? 'Open Now' : 'Closed'}</Text>
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
            {!shop.isOpen && (
              <View style={styles.closedBanner}>
                <Ionicons name="time-outline" size={18} color="#b45309" />
                <Text style={styles.closedBannerText}>
                  This shop is currently closed. You can still browse products.
                </Text>
              </View>
            )}
            {shop.products.map((product) => {
              const qty = items[product.id] ?? 0;
              return (
                <View key={product.id} style={styles.productCard}>
                  <Image
                    source={ASSET_IMAGES[product.image] ?? ASSET_IMAGES.water_can_1}
                    style={styles.productImage}
                    contentFit="cover"
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productDesc} numberOfLines={2}>{product.description}</Text>
                    <View style={styles.productBottom}>
                      <View>
                        <Text style={styles.productPrice}>₹{product.price}</Text>
                        <Text style={styles.productUnit}>{product.unitLabel}</Text>
                      </View>
                      {/* Quantity Stepper */}
                      {product.inStock ? (
                        <View style={styles.stepper}>
                          {qty === 0 ? (
                            <TouchableOpacity
                              style={styles.addBtn}
                              onPress={() => setQuantity(product.id, 1, shop.id)}
                            >
                              <Ionicons name="add" size={18} color="white" />
                              <Text style={styles.addBtnText}>Add</Text>
                            </TouchableOpacity>
                          ) : (
                            <>
                              <TouchableOpacity
                                style={styles.stepperBtn}
                                onPress={() => setQuantity(product.id, qty - 1, shop.id)}
                              >
                                <Ionicons name="remove" size={18} color="#005d90" />
                              </TouchableOpacity>
                              <Text style={styles.stepperQty}>{qty}</Text>
                              <TouchableOpacity
                                style={styles.stepperBtn}
                                onPress={() => setQuantity(product.id, qty + 1, shop.id)}
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
                    {product.stockCount < 30 && product.inStock && (
                      <View style={styles.lowStockRow}>
                        <Ionicons name="alert-circle-outline" size={12} color="#b45309" />
                        <Text style={styles.lowStockText}>Only {product.stockCount} left</Text>
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
              { icon: 'location-outline', label: 'Area', value: shop.area },
              { icon: 'time-outline', label: 'Estimated delivery', value: shop.deliveryTime },
              { icon: 'cash-outline', label: 'Price per can (20L)', value: `₹${shop.pricePerCan}` },
              { icon: 'star-outline', label: 'Rating', value: `${shop.rating} / 5.0` },
            ].map((item) => (
              <View key={item.label} style={item.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name={item.icon as any} size={20} color="#005d90" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              </View>
            ))}

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Tags</Text>
            <View style={styles.tagsWrap}>
              {shop.tags.map((tag) => (
                <View key={tag} style={styles.infoTag}>
                  <Text style={styles.infoTagText}>{tag}</Text>
                </View>
              ))}
            </View>
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

  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: '#f7f9ff' },
  errorText: { fontSize: 17, fontWeight: '700', color: '#707881' },
  errorBack: { backgroundColor: '#005d90', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  errorBackText: { color: 'white', fontWeight: '800' },

  // HERO
  heroWrapper: { height: 260, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  headerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 18, fontWeight: '900', color: 'white', letterSpacing: -0.5 },
  shareBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center',
  },
  heroBottom: { position: 'absolute', bottom: 16, left: 20, right: 20 },
  heroTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tag: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagVerified: { backgroundColor: 'rgba(232,245,233,0.85)' },
  tagText: { fontSize: 10, fontWeight: '700', color: 'white' },
  heroShopName: { fontSize: 26, fontWeight: '900', color: 'white', letterSpacing: -0.5, marginBottom: 6 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  heroMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  heroMetaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)' },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'white' },
  openText: { fontSize: 11, fontWeight: '700', color: 'white' },

  // TABS
  tabBar: {
    flexDirection: 'row', backgroundColor: 'white',
    borderBottomWidth: 1, borderBottomColor: '#f1f4f9',
  },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13 },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: '#005d90' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#9ca3af' },
  tabTextActive: { color: '#005d90' },

  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#181c20', marginTop: 20, marginBottom: 14, letterSpacing: -0.3 },

  closedBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#fef3c7', borderRadius: 14, padding: 14, marginBottom: 16,
  },
  closedBannerText: { flex: 1, fontSize: 13, color: '#92400e', fontWeight: '600' },

  // PRODUCT CARD
  productCard: {
    backgroundColor: 'white', borderRadius: 18, marginBottom: 14,
    flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  productImage: { width: 90, height: 110 },
  productInfo: { flex: 1, padding: 14 },
  productName: { fontSize: 14, fontWeight: '800', color: '#181c20', marginBottom: 4 },
  productDesc: { fontSize: 12, color: '#707881', lineHeight: 16, marginBottom: 10 },
  productBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  productPrice: { fontSize: 18, fontWeight: '900', color: '#005d90' },
  productUnit: { fontSize: 10, color: '#9ca3af', fontWeight: '600', marginTop: 1 },

  // STEPPER
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepperBtn: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center',
  },
  stepperQty: { fontSize: 16, fontWeight: '900', color: '#005d90', minWidth: 24, textAlign: 'center' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#005d90', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
  },
  addBtnText: { color: 'white', fontWeight: '800', fontSize: 13 },
  outOfStock: { backgroundColor: '#f1f4f9', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  outOfStockText: { fontSize: 11, color: '#9ca3af', fontWeight: '700' },
  lowStockRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  lowStockText: { fontSize: 11, color: '#b45309', fontWeight: '700' },

  // INFO TAB
  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  infoIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '800', color: '#181c20' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoTag: { backgroundColor: '#e0f0ff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  infoTagText: { fontSize: 13, fontWeight: '700', color: '#005d90' },

  // CHECKOUT BAR
  checkoutBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 28,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    borderTopWidth: 1, borderTopColor: '#f1f4f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 10,
  },
  checkoutInfo: { gap: 2 },
  checkoutQty: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },
  checkoutSubtotal: { fontSize: 20, fontWeight: '900', color: '#181c20' },
  checkoutBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  checkoutBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16,
  },
  checkoutBtnText: { color: 'white', fontWeight: '900', fontSize: 15 },
});
