import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppNavigation } from '@/hooks/use-app-navigation';

import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { Logo } from '@/components/ui/Logo';
import { BackButton } from '@/components/ui/BackButton';

import { ExpoMap } from '@/components/maps/ExpoMap';
import { useOrderStore } from '@/stores/orderStore';
import { useShopStore } from '@/stores/shopStore';

type StepStatus = 'done' | 'active' | 'pending';

interface Step {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  status: StepStatus;
}

// Tracking markers computed dynamically inside component (from active order data)
// In production, subscribe to Firebase Realtime DB for live driver coordinates

const DRIVER_PHONE = '+919876543210';
const SHOP_PHONE   = '+919123456789';

function StepNode({ step, isLast }: { step: Step; isLast: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (step.status === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.18, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [step.status]);

  const isDone    = step.status === 'done';
  const isActive  = step.status === 'active';
  const isPending = step.status === 'pending';

  return (
    <View style={styles.stepRow}>
      <View style={styles.stepLeft}>
        <Animated.View
          style={[
            styles.stepCircle,
            isDone    && styles.stepCircleDone,
            isActive  && styles.stepCircleActive,
            isPending && styles.stepCirclePending,
            isActive  && { transform: [{ scale: pulse }] },
          ]}
        >
          <Ionicons name={step.icon} size={18} color={isPending ? '#bfc7d1' : 'white'} />
        </Animated.View>
        {!isLast && (
          <View style={[styles.stepLine, (isDone || isActive) && styles.stepLineFilled]} />
        )}
      </View>
      <View style={[styles.stepContent, isPending && { opacity: 0.45 }]}>
        <Text style={[styles.stepTitle, isActive && styles.stepTitleActive]}>{step.title}</Text>
        <Text style={styles.stepSub}>{step.subtitle}</Text>
      </View>
    </View>
  );
}

const callNumber = (phone: string, label: string) => {
  const url = `tel:${phone}`;
  Linking.canOpenURL(url).then((can) => {
    if (can) {
      Linking.openURL(url);
    } else {
      Alert.alert(`Call ${label}`, `Unable to place a call. Please dial ${phone} manually.`);
    }
  }).catch(() => Alert.alert('Error', 'Could not initiate call.'));
};

export default function OrderTrackingScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const router = useRouter();
  const { safeBack } = useAppNavigation();

  const { orders, activeOrderId } = useOrderStore();
  const { shops } = useShopStore();

  useAndroidBackHandler(() => {
    safeBack('/(tabs)');
  });


  const activeOrder = orders.find((order) => order.id === activeOrderId) ?? orders[0];
  const shop = shops.find((item) => item.id === activeOrder?.shopId);
  const quantity = activeOrder?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 2;
  const deliveryFee = 20;
  const subtotal = Math.max((activeOrder?.total ?? 110) - deliveryFee, 0);

  // Dynamic markers — offset by shop index until real GPS data is available
  const shopIdx = shops.indexOf(shop ?? shops[0]);
  const baseLat = 12.9716 + shopIdx * 0.005;
  const baseLng = 80.2210 + shopIdx * 0.005;
  const TRACKING_MARKERS = [
    { latitude: baseLat, longitude: baseLng, title: `📦 ${shop?.name ?? 'Shop'}`, color: '#005d90', iconType: 'home' as const },
    { latitude: baseLat + 0.002, longitude: baseLng + 0.002, title: `🚲 ${activeOrder?.deliveryAgentName ?? 'Driver'}`, color: '#006878', iconType: 'bicycle' as const },
  ];
  const steps: Step[] = [
    {
      icon: 'water',
      title: 'Order Placed',
      subtitle: activeOrder ? `Your order was placed ${activeOrder.createdAtLabel}` : 'Your order was placed recently',
      status: 'done',
    },
    {
      icon: 'checkmark-circle',
      title: 'Accepted by Shop',
      subtitle: shop ? `${shop.name} confirmed your request` : 'Confirmed by the shop',
      status:
        activeOrder && ['accepted', 'preparing', 'out_for_delivery', 'delivered'].includes(activeOrder.status)
          ? 'done'
          : activeOrder?.status === 'pending'
            ? 'active'
            : 'pending',
    },
    {
      icon: 'bicycle',
      title: 'Out for Delivery',
      subtitle: activeOrder?.deliveryAgentName
        ? `${activeOrder.deliveryAgentName} is heading to your location`
        : 'Driver assignment will appear here',
      status:
        activeOrder && ['out_for_delivery', 'delivered'].includes(activeOrder.status)
          ? activeOrder.status === 'delivered'
            ? 'done'
            : 'active'
          : 'pending',
    },
    {
      icon: 'home',
      title: 'Delivered',
      subtitle: activeOrder?.status === 'delivered' ? 'Order completed successfully' : `Expected in ${activeOrder?.eta ?? 'a short while'}`,
      status: activeOrder?.status === 'delivered' ? 'active' : 'pending',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <BackButton fallback="/(tabs)" />
        <View style={{ flex: 1 }}>

          <View style={styles.brandRow}>
            <Logo size="sm" />
            <Text style={styles.brandName}>ThanniGo</Text>
          </View>
          <Text style={styles.headerSub}>Order #{activeOrder?.id ?? 'TNG-TRACK'}</Text>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/notifications' as any)}>
          <Ionicons name="notifications-outline" size={20} color="#005d90" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
      >
        {/* ── LIVE TRACKING MAP ── */}
        <View style={styles.mapCard}>
          <ExpoMap
            style={styles.mapImage}
            initialRegion={{
              latitude: TRACKING_MARKERS[0].latitude,
              longitude: TRACKING_MARKERS[0].longitude,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            }}
            markers={TRACKING_MARKERS}
            showRoute
          />

          {/* Map Controls */}
          <View style={styles.mapControls}>
            <TouchableOpacity
              style={styles.mapIconBtn}
              onPress={() => {
                router.push({
                  pathname: '/map-preview',
                  params: {
                    lat: TRACKING_MARKERS[0].latitude.toString(),
                    lng: TRACKING_MARKERS[0].longitude.toString(),
                    title: 'Delivery Status',
                    target: 'view',
                    markers: JSON.stringify(TRACKING_MARKERS)
                  }
                } as any);
              }}
            >
              <Ionicons name="eye-outline" size={20} color="#005d90" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mapIconBtn, { marginTop: 8 }]}
              onPress={() => {
                Alert.alert('Tracking', 'Re-centering on your live delivery position...');
              }}
            >
              <Ionicons name="locate" size={20} color="#005d90" />
            </TouchableOpacity>
          </View>

          {/* Overlay gradient at bottom */}
          <View style={styles.mapOverlay} pointerEvents="none" />

          {/* ETA chip */}
          <View style={styles.etaChip}>
            <Ionicons name="time-outline" size={14} color="#005d90" />
            <Text style={styles.etaText}>{activeOrder?.eta ?? '~5 mins away'}</Text>
          </View>

          {/* Driver info card overlaid on map */}
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Ionicons name="bicycle" size={20} color="#005d90" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverLabel}>DELIVERY PARTNER</Text>
              <Text style={styles.driverName}>{activeOrder?.deliveryAgentName ?? 'Assigned shortly'}</Text>
            </View>
            <TouchableOpacity
              style={styles.callDriverBtn}
              onPress={() => callNumber(DRIVER_PHONE, 'Driver')}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── TIMELINE ── */}
        <View style={styles.timelineCard}>
          <View style={styles.timelineDecor}>
            <Ionicons name="water" size={100} color="#005d90" style={{ opacity: 0.04 }} />
          </View>
          {steps.map((step, index) => (
            <StepNode key={step.title} step={step} isLast={index === steps.length - 1} />
          ))}
        </View>

        {/* ── QUICK ACTIONS ── */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => callNumber(SHOP_PHONE, 'Shop')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#ebeef4' }]}>
              <Ionicons name="storefront-outline" size={22} color="#404850" />
            </View>
            <Text style={styles.actionLabel}>Call Shop</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardPrimary]}
            activeOpacity={0.8}
            onPress={() => callNumber(DRIVER_PHONE, 'Driver')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#005d90' }]}>
              <Ionicons name="call" size={22} color="white" />
            </View>
            <Text style={[styles.actionLabel, { color: '#005d90', fontWeight: '800' }]}>
              Call Driver
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── ORDER SUMMARY ── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Order Details</Text>
            <View style={styles.prepaidBadge}>
              <Text style={styles.prepaidText}>{activeOrder?.paymentMethod === 'cod' ? 'COD' : 'PREPAID'}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>20L Water Can (×2)</Text>
            <Text style={styles.summaryVal}>₹90</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Delivery Fee</Text>
            <Text style={styles.summaryVal}>₹20</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalKey}>Total</Text>
            <Text style={styles.summaryTotalVal}>₹110.00</Text>
          </View>

          {/* Rate order CTA when delivered */}
          <TouchableOpacity
            style={styles.rateBtn}
            onPress={() => router.push('/order/rating' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="star-outline" size={16} color="#005d90" />
            <Text style={styles.rateBtnText}>Rate this Delivery</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1, borderBottomColor: '#f1f4f9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: '#ebeef4', alignItems: 'center', justifyContent: 'center',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandName: { fontSize: 18, fontWeight: '900', color: '#003a5c', letterSpacing: -0.4 },
  headerSub: { fontSize: 12, color: '#707881', fontWeight: '500', marginTop: 1 },

  // Map
  mapCard: {
    height: 220, borderRadius: 24, marginTop: 20, marginBottom: 20,
    overflow: 'hidden', position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 5,
  },
  mapImage: { width: '100%', height: '100%' },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // subtle bottom fade for overlay cards
    backgroundImage: undefined,
  },
  etaChip: {
    position: 'absolute', top: 14, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  etaText: { fontSize: 12, fontWeight: '700', color: '#005d90' },
  mapControls: {
    position: 'absolute', top: 60, right: 14,
    zIndex: 10,
  },
  mapIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  driverCard: {
    position: 'absolute', bottom: 12, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  driverAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#005d90',
  },
  driverLabel: { fontSize: 9, fontWeight: '700', color: '#707881', textTransform: 'uppercase', letterSpacing: 1 },
  driverName: { fontSize: 15, fontWeight: '800', color: '#181c20' },
  callDriverBtn: {
    marginLeft: 'auto', width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#005d90', alignItems: 'center', justifyContent: 'center',
  },

  // Timeline
  timelineCard: {
    backgroundColor: 'white', borderRadius: 24, padding: 24, marginBottom: 16,
    position: 'relative', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  timelineDecor: { position: 'absolute', right: -10, top: -10 },
  stepRow: { flexDirection: 'row', gap: 16 },
  stepLeft: { alignItems: 'center', width: 40 },
  stepCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  stepCircleDone: { backgroundColor: '#005d90' },
  stepCircleActive: {
    backgroundColor: '#006878', borderWidth: 3, borderColor: 'white',
    shadowColor: '#006878', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6,
  },
  stepCirclePending: { backgroundColor: '#ebeef4' },
  stepLine: { width: 4, flex: 1, backgroundColor: '#e0e2e8', marginVertical: 4, borderRadius: 2 },
  stepLineFilled: { backgroundColor: '#005d90' },
  stepContent: { flex: 1, paddingTop: 8, paddingBottom: 20 },
  stepTitle: { fontSize: 16, fontWeight: '800', color: '#181c20', marginBottom: 3 },
  stepTitleActive: { color: '#005d90' },
  stepSub: { fontSize: 13, color: '#707881', fontWeight: '500' },

  // Actions
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionCard: {
    flex: 1, backgroundColor: 'white', borderRadius: 24,
    padding: 20, alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  actionCardPrimary: { backgroundColor: '#e0f0ff' },
  actionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 14, fontWeight: '700', color: '#404850' },

  // Summary
  summaryCard: {
    backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  summaryTitle: { fontSize: 17, fontWeight: '800', color: '#181c20' },
  prepaidBadge: { backgroundColor: '#e0f0ff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  prepaidText: { fontSize: 10, fontWeight: '700', color: '#005d90', letterSpacing: 0.5 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryKey: { fontSize: 13, color: '#707881', fontWeight: '500' },
  summaryVal: { fontSize: 13, color: '#181c20', fontWeight: '700' },
  summaryDivider: { height: 1, backgroundColor: '#f1f4f9', marginVertical: 10 },
  summaryTotalKey: { fontSize: 16, fontWeight: '900', color: '#181c20' },
  summaryTotalVal: { fontSize: 20, fontWeight: '900', color: '#005d90' },
  rateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 16, paddingVertical: 12,
    backgroundColor: '#f1f4f9', borderRadius: 14,
    borderWidth: 1, borderColor: '#e0e2e8',
  },
  rateBtnText: { color: '#005d90', fontWeight: '700', fontSize: 14 },
});
