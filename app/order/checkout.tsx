import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { useAppNavigation } from "@/hooks/use-app-navigation";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAppTheme } from '@/providers/ThemeContext';
import React, { useState } from "react";
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
import { Shadow, roleAccent, roleGradients, roleSurface, Radius } from "@/constants/theme";

const CUSTOMER_ACCENT = roleAccent.customer;
const CUSTOMER_GRAD: [string, string] = [roleGradients.customer.start, roleGradients.customer.end];
import { LinearGradient } from "expo-linear-gradient";
import moment from "moment";
import Toast from "react-native-toast-message";
import { promotionApi } from "@/api/promotionApi";
import { addressApi } from "@/api/addressApi";
import { systemApi } from "@/api/systemApi";
import { log } from "@/utils/logger";
import { ApiError } from "@/api/apiError";
import { paymentApi } from "@/api/paymentApi";
import { platformSubscriptionApi, CheckoutBenefits } from "@/api/platformSubscriptionApi";

type PaymentType = "upi" | "cod";

// Sub-components moved inside Main Screen
 
// Sub-components moved inside Main Screen


// Real address type based on API response
interface Address {
  id: string | number;
  label: string;
  address_line1: string;
  city: string;
  is_default?: boolean;
  latitude?: number;
  longitude?: number;
}

export default function OrderCheckoutScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);

  // ─── Inner Components ───────────────────────────────────────────────────────

  const CouponBlock = ({ subtotal, onApply }: { subtotal: number; onApply?: (discount: number, code: string) => void }) => {
    const [coupon, setCoupon] = useState("");
    const [discount, setDiscount] = useState(0);
    const [couponError, setCouponError] = useState("");
    const [isValidating, setIsValidating] = useState(false);

    const applyCoupon = async () => {
      const targetCode = coupon.trim().toUpperCase();
      if (!targetCode) return;
      setIsValidating(true);
      setCouponError("");
      try {
        const result = await promotionApi.validateCoupon(targetCode, subtotal);
        setDiscount(result.discount_amount);
        setCoupon(targetCode);
        onApply?.(result.discount_amount, targetCode);
      } catch (err) {
        setDiscount(0);
        onApply?.(0, "");
        if (err instanceof ApiError) {
          setCouponError(err.message || "Invalid or expired coupon code.");
        } else {
          setCouponError("Could not validate coupon. Please try again.");
        }
      } finally {
        setIsValidating(false);
      }
    };

    return (
      <View style={{ marginTop: 8 }}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1, position: 'relative' }}>
            <TextInput
              value={coupon}
              onChangeText={(t) => {
                setCoupon(t);
                setCouponError("");
                if (discount > 0) {
                  setDiscount(0);
                  onApply?.(0, "");
                }
              }}
              placeholder="Enter promo code"
              placeholderTextColor="#bfc7d1"
              autoCapitalize="characters"
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                paddingRight: 40,
                borderWidth: 1.5,
                borderColor: discount > 0 ? colors.success : couponError ? colors.error : colors.border,
                fontSize: 15,
                fontWeight: "700",
                color: colors.text,
              }}
            />
            {discount > 0 && (
              <View style={{ position: 'absolute', right: 12, top: 14 }}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={applyCoupon}
            disabled={!coupon.trim() || isValidating}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 14,
              paddingHorizontal: 20,
              justifyContent: "center",
              opacity: !coupon.trim() || isValidating ? 0.6 : 1,
            }}
          >
            {isValidating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={{ color: "white", fontWeight: "800", fontSize: 14 }}>Apply</Text>
            )}
          </TouchableOpacity>
        </View>
        {couponError ? (
          <Text style={{ color: colors.error, fontSize: 12, marginTop: 8, fontWeight: "600", marginLeft: 4 }}>
            {couponError}
          </Text>
        ) : null}
        {discount > 0 ? (
          <Text style={{ color: colors.success, fontSize: 13, marginTop: 8, fontWeight: "800", marginLeft: 4 }}>
            Extra ₹{discount} off applied!
          </Text>
        ) : null}
      </View>
    );
  };

  const LoyaltyBlock = ({ points, onToggle, isEnabled }: { points: number; onToggle: (val: boolean) => void; isEnabled: boolean }) => {
    return (
      <View style={styles.loyaltyCard}>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="gift" size={18} color={CUSTOMER_ACCENT} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>Thanni Points</Text>
          </View>
          <Text style={{ fontSize: 11, color: colors.muted, fontWeight: '500' }}>
            You have {points} points available. Use them to get a discount on this order.
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => onToggle(!isEnabled)}
          style={[styles.loyaltyToggle, isEnabled && styles.loyaltyToggleActive]}
        >
          <View style={[styles.loyaltyThumb, isEnabled && styles.loyaltyThumbActive]} />
        </TouchableOpacity>
      </View>
    );
  };
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const { user } = useAppSession();

  const { shopId = "1", slotId, date, slotLabel, note: paramNote } = useLocalSearchParams<{
    shopId: string;
    slotId: string;
    date: string;
    slotLabel: string;
    note: string;
  }>();
  
  const {
    paymentMethod,
    setPaymentMethod,
    getSubtotal,
    getDeliveryFee,
    getTotal,
    items,
    note,
    clearCart,
    applyCoupon,
  } = useCartStore();
  const { shops } = useShopStore();
  const { placeOrder, isSubmitting } = useOrderStore();

  const [deliveryType, setDeliveryType] = useState<'instant' | 'scheduled'>('instant');
  const [payment, setPayment] = useState<PaymentType>(
    (paymentMethod as PaymentType) || "upi",
  );
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [useLoyalty, setUseLoyalty] = useState(false);
  const [calculatedDistance, setCalculatedDistance] = useState(1.2);


  // Sync paramNote with cartStore if provided from schedule screen
  React.useEffect(() => {
    if (slotId) setDeliveryType('scheduled');
  }, [slotId]);

  const shop = shops.find((item) => item.id === shopId) ?? shops[0];

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const res = await addressApi.getAddresses();
      const addrList = res.data.data || [];
      setAddresses(addrList);
      
      // Auto-select: check for default, else first available
      let targetAddr = addrList.find((a: any) => a.is_default) || (addrList.length > 0 ? addrList[0] : null);
      if (targetAddr) {
        setSelectedAddress(targetAddr);
        calculateDistance(targetAddr);
      }
    } catch (err) {
      log.error("[Checkout] Failed to fetch addresses:", err);
      Toast.show({ type: 'error', text1: 'Address Error', text2: 'Could not load your saved addresses' });
    } finally {
      setLoadingAddresses(false);
    }
  };

  const calculateDistance = async (addr: Address) => {
    if (!addr.latitude || !addr.longitude || !(shop as any)?.lat || !(shop as any)?.lng) return;
    try {
      const res = await systemApi.getDistance((shop as any).lat, (shop as any).lng, addr.latitude, addr.longitude);
      if (res.data?.distance_km && res.data.distance_km > 0) {
        setCalculatedDistance(res.data.distance_km);
      }
    } catch(e) {
       console.warn("Failed to calc API distance, fallback 1.2 used", e);
    }
  };

  const [benefits, setBenefits] = useState<CheckoutBenefits | null>(null);
  const [loadingBenefits, setLoadingBenefits] = useState(false);

  React.useEffect(() => {
    const fetchBenefits = async () => {
      setLoadingBenefits(true);
      try {
        const data = await platformSubscriptionApi.getCheckoutBenefits();
        setBenefits(data);
      } catch (e) {
        log.warn('[Checkout] Failed to fetch benefits', e);
      } finally {
        setLoadingBenefits(false);
      }
    };
    fetchBenefits();
    fetchAddresses();
  }, []);

  useAndroidBackHandler(() => {
    if (showAddressModal) setShowAddressModal(false);
    else safeBack("/(tabs)");
  });

  const quantity = Object.values(items).reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = getSubtotal();
  const rawDeliveryFee = getDeliveryFee();
  
  const hasFreeDelivery = benefits?.free_delivery ?? false;
  const deliveryFee = hasFreeDelivery ? 0 : rawDeliveryFee;

  const floorCharge = (shop as any)?.floor_charge || 0;
  
  // Stacking: Subtotal -> Coupon -> Sub Discount -> Loyalty -> Delivery
  const couponDiscount = useCartStore(s => s.couponDiscount);
  const postCouponTarget = Math.max(0, subtotal - couponDiscount);
  
  const subDiscountPct = benefits?.auto_discount_pct ?? 0;
  const subDiscountAmt = Math.floor(postCouponTarget * (subDiscountPct / 100));
  
  const postSubTarget = Math.max(0, postCouponTarget - subDiscountAmt);

  const maxLoyaltyUse = Math.min(user?.loyalty_points || 0, postSubTarget);
  const loyaltyDiscount = useLoyalty ? maxLoyaltyUse : 0;

  const total = Math.max(0, postSubTarget - loyaltyDiscount) + deliveryFee + floorCharge;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* HEADER */}
      <View style={styles.header}>
        <BackButton fallback="/(tabs)" />
        <Text style={styles.headerTitle}>Order Summary</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#005d90"]}
          />
        }
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 180 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* PAYMENT METHOD */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
        </View>
        <View style={styles.paymentGrid}>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              payment === "upi" && styles.paymentOptionActive,
            ]}
            onPress={() => {
              setPayment("upi");
              setPaymentMethod("upi");
            }}
          >
            <View
              style={[
                styles.paymentIcon,
                payment === "upi" && styles.paymentIconActive,
              ]}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={20}
                color={payment === "upi" ? colors.primary : colors.muted}
              />
            </View>
            <Text
              style={[
                styles.paymentOptionLabel,
                payment === "upi" && styles.paymentOptionLabelActive,
              ]}
            >
              UPI
            </Text>
            <Text style={styles.paymentNote}>GPay / PhonePe</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              payment === "cod" && styles.paymentOptionActive,
            ]}
            onPress={() => {
              setPayment("cod");
              setPaymentMethod("cod");
            }}
          >
            <View
              style={[
                styles.paymentIcon,
                payment === "cod" && styles.paymentIconActive,
              ]}
            >
              <Ionicons
                name="cash-outline"
                size={20}
                color={payment === "cod" ? colors.primary : colors.muted}
              />
            </View>
            <Text
              style={[
                styles.paymentOptionLabel,
                payment === "cod" && styles.paymentOptionLabelActive,
              ]}
            >
              Cash
            </Text>
            <Text style={styles.paymentNote}>On Delivery</Text>
          </TouchableOpacity>
        </View>

        {/* DELIVERY TYPE */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Delivery Mode</Text>
        </View>
        <View style={styles.deliveryToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, deliveryType === 'instant' && styles.toggleBtnActive]}
            onPress={() => setDeliveryType('instant')}
          >
            <Ionicons name="flash" size={18} color={deliveryType === 'instant' ? 'white' : colors.muted} />
            <Text style={[styles.toggleText, deliveryType === 'instant' && styles.toggleTextActive]}>Instant</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, deliveryType === 'scheduled' && styles.toggleBtnActive]}
            onPress={() => {
              if (!slotId) {
                router.push({ pathname: '/order/schedule' as any, params: { shopId: shop.id } });
              } else {
                setDeliveryType('scheduled');
              }
            }}
          >
            <Ionicons name="calendar" size={18} color={deliveryType === 'scheduled' ? 'white' : colors.muted} />
            <Text style={[styles.toggleText, deliveryType === 'scheduled' && styles.toggleTextActive]}>Scheduled</Text>
          </TouchableOpacity>
        </View>

        {deliveryType === 'scheduled' && (
          <TouchableOpacity
            style={styles.slotPicker}
            onPress={() => router.push({ pathname: '/order/schedule' as any, params: { shopId: shop.id } })}
          >
            <View style={styles.slotInfo}>
              <Text style={styles.slotLabel}>DELIVERY SLOT</Text>
              <Text style={styles.slotValue}>{slotLabel || 'Select a time slot'}</Text>
              {date && <Text style={styles.slotDate}>{moment(date).format('dddd, MMM Do')}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color={CUSTOMER_ACCENT} />
          </TouchableOpacity>
        )}

        {/* DELIVERY ADDRESS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
        </View>
        <TouchableOpacity
          style={styles.addressCard}
          activeOpacity={0.8}
          onPress={() => setShowAddressModal(true)}
        >
          <View style={styles.addressIconWrap}>
            <Ionicons
              name={
                selectedAddress?.label?.toLowerCase() === "home"
                  ? "home"
                  : selectedAddress?.label?.toLowerCase() === "office"
                    ? "briefcase"
                    : "location"
              }
              size={22}
              color={roleSurface.shop_owner}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addressLabel}>
              {selectedAddress?.label?.toUpperCase() || 'SELECT ADDRESS'}
            </Text>
            {loadingAddresses ? (
              <ActivityIndicator size="small" color={'#006878'} style={{ alignSelf: 'flex-start' }} />
            ) : (
              <Text style={styles.addressText} numberOfLines={2}>
                {selectedAddress ? `${selectedAddress.address_line1}, ${selectedAddress.city}` : 'No address selected'}
              </Text>
            )}
          </View>
          <View style={styles.editWrap}>
            <Text style={styles.editText}>Change</Text>
          </View>
        </TouchableOpacity>

        {/* LOYALTY POINTS */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>Redeem Points</Text>
          <LoyaltyBlock 
            points={user?.loyalty_points || 0} 
            isEnabled={useLoyalty}
            onToggle={setUseLoyalty}
          />
        </View>
 
        {/* DELIVERY NOTES */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>Delivery Instructions</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="e.g. Gate code 1234, leave at door, call on arrival…"
            placeholderTextColor="#a0aab4"
            value={note}
            onChangeText={(v) => useCartStore.getState().setNote(v)}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            maxLength={200}
          />
        </View>

        {/* COUPON / PROMO CODE */}
        <View style={{ marginBottom: 28 }}>
          <Text style={styles.sectionTitle}>Coupon / Promo Code</Text>
          <CouponBlock
            subtotal={subtotal}
            onApply={(discount, code) => {
              applyCoupon(code, discount);
            }}
          />
        </View>

        {/* ORDER TOTALS */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Products (×{quantity})</Text>
            <Text style={styles.summaryVal}>₹{subtotal}</Text>
          </View>
          {floorCharge > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Floor charge</Text>
              <Text style={styles.summaryVal}>₹{floorCharge}</Text>
            </View>
          )}
          {couponDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Coupon Discount</Text>
              <Text style={[styles.summaryVal, { color: colors.success }]}>-₹{couponDiscount}</Text>
            </View>
          )}
          {subDiscountAmt > 0 && (
            <View style={styles.summaryRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.summaryKey}>Plus Member ({subDiscountPct}%)</Text>
                <Ionicons name="diamond" size={12} color="#7c3aed" />
              </View>
              <Text style={[styles.summaryVal, { color: '#7c3aed' }]}>-₹{subDiscountAmt}</Text>
            </View>
          )}
          {loyaltyDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Loyalty Points Used</Text>
              <Text style={[styles.summaryVal, { color: '#eab308' }]}>-₹{loyaltyDiscount}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Delivery Fee</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {hasFreeDelivery && <Text style={{ fontSize: 13, color: '#7c3aed', fontWeight: '800' }}>Plus Free</Text>}
              <Text style={[styles.summaryVal, hasFreeDelivery && { textDecorationLine: 'line-through', color: '#94a3b8' }]}>
                ₹{rawDeliveryFee}
              </Text>
            </View>
          </View>
          <View style={[styles.summaryRow, styles.summaryDivider]}>
            <Text style={styles.summaryTotal}>Total Pay</Text>
            <Text style={styles.summaryTotalVal}>₹{total}</Text>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.totalFloating}>
          <View>
            <Text style={styles.totalFloatingLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.totalFloatingValue}>₹{total}</Text>
          </View>
          <Text style={styles.totalFloatingSub}>
            via {payment.toUpperCase()}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={isSubmitting}
          onPress={async () => {
            if (deliveryType === 'scheduled' && !slotId) {
              Toast.show({ type: 'error', text1: 'Missing Slot', text2: 'Please select a delivery slot' });
              router.push({ pathname: '/order/schedule' as any, params: { shopId: shop.id } });
              return;
            }

            if (!selectedAddress) {
              Toast.show({ type: 'error', text1: 'Missing Address', text2: 'Please select a delivery address' });
              setShowAddressModal(true);
              return;
            }

            try {
              const orderData: any = await placeOrder({
                shop_id: Number(shop.id),
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
                const options = {
                  description: `Order #${orderData.order_number || orderData.id}`,
                  image: (shop as any).logo_url || 'https://thannigo.com/logo.png',
                  currency: orderData.currency || 'INR',
                  key: orderData.razorpay_key,
                  amount: Math.round(Number(orderData.amount) * 100),
                  name: 'ThanniGo',
                  order_id: orderData.razorpay_order_id,
                  prefill: {
                    email: user?.email || '',
                    contact: user?.phone || '',
                    name: user?.name || ''
                  },
                  theme: { color: CUSTOMER_ACCENT }
                };

                RazorpayCheckout.open(options).then(async (data: any) => {
                  log.info('[Razorpay] Payment success:', data);
                  try {
                    await paymentApi.verifyPayment({
                      razorpay_order_id: data.razorpay_order_id,
                      razorpay_payment_id: data.razorpay_payment_id,
                      razorpay_signature: data.razorpay_signature,
                    });
                  } catch (verifyErr) {
                    log.warn('[Razorpay] Verify call failed (webhook will reconcile):', verifyErr);
                  }
                  clearCart();
                  router.push("/order/confirmed" as any);
                }).catch((error: any) => {
                  log.error('[Razorpay] Payment failed:', error);
                  Toast.show({ 
                    type: 'error', 
                    text1: 'Payment Failed', 
                    text2: error.description || 'Payment was cancelled or failed.' 
                  });
                });
              } else {
                // COD or fallback
                clearCart();
                router.push("/order/confirmed" as any);
              }
            } catch (err: any) {
              log.error('[Checkout] Place order failed:', err);
              Toast.show({ type: 'error', text1: 'Order Failed', text2: err.message || 'Check your internet connection' });
            }
          }}
        >
          <LinearGradient
              colors={[colors.primary, "#0077b6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.ctaBtn, { opacity: isSubmitting ? 0.7 : 1 }]}
          >
            <Text style={styles.ctaBtnText}>
              {isSubmitting ? "Processing..." : "Pay & Confirm"}
            </Text>
            {!isSubmitting && (
              <Ionicons name="checkmark-circle" size={20} color="white" />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ADDRESS SELECTOR MODAL */}
      <Modal
        visible={showAddressModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Delivery Address</Text>
              <TouchableOpacity
                onPress={() => setShowAddressModal(false)}
                style={styles.modalClose}
              >
            <Ionicons name="close" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ maxHeight: 300, width: "100%" }}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={loadingAddresses} onRefresh={fetchAddresses} />}
            >
              {addresses.length === 0 && !loadingAddresses ? (
                <Text style={{ textAlign: 'center', padding: 20, color: colors.muted }}>No saved addresses found.</Text>
              ) : null}
              {addresses.map((addr) => (
                <TouchableOpacity
                  key={addr.id}
                  style={[
                    styles.modalAddrCard,
                    selectedAddress?.id === addr.id &&
                      styles.modalAddrCardActive,
                  ]}
                  onPress={() => {
                    setSelectedAddress(addr);
                    setShowAddressModal(false);
                    calculateDistance(addr);
                  }}
                >
                  <Ionicons
                    name={
                      addr.label?.toLowerCase() === "home"
                        ? "home"
                        : addr.label?.toLowerCase() === "office"
                          ? "briefcase"
                          : "location"
                    }
                    size={20}
                    color={selectedAddress?.id === addr.id ? colors.primary : colors.muted}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      style={[
                        styles.modalAddrTitle,
                        selectedAddress?.id === addr.id && { color: colors.primary },
                      ]}
                    >
                      {addr.label}
                    </Text>
                    <Text style={styles.modalAddrText} numberOfLines={2}>
                      {addr.address_line1}, {addr.city}
                    </Text>
                  </View>
                  {selectedAddress?.id === addr.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={CUSTOMER_ACCENT}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.addNewAddrBtn}
              onPress={() => {
                setShowAddressModal(false);
                router.push("/addresses" as any);
              }}
            >
              <Ionicons name="add" size={20} color={CUSTOMER_ACCENT} />
              <Text style={styles.addNewAddrText}>Add New Address</Text>
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
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "rgba(255,255,255,0.95)",
  },
  backBtn: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: colors.border, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "900", color: colors.text },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.text, letterSpacing: -0.2 },

  paymentGrid: { flexDirection: "row", gap: 12, marginBottom: 26 },
  paymentOption: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 20,
    paddingVertical: 16, paddingHorizontal: 8, alignItems: "center", gap: 8,
    borderWidth: 1.5, borderColor: colors.border,
    ...Shadow.xs,
  },
  paymentOptionActive: { borderColor: CUSTOMER_ACCENT, backgroundColor: colors.inputBg },
  paymentIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.border, alignItems: "center", justifyContent: "center" },
  paymentIconActive: { backgroundColor: colors.inputBg },
  paymentOptionLabel: { fontSize: 12, fontWeight: "800", color: colors.muted },
  paymentOptionLabelActive: { color: CUSTOMER_ACCENT },
  paymentNote: { fontSize: 10, color: colors.muted, fontWeight: "600" },
  notesInput: { backgroundColor: colors.surface, borderRadius: Radius.lg, padding: 14, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border, minHeight: 72, marginTop: 10 },
  addressCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.deliverySoft, borderRadius: Radius.xl, padding: 16, marginBottom: 28 },
  addressIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  addressLabel: { fontSize: 10, fontWeight: "800", color: '#006878', letterSpacing: 1, marginBottom: 3 },
  addressText: { fontSize: 13, color: colors.text, fontWeight: "500", lineHeight: 18 },
  editWrap: { backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  editText: { fontSize: 12, color: CUSTOMER_ACCENT, fontWeight: "800" },

  summaryCard: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, marginBottom: 16, ...Shadow.sm },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  summaryKey: { flex: 1, fontSize: 14, color: colors.muted, fontWeight: "500" },
  summaryVal: { fontSize: 15, color: colors.text, fontWeight: "800", textAlign: "right" },
  summaryDivider: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 6 },
  summaryTotal: { fontSize: 16, fontWeight: "900", color: colors.text },
  summaryTotalVal: { fontSize: 20, fontWeight: "900", color: CUSTOMER_ACCENT },

  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32,
    shadowColor: "#003a5c", shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 12,
    borderTopLeftRadius: 28, borderTopRightRadius: 28, gap: 12,
  },
  deliveryToggle: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  toggleBtnActive: { backgroundColor: CUSTOMER_ACCENT, borderColor: CUSTOMER_ACCENT },
  toggleText: { fontSize: 13, fontWeight: '800', color: colors.muted },
  toggleTextActive: { color: 'white' },

  slotPicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, padding: 16, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: CUSTOMER_ACCENT, marginBottom: 20 },
  slotInfo: { flex: 1, gap: 2 },
  slotLabel: { fontSize: 9, fontWeight: '900', color: CUSTOMER_ACCENT, letterSpacing: 1 },
  slotValue: { fontSize: 15, fontWeight: '800', color: colors.text },
  slotDate: { fontSize: 11, color: colors.muted, fontWeight: '500' },

  totalFloating: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalFloatingLabel: { fontSize: 9, fontWeight: "700", color: colors.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
  totalFloatingValue: { fontSize: 24, fontWeight: "900", color: colors.text, letterSpacing: -0.5 },
  totalFloatingSub: { fontSize: 11, color: colors.muted },
  ctaBtn: {
    borderRadius: 20, paddingVertical: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    shadowColor: CUSTOMER_ACCENT, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  ctaBtnText: { color: "white", fontSize: 17, fontWeight: "900", letterSpacing: -0.2 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.6)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, alignItems: "center" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "900", color: colors.text },
  modalClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  modalAddrCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, marginBottom: 12, width: "100%" },
  modalAddrCardActive: { borderColor: colors.inputBg, backgroundColor: "#F8FCFF" },
  modalAddrTitle: { fontSize: 14, fontWeight: "800", color: colors.text, marginBottom: 2 },
  modalAddrText: { fontSize: 12, color: colors.muted },
  addNewAddrBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: colors.inputBg, width: "100%", padding: 16, borderRadius: 16, marginTop: 8 },
  addNewAddrText: { fontSize: 14, fontWeight: "800", color: CUSTOMER_ACCENT, marginLeft: 8 },
  loyaltyThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.surface },
  loyaltyThumbActive: { backgroundColor: colors.surface, transform: [{ translateX: 22 }] },
  loyaltyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border, gap: 12, marginBottom: 4 },
  loyaltyToggle: { width: 48, height: 26, borderRadius: 13, backgroundColor: '#CBD5E1', padding: 2, justifyContent: 'center' },
  loyaltyToggleActive: { backgroundColor: CUSTOMER_ACCENT },
});


