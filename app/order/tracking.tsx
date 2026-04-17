import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Linking, RefreshControl, Modal, ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { Logo } from '@/components/ui/Logo';
import { BackButton } from '@/components/ui/BackButton';
import { ExpoMap } from '@/components/maps/ExpoMap';
import { useOrderStore } from '@/stores/orderStore';
import { useShopStore } from '@/stores/shopStore';
import { connectSocket, disconnectSocket, joinOrderRoom } from '@/utils/socket';
import { apiService } from '@/api/apiService';
import { apiClient } from '@/api/client';
import { Shadow, thannigoPalette, roleAccent, roleSurface } from '@/constants/theme';

const CUSTOMER_ACCENT = roleAccent.customer;
const CUSTOMER_SURF = roleSurface.customer;

type StepStatus = 'done' | 'active' | 'pending';

interface Step {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  status: StepStatus;
}

// Tracking markers computed dynamically inside component (from active order data)
// In production, subscribe to Firebase Realtime DB for live driver coordinates

// Phone numbers are resolved from the order/shop data at runtime

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
      Toast.show({
        type: 'error',
        text1: `Call ${label}`,
        text2: `Unable to place a call. Please dial ${phone} manually.`
      });
    }
  }).catch(() => Toast.show({
    type: 'error',
    text1: 'Error',
    text2: 'Could not initiate call.'
  }));
};

export default function OrderTrackingScreen() {
  const { orders, activeOrderId } = useOrderStore();
  const { shops } = useShopStore();
  const activeOrder = orders.find((order) => order.id === activeOrderId) ?? orders[0];

  const [refreshing, setRefreshing] = React.useState(false);
  const [mapType, setMapType] = React.useState<'standard' | 'satellite' | 'hybrid' | 'terrain' | 'none'>('terrain');
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchInitialTracking().finally(() => setRefreshing(false));
  }, [activeOrder?.id]);
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const mapRef = useRef<any>(null);

  useAndroidBackHandler(() => {
    safeBack('/(tabs)');
  });

  const shop = shops.find((item) => item.id === activeOrder?.shopId);
  const quantity = activeOrder?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const deliveryFee = (activeOrder as any)?.delivery_fee ?? 20;
  const subtotal = Math.max((activeOrder?.total ?? 0) - deliveryFee, 0);

  // Resolve phone numbers from real data
  const shopPhone: string | null = (shop as any)?.phone ?? null;
  const [driverPhone, setDriverPhone] = useState<string | null>(null);

  // Dynamic markers — offset by shop index until real GPS data is available
  const shopIdx = shops.indexOf(shop ?? shops[0]);
  const baseLat = 12.9716 + shopIdx * 0.005;
  const baseLng = 80.2210 + shopIdx * 0.005;

  // Live driver location from socket; falls back to offset position when no real data yet
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Shop change offer state (when current shop rejects and a new shop is found)
  const [shopChangeOffer, setShopChangeOffer] = useState<{
    pendingShop: { id: number; name: string; phone?: string };
    previousTotal: number;
    newTotal: number;
  } | null>(null);
  const [shopChangeLoading, setShopChangeLoading] = useState(false);

  // Fallback simulated position used before the first real location_update arrives
  const [driverPos, setDriverPos] = React.useState({ lat: baseLat + 0.002, lng: baseLng + 0.002 });

  const fetchInitialTracking = async () => {
    try {
      const response = await apiService.get<any>(`/orders/${activeOrder?.id}/tracking`);
      if (response && response.status === 1 && response.data) {
        const d = response.data.data ?? response.data;
        if (d.latitude && d.longitude) {
          setDriverLocation({ lat: parseFloat(d.latitude), lng: parseFloat(d.longitude) });
        }
        if (d.driver_phone) setDriverPhone(d.driver_phone);
      }
    } catch (error) {
      console.warn('[Tracking] Initial fetch failed:', error);
    }
  };

  useEffect(() => {
    fetchInitialTracking();
    let mounted = true;

    connectSocket()
      .then((sock) => {
        if (!mounted) return;
        setSocketConnected(sock.connected);

        // Keep connected state in sync with socket events
        const onConnect = () => { if (mounted) setSocketConnected(true); };
        const onDisconnect = () => { if (mounted) setSocketConnected(false); };
        sock.on('connect', onConnect);
        sock.on('disconnect', onDisconnect);

        joinOrderRoom(activeOrder?.id ?? '');

        sock.on('location_update', (data: { latitude: number; longitude: number; order_id: string }) => {
          if (String(data.order_id) === String(activeOrder?.id) && mounted) {
            setDriverLocation({ lat: data.latitude, lng: data.longitude });
          }
        });

        sock.on('order_status', (data: { order_id: string; status: string; pending_shop?: any; previous_total?: number; new_total?: number }) => {
          if (String(data.order_id) === String(activeOrder?.id) && mounted) {
            if (data.status === 'awaiting_customer_confirm' && data.pending_shop) {
              setShopChangeOffer({
                pendingShop: data.pending_shop,
                previousTotal: data.previous_total ?? 0,
                newTotal: data.new_total ?? 0,
              });
            }
            if (data.status === 'cancelled') {
              setShopChangeOffer(null);
            }
          }
        });
      })
      .catch((err) => console.warn('Socket connect failed:', err));

    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, [activeOrder?.id]);

  // Fallback simulated movement — only runs when no live data is available
  useEffect(() => {
    if (driverLocation) return; // real GPS is live; skip simulation
    const interval = setInterval(() => {
      setDriverPos((prev) => {
        const dLat = (baseLat - prev.lat) * 0.1;
        const dLng = (baseLng - prev.lng) * 0.1;
        if (Math.abs(dLat) < 0.0001) {
          return {
            lat: prev.lat + (Math.random() - 0.5) * 0.0002,
            lng: prev.lng + (Math.random() - 0.5) * 0.0002,
          };
        }
        return { lat: prev.lat + dLat, lng: prev.lng + dLng };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [baseLat, baseLng, driverLocation]);

  // Use real socket location when available; otherwise fall back to simulated position
  const effectiveDriverPos = driverLocation ?? driverPos;

  const TRACKING_MARKERS = [
    { latitude: baseLat, longitude: baseLng, title: `📦 ${shop?.name ?? 'Shop'}`, color: '#005d90', iconType: 'home' as const },
    {
      latitude: effectiveDriverPos.lat,
      longitude: effectiveDriverPos.lng,
      title: `🚲 ${activeOrder?.deliveryAgentName ?? 'Driver'}${driverLocation ? ' (Live)' : ''}`,
      color: driverLocation ? '#00a878' : '#006878',
      iconType: 'bicycle' as const,
    },
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

  const handleShopChangeResponse = async (accept: boolean) => {
    if (!activeOrder?.id) return;
    try {
      setShopChangeLoading(true);
      await apiClient.post(`/orders/${activeOrder.id}/confirm-shop-change`, { accept });
      setShopChangeOffer(null);
      if (!accept) {
        Toast.show({ type: 'info', text1: 'Order Cancelled', text2: 'Your payment will be refunded.' });
        router.replace('/(tabs)' as any);
      } else {
        Toast.show({ type: 'success', text1: 'Confirmed!', text2: 'Your order is now with the new shop.' });
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e?.response?.data?.message ?? 'Please try again.' });
    } finally {
      setShopChangeLoading(false);
    }
  };

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
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            const msg = `Track my water order #${activeOrder?.id} from ${shop?.name ?? 'ThanniGo'}: https://thannigo.app/track/${activeOrder?.id}`;
            Linking.openURL(`whatsapp://send?text=${msg}`).catch(() =>
              Toast.show({
                type: 'info',
                text1: 'Share',
                text2: `Copy this message: ${msg}`
              })
            );
          }}
        >
          <Ionicons name="share-social-outline" size={20} color={CUSTOMER_ACCENT} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.backBtn, { marginLeft: 10 }]} onPress={() => router.push('/notifications' as any)}>
          <Ionicons name="notifications-outline" size={20} color={CUSTOMER_ACCENT} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[CUSTOMER_ACCENT]} tintColor={CUSTOMER_ACCENT} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── LIVE TRACKING MAP ── */}
        <View style={styles.mapCard}>
          <ExpoMap
            ref={mapRef}
            style={styles.mapImage}
            initialRegion={{
              latitude: TRACKING_MARKERS[0].latitude,
              longitude: TRACKING_MARKERS[0].longitude,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            }}
            markers={TRACKING_MARKERS}
            showRoute
            mapType={mapType}
            showsTraffic={true}
            hideControls={true}
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
              <Ionicons name="expand-outline" size={20} color="#005d90" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mapIconBtn, { marginTop: 8 }]}
              onPress={() => {
                mapRef.current?.animateToRegion({
                  latitude: TRACKING_MARKERS[1].latitude,
                  longitude: TRACKING_MARKERS[1].longitude,
                  latitudeDelta: 0.008,
                  longitudeDelta: 0.008,
                });
                Toast.show({
                  type: 'info',
                  text1: 'Tracking',
                  text2: 'Re-centering on your live delivery position...'
                });
              }}
            >
              <Ionicons name="locate" size={20} color="#005d90" />
            </TouchableOpacity>
          </View>

          <View style={[styles.mapOverlay, { pointerEvents: 'none' }]} />

          {/* ETA chip */}
          <View style={styles.etaChip}>
            <Ionicons name="time-outline" size={14} color="#005d90" />
            <Text style={styles.etaText}>{activeOrder?.eta ?? '~5 mins away'}</Text>
          </View>

          {/* Map Layer Controls */}
          <View style={styles.mapLayerControls}>
             <TouchableOpacity style={styles.miniTypeBtn} onPress={() => {
                const types: any[] = ['standard', 'satellite', 'terrain'];
                const nextIdx = (types.indexOf(mapType) + 1) % 3;
                setMapType(types[nextIdx]);
             }}>
                <Ionicons 
                  name={mapType === 'satellite' ? 'images' : mapType === 'terrain' ? 'earth' : 'map'} 
                  size={14} 
                  color="#005d90" 
                />
             </TouchableOpacity>
          </View>

          {/* Driver info card overlaid on map */}
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Ionicons name="bicycle" size={20} color="#005d90" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.driverLabelRow}>
                <Text style={styles.driverLabel}>DELIVERY PARTNER</Text>
                {/* Socket live status badge */}
                <View style={[styles.liveBadge, !socketConnected && styles.liveBadgeConnecting]}>
                  <View style={[styles.liveDot, !socketConnected && styles.liveDotConnecting]} />
                  <Text style={[styles.liveBadgeText, !socketConnected && styles.liveBadgeTextConnecting]}>
                    {socketConnected ? 'Live' : 'Connecting...'}
                  </Text>
                </View>
              </View>
              <Text style={styles.driverName}>{activeOrder?.deliveryAgentName ?? 'Assigned shortly'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.callDriverBtn, !driverPhone && { opacity: 0.4 }]}
              onPress={() => driverPhone && callNumber(driverPhone, 'Driver')}
              activeOpacity={0.8}
              disabled={!driverPhone}
            >
              <Ionicons name="call" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── TIMELINE ── */}
        <View style={styles.timelineCard}>
          <View style={styles.timelineDecor}>
            <Ionicons name="water" size={100} color={CUSTOMER_ACCENT} style={{ opacity: 0.04 }} />
          </View>
          {steps.map((step, index) => (
            <StepNode key={step.title} step={step} isLast={index === steps.length - 1} />
          ))}
        </View>

        {/* ── QUICK ACTIONS ── */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionCard, !shopPhone && { opacity: 0.4 }]}
            activeOpacity={0.8}
            onPress={() => shopPhone && callNumber(shopPhone, 'Shop')}
            disabled={!shopPhone}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#ebeef4' }]}>
              <Ionicons name="storefront-outline" size={22} color="#404850" />
            </View>
            <Text style={styles.actionLabel}>Call Shop</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardPrimary, !driverPhone && { opacity: 0.4 }]}
            activeOpacity={0.8}
            onPress={() => driverPhone && callNumber(driverPhone, 'Driver')}
            disabled={!driverPhone}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#005d90' }]}>
              <Ionicons name="call" size={22} color="white" />
            </View>
            <Text style={[styles.actionLabel, { color: '#005d90', fontWeight: '800' }]}>
              Call Driver
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, !driverPhone && { opacity: 0.4 }]}
            activeOpacity={0.8}
            onPress={() => driverPhone && Linking.openURL(`whatsapp://send?phone=${driverPhone}&text=Hi, I%27m tracking my water delivery order.`)}
            disabled={!driverPhone}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#e8f5e9' }]}>
              <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
            </View>
            <Text style={[styles.actionLabel, { color: '#25D366', fontWeight: '800' }]}>WhatsApp</Text>
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
          {(activeOrder?.items ?? []).length > 0 ? (
            activeOrder!.items.map((item: any, idx: number) => (
              <View key={idx} style={styles.summaryRow}>
                <Text style={styles.summaryKey}>{item.name ?? item.product_name ?? 'Item'} (×{item.quantity})</Text>
                <Text style={styles.summaryVal}>₹{((item.price ?? 0) * item.quantity).toFixed(0)}</Text>
              </View>
            ))
          ) : quantity > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Items (×{quantity})</Text>
              <Text style={styles.summaryVal}>₹{subtotal.toFixed(0)}</Text>
            </View>
          ) : null}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Delivery Fee</Text>
            <Text style={styles.summaryVal}>₹{deliveryFee}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalKey}>Total</Text>
            <Text style={styles.summaryTotalVal}>₹{(activeOrder?.total ?? 0).toFixed(2)}</Text>
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

          {/* Share tracking via WhatsApp */}
          <TouchableOpacity
            style={[styles.rateBtn, { marginTop: 10, borderColor: '#dcfce7', backgroundColor: '#f0fdf4' }]}
            onPress={() => Linking.openURL(
              `whatsapp://send?text=Track my ThanniGo water delivery → Order%20%23${activeOrder?.id ?? 'TNG-001'}%20is%20${activeOrder?.status ?? 'on%20its%20way'}!`
            )}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
            <Text style={[styles.rateBtnText, { color: '#25D366' }]}>Share Tracking with Family</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* SHOP CHANGE OFFER MODAL */}
      <Modal visible={!!shopChangeOffer} transparent animationType="slide">
        <View style={styles.shopChangeOverlay}>
          <View style={styles.shopChangeSheet}>
            <View style={styles.shopChangePill} />
            <View style={styles.shopChangeIconWrap}>
              <Ionicons name="storefront" size={32} color="#b45309" />
            </View>
            <Text style={styles.shopChangeTitle}>Shop Rejected Your Order</Text>
            <Text style={styles.shopChangeSub}>
              A nearby shop <Text style={{ fontWeight: '800', color: '#181c20' }}>{shopChangeOffer?.pendingShop?.name}</Text> is available and can fulfil your order.
            </Text>

            <View style={styles.shopChangePriceRow}>
              {shopChangeOffer && shopChangeOffer.newTotal !== shopChangeOffer.previousTotal ? (
                <>
                  <View style={styles.shopChangePriceBox}>
                    <Text style={styles.shopChangePriceLabel}>Previous Total</Text>
                    <Text style={[styles.shopChangePriceVal, { textDecorationLine: 'line-through', color: '#94a3b8' }]}>₹{shopChangeOffer.previousTotal}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color="#94a3b8" />
                  <View style={styles.shopChangePriceBox}>
                    <Text style={styles.shopChangePriceLabel}>New Total</Text>
                    <Text style={[styles.shopChangePriceVal, { color: '#005d90' }]}>₹{shopChangeOffer.newTotal}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.shopChangePriceBox}>
                  <Text style={styles.shopChangePriceLabel}>Total</Text>
                  <Text style={[styles.shopChangePriceVal, { color: '#005d90' }]}>₹{shopChangeOffer?.newTotal}</Text>
                </View>
              )}
            </View>

            <Text style={styles.shopChangeQuestion}>Would you like to continue with this shop?</Text>

            <View style={styles.shopChangeBtns}>
              <TouchableOpacity
                style={styles.shopChangeRejectBtn}
                onPress={() => handleShopChangeResponse(false)}
                disabled={shopChangeLoading}
              >
                {shopChangeLoading ? <ActivityIndicator color="#dc2626" /> : <Text style={styles.shopChangeRejectText}>No, Cancel Order</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shopChangeAcceptBtn}
                onPress={() => handleShopChangeResponse(true)}
                disabled={shopChangeLoading}
              >
                {shopChangeLoading ? <ActivityIndicator color="white" /> : <Text style={styles.shopChangeAcceptText}>Yes, Continue</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: thannigoPalette.background },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1, borderBottomColor: thannigoPalette.borderSoft,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: thannigoPalette.surface, alignItems: 'center', justifyContent: 'center',
    ...Shadow.xs,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandName: { fontSize: 18, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.4 },
  headerSub: { fontSize: 12, color: thannigoPalette.neutral, fontWeight: '500', marginTop: 1 },

  // Map
  mapCard: {
    height: 220, borderRadius: 24, marginTop: 20, marginBottom: 20,
    overflow: 'hidden', position: 'relative',
    ...Shadow.md,
  },
  mapImage: { width: '100%', height: '100%' },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  etaChip: {
    position: 'absolute', top: 14, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    ...Shadow.sm,
  },
  etaText: { fontSize: 12, fontWeight: '700', color: CUSTOMER_ACCENT },
  mapControls: {
    position: 'absolute', top: 60, right: 14,
    zIndex: 10,
  },
  mapIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  driverCard: {
    position: 'absolute', bottom: 12, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 10,
    ...Shadow.sm,
  },
  driverAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: CUSTOMER_SURF, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: CUSTOMER_ACCENT,
  },
  driverLabel: { fontSize: 9, fontWeight: '700', color: thannigoPalette.neutral, textTransform: 'uppercase', letterSpacing: 1 },
  driverName: { fontSize: 15, fontWeight: '800', color: thannigoPalette.darkText },
  callDriverBtn: {
    marginLeft: 'auto', width: 38, height: 38, borderRadius: 19,
    backgroundColor: CUSTOMER_ACCENT, alignItems: 'center', justifyContent: 'center',
  },

  // Timeline
  timelineCard: {
    backgroundColor: thannigoPalette.surface, borderRadius: 24, padding: 24, marginBottom: 16,
    position: 'relative', overflow: 'hidden',
    ...Shadow.sm,
  },
  timelineDecor: { position: 'absolute', right: -10, top: -10 },
  stepRow: { flexDirection: 'row', gap: 16 },
  stepLeft: { alignItems: 'center', width: 40 },
  stepCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  stepCircleDone: { backgroundColor: CUSTOMER_ACCENT },
  stepCircleActive: {
    backgroundColor: '#006878', borderWidth: 3, borderColor: 'white',
    shadowColor: '#006878', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6,
  },
  stepCirclePending: { backgroundColor: thannigoPalette.surface },
  stepLine: { width: 4, flex: 1, backgroundColor: thannigoPalette.borderSoft, marginVertical: 4, borderRadius: 2 },
  stepLineFilled: { backgroundColor: CUSTOMER_ACCENT },
  stepContent: { flex: 1, paddingTop: 8, paddingBottom: 20 },
  stepTitle: { fontSize: 16, fontWeight: '800', color: thannigoPalette.darkText, marginBottom: 3 },
  stepTitleActive: { color: CUSTOMER_ACCENT },
  stepSub: { fontSize: 13, color: thannigoPalette.neutral, fontWeight: '500' },

  // Actions
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionCard: {
    flex: 1, backgroundColor: thannigoPalette.surface, borderRadius: 24,
    padding: 20, alignItems: 'center', gap: 10,
    ...Shadow.xs,
  },
  actionCardPrimary: { backgroundColor: CUSTOMER_SURF },
  actionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 14, fontWeight: '700', color: '#404850' },

  // Summary
  summaryCard: {
    backgroundColor: thannigoPalette.surface, borderRadius: 24, padding: 20, marginBottom: 16,
    ...Shadow.xs,
  },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  summaryTitle: { fontSize: 17, fontWeight: '800', color: thannigoPalette.darkText },
  prepaidBadge: { backgroundColor: CUSTOMER_SURF, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  prepaidText: { fontSize: 10, fontWeight: '700', color: CUSTOMER_ACCENT, letterSpacing: 0.5 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryKey: { fontSize: 13, color: thannigoPalette.neutral, fontWeight: '500' },
  summaryVal: { fontSize: 13, color: thannigoPalette.darkText, fontWeight: '700' },
  summaryDivider: { height: 1, backgroundColor: thannigoPalette.borderSoft, marginVertical: 10 },
  summaryTotalKey: { fontSize: 16, fontWeight: '900', color: thannigoPalette.darkText },
  summaryTotalVal: { fontSize: 20, fontWeight: '900', color: CUSTOMER_ACCENT },
  rateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 16, paddingVertical: 12,
    backgroundColor: thannigoPalette.background, borderRadius: 14,
    borderWidth: 1, borderColor: thannigoPalette.borderSoft,
  },
  rateBtnText: { color: CUSTOMER_ACCENT, fontWeight: '700', fontSize: 14 },
  mapLayerControls: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 10,
  },
  miniTypeBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.xs,
  },

  // Shop change offer modal
  shopChangeOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  shopChangeSheet: { backgroundColor: thannigoPalette.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingBottom: 40, alignItems: 'center' },
  shopChangePill: { width: 40, height: 4, backgroundColor: thannigoPalette.borderSoft, borderRadius: 2, marginBottom: 24 },
  shopChangeIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  shopChangeTitle: { fontSize: 20, fontWeight: '900', color: thannigoPalette.darkText, textAlign: 'center', marginBottom: 8 },
  shopChangeSub: { fontSize: 14, color: thannigoPalette.neutral, textAlign: 'center', lineHeight: 20, fontWeight: '500', marginBottom: 20 },
  shopChangePriceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, backgroundColor: thannigoPalette.background, borderRadius: 16, padding: 16, width: '100%', justifyContent: 'center' },
  shopChangePriceBox: { alignItems: 'center', gap: 4 },
  shopChangePriceLabel: { fontSize: 11, fontWeight: '700', color: thannigoPalette.neutral, textTransform: 'uppercase' },
  shopChangePriceVal: { fontSize: 22, fontWeight: '900' },
  shopChangeQuestion: { fontSize: 15, fontWeight: '700', color: thannigoPalette.darkText, textAlign: 'center', marginBottom: 20 },
  shopChangeBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  shopChangeRejectBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, borderWidth: 1.5, borderColor: '#fecaca', alignItems: 'center', backgroundColor: '#fff5f5' },
  shopChangeRejectText: { fontSize: 14, fontWeight: '800', color: '#dc2626' },
  shopChangeAcceptBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: CUSTOMER_ACCENT, alignItems: 'center' },
  shopChangeAcceptText: { fontSize: 14, fontWeight: '800', color: 'white' },

  // Live socket status badge inside driver card
  driverLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 1 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#dcfce7', borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  liveBadgeConnecting: { backgroundColor: '#fef9c3' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' },
  liveDotConnecting: { backgroundColor: '#ca8a04' },
  liveBadgeText: { fontSize: 9, fontWeight: '700', color: '#16a34a', letterSpacing: 0.3 },
  liveBadgeTextConnecting: { color: '#ca8a04' },
});


