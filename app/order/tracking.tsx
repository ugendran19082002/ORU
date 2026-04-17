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
import { Shadow, roleAccent, roleSurface, makeShadow } from '@/constants/theme';
import { useAppTheme } from '@/providers/ThemeContext';

const CUSTOMER_ACCENT = roleAccent.customer;
const CUSTOMER_SURF = roleSurface.customer;
const SHOP_ACCENT = roleAccent.shop_owner;

type StepStatus = 'done' | 'active' | 'pending';

interface Step {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  status: StepStatus;
}

function StepNode({ step, isLast, colors, isDark }: { step: Step; isLast: boolean; colors: any; isDark: boolean }) {
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

  const isDone = step.status === 'done';
  const isActive = step.status === 'active';
  const isPending = step.status === 'pending';

  return (
    <View style={stepStyles.row}>
      <View style={stepStyles.left}>
        <Animated.View
          style={[
            stepStyles.circle,
            isDone && { backgroundColor: CUSTOMER_ACCENT },
            isActive && {
              backgroundColor: SHOP_ACCENT, borderWidth: 3, borderColor: isDark ? '#1f2937' : 'white',
              shadowColor: SHOP_ACCENT, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6,
            },
            isPending && { backgroundColor: isDark ? '#1f2937' : '#f1f5f9' },
            isActive && { transform: [{ scale: pulse }] },
          ]}
        >
          <Ionicons name={step.icon} size={17} color={isPending ? colors.muted : 'white'} />
        </Animated.View>
        {!isLast && (
          <View style={[
            stepStyles.line,
            { backgroundColor: isDone || isActive ? CUSTOMER_ACCENT : colors.border },
          ]} />
        )}
      </View>
      <View style={[stepStyles.content, isPending && { opacity: 0.45 }]}>
        <Text style={[stepStyles.title, { color: isActive ? CUSTOMER_ACCENT : colors.text }]}>{step.title}</Text>
        <Text style={[stepStyles.sub, { color: colors.muted }]}>{step.subtitle}</Text>
      </View>
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 16 },
  left: { alignItems: 'center', width: 40 },
  circle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  line: { width: 4, flex: 1, marginVertical: 4, borderRadius: 2 },
  content: { flex: 1, paddingTop: 8, paddingBottom: 20 },
  title: { fontSize: 15, fontWeight: '800', marginBottom: 3 },
  sub: { fontSize: 13, fontWeight: '500' },
});

const callNumber = (phone: string, label: string) => {
  const url = `tel:${phone}`;
  Linking.canOpenURL(url).then((can) => {
    if (can) {
      Linking.openURL(url);
    } else {
      Toast.show({ type: 'error', text1: `Call ${label}`, text2: `Unable to place a call. Please dial ${phone} manually.` });
    }
  }).catch(() => Toast.show({ type: 'error', text1: 'Error', text2: 'Could not initiate call.' }));
};

export default function OrderTrackingScreen() {
  const { orders, activeOrderId } = useOrderStore();
  const { shops } = useShopStore();
  const activeOrder = orders.find((order) => order.id === activeOrderId) ?? orders[0];
  const { colors, isDark } = useAppTheme();

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

  const shopPhone: string | null = (shop as any)?.phone ?? null;
  const [driverPhone, setDriverPhone] = useState<string | null>(null);

  const shopIdx = shops.indexOf(shop ?? shops[0]);
  const baseLat = 12.9716 + shopIdx * 0.005;
  const baseLng = 80.2210 + shopIdx * 0.005;

  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const [shopChangeOffer, setShopChangeOffer] = useState<{
    pendingShop: { id: number; name: string; phone?: string };
    previousTotal: number;
    newTotal: number;
  } | null>(null);
  const [shopChangeLoading, setShopChangeLoading] = useState(false);

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
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchInitialTracking();
    let mounted = true;

    connectSocket()
      .then((sock) => {
        if (!mounted) return;
        setSocketConnected(sock.connected);

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
            if (data.status === 'cancelled') setShopChangeOffer(null);
          }
        });
      })
      .catch(() => {});

    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, [activeOrder?.id]);

  useEffect(() => {
    if (driverLocation) return;
    const interval = setInterval(() => {
      setDriverPos((prev) => {
        const dLat = (baseLat - prev.lat) * 0.1;
        const dLng = (baseLng - prev.lng) * 0.1;
        if (Math.abs(dLat) < 0.0001) {
          return { lat: prev.lat + (Math.random() - 0.5) * 0.0002, lng: prev.lng + (Math.random() - 0.5) * 0.0002 };
        }
        return { lat: prev.lat + dLat, lng: prev.lng + dLng };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [baseLat, baseLng, driverLocation]);

  const effectiveDriverPos = driverLocation ?? driverPos;

  const TRACKING_MARKERS = [
    { latitude: baseLat, longitude: baseLng, title: `📦 ${shop?.name ?? 'Shop'}`, color: CUSTOMER_ACCENT, iconType: 'home' as const },
    {
      latitude: effectiveDriverPos.lat,
      longitude: effectiveDriverPos.lng,
      title: `🚲 ${activeOrder?.deliveryAgentName ?? 'Driver'}${driverLocation ? ' (Live)' : ''}`,
      color: driverLocation ? '#00a878' : SHOP_ACCENT,
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
      status: activeOrder && ['accepted', 'preparing', 'out_for_delivery', 'delivered'].includes(activeOrder.status)
        ? 'done'
        : activeOrder?.status === 'pending' ? 'active' : 'pending',
    },
    {
      icon: 'bicycle',
      title: 'Out for Delivery',
      subtitle: activeOrder?.deliveryAgentName
        ? `${activeOrder.deliveryAgentName} is heading to your location`
        : 'Driver assignment will appear here',
      status: activeOrder && ['out_for_delivery', 'delivered'].includes(activeOrder.status)
        ? activeOrder.status === 'delivered' ? 'done' : 'active'
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

  const surf = colors.surface;
  const border = colors.border;
  const text = colors.text;
  const muted = colors.muted;
  const inputBg = colors.inputBg;
  const bg = colors.background;
  const shadow = makeShadow(isDark);

  const floatBg = isDark ? 'rgba(17,24,39,0.97)' : 'rgba(255,255,255,0.95)';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: surf, borderBottomColor: border }]}>
        <BackButton fallback="/(tabs)" />
        <View style={{ flex: 1 }}>
          <View style={styles.brandRow}>
            <Logo size="sm" />
            <Text style={[styles.brandName, { color: text }]}>ThanniGo</Text>
          </View>
          <Text style={[styles.headerSub, { color: muted }]}>Order #{activeOrder?.id ?? 'TNG-TRACK'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.headerBtn, { backgroundColor: inputBg }]}
          onPress={() => {
            const msg = `Track my water order #${activeOrder?.id} from ${shop?.name ?? 'ThanniGo'}: https://thannigo.app/track/${activeOrder?.id}`;
            Linking.openURL(`whatsapp://send?text=${msg}`).catch(() =>
              Toast.show({ type: 'info', text1: 'Share', text2: `Copy this message: ${msg}` })
            );
          }}
        >
          <Ionicons name="share-social-outline" size={19} color={CUSTOMER_ACCENT} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.headerBtn, { backgroundColor: inputBg, marginLeft: 8 }]}
          onPress={() => router.push('/notifications' as any)}
        >
          <Ionicons name="notifications-outline" size={19} color={CUSTOMER_ACCENT} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[CUSTOMER_ACCENT]} tintColor={CUSTOMER_ACCENT} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 4 }}
      >
        {/* LIVE TRACKING MAP */}
        <View style={[styles.mapCard, shadow.md]}>
          <ExpoMap
            ref={mapRef}
            style={styles.mapFill}
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

          {/* Map controls */}
          <View style={styles.mapControls}>
            <TouchableOpacity
              style={[styles.mapIconBtn, { backgroundColor: floatBg }]}
              onPress={() => {
                router.push({
                  pathname: '/map-preview',
                  params: {
                    lat: TRACKING_MARKERS[0].latitude.toString(),
                    lng: TRACKING_MARKERS[0].longitude.toString(),
                    title: 'Delivery Status',
                    target: 'view',
                    markers: JSON.stringify(TRACKING_MARKERS),
                  },
                } as any);
              }}
            >
              <Ionicons name="expand-outline" size={19} color={CUSTOMER_ACCENT} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mapIconBtn, { backgroundColor: floatBg, marginTop: 8 }]}
              onPress={() => {
                mapRef.current?.animateToRegion({
                  latitude: TRACKING_MARKERS[1].latitude,
                  longitude: TRACKING_MARKERS[1].longitude,
                  latitudeDelta: 0.008,
                  longitudeDelta: 0.008,
                });
              }}
            >
              <Ionicons name="locate" size={19} color={CUSTOMER_ACCENT} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mapIconBtn, { backgroundColor: floatBg, marginTop: 8 }]}
              onPress={() => {
                const types: any[] = ['standard', 'satellite', 'terrain'];
                const nextIdx = (types.indexOf(mapType) + 1) % 3;
                setMapType(types[nextIdx]);
              }}
            >
              <Ionicons
                name={mapType === 'satellite' ? 'images' : mapType === 'terrain' ? 'earth' : 'map'}
                size={16}
                color={CUSTOMER_ACCENT}
              />
            </TouchableOpacity>
          </View>

          {/* ETA chip */}
          <View style={[styles.etaChip, { backgroundColor: floatBg }]}>
            <Ionicons name="time-outline" size={13} color={CUSTOMER_ACCENT} />
            <Text style={[styles.etaText, { color: CUSTOMER_ACCENT }]}>{activeOrder?.eta ?? '~5 mins away'}</Text>
          </View>

          {/* Driver info overlay */}
          <View style={[styles.driverCard, { backgroundColor: floatBg }]}>
            <View style={[styles.driverAvatar, { backgroundColor: isDark ? '#0A1929' : CUSTOMER_SURF }]}>
              <Ionicons name="bicycle" size={19} color={CUSTOMER_ACCENT} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.driverLabelRow}>
                <Text style={[styles.driverLabel, { color: muted }]}>DELIVERY PARTNER</Text>
                <View style={[styles.liveBadge, { backgroundColor: socketConnected ? (isDark ? '#052e16' : '#dcfce7') : (isDark ? '#2d2000' : '#fef9c3') }]}>
                  <View style={[styles.liveDot, { backgroundColor: socketConnected ? '#16a34a' : '#ca8a04' }]} />
                  <Text style={[styles.liveBadgeText, { color: socketConnected ? '#16a34a' : '#ca8a04' }]}>
                    {socketConnected ? 'Live' : 'Connecting...'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.driverName, { color: text }]}>{activeOrder?.deliveryAgentName ?? 'Assigned shortly'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.callDriverBtn, !driverPhone && { opacity: 0.4 }]}
              onPress={() => driverPhone && callNumber(driverPhone, 'Driver')}
              disabled={!driverPhone}
            >
              <Ionicons name="call" size={15} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* TIMELINE */}
        <View style={[styles.timelineCard, { backgroundColor: surf, borderColor: border }, shadow.sm]}>
          <View style={[styles.timelineDecor, { opacity: isDark ? 0.03 : 0.05 }]}>
            <Ionicons name="water" size={100} color={CUSTOMER_ACCENT} />
          </View>
          <Text style={[styles.sectionLabel, { color: muted }]}>DELIVERY PROGRESS</Text>
          {steps.map((step, index) => (
            <StepNode key={step.title} step={step} isLast={index === steps.length - 1} colors={colors} isDark={isDark} />
          ))}
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: surf, borderColor: border }, !shopPhone && { opacity: 0.4 }, shadow.xs]}
            activeOpacity={0.8}
            onPress={() => shopPhone && callNumber(shopPhone, 'Shop')}
            disabled={!shopPhone}
          >
            <View style={[styles.actionIcon, { backgroundColor: inputBg }]}>
              <Ionicons name="storefront-outline" size={21} color={muted} />
            </View>
            <Text style={[styles.actionLabel, { color: muted }]}>Call Shop</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: isDark ? '#0A1929' : CUSTOMER_SURF, borderColor: border }, !driverPhone && { opacity: 0.4 }, shadow.xs]}
            activeOpacity={0.8}
            onPress={() => driverPhone && callNumber(driverPhone, 'Driver')}
            disabled={!driverPhone}
          >
            <View style={[styles.actionIcon, { backgroundColor: CUSTOMER_ACCENT }]}>
              <Ionicons name="call" size={21} color="white" />
            </View>
            <Text style={[styles.actionLabel, { color: CUSTOMER_ACCENT, fontWeight: '800' }]}>Call Driver</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: surf, borderColor: border }, !driverPhone && { opacity: 0.4 }, shadow.xs]}
            activeOpacity={0.8}
            onPress={() => driverPhone && Linking.openURL(`whatsapp://send?phone=${driverPhone}&text=Hi, I%27m tracking my water delivery order.`)}
            disabled={!driverPhone}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? '#052e16' : '#e8f5e9' }]}>
              <Ionicons name="logo-whatsapp" size={21} color="#25D366" />
            </View>
            <Text style={[styles.actionLabel, { color: '#25D366', fontWeight: '800' }]}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* ORDER SUMMARY */}
        <View style={[styles.summaryCard, { backgroundColor: surf, borderColor: border }, shadow.xs]}>
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryTitle, { color: text }]}>Order Details</Text>
            <View style={[styles.prepaidBadge, { backgroundColor: isDark ? '#0A1929' : CUSTOMER_SURF }]}>
              <Text style={[styles.prepaidText, { color: CUSTOMER_ACCENT }]}>
                {activeOrder?.paymentMethod === 'cod' ? 'COD' : 'PREPAID'}
              </Text>
            </View>
          </View>

          {(activeOrder?.items ?? []).length > 0 ? (
            activeOrder!.items.map((item: any, idx: number) => (
              <View key={idx} style={styles.summaryRow}>
                <Text style={[styles.summaryKey, { color: muted }]}>{item.name ?? item.product_name ?? 'Item'} (×{item.quantity})</Text>
                <Text style={[styles.summaryVal, { color: text }]}>₹{((item.price ?? 0) * item.quantity).toFixed(0)}</Text>
              </View>
            ))
          ) : quantity > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryKey, { color: muted }]}>Items (×{quantity})</Text>
              <Text style={[styles.summaryVal, { color: text }]}>₹{subtotal.toFixed(0)}</Text>
            </View>
          ) : null}

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryKey, { color: muted }]}>Delivery Fee</Text>
            <Text style={[styles.summaryVal, { color: text }]}>₹{deliveryFee}</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryTotalKey, { color: text }]}>Total</Text>
            <Text style={[styles.summaryTotalVal, { color: CUSTOMER_ACCENT }]}>₹{(activeOrder?.total ?? 0).toFixed(2)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.rateBtn, { backgroundColor: inputBg, borderColor: border }]}
            onPress={() => router.push('/order/rating' as any)}
          >
            <Ionicons name="star-outline" size={15} color={CUSTOMER_ACCENT} />
            <Text style={[styles.rateBtnText, { color: CUSTOMER_ACCENT }]}>Rate this Delivery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rateBtn, { marginTop: 10, backgroundColor: isDark ? '#052e16' : '#f0fdf4', borderColor: isDark ? '#14532d' : '#dcfce7' }]}
            onPress={() => Linking.openURL(
              `whatsapp://send?text=Track my ThanniGo water delivery → Order%20%23${activeOrder?.id ?? 'TNG-001'}%20is%20${activeOrder?.status ?? 'on%20its%20way'}!`
            )}
          >
            <Ionicons name="logo-whatsapp" size={15} color="#25D366" />
            <Text style={[styles.rateBtnText, { color: '#25D366' }]}>Share Tracking with Family</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* SHOP CHANGE OFFER MODAL */}
      <Modal visible={!!shopChangeOffer} transparent animationType="slide">
        <View style={styles.shopChangeOverlay}>
          <View style={[styles.shopChangeSheet, { backgroundColor: surf }]}>
            <View style={[styles.shopChangePill, { backgroundColor: border }]} />
            <View style={[styles.shopChangeIconWrap, { backgroundColor: isDark ? '#2d2000' : '#fef3c7' }]}>
              <Ionicons name="storefront" size={32} color="#b45309" />
            </View>
            <Text style={[styles.shopChangeTitle, { color: text }]}>Shop Rejected Your Order</Text>
            <Text style={[styles.shopChangeSub, { color: muted }]}>
              A nearby shop{' '}
              <Text style={{ fontWeight: '800', color: text }}>{shopChangeOffer?.pendingShop?.name}</Text>
              {' '}is available and can fulfil your order.
            </Text>

            <View style={[styles.shopChangePriceRow, { backgroundColor: bg }]}>
              {shopChangeOffer && shopChangeOffer.newTotal !== shopChangeOffer.previousTotal ? (
                <>
                  <View style={styles.shopChangePriceBox}>
                    <Text style={[styles.shopChangePriceLabel, { color: muted }]}>Previous Total</Text>
                    <Text style={[styles.shopChangePriceVal, { textDecorationLine: 'line-through', color: muted }]}>₹{shopChangeOffer.previousTotal}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color={muted} />
                  <View style={styles.shopChangePriceBox}>
                    <Text style={[styles.shopChangePriceLabel, { color: muted }]}>New Total</Text>
                    <Text style={[styles.shopChangePriceVal, { color: CUSTOMER_ACCENT }]}>₹{shopChangeOffer.newTotal}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.shopChangePriceBox}>
                  <Text style={[styles.shopChangePriceLabel, { color: muted }]}>Total</Text>
                  <Text style={[styles.shopChangePriceVal, { color: CUSTOMER_ACCENT }]}>₹{shopChangeOffer?.newTotal}</Text>
                </View>
              )}
            </View>

            <Text style={[styles.shopChangeQuestion, { color: text }]}>Would you like to continue with this shop?</Text>

            <View style={styles.shopChangeBtns}>
              <TouchableOpacity
                style={[styles.shopChangeRejectBtn, { backgroundColor: isDark ? '#2d0a0a' : '#fff5f5', borderColor: isDark ? '#7f1d1d' : '#fecaca' }]}
                onPress={() => handleShopChangeResponse(false)}
                disabled={shopChangeLoading}
              >
                {shopChangeLoading ? <ActivityIndicator color="#dc2626" /> : <Text style={styles.shopChangeRejectText}>No, Cancel Order</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shopChangeAcceptBtn, { backgroundColor: CUSTOMER_ACCENT }]}
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
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandName: { fontSize: 17, fontWeight: '900', letterSpacing: -0.4 },
  headerSub: { fontSize: 12, fontWeight: '500', marginTop: 1 },

  mapCard: { height: 300, borderRadius: 24, marginTop: 20, marginBottom: 20, overflow: 'hidden', position: 'relative' },
  mapFill: { width: '100%', height: '100%' },
  mapControls: { position: 'absolute', top: 14, right: 14, zIndex: 10 },
  mapIconBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
  },
  etaChip: {
    position: 'absolute', top: 14, left: 14,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  etaText: { fontSize: 12, fontWeight: '700' },
  driverCard: {
    position: 'absolute', bottom: 12, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  driverAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: CUSTOMER_ACCENT },
  driverLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 1 },
  driverLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  driverName: { fontSize: 14, fontWeight: '800' },
  callDriverBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: CUSTOMER_ACCENT, alignItems: 'center', justifyContent: 'center' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  liveDot: { width: 5, height: 5, borderRadius: 3 },
  liveBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },

  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 16 },
  timelineCard: { borderRadius: 24, padding: 22, marginBottom: 16, borderWidth: 1, position: 'relative', overflow: 'hidden' },
  timelineDecor: { position: 'absolute', right: -10, top: -10 },

  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionCard: { flex: 1, borderRadius: 20, padding: 16, alignItems: 'center', gap: 10, borderWidth: 1 },
  actionIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },

  summaryCard: { borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  summaryTitle: { fontSize: 16, fontWeight: '800' },
  prepaidBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  prepaidText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryKey: { fontSize: 13, fontWeight: '500' },
  summaryVal: { fontSize: 13, fontWeight: '700' },
  summaryDivider: { height: 1, marginVertical: 10 },
  summaryTotalKey: { fontSize: 15, fontWeight: '900' },
  summaryTotalVal: { fontSize: 19, fontWeight: '900' },
  rateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1,
  },
  rateBtnText: { fontWeight: '700', fontSize: 13 },

  shopChangeOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  shopChangeSheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingBottom: 40, alignItems: 'center' },
  shopChangePill: { width: 40, height: 4, borderRadius: 2, marginBottom: 24 },
  shopChangeIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  shopChangeTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  shopChangeSub: { fontSize: 14, textAlign: 'center', lineHeight: 20, fontWeight: '500', marginBottom: 20 },
  shopChangePriceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, borderRadius: 16, padding: 16, width: '100%', justifyContent: 'center' },
  shopChangePriceBox: { alignItems: 'center', gap: 4 },
  shopChangePriceLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  shopChangePriceVal: { fontSize: 22, fontWeight: '900' },
  shopChangeQuestion: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  shopChangeBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  shopChangeRejectBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, borderWidth: 1.5, alignItems: 'center' },
  shopChangeRejectText: { fontSize: 14, fontWeight: '800', color: '#dc2626' },
  shopChangeAcceptBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  shopChangeAcceptText: { fontSize: 14, fontWeight: '800', color: 'white' },
});
