import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";

import { RoleHeader } from "@/components/ui/RoleHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Shadow,
  roleAccent,
  roleGradients,
  Radius,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useAppTheme } from "@/providers/ThemeContext";
import { useOrderStore } from "@/stores/orderStore";
import { useShopStore } from "@/stores/shopStore";
import { apiClient } from "@/api/client";

const SHOP_ACCENT = roleAccent.shop_owner;
const SHOP_GRAD: [string, string] = [
  roleGradients.shop_owner.start,
  roleGradients.shop_owner.end,
];

type TabState = "active" | "completed";

type NavItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  badge?: string;
  color?: string;
};

const QUICK_ACTIONS: NavItem[] = [
  {
    label: "Service Rules & Charges",
    icon: "settings-outline",
    route: "/shop/operational-settings",
    color: "#0077b6",
  },
  {
    label: "Inventory",
    icon: "cube-outline",
    route: "/shop/inventory",
    color: "#005d90",
  },
  {
    label: "Can Mgmt",
    icon: "water-outline",
    route: "/shop/can-management",
    color: "#0077b6",
  },
  {
    label: "Earnings",
    icon: "cash-outline",
    route: "/shop/earnings",
    color: "#10b981",
  },
  {
    label: "Slots",
    icon: "calendar-outline",
    route: "/shop/slots",
    color: "#f59e0b",
  },
  {
    label: "Hours",
    icon: "time-outline",
    route: "/shop/schedule",
    color: "#6366f1",
  },
];

const REJECT_REASONS = [
  "Out of stock",
  "Shop closed / holiday",
  "Outside delivery area",
  "Too many active orders",
  "Customer unreachable",
];

function getStatusColor(status: string | undefined, colors: ColorSchemeColors) {
  const s = status || 'pending';
  switch (s) {
    case 'pending': return colors.warning;
    case 'accepted': return SHOP_ACCENT;
    case 'out_for_delivery': return colors.primary;
    case 'completed':
    case 'delivered': return colors.success;
    case 'cancelled': return '#ba1a1a';
    default: return SHOP_ACCENT;
  }
}

// Sub-component moved inside Main Screen

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ShopOrdersScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);

  // ─── Order Card (Inner) ───────────────────────────────────────────────────
  const OrderCard = ({
    order,
    onAccept,
    onReject,
    onDelivered,
    onPress,
  }: {
    order: any;
    onAccept: () => void;
    onReject: () => void;
    onDelivered: () => void;
    onPress: () => void;
  }) => {
    const [acting, setActing] = useState<"accept" | "reject" | "delivered" | null>(null);
    const router = useRouter();

    const totalQty = order.items?.reduce((s: number, i: any) => s + i.quantity, 0) ?? 0;
    const totalAmt = order.total_amount ?? order.totalAmount ?? 0;
    const isPending = order.status === "pending";
    const isAccepted = order.status === "accepted";
    const statusColor = getStatusColor(order.status, colors);

    const doAction = async (type: "accept" | "reject" | "delivered") => {
      setActing(type);
      try {
        if (type === "accept") await onAccept();
        else if (type === "reject") onReject();
        else await onDelivered();
      } finally {
        setTimeout(() => setActing(null), 1200);
      }
    };

    return (
      <TouchableOpacity
        activeOpacity={0.92}
        style={[styles.orderCard, { backgroundColor: colors.surface }, Shadow.sm]}
        onPress={onPress}
      >
        <View style={styles.orderTop}>
          <View style={[styles.orderIconWrap, { backgroundColor: colors.deliverySoft }]}>
            <Ionicons name="water" size={20} color={SHOP_ACCENT} />
          </View>
          <View style={{ flex: 1 }}>
            {isPending && <Text style={styles.priorityLabel}>NEW ORDER</Text>}
            <Text style={[styles.customerName, { color: colors.text }]} numberOfLines={1}>
              {order.customerName ?? order.customer_name ?? "Customer"}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {order.status?.replace(/_/g, " ") ?? "—"}
            </Text>
          </View>
        </View>

        <View style={styles.orderMetaRow}>
          <View style={styles.orderMetaItem}>
            <Ionicons name="layers-outline" size={14} color={colors.muted} />
            <Text style={[styles.orderMetaText, { color: colors.text }]}>
              {totalQty} can{totalQty !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.orderMetaItem}>
            <Ionicons name="cash-outline" size={14} color={colors.muted} />
            <Text style={[styles.orderMetaText, { color: colors.text }]}>
              ₹{Number(totalAmt).toFixed(0)}
            </Text>
          </View>
          <View style={styles.orderMetaItem}>
            <Ionicons name="pricetag-outline" size={14} color={colors.muted} />
            <Text style={[styles.orderMetaText, { color: colors.text }]}>
              #{String(order.id).slice(-6)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addressRow}
          activeOpacity={0.7}
          onPress={() =>
            router.push({
              pathname: "/map-preview",
              params: {
                lat: order.delivery_lat ?? "12.9716",
                lng: order.delivery_lng ?? "80.221",
                title: order.customerName ?? "Delivery",
              },
            })
          }
        >
          <Ionicons name="location-outline" size={14} color={colors.muted} />
          <Text style={[styles.addressText, { color: colors.muted }]} numberOfLines={2}>
            {order.address ?? order.delivery_address ?? "Address not available"}
          </Text>
          <Ionicons name="chevron-forward" size={12} color={colors.muted} />
        </TouchableOpacity>

        {(isPending || isAccepted) && (
          <View style={styles.actionArea}>
            {isPending && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.9} onPress={() => doAction("accept")} disabled={acting !== null}>
                  <LinearGradient colors={SHOP_GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.acceptBtn, acting === "accept" && { opacity: 0.7 }]}>
                    <Ionicons name="checkmark-circle" size={18} color="white" />
                    <Text style={styles.acceptBtnText}>{acting === "accept" ? "Accepting…" : "Accept"}</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rejectBtn, { borderColor: colors.adminSoft, backgroundColor: colors.surface }]}
                  onPress={() => doAction("reject")}
                  disabled={acting !== null}
                >
                  <Ionicons name="close" size={16} color={'#ba1a1a'} />
                  <Text style={[styles.rejectBtnText, { color: '#ba1a1a' }]}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
            {isAccepted && (
              <TouchableOpacity
                style={[styles.deliveredBtn, { backgroundColor: SHOP_ACCENT }, acting === "delivered" && { opacity: 0.7 }]}
                onPress={() => doAction("delivered")}
                disabled={acting !== null}
              >
                <Ionicons name="bicycle" size={16} color="white" />
                <Text style={styles.deliveredBtnText}>{acting === "delivered" ? "Updating…" : "Mark as Delivered"}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabState>("active");
  const [acceptingOrders, setAcceptingOrders] = useState(true);
  const [busyMode, setBusyMode] = useState(false);
  const [rejectModalOrderId, setRejectModalOrderId] = useState<string | null>(null);
  const [selectedRejectReason, setSelectedRejectReason] = useState<
    string | null
  >(null);

  const router = useRouter();
  const { orders, updateStatus, setActiveOrder, fetchOrders } = useOrderStore();
  const { shops } = useShopStore();

  const pendingAlertRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders().finally(() => setRefreshing(false));
  }, [fetchOrders]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const shop = shops?.[0];

  const activeOrders = orders.filter(
    (o) => !["completed", "cancelled", "delivered"].includes(o.status),
  );

  const completedOrders = orders.filter((o) =>
    ["completed", "cancelled", "delivered"].includes(o.status),
  );

  const pendingCount = activeOrders.filter(
    (o) => o.status === "pending",
  ).length;
  const lowStockCount =
    shop?.products?.filter((p: any) => p.stockCount < 30)?.length ?? 0;

  // Auto busy-mode
  useEffect(() => {
    if (activeOrders.length >= 5 && !busyMode) setBusyMode(true);
  }, [activeOrders.length]);

  // Pending alert — fire once when there are pending orders, debounce on changes
  useEffect(() => {
    if (pendingAlertRef.current) clearTimeout(pendingAlertRef.current);
    if (pendingCount === 0) return;
    pendingAlertRef.current = setTimeout(
      () => {
        Toast.show({
          type: "info",
          text1: "Unaccepted Orders",
          text2: `${pendingCount} order(s) still waiting for acceptance.`,
        });
      },
      5 * 60 * 1000,
    );
    return () => {
      if (pendingAlertRef.current) clearTimeout(pendingAlertRef.current);
    };
  }, [pendingCount]);

  const handleAccept = async (orderId: string) => {
    setActiveOrder(orderId);
    await apiClient.patch(`/shop-owner/orders/${orderId}/status`, {
      status: "accepted",
    });
    updateStatus(orderId, "accepted");
  };

  const handleDelivered = async (orderId: string) => {
    setActiveOrder(orderId);
    await apiClient.patch(`/shop-owner/orders/${orderId}/status`, {
      status: "delivered",
    });
    updateStatus(orderId, "completed");
    router.push(`/shop/order/${orderId}` as any);
  };

  const openRejectModal = (orderId: string) => {
    setSelectedRejectReason(null);
    setRejectModalOrderId(orderId);
  };

  const confirmReject = async () => {
    if (!selectedRejectReason) {
      Toast.show({
        type: "error",
        text1: "Reason required",
        text2: "Select a reason to reject.",
      });
      return;
    }
    if (!rejectModalOrderId) return;
    try {
      const res = await apiClient.post(
        `/shop-owner/orders/${rejectModalOrderId}/reject`,
        {
          reason: selectedRejectReason,
        },
      );
      setActiveOrder(rejectModalOrderId);
      updateStatus(rejectModalOrderId, "cancelled");
      Toast.show({
        type: res.data.data?.fallback ? "info" : "success",
        text1: res.data.data?.fallback ? "Finding next shop" : "Order Rejected",
        text2: res.data.data?.fallback
          ? "Customer will receive a new offer."
          : "Order has been cancelled.",
      });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Reject failed",
        text2: e?.response?.data?.message ?? "Try again",
      });
    } finally {
      setRejectModalOrderId(null);
      setSelectedRejectReason(null);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      <RoleHeader
        role="shop_owner"
        title="Shop Panel"
        hasNotif
        onNotif={() => router.push("/notifications" as any)}
        onSettings={() => router.push("/shop/settings" as any)}
      />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[SHOP_ACCENT]}
            tintColor={SHOP_ACCENT}
          />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
      >
        {/* Delivery mode hero */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/delivery" as any)}
        >
          <LinearGradient
            colors={SHOP_GRAD}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroCard, { shadowColor: SHOP_ACCENT }]}
          >
            <View style={styles.heroLeft}>
              <View style={styles.heroIcon}>
                <Ionicons name="bicycle" size={26} color={SHOP_ACCENT} />
              </View>
              <View>
                <Text style={styles.heroTitle}>Switch to Delivery Mode</Text>
                <Text style={styles.heroSub}>
                  Act as delivery agent for your shop
                </Text>
              </View>
            </View>
            <View style={styles.heroArrow}>
              <Ionicons name="arrow-forward" size={18} color="white" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
        {/* Quick actions grid */}
        <View style={styles.gridRow}>
          {QUICK_ACTIONS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.gridCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => router.navigate(item.route as any)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.gridIcon,
                  { backgroundColor: (item.color ?? SHOP_ACCENT) + "18" },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={item.color ?? SHOP_ACCENT}
                />
              </View>
              <Text style={[styles.gridLabel, { color: colors.text }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            {
              label: "Active",
              value: activeOrders.length,
              icon: "receipt-outline",
            },
            { label: "Pending", value: pendingCount, icon: "time-outline" },
            {
              label: "Low Stock",
              value: lowStockCount,
              icon: "warning-outline",
            },
          ].map((s) => (
            <View
              key={s.label}
              style={[
                styles.statCard,
                { backgroundColor: colors.surface },
                Shadow.xs,
              ]}
            >
              <Ionicons name={s.icon as any} size={16} color={SHOP_ACCENT} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {s.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={[styles.tabsWrap, { backgroundColor: colors.border }]}>
          {(["active", "completed"] as TabState[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabBtn,
                activeTab === tab && [
                  styles.tabBtnActive,
                  { backgroundColor: colors.surface },
                  Shadow.xs,
                ],
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: colors.muted },
                  activeTab === tab && {
                    color: SHOP_ACCENT,
                    fontWeight: "800",
                  },
                ]}
              >
                {tab === "active"
                  ? `Active${activeOrders.length > 0 ? ` (${activeOrders.length})` : ""}`
                  : "Completed"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Active orders list */}
        {activeTab === "active" &&
          (activeOrders.length === 0 ? (
            <EmptyState
              icon="checkmark-done-circle-outline"
              title="No active orders"
              subtitle="New customer orders will appear here."
            />
          ) : (
            activeOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onAccept={async () => {
                  try {
                    await handleAccept(order.id);
                  } catch (e: any) {
                    Toast.show({
                      type: "error",
                      text1: "Accept failed",
                      text2: e?.response?.data?.message ?? "Try again",
                    });
                    throw e;
                  }
                }}
                onReject={() => openRejectModal(order.id)}
                onDelivered={async () => {
                  try {
                    await handleDelivered(order.id);
                  } catch (e: any) {
                    Toast.show({
                      type: "error",
                      text1: "Update failed",
                      text2: e?.response?.data?.message ?? "Try again",
                    });
                    throw e;
                  }
                }}
                onPress={() => router.push(`/shop/order/${order.id}` as any)}
              />
            ))
          ))}

        {/* Completed orders list */}
        {activeTab === "completed" &&
          (completedOrders.length === 0 ? (
            <EmptyState
              icon="checkmark-done-circle-outline"
              title="No completed orders yet"
              subtitle="Delivered and cancelled orders appear here."
            />
          ) : (
            completedOrders.map((order) => {
              const totalAmt = order.total_amount ?? order.totalAmount ?? 0;
              const isCancelled = order.status === "cancelled";
              return (
                <TouchableOpacity
                  key={order.id}
                  style={[
                    styles.completedCard,
                    { backgroundColor: colors.surface },
                    Shadow.xs,
                  ]}
                  onPress={() => router.push(`/shop/order/${order.id}` as any)}
                >
                  <View
                    style={[
                      styles.completedIconWrap,
                      {
                        backgroundColor: isCancelled
                          ? colors.adminSoft
                          : colors.deliverySoft,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        isCancelled
                          ? "close-circle-outline"
                          : "checkmark-circle-outline"
                      }
                      size={20}
                      color={
                        isCancelled ? '#ba1a1a' : SHOP_ACCENT
                      }
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.completedName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {order.customerName ?? order.customer_name ?? "Customer"}
                    </Text>
                    <Text style={[styles.completedId, { color: colors.muted }]}>
                      #{String(order.id).slice(-6)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Text style={[styles.completedAmt, { color: colors.text }]}>
                      ₹{Number(totalAmt).toFixed(0)}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: getStatusColor(order.status, colors) + "20",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: getStatusColor(order.status, colors) },
                        ]}
                      >
                        {order.status?.replace(/_/g, " ")}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.muted}
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              );
            })
          ))}
      </ScrollView>

      {/* Reject Modal */}
      <Modal
        visible={rejectModalOrderId !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectModalOrderId(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalSheet, { backgroundColor: colors.surface }]}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Reject Order
              </Text>
              <TouchableOpacity
                style={[
                  styles.modalCloseBtn,
                  { backgroundColor: colors.background },
                ]}
                onPress={() => setRejectModalOrderId(null)}
              >
                <Ionicons name="close" size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSub, { color: colors.muted }]}>
              Select a reason (required)
            </Text>

            <View style={{ gap: 8, marginBottom: 20 }}>
              {REJECT_REASONS.map((reason) => {
                const selected = selectedRejectReason === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.reasonItem,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                      },
                      selected && {
                        borderColor: colors.adminSoft,
                        backgroundColor: colors.adminSoft,
                      },
                    ]}
                    onPress={() => setSelectedRejectReason(reason)}
                  >
                    <Ionicons
                      name={selected ? "radio-button-on" : "radio-button-off"}
                      size={18}
                      color={selected ? '#ba1a1a' : colors.muted}
                    />
                    <Text
                      style={[
                        styles.reasonText,
                        { color: colors.text },
                        selected && {
                          color: '#ba1a1a',
                          fontWeight: "800",
                        },
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[
                styles.confirmRejectBtn,
                { backgroundColor: '#ba1a1a' },
                !selectedRejectReason && { opacity: 0.4 },
              ]}
              onPress={confirmReject}
            >
              <Ionicons name="close-circle" size={16} color="white" />
              <Text style={styles.confirmRejectText}>Confirm Rejection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: Radius.xl,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  gridCard: {
    width: "30%",
    flexGrow: 1,
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    ...Shadow.xs,
  },
  gridIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  gridLabel: { fontSize: 10, fontWeight: "800", textAlign: "center" },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "600" },

  heroCard: {
    borderRadius: Radius.xl,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 12,
    ...Shadow.hero,
  },
  heroLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 14 },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: { fontSize: 16, fontWeight: "900", color: "white" },
  heroSub: { fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  heroArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  opsCard: { borderRadius: Radius.xl, padding: 16, gap: 12, marginBottom: 16 },
  opsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  opsTitle: { fontSize: 14, fontWeight: "800" },
  opsSub: { fontSize: 12, lineHeight: 17, marginTop: 2, flexShrink: 1 },
  divider: { height: 1 },
  togglePill: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  toggleText: { fontWeight: "800", fontSize: 13 },
  analyticsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderStyle: "dashed",
    borderWidth: 1,
  },
  analyticsText: { fontSize: 12, fontWeight: "700" },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    borderRadius: Radius.xl,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: 20, fontWeight: "900" },
  statLabel: { fontSize: 10, fontWeight: "700", textAlign: "center" },

  tabsWrap: {
    flexDirection: "row",
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: Radius.md,
  },
  tabBtnActive: {},
  tabText: { fontSize: 13, fontWeight: "600" },

  // Order card
  orderCard: { borderRadius: Radius.xl, padding: 16, marginBottom: 12 },
  orderTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  orderIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  priorityLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: SHOP_ACCENT,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  customerName: { fontSize: 16, fontWeight: "900" },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "capitalize",
  },

  orderMetaRow: { flexDirection: "row", gap: 16, marginBottom: 10 },
  orderMetaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  orderMetaText: { fontSize: 13, fontWeight: "700" },

  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 12,
  },
  addressText: { flex: 1, fontSize: 12, lineHeight: 17 },

  actionArea: { gap: 8 },
  actionRow: { flexDirection: "row", gap: 10 },
  acceptBtn: {
    borderRadius: Radius.lg,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  acceptBtnText: { color: "white", fontSize: 13, fontWeight: "900" },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    paddingVertical: 12,
  },
  rejectBtnText: { fontWeight: "800", fontSize: 12 },
  deliveredBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: Radius.lg,
    paddingVertical: 12,
  },
  deliveredBtnText: { color: "white", fontWeight: "800", fontSize: 13 },

  // Completed card
  completedCard: {
    borderRadius: Radius.xl,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  completedIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  completedName: { fontSize: 14, fontWeight: "800" },
  completedId: { fontSize: 11, marginTop: 2 },
  completedAmt: { fontSize: 14, fontWeight: "900" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,40,60,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  modalTitle: { fontSize: 20, fontWeight: "900" },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSub: { fontSize: 13, marginBottom: 16, fontWeight: "500" },
  reasonItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  reasonText: { fontSize: 14, fontWeight: "600", flex: 1 },
  confirmRejectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: Radius.xl,
    paddingVertical: 15,
  },
  confirmRejectText: { color: "white", fontWeight: "800", fontSize: 15 },
});
