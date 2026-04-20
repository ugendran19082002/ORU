import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { useAppNavigation } from "@/hooks/use-app-navigation";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAppTheme } from '@/providers/ThemeContext';
import React, { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RazorpayCheckout from 'react-native-razorpay';

import { BackButton } from "@/components/ui/BackButton";
import { useAndroidBackHandler } from "@/hooks/use-back-handler";
import { useCartStore } from "@/stores/cartStore";
import { useOrderStore } from "@/stores/orderStore";
import { useShopStore } from "@/stores/shopStore";
import { useAppSession } from "@/hooks/use-app-session";
import { Shadow, roleAccent, roleGradients } from "@/constants/theme";

const CUSTOMER_ACCENT = roleAccent.customer;
const CUSTOMER_GRAD: [string, string] = [roleGradients.customer.start, roleGradients.customer.end];
import { LinearGradient } from "expo-linear-gradient";
import moment from "moment";
import Toast from "react-native-toast-message";
import { promotionApi } from "@/api/promotionApi";
import { apiClient } from "@/api/client";
import { addressApi } from "@/api/addressApi";
import { systemApi } from "@/api/systemApi";
import { ApiError } from "@/api/apiError";
import { paymentApi } from "@/api/paymentApi";
import { platformSubscriptionApi, CheckoutBenefits } from "@/api/platformSubscriptionApi";

type PaymentType = "upi" | "cod";

interface Address {
  id: string | number;
  label: string;
  address_line1: string;
  city: string;
  is_default?: boolean;
  latitude?: number;
  longitude?: number;
}

const StepBadge = ({ n, color }: { n: number; color: string }) => (
  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: 11, fontWeight: '900', color: 'white' }}>{n}</Text>
  </View>
);

function BillRow({ label, value, valueColor }: { label: any; value: any; valueColor?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      {typeof label === 'string'
        ? <Text style={{ fontSize: 13, color: colors.muted, fontWeight: '500', flex: 1 }}>{label}</Text>
        : label}
      {typeof value === 'string'
        ? <Text style={{ fontSize: 14, fontWeight: '800', color: valueColor || colors.text }}>{value}</Text>
        : value}
    </View>
  );
}

// ─── CouponBlock lifted to module-level so it never remounts on parent re-render
function CouponBlock({
  subtotal, shopId, availableCoupons, onApply,
}: {
  subtotal: number;
  shopId: string | null;
  availableCoupons: any[];
  onApply?: (discount: number, code: string) => void;
}) {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const doApply = async (code?: string) => {
    const targetCode = (code ?? coupon).trim().toUpperCase();
    if (!targetCode) return;
    setIsValidating(true);
    setCouponError("");
    try {
      const result = await promotionApi.validateCoupon(targetCode, subtotal, shopId ?? undefined);
      setDiscount(result.discount_amount);
      setCoupon(targetCode);
      onApply?.(result.discount_amount, targetCode);
      Toast.show({ type: 'success', text1: '🎉 Coupon Applied!', text2: `You save ₹${result.discount_amount}` });
    } catch (err) {
      setDiscount(0);
      onApply?.(0, "");
      setCouponError(err instanceof ApiError ? (err.message || "Invalid coupon.") : "Could not validate. Try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => { setCoupon(""); setDiscount(0); setCouponError(""); onApply?.(0, ""); };

  const couponSavingLabel = (c: any) => {
    if (c.type === 'percentage') return `${c.discount_value}% off${c.max_discount ? ` (up to ₹${c.max_discount})` : ''}`;
    if (c.type === 'free_delivery') return 'Free delivery';
    return `₹${c.discount_value} off`;
  };

  const isApplied = discount > 0;
  const cannotApply = !coupon.trim() || isValidating || isApplied;

  return (
    <View>
      {isApplied ? (
        <View style={styles.couponAppliedBanner}>
          <View style={styles.couponAppliedIcon}>
            <Ionicons name="checkmark" size={14} color="white" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.couponAppliedCode}>{coupon}</Text>
            <Text style={styles.couponAppliedSaving}>Saving ₹{discount} on this order</Text>
          </View>
          <TouchableOpacity onPress={removeCoupon} style={styles.couponRemoveBtn}>
            <Text style={styles.couponRemoveText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {availableCoupons.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingRight: 8 }}>
                {availableCoupons.map((c) => {
                  const meetsMin = Number(c.min_order_value || 0) <= subtotal;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => { if (meetsMin) { setCoupon(c.code); doApply(c.code); } }}
                      activeOpacity={meetsMin ? 0.7 : 1}
                      style={[styles.couponChip, !meetsMin && styles.couponChipDisabled]}
                    >
                      <Ionicons name="pricetag-outline" size={12} color={meetsMin ? CUSTOMER_ACCENT : colors.muted} />
                      <View>
                        <Text style={[styles.couponChipCode, !meetsMin && { color: colors.muted }]}>{c.code}</Text>
                        <Text style={styles.couponChipLabel}>{couponSavingLabel(c)}</Text>
                        {!meetsMin && Number(c.min_order_value) > 0 && (
                          <Text style={styles.couponChipMinOrder}>Min order ₹{c.min_order_value}</Text>
                        )}
                      </View>
                      {!meetsMin && (
                        <View style={styles.couponChipLock}>
                          <Ionicons name="lock-closed" size={10} color={colors.muted} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TextInput
              value={coupon}
              onChangeText={(t) => { setCoupon(t); setCouponError(""); }}
              placeholder="Enter promo code"
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
              editable={!isApplied}
              style={[styles.couponInput, couponError ? { borderColor: colors.error } : {}]}
            />
            <TouchableOpacity
              onPress={() => doApply()}
              disabled={cannotApply}
              style={[styles.couponApplyBtn, cannotApply && { opacity: 0.45 }]}
            >
              {isValidating
                ? <ActivityIndicator size="small" color="white" />
                : <Text style={styles.couponApplyText}>Apply</Text>
              }
            </TouchableOpacity>
          </View>

          {couponError ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
              <Text style={{ color: colors.error, fontSize: 12, fontWeight: "600" }}>{couponError}</Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

export default function OrderCheckoutScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);

  // ─── Loyalty Block ──────────────────────────────────────────────────────────
  const LoyaltyBlock = ({ points, onToggle, isEnabled, discountAmt }: {
    points: number; onToggle: (val: boolean) => void; isEnabled: boolean; discountAmt: number;
  }) => (
    <TouchableOpacity onPress={() => onToggle(!isEnabled)} activeOpacity={0.85}
      style={[styles.loyaltyCard, isEnabled && styles.loyaltyCardActive]}>
      <LinearGradient
        colors={isEnabled ? ['#f59e0b', '#d97706'] : [colors.surface, colors.surface]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.loyaltyGradient}
      >
        <View style={[styles.loyaltyIconWrap, isEnabled && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
          <Ionicons name="star" size={18} color={isEnabled ? 'white' : '#f59e0b'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.loyaltyTitle, isEnabled && { color: 'white' }]}>Thanni Points</Text>
          <Text style={[styles.loyaltySub, isEnabled && { color: 'rgba(255,255,255,0.8)' }]}>
            {points} pts available{isEnabled ? ` · Saving ₹${discountAmt}` : ' · Tap to redeem'}
          </Text>
        </View>
        <View style={[styles.loyaltyToggle, isEnabled && styles.loyaltyToggleOn]}>
          <View style={[styles.loyaltyThumb, isEnabled && styles.loyaltyThumbOn]} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  // ─── State ─────────────────────────────────────────────────────────────────
  const [refreshing, setRefreshing] = React.useState(false);
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const { user } = useAppSession();

  const { shopId: paramShopId, slotId, date, slotLabel } = useLocalSearchParams<{
    shopId?: string; slotId?: string; date?: string; slotLabel?: string; note?: string;
  }>();
  const cartShopId = useCartStore((s) => s.shopId);
  const shopId = paramShopId || cartShopId;

  const { paymentMethod, setPaymentMethod, getSubtotal, getDeliveryFee, items, note, clearCart, applyCoupon } = useCartStore();
  const { shops } = useShopStore();
  const { placeOrder, isSubmitting } = useOrderStore();

  const [deliveryType, setDeliveryType] = useState<'instant' | 'scheduled'>('instant');
  const [payment, setPayment] = useState<PaymentType>((paymentMethod as PaymentType) || "upi");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [useLoyalty, setUseLoyalty] = useState(false);
  const [calculatedDistance, setCalculatedDistance] = useState(1.2);
  const [benefits, setBenefits] = useState<CheckoutBenefits | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  // ─── Payment retry: store pending razorpay order so re-tap doesn't create a new DB order ───
  const [pendingRzpOrderId, setPendingRzpOrderId] = useState<string | null>(null);
  const [pendingOrderData, setPendingOrderData] = useState<any | null>(null);

  React.useEffect(() => {
    if (!shopId) return;
    apiClient.get('/promotion/coupons/active', { params: { shop_id: shopId } })
      .then(res => { if (res.data.status === 1) setAvailableCoupons(res.data.data ?? []); })
      .catch(() => {});
  }, [shopId]);

  React.useEffect(() => { if (slotId) setDeliveryType('scheduled'); }, [slotId]);

  const shop = shopId ? shops.find((item) => String(item.id) === String(shopId)) : undefined;

  if (shops.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const res = await addressApi.getAddresses();
      const addrList = res.data.data || [];
      setAddresses(addrList);
      const targetAddr = addrList.find((a: any) => a.is_default) || (addrList.length > 0 ? addrList[0] : null);
      if (targetAddr) { setSelectedAddress(targetAddr); calculateDistance(targetAddr); }
    } catch {
      Toast.show({ type: 'error', text1: 'Address Error', text2: 'Could not load saved addresses' });
    } finally { setLoadingAddresses(false); }
  };

  const calculateDistance = async (addr: Address) => {
    if (!addr.latitude || !addr.longitude || !(shop as any)?.lat || !(shop as any)?.lng) return;
    try {
      const res = await systemApi.getDistance((shop as any).lat, (shop as any).lng, addr.latitude, addr.longitude);
      if (res.data?.distance_km > 0) setCalculatedDistance(res.data.distance_km);
    } catch {}
  };

  React.useEffect(() => {
    platformSubscriptionApi.getCheckoutBenefits().then(setBenefits).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => { fetchAddresses(); }, []));
  useAndroidBackHandler(() => {
    if (showAddressModal) setShowAddressModal(false);
    else safeBack("/(tabs)");
  });

  // ─── Totals ────────────────────────────────────────────────────────────────
  const cartItems = Object.values(items).filter(i => i.quantity > 0);
  const quantity = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = getSubtotal();
  const rawDeliveryFee = getDeliveryFee();
  const hasFreeDelivery = benefits?.free_delivery ?? false;
  const deliveryFee = hasFreeDelivery ? 0 : rawDeliveryFee;
  const floorCharge = (shop as any)?.floor_charge || 0;
  const couponDiscount = useCartStore(s => s.couponDiscount);
  const postCouponTarget = Math.max(0, subtotal - couponDiscount);
  const subDiscountPct = benefits?.auto_discount_pct ?? 0;
  const subDiscountAmt = Math.floor(postCouponTarget * (subDiscountPct / 100));
  const postSubTarget = Math.max(0, postCouponTarget - subDiscountAmt);
  const maxLoyaltyUse = Math.min(user?.loyalty_points || 0, postSubTarget);
  const loyaltyDiscount = useLoyalty ? maxLoyaltyUse : 0;
  const total = Math.max(0, postSubTarget - loyaltyDiscount) + deliveryFee + floorCharge;
  const totalSaved = couponDiscount + subDiscountAmt + loyaltyDiscount + (hasFreeDelivery ? rawDeliveryFee : 0);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* HEADER */}
      <View style={styles.header}>
        <BackButton fallback="/(tabs)" />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Checkout</Text>
          {shop
            ? <TouchableOpacity onPress={() => router.push(`/shop-detail/${shop.id}` as any)}>
                <Text style={styles.headerShopName}>{shop.name} ›</Text>
              </TouchableOpacity>
            : <Text style={{ fontSize: 12, color: colors.error, fontWeight: '700', marginTop: 2 }}>Shop offline</Text>
          }
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 800); }} colors={[CUSTOMER_ACCENT]} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 200 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── STEP 1 · DELIVERY MODE ── */}
        <View style={styles.sectionRow}>
          <StepBadge n={1} color={CUSTOMER_ACCENT} />
          <Text style={styles.sectionTitle}>Delivery Mode</Text>
        </View>
        <View style={styles.deliveryToggle}>
          {(['instant', 'scheduled'] as const).map((type) => {
            const active = deliveryType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                onPress={() => {
                  if (type === 'scheduled' && !slotId) {
                    router.push({ pathname: '/order/schedule' as any, params: { shopId: shop?.id } });
                  } else {
                    setDeliveryType(type);
                  }
                }}
                activeOpacity={0.8}
              >
                {active
                  ? <LinearGradient colors={CUSTOMER_GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.toggleGrad}>
                      <Ionicons name={type === 'instant' ? 'flash' : 'calendar'} size={17} color="white" />
                      <Text style={styles.toggleTextActive}>{type === 'instant' ? 'Instant' : 'Scheduled'}</Text>
                    </LinearGradient>
                  : <>
                      <Ionicons name={type === 'instant' ? 'flash-outline' : 'calendar-outline'} size={17} color={colors.muted} />
                      <Text style={styles.toggleText}>{type === 'instant' ? 'Instant' : 'Scheduled'}</Text>
                    </>
                }
              </TouchableOpacity>
            );
          })}
        </View>
        {deliveryType === 'scheduled' && (
          <TouchableOpacity style={styles.slotPicker}
            onPress={() => router.push({ pathname: '/order/schedule' as any, params: { shopId: shop?.id } })}>
            <Ionicons name="time-outline" size={20} color={CUSTOMER_ACCENT} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.slotLabel}>DELIVERY SLOT</Text>
              <Text style={styles.slotValue}>{slotLabel || 'Tap to select a time slot'}</Text>
              {date && <Text style={styles.slotDate}>{moment(date).format('ddd, MMM Do')}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={18} color={CUSTOMER_ACCENT} />
          </TouchableOpacity>
        )}

        {/* ── STEP 2 · DELIVERY ADDRESS ── */}
        <View style={styles.sectionRow}>
          <StepBadge n={2} color={CUSTOMER_ACCENT} />
          <Text style={styles.sectionTitle}>Delivery Address</Text>
        </View>
        <TouchableOpacity style={styles.addressCard} activeOpacity={0.8} onPress={() => setShowAddressModal(true)}>
          <View style={styles.addressIconWrap}>
            <Ionicons
              name={selectedAddress?.label?.toLowerCase() === "home" ? "home" : selectedAddress?.label?.toLowerCase() === "office" ? "briefcase" : "location"}
              size={20} color={CUSTOMER_ACCENT}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addressLabel}>{selectedAddress?.label?.toUpperCase() || 'SELECT ADDRESS'}</Text>
            {loadingAddresses
              ? <ActivityIndicator size="small" color={CUSTOMER_ACCENT} style={{ alignSelf: 'flex-start', marginTop: 2 }} />
              : <Text style={styles.addressText} numberOfLines={2}>
                  {selectedAddress ? `${selectedAddress.address_line1}, ${selectedAddress.city}` : 'Tap to choose a delivery address'}
                </Text>
            }
          </View>
          <View style={styles.changeChip}>
            <Text style={styles.changeChipText}>Change</Text>
          </View>
        </TouchableOpacity>

        {/* ── STEP 3 · ITEMS ── */}
        <View style={styles.sectionRow}>
          <StepBadge n={3} color={CUSTOMER_ACCENT} />
          <Text style={styles.sectionTitle}>Your Items</Text>
          {shop && (
            <TouchableOpacity onPress={() => router.push(`/shop-detail/${shop.id}` as any)} style={styles.addMoreBtn}>
              <Ionicons name="add" size={13} color={CUSTOMER_ACCENT} />
              <Text style={styles.addMoreText}>Add more</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.productsCard}>
          {shop && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Ionicons name="storefront-outline" size={14} color={colors.muted} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.muted }}>Ordering from {shop.name}</Text>
            </View>
          )}
          {cartItems.map((item, idx) => (
            <View key={item.productId} style={[styles.productRow, idx < cartItems.length - 1 && styles.productRowDivider]}>
              <View style={styles.productQtyBadge}>
                <Text style={styles.productQtyText}>{item.quantity}×</Text>
              </View>
              <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.productPrice}>₹{(item.price * item.quantity).toFixed(0)}</Text>
            </View>
          ))}
          <View style={styles.productsTotalRow}>
            <Text style={styles.productsTotalLabel}>Subtotal ({quantity} items)</Text>
            <Text style={styles.productsTotalVal}>₹{subtotal}</Text>
          </View>
        </View>

        {/* ── STEP 4 · COUPON ── */}
        <View style={styles.sectionRow}>
          <StepBadge n={4} color="#16a34a" />
          <Text style={styles.sectionTitle}>Coupon / Promo</Text>
        </View>
        <View style={styles.card}>
          <CouponBlock subtotal={subtotal} shopId={shopId} availableCoupons={availableCoupons} onApply={(d, c) => applyCoupon(c, d)} />
        </View>

        {/* ── STEP 5 · REDEEM POINTS ── */}
        <View style={styles.sectionRow}>
          <StepBadge n={5} color="#d97706" />
          <Text style={styles.sectionTitle}>Redeem Points</Text>
        </View>
        <LoyaltyBlock points={user?.loyalty_points || 0} isEnabled={useLoyalty} onToggle={setUseLoyalty} discountAmt={maxLoyaltyUse} />

        {/* ── STEP 6 · PAYMENT METHOD ── */}
        <View style={styles.sectionRow}>
          <StepBadge n={6} color={CUSTOMER_ACCENT} />
          <Text style={styles.sectionTitle}>Payment Method</Text>
        </View>
        <View style={styles.paymentGrid}>
          {[
            { key: 'upi' as const, icon: 'phone-portrait-outline', label: 'UPI', sub: 'GPay · PhonePe' },
            { key: 'cod' as const, icon: 'cash-outline', label: 'Cash', sub: 'On Delivery' },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.paymentOption, payment === opt.key && styles.paymentOptionActive]}
              onPress={() => { setPayment(opt.key); setPaymentMethod(opt.key); }}
              activeOpacity={0.8}
            >
              {payment === opt.key && (
                <LinearGradient colors={CUSTOMER_GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 18 }]} />
              )}
              <View style={[styles.paymentIconWrap, payment === opt.key && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name={opt.icon as any} size={22} color={payment === opt.key ? 'white' : colors.muted} />
              </View>
              <Text style={[styles.paymentLabel, payment === opt.key && { color: 'white' }]}>{opt.label}</Text>
              <Text style={[styles.paymentSub, payment === opt.key && { color: 'rgba(255,255,255,0.75)' }]}>{opt.sub}</Text>
              {payment === opt.key && (
                <View style={styles.paymentCheck}>
                  <Ionicons name="checkmark-circle" size={16} color="white" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── BILL DETAILS ── */}
        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Bill Details</Text>
          <BillRow label={`Items (×${quantity})`} value={`₹${subtotal}`} />
          {floorCharge > 0 && <BillRow label="Floor charge" value={`₹${floorCharge}`} />}
          {couponDiscount > 0 && <BillRow label="Coupon Discount" value={`-₹${couponDiscount}`} valueColor="#16a34a" />}
          {subDiscountAmt > 0 && (
            <BillRow
              label={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 }}>
                  <Text style={{ fontSize: 13, color: colors.muted, fontWeight: '500' }}>Plus Member ({subDiscountPct}%)</Text>
                  <Ionicons name="diamond" size={11} color="#7c3aed" />
                </View>
              }
              value={`-₹${subDiscountAmt}`} valueColor="#7c3aed"
            />
          )}
          {loyaltyDiscount > 0 && <BillRow label="Thanni Points" value={`-₹${loyaltyDiscount}`} valueColor="#d97706" />}
          <BillRow
            label="Delivery Fee"
            value={hasFreeDelivery
              ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 12, color: '#7c3aed', fontWeight: '800' }}>FREE</Text>
                  <Text style={{ fontSize: 13, color: colors.muted, textDecorationLine: 'line-through' }}>₹{rawDeliveryFee}</Text>
                </View>
              : `₹${rawDeliveryFee}`}
          />
          <View style={styles.billDivider} />
          <View style={styles.billTotalRow}>
            <Text style={styles.billTotalLabel}>Total Pay</Text>
            <Text style={styles.billTotalVal}>₹{total}</Text>
          </View>
          {totalSaved > 0 && (
            <View style={styles.savingsBanner}>
              <Ionicons name="happy-outline" size={14} color="#16a34a" />
              <Text style={styles.savingsText}>You're saving ₹{totalSaved} on this order 🎉</Text>
            </View>
          )}
        </View>

        {/* ── DELIVERY INSTRUCTIONS ── */}
        <View style={[styles.sectionRow, { marginTop: 8 }]}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.muted} />
          <Text style={[styles.sectionTitle, { fontSize: 14, color: colors.muted, fontWeight: '700' }]}>Delivery Instructions</Text>
          <Text style={{ fontSize: 11, color: colors.muted, marginLeft: 'auto' }}>Optional</Text>
        </View>
        <TextInput
          style={styles.notesInput}
          placeholder="e.g. Gate code 1234, leave at door…"
          placeholderTextColor={colors.muted}
          value={note}
          onChangeText={(v) => useCartStore.getState().setNote(v)}
          multiline numberOfLines={2}
          textAlignVertical="top"
          maxLength={200}
        />

      </ScrollView>

      {/* ── BOTTOM CTA ── */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomSummary}>
          <View>
            <Text style={styles.bottomLabel}>TOTAL AMOUNT</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={styles.bottomTotal}>₹{total}</Text>
              {totalSaved > 0 && <Text style={styles.bottomSaved}>Saved ₹{totalSaved}</Text>}
            </View>
          </View>
          <View style={styles.payBadge}>
            <Ionicons name={payment === 'upi' ? 'phone-portrait-outline' : 'cash-outline'} size={13} color={CUSTOMER_ACCENT} />
            <Text style={styles.payBadgeText}>{payment.toUpperCase()}</Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={isSubmitting || !shop}
          onPress={async () => {
            if (deliveryType === 'scheduled' && !slotId) {
              Toast.show({ type: 'error', text1: 'Missing Slot', text2: 'Please select a delivery slot' });
              router.push({ pathname: '/order/schedule' as any, params: { shopId: shop?.id } });
              return;
            }
            if (!selectedAddress) {
              Toast.show({ type: 'error', text1: 'Missing Address', text2: 'Please select a delivery address' });
              setShowAddressModal(true);
              return;
            }
            
            const handleRazorpay = (orderData: any) => {
              const options = {
                description: `Order #${orderData.order_number || orderData.id}`,
                image: (shop as any)?.logo_url || 'https://thannigo.com/logo.png',
                currency: orderData.currency || 'INR',
                key: orderData.razorpay_key,
                amount: Math.round(Number(orderData.amount) * 100),
                name: 'ThanniGo',
                order_id: orderData.razorpay_order_id,
                prefill: { email: user?.email || '', contact: user?.phone || '', name: user?.name || '' },
                theme: { color: CUSTOMER_ACCENT },
              };
              RazorpayCheckout.open(options)
                .then(async (data: any) => {
                  try {
                    await paymentApi.verifyPayment({
                      razorpay_order_id: data.razorpay_order_id,
                      razorpay_payment_id: data.razorpay_payment_id,
                      razorpay_signature: data.razorpay_signature,
                    });
                  } catch {
                    Toast.show({ type: 'info', text1: 'Payment Received', text2: 'Confirming — this may take a moment.' });
                  }
                  clearCart();
                  setPendingOrderData(null);
                  router.push("/order/confirmed" as any);
                })
                .catch((error: any) => {
                  setPendingOrderData(orderData);
                  Toast.show({ type: 'error', text1: 'Payment Failed', text2: error.description || 'Cancelled or failed. Tap Place Order to retry.' });
                });
            };

            if (pendingOrderData && pendingOrderData.razorpay_order_id && payment === 'upi') {
              handleRazorpay(pendingOrderData);
              return;
            }

            try {
              const orderData: any = await placeOrder({
                shop_id: Number(shop?.id),
                items: Object.entries(items)
                  .filter(([, item]) => item.quantity > 0)
                  .map(([productId, item]) => ({ product_id: productId, quantity: item.quantity })),
                address_id: Number(selectedAddress.id),
                payment_method: payment,
                delivery_type: deliveryType,
                slot_id: slotId ? Number(slotId) : undefined,
                scheduled_for: date || undefined,
                distance_km: calculatedDistance,
                notes: note,
                use_loyalty_points: useLoyalty,
              });

              if (payment === 'upi' && orderData.razorpay_order_id) {
                handleRazorpay(orderData);
              } else {
                clearCart();
                setPendingOrderData(null);
                router.push("/order/confirmed" as any);
              }
            } catch (err: any) {
              Toast.show({ type: 'error', text1: 'Order Failed', text2: err.message || 'Check your connection' });
            }
          }}
        >
          <LinearGradient
            colors={CUSTOMER_GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.ctaBtn, (isSubmitting || !shop) && { opacity: 0.65 }]}
          >
            {isSubmitting
              ? <ActivityIndicator color="white" size="small" />
              : <>
                  <Text style={styles.ctaBtnText}>Place Order · ₹{total}</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </>
            }
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── ADDRESS MODAL ── */}
      <Modal visible={showAddressModal} transparent animationType="slide" onRequestClose={() => setShowAddressModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delivery Address</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)} style={styles.modalClose}>
                <Ionicons name="close" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={loadingAddresses} onRefresh={fetchAddresses} />}>
              {addresses.length === 0 && !loadingAddresses && (
                <Text style={{ textAlign: 'center', padding: 24, color: colors.muted, fontWeight: '600' }}>No saved addresses.</Text>
              )}
              {addresses.map((addr) => {
                const isSelected = selectedAddress?.id === addr.id;
                return (
                  <TouchableOpacity key={addr.id}
                    style={[styles.addrCard, isSelected && styles.addrCardActive]}
                    onPress={() => { setSelectedAddress(addr); setShowAddressModal(false); calculateDistance(addr); }}
                  >
                    <View style={[styles.addrIconWrap, isSelected && { backgroundColor: CUSTOMER_ACCENT }]}>
                      <Ionicons
                        name={addr.label?.toLowerCase() === "home" ? "home" : addr.label?.toLowerCase() === "office" ? "briefcase" : "location"}
                        size={18} color={isSelected ? 'white' : colors.muted}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.addrTitle, isSelected && { color: CUSTOMER_ACCENT }]}>{addr.label}</Text>
                      <Text style={styles.addrText} numberOfLines={2}>{addr.address_line1}, {addr.city}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={22} color={CUSTOMER_ACCENT} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.addAddrBtn}
              onPress={() => { setShowAddressModal(false); router.push("/addresses" as any); }}>
              <Ionicons name="add-circle-outline" size={18} color={CUSTOMER_ACCENT} />
              <Text style={styles.addAddrText}>Add New Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: "900", color: colors.text },
  headerShopName: { fontSize: 12, color: CUSTOMER_ACCENT, fontWeight: '700', marginTop: 2 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: colors.text },

  deliveryToggle: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, borderRadius: 16, overflow: 'hidden',
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
  },
  toggleBtnActive: { borderColor: 'transparent' },
  toggleGrad: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  toggleText: { fontSize: 13, fontWeight: '800', color: colors.muted },
  toggleTextActive: { fontSize: 13, fontWeight: '900', color: 'white' },

  slotPicker: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.inputBg, padding: 14, borderRadius: 16,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: CUSTOMER_ACCENT, marginBottom: 4,
  },
  slotLabel: { fontSize: 9, fontWeight: '900', color: CUSTOMER_ACCENT, letterSpacing: 1 },
  slotValue: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 2 },
  slotDate: { fontSize: 11, color: colors.muted, fontWeight: '500', marginTop: 1 },

  addressCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: colors.surface, borderRadius: 18, padding: 14,
    borderWidth: 1.5, borderColor: colors.border, ...Shadow.xs,
  },
  addressIconWrap: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.inputBg, alignItems: "center", justifyContent: "center" },
  addressLabel: { fontSize: 9, fontWeight: "900", color: CUSTOMER_ACCENT, letterSpacing: 1, marginBottom: 2 },
  addressText: { fontSize: 13, color: colors.text, fontWeight: "500", lineHeight: 18 },
  changeChip: { backgroundColor: colors.inputBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  changeChipText: { fontSize: 12, color: CUSTOMER_ACCENT, fontWeight: "800" },

  productsCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, ...Shadow.xs, borderWidth: 1, borderColor: colors.border },
  productRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  productRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  productQtyBadge: { width: 32, height: 28, borderRadius: 8, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center' },
  productQtyText: { fontSize: 11, fontWeight: '900', color: CUSTOMER_ACCENT },
  productName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },
  productPrice: { fontSize: 14, fontWeight: '800', color: colors.text },
  productsTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 10, marginTop: 4, borderTopWidth: 1, borderTopColor: colors.border,
  },
  productsTotalLabel: { fontSize: 13, fontWeight: '700', color: colors.muted },
  productsTotalVal: { fontSize: 15, fontWeight: '900', color: colors.text },

  addMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto', backgroundColor: colors.inputBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  addMoreText: { fontSize: 12, color: CUSTOMER_ACCENT, fontWeight: '800' },

  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, ...Shadow.xs, borderWidth: 1, borderColor: colors.border },

  couponAppliedBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f0fdf4', borderRadius: 14, padding: 12, marginBottom: 4,
    borderWidth: 1.5, borderColor: '#86efac',
  },
  couponAppliedIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center' },
  couponAppliedCode: { fontSize: 13, fontWeight: '900', color: '#15803d' },
  couponAppliedSaving: { fontSize: 11, color: '#16a34a', fontWeight: '600', marginTop: 1 },
  couponRemoveBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#fee2e2', borderRadius: 8 },
  couponRemoveText: { fontSize: 12, color: '#dc2626', fontWeight: '800' },
  couponChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.background, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed',
    paddingHorizontal: 12, paddingVertical: 8,
  },
  couponChipCode: { fontSize: 12, fontWeight: '900', color: colors.text },
  couponChipLabel: { fontSize: 10, color: colors.muted, fontWeight: '500' },
  couponChipDisabled: { borderColor: colors.border, opacity: 0.6 },
  couponChipMinOrder: { fontSize: 9, color: '#d97706', fontWeight: '700', marginTop: 2 },
  couponChipLock: { position: 'absolute', top: 6, right: 6 },
  couponInput: {
    flex: 1, backgroundColor: colors.background, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: colors.border,
    fontSize: 14, fontWeight: "700", color: colors.text,
  },
  couponApplyBtn: {
    backgroundColor: CUSTOMER_ACCENT, borderRadius: 14,
    paddingHorizontal: 20, justifyContent: "center", alignItems: 'center', minWidth: 76, height: 48,
  },
  couponApplyText: { color: "white", fontWeight: "900", fontSize: 14 },

  loyaltyCard: { borderRadius: 18, overflow: 'hidden', borderWidth: 1.5, borderColor: colors.border, marginBottom: 4 },
  loyaltyCardActive: { borderColor: '#f59e0b' },
  loyaltyGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  loyaltyIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' },
  loyaltyTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  loyaltySub: { fontSize: 11, color: colors.muted, fontWeight: '500', marginTop: 2 },
  loyaltyToggle: { width: 46, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.15)', padding: 2, justifyContent: 'center' },
  loyaltyToggleOn: { backgroundColor: 'rgba(255,255,255,0.3)' },
  loyaltyThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'white' },
  loyaltyThumbOn: { transform: [{ translateX: 20 }] },

  paymentGrid: { flexDirection: "row", gap: 12, marginBottom: 8 },
  paymentOption: {
    flex: 1, borderRadius: 18, paddingVertical: 18, paddingHorizontal: 10,
    alignItems: "center", gap: 6, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface, overflow: 'hidden', ...Shadow.xs,
  },
  paymentOptionActive: { borderColor: 'transparent' },
  paymentIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.inputBg, alignItems: "center", justifyContent: "center" },
  paymentLabel: { fontSize: 13, fontWeight: "900", color: colors.text },
  paymentSub: { fontSize: 10, color: colors.muted, fontWeight: "600" },
  paymentCheck: { position: 'absolute', top: 10, right: 10 },

  billCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 18, marginTop: 20, ...Shadow.xs, borderWidth: 1, borderColor: colors.border },
  billTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 14 },
  billDivider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  billTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  billTotalLabel: { fontSize: 15, fontWeight: '800', color: colors.text },
  billTotalVal: { fontSize: 22, fontWeight: '900', color: CUSTOMER_ACCENT },
  savingsBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10 },
  savingsText: { fontSize: 12, color: '#15803d', fontWeight: '700', flex: 1 },

  notesInput: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 14,
    fontSize: 13, color: colors.text, borderWidth: 1, borderColor: colors.border, minHeight: 64,
  },

  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 12,
  },
  bottomSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bottomLabel: { fontSize: 9, fontWeight: '700', color: colors.muted, letterSpacing: 1.2, marginBottom: 2 },
  bottomTotal: { fontSize: 26, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  bottomSaved: { fontSize: 12, color: '#16a34a', fontWeight: '700' },
  payBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.inputBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  payBadgeText: { fontSize: 12, color: CUSTOMER_ACCENT, fontWeight: '900' },
  ctaBtn: { borderRadius: 18, paddingVertical: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  ctaBtnText: { color: "white", fontSize: 16, fontWeight: "900" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 36 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: "900", color: colors.text },
  modalClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.border, alignItems: "center", justifyContent: "center" },
  addrCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, marginBottom: 10 },
  addrCardActive: { borderColor: CUSTOMER_ACCENT, backgroundColor: colors.inputBg },
  addrIconWrap: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  addrTitle: { fontSize: 13, fontWeight: "800", color: colors.text, marginBottom: 2 },
  addrText: { fontSize: 12, color: colors.muted, lineHeight: 16 },
  addAddrBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.inputBg, padding: 14, borderRadius: 14, marginTop: 6 },
  addAddrText: { fontSize: 14, fontWeight: "800", color: CUSTOMER_ACCENT },
});
