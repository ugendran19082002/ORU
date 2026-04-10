import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Logo } from '@/components/ui/Logo';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';

import { useCartStore } from '@/stores/cartStore';
import { useShopStore } from '@/stores/shopStore';

export default function OrderDetailScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const router = useRouter();

  const { safeBack } = useAppNavigation();

  useAndroidBackHandler(() => {
    safeBack('/(tabs)');
  });

  const { id } = useLocalSearchParams<{ id: string }>();
  const { shops, setSelectedShop } = useShopStore();
  const { items, setQuantity, setShop } = useCartStore();
  const shop = shops.find((item) => item.id === (id ?? '1')) ?? shops[0];
  const product = shop.products[0];
  const quantity = items[product.id] ?? 2;
  const pricePerUnit = product.price;


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <BackButton fallback="/(tabs)" iconColor="#005d90" />

        <View style={styles.headerCenter}>
          <Logo size="sm" />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerShopName} numberOfLines={1}>{shop.name}</Text>
            <View style={styles.headerMeta}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={styles.headerMetaText}>{shop.rating} | {shop.eta}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="share-outline" size={20} color="#005d90" />
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 180 }}
      >
        {/* PRODUCT IMAGE */}
        <View style={styles.productImageWrapper}>
          <Image
            source={require('@/assets/images/water_can_1.jpg')}
            style={styles.productImage}
            resizeMode="cover"
          />
          <View style={styles.productBadge}>
            <Text style={styles.productBadgeText}>{shop.isOpen ? 'Available Now' : 'Closed Today'}</Text>
          </View>
        </View>

        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productPrice}>Rs. {pricePerUnit}.00 per unit</Text>

        {/* WATER QUALITY TAGS */}
        <View style={styles.tagRow}>
          {shop.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Ionicons name="checkmark-circle" size={12} color="#006878" />
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* QUANTITY SELECTOR */}
        <View style={styles.quantityCard}>
          <View>
            <Text style={styles.quantityLabel}>QUANTITY</Text>
            <Text style={styles.quantityValue}>{String(quantity).padStart(2, '0')}</Text>
            {quantity >= 50 && (
              <Text style={{ fontSize: 10, color: '#e07b00', fontWeight: '700', marginTop: 2 }}>Max 50 cans</Text>
            )}
          </View>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.qtyBtnMinus}
              onPress={() => {
                setSelectedShop(shop.id);
                setQuantity(product.id, Math.max(1, quantity - 1), shop.id);
              }}
            >
              <Ionicons name="remove" size={22} color="#005d90" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.qtyBtnPlus, quantity >= 50 && { opacity: 0.4 }]}
              disabled={quantity >= 50}
              onPress={() => {
                setSelectedShop(shop.id);
                setQuantity(product.id, Math.min(50, quantity + 1), shop.id);
              }}
            >
              <LinearGradient
                colors={['#005d90', '#0077b6']}
                style={styles.qtyBtnPlusGrad}
              >
                <Ionicons name="add" size={22} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* BOTTOM CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.totalFloating}>
          <View>
            <Text style={styles.totalFloatingLabel}>TOTAL ESTIMATE</Text>
            <Text style={styles.totalFloatingValue}>Rs. {quantity * pricePerUnit}</Text>
          </View>
          <Text style={styles.totalFloatingSub}>Excl. Delivery</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            setSelectedShop(shop.id);
            setShop(shop.id);
            setQuantity(product.id, quantity, shop.id);
            router.push(`/order/checkout?shopId=${shop.id}&qty=${quantity}` as any);
          }}
        >
          <LinearGradient
            colors={['#005d90', '#0077b6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBtn}
          >
            <Text style={styles.ctaBtnText}>Continue to Checkout</Text>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: '#ebeef4', alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerShopName: { fontSize: 16, fontWeight: '800', color: '#005d90' },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerMetaText: { fontSize: 12, color: '#707881', fontWeight: '500' },

  productImageWrapper: {
    width: '100%', height: 260, borderRadius: 24,
    marginTop: 20, marginBottom: 20, overflow: 'hidden', position: 'relative',
    backgroundColor: '#ebeef4',
  },
  productImage: { width: '100%', height: '100%' },
  productBadge: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: 'rgba(105,229,255,0.95)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  productBadgeText: { color: '#004e5b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  productName: { fontSize: 24, fontWeight: '900', color: '#181c20', letterSpacing: -0.3, textAlign: 'center' },
  productPrice: { fontSize: 15, color: '#707881', fontWeight: '500', textAlign: 'center', marginTop: 4, marginBottom: 14 },

  tagRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 28 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e0f7fa', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { fontSize: 11, fontWeight: '700', color: '#006878' },

  quantityCard: {
    backgroundColor: 'white', borderRadius: 28, padding: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  quantityLabel: { fontSize: 10, fontWeight: '700', color: '#707881', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  quantityValue: { fontSize: 48, fontWeight: '900', color: '#005d90', letterSpacing: -2 },
  quantityControls: { flexDirection: 'row', gap: 12 },
  qtyBtnMinus: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: '#ebeef4', alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnPlus: { width: 52, height: 52, borderRadius: 16, overflow: 'hidden' },
  qtyBtnPlusGrad: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#005d90', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#181c20', letterSpacing: -0.2, marginBottom: 12 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'white', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.07, shadowRadius: 20, elevation: 12,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    gap: 12,
  },
  totalFloating: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalFloatingLabel: { fontSize: 9, fontWeight: '700', color: '#707881', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  totalFloatingValue: { fontSize: 24, fontWeight: '900', color: '#181c20', letterSpacing: -0.5 },
  totalFloatingSub: { fontSize: 11, color: '#707881' },
  ctaBtn: {
    borderRadius: 20, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#005d90', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  ctaBtnText: { color: 'white', fontSize: 17, fontWeight: '900', letterSpacing: -0.2 },
});
