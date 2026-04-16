import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
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
import Toast from 'react-native-toast-message';
import { SafeAreaView } from "react-native-safe-area-context";

import { Logo } from "@/components/ui/Logo";
import { useOrderStore } from "@/stores/orderStore";
import { useShopStore } from "@/stores/shopStore";
import { apiClient } from "@/api/client";

type OrderAction = "accept" | "reject" | "delivered";
type TabState = "active" | "completed";

const REJECT_REASONS = [
  "Out of stock",
  "Shop closed / holiday",
  "Outside delivery area",
  "Too many active orders",
  "Customer unreachable",
];

export default function ShopOrdersScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const [actionDone, setActionDone] = useState<OrderAction | null>(null);
  const [activeTab, setActiveTab] = useState<TabState>("active");
  const [acceptingOrders, setAcceptingOrders] = useState(true);
  const [busyMode, setBusyMode] = useState(false);
  const [rejectModalOrderId, setRejectModalOrderId] = useState<string | null>(null);
  const [selectedRejectReason, setSelectedRejectReason] = useState<string | null>(null);
  const [orderSearchText, setOrderSearchText] = useState("");

  const router = useRouter();
  const { orders, updateStatus, setActiveOrder, fetchOrders } = useOrderStore();
  const { shops } = useShopStore();

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchOrders().finally(() => setRefreshing(false));
  }, [fetchOrders]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  const shop = shops[0];
  const activeOrders = orders
    .filter((order) => !["completed", "cancelled"].includes(order.status))
    .filter((order) => {
      const q = orderSearchText.toLowerCase();
      return (
        order.customerName.toLowerCase().includes(q) ||
        order.id.toLowerCase().includes(q)
      );
    });
  const completedOrders = orders
    .filter((order) => ["completed", "cancelled"].includes(order.status))
    .filter((order) => {
      const q = orderSearchText.toLowerCase();
      return (
        order.customerName.toLowerCase().includes(q) ||
        order.id.toLowerCase().includes(q)
      );
    });
  const nextOrder = activeOrders[0];
  const lowStock =
    shop?.products.filter((product) => product.stockCount < 30) ?? [];

  // P0: Delivery capacity management - auto busy mode
  React.useEffect(() => {
    if (activeOrders.length >= 5 && !busyMode) {
      setBusyMode(true);
    }
  }, [activeOrders.length]);

  // P0: 5-min auto-reminder when order not accepted
  React.useEffect(() => {
    const pendingCount = activeOrders.filter(
      (o) => o.status === "pending",
    ).length;
    if (pendingCount === 0) return;
    // In a real app we'd compare created timestamps, but here we trigger a timer.
    const timer = setTimeout(
      () => {
        Toast.show({
          type: 'info',
          text1: '⚠️ Unaccepted Orders',
          text2: `You have ${pendingCount} order(s) waiting for acceptance. Please action them immediately.`
        });
      },
      5 * 60 * 1000,
    );
    return () => clearTimeout(timer);
  }, [activeOrders]);

  const handleAction = async (action: OrderAction, orderId?: string) => {
    setActionDone(action);
    if (orderId) {
      setActiveOrder(orderId);
    }

    if (action === "accept" && orderId) {
      try {
        await apiClient.patch(`/shop-owner/orders/${orderId}/status`, { status: "accepted" });
        updateStatus(orderId, "accepted");
      } catch (e: any) {
        Toast.show({ type: 'error', text1: 'Accept failed', text2: e?.response?.data?.message ?? 'Try again' });
        return;
      }
    }

    // 'reject' is handled by openRejectModal — never called directly here

    if (action === "delivered" && orderId) {
      try {
        await apiClient.patch(`/shop-owner/orders/${orderId}/status`, { status: "delivered" });
        updateStatus(orderId, "completed");
      } catch (e: any) {
        Toast.show({ type: 'error', text1: 'Update failed', text2: e?.response?.data?.message ?? 'Try again' });
        return;
      }
    }

    if (action === "delivered") {
      setTimeout(() => {
        setActionDone(null);
        if (orderId) {
          router.push(`/shop/order/${orderId}` as any);
        }
      }, 700);
    } else {
      setTimeout(() => setActionDone(null), 2000);
    }
  };

  /** P0: Reject reason is MANDATORY — opens bottom-sheet */
  const openRejectModal = (orderId: string) => {
    setSelectedRejectReason(null);
    setRejectModalOrderId(orderId);
  };

  const confirmReject = async () => {
    if (!selectedRejectReason) {
      Toast.show({
        type: 'error',
        text1: 'Reason Required',
        text2: 'Please select a reason before rejecting this order.'
      });
      return;
    }
    if (rejectModalOrderId) {
      try {
        const res = await apiClient.post(`/shop-owner/orders/${rejectModalOrderId}/reject`, { reason: selectedRejectReason });
        setActiveOrder(rejectModalOrderId);
        // If fallback found, backend notifies customer via socket — update local status to show searching
        if (res.data.data?.fallback) {
          updateStatus(rejectModalOrderId, "cancelled"); // Remove from shop queue
          Toast.show({ type: 'info', text1: 'Searching for next shop', text2: 'Customer will be notified with a new offer.' });
        } else {
          updateStatus(rejectModalOrderId, "cancelled");
          Toast.show({ type: 'success', text1: 'Order Rejected', text2: 'Order has been cancelled.' });
        }
        setActionDone("reject");
        setTimeout(() => setActionDone(null), 2000);
      } catch (e: any) {
        Toast.show({ type: 'error', text1: 'Reject failed', text2: e?.response?.data?.message ?? 'Try again' });
      }
    }
    setRejectModalOrderId(null);
    setSelectedRejectReason(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <View style={styles.brandRow}>
            <Logo size="md" />
            <Text style={styles.brandName}>ThanniGo</Text>
          </View>
          <Text style={styles.roleLabel}>SHOP PANEL</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/shop/settings" as any)}
          >
            <Ionicons name="grid-outline" size={20} color="#005d90" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/notifications" as any)}
          >
            <Ionicons name="notifications-outline" size={22} color="#005d90" />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#005d90"]}
            tintColor="#005d90"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
      >
        <Text style={styles.pageTitle}>Orders</Text>

        {/* SEARCH BAR (P1) */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#707881"
            style={styles.searchIcon}
          />
          <TextInput
            value={orderSearchText}
            onChangeText={setOrderSearchText}
            placeholder="Search customer name or Order ID..."
            placeholderTextColor="#bfc7d1"
            style={styles.searchInput}
          />
          {orderSearchText ? (
            <TouchableOpacity onPress={() => setOrderSearchText("")}>
              <Ionicons name="close-circle" size={18} color="#bfc7d1" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* --- DELIVERY MODE HERO CARD --- */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/delivery" as any)}
        >
          <LinearGradient
            colors={["#006878", "#004e5b"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.deliveryHeroCard}
          >
            <View style={styles.heroLeft}>
              <View style={styles.heroIconBackground}>
                <Ionicons name="bicycle" size={28} color="#006878" />
              </View>
              <View>
                <Text style={styles.heroTitle}>Switch to Delivery Mode</Text>
                <Text style={styles.heroSub}>
                  Act as delivery agent for your shop
                </Text>
              </View>
            </View>
            <View style={styles.heroAction}>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.opsCard}>
          <View style={styles.opsRow}>
            <View>
              <Text style={styles.opsTitle}>Accept Orders</Text>
              <Text style={styles.opsSub}>
                Control whether customers can place new orders right now.
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.statePill,
                acceptingOrders && styles.statePillActive,
              ]}
              onPress={() => setAcceptingOrders((value) => !value)}
            >
              <Text
                style={[
                  styles.statePillText,
                  acceptingOrders && styles.statePillTextActive,
                ]}
              >
                {acceptingOrders ? "Online" : "Paused"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* --- QUICK ANALYTICS LINK (Hidden Menu Entry Point) --- */}
          <TouchableOpacity
            style={styles.insightsRow}
            onPress={() => router.push("/shop/analytics" as any)}
          >
            <View style={styles.insightsLeft}>
              <Ionicons name="trending-up" size={16} color="#006878" />
              <Text style={styles.insightsText}>
                View Shop Analytics & Trends
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
          </TouchableOpacity>
          <View style={styles.dividerLine} />
          <View style={styles.opsRow}>
            <View>
              <Text style={styles.opsTitle}>Busy Mode</Text>
              <Text style={styles.opsSub}>
                Use when capacity is full and new requests should be slowed
                down.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.statePill, busyMode && styles.statePillWarn]}
              onPress={() => setBusyMode((value) => !value)}
            >
              <Text
                style={[
                  styles.statePillText,
                  busyMode && styles.statePillWarnText,
                ]}
              >
                {busyMode ? "Busy" : "Normal"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.capacityRow}>
          <View style={styles.capacityCard}>
            <Text style={styles.capacityLabel}>Open Orders</Text>
            <Text style={styles.capacityValue}>{activeOrders.length}</Text>
          </View>
          <View style={styles.capacityCard}>
            <Text style={styles.capacityLabel}>Per Hour Capacity</Text>
            <Text style={styles.capacityValue}>5</Text>
          </View>
          <View style={styles.capacityCard}>
            <Text style={styles.capacityLabel}>Low Stock SKUs</Text>
            <Text style={styles.capacityValue}>{lowStock.length}</Text>
          </View>
        </View>

        {/* CUSTOM TABS */}
        <View style={styles.tabsWrap}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === "active" && styles.tabBtnActive,
            ]}
            onPress={() => setActiveTab("active")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "active" && styles.tabTextActive,
              ]}
            >
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === "completed" && styles.tabBtnActive,
            ]}
            onPress={() => setActiveTab("completed")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "completed" && styles.tabTextActive,
              ]}
            >
              Completed
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "active" && (
          <>
            <Text style={styles.sectionHeader}>Pending Actions</Text>
            {nextOrder ? (
              <View style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <View style={styles.orderIconWrap}>
                    <Ionicons name="water" size={22} color="#004e5b" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.priorityLabel}>Priority Order</Text>
                    <Text style={styles.customerName}>
                      {nextOrder.customerName}
                    </Text>
                  </View>
                  <View style={styles.orderIdBadge}>
                    <Text style={styles.orderIdText}>#{nextOrder.id}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailIconWrap}>
                    <Ionicons name="layers-outline" size={18} color="#005d90" />
                  </View>
                  <Text style={styles.detailValue}>
                    {nextOrder.items.reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    )}{" "}
                    Cans{" "}
                    <Text style={styles.detailValueSub}>
                      ({shop?.products[0]?.unitLabel ?? "20L"})
                    </Text>
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.detailRow}
                  onPress={() =>
                    router.push({
                      pathname: "/map-preview",
                      params: {
                        lat: "28.4595",
                        lng: "77.0266",
                        title: nextOrder.customerName,
                      },
                    })
                  }
                >
                  <View style={styles.detailIconWrap}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color="#707881"
                    />
                  </View>
                  <Text style={styles.addressText}>{nextOrder.address}</Text>
                </TouchableOpacity>

                {/* Action Buttons */}
                <View style={styles.actionGrid}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={{ flex: 1 }}
                    onPress={() => handleAction("accept", nextOrder.id)}
                  >
                    <LinearGradient
                      colors={["#005d90", "#0077b6"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.acceptBtn}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="white"
                      />
                      <Text style={styles.acceptBtnText}>ACCEPT</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => openRejectModal(nextOrder.id)}
                  >
                    <Ionicons name="close" size={18} color="#ba1a1a" />
                    <Text style={styles.rejectBtnText}>REJECT</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.deliveredBtn}
                  onPress={() => handleAction("delivered", nextOrder.id)}
                >
                  <Ionicons name="bicycle" size={18} color="white" />
                  <Text style={styles.deliveredBtnText}>MARK AS DELIVERED</Text>
                </TouchableOpacity>

                {/* STATUS MESSAGE */}
                {actionDone && (
                  <View
                    style={[
                      styles.statusMsg,
                      actionDone === "accept"
                        ? styles.statusMsgSuccess
                        : actionDone === "reject"
                          ? styles.statusMsgError
                          : styles.statusMsgInfo,
                    ]}
                  >
                    <Text style={styles.statusMsgText}>
                      {actionDone === "accept"
                        ? "Order Accepted!"
                        : actionDone === "reject"
                          ? "Order Rejected"
                          : "Marked as Delivered!"}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="checkmark-done-circle-outline"
                  size={48}
                  color="#bfc7d1"
                />
                <Text style={styles.emptyTitle}>No active shop orders</Text>
                <Text style={styles.emptySub}>
                  New customer orders will appear here.
                </Text>
              </View>
            )}
          </>
        )}

        {activeTab === "completed" &&
          (completedOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="checkmark-done-circle-outline"
                size={48}
                color="#bfc7d1"
              />
              <Text style={styles.emptyTitle}>No completed orders yet</Text>
              <Text style={styles.emptySub}>
                Orders marked as delivered will appear here.
              </Text>
            </View>
          ) : (
            completedOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.completedCard}
                onPress={() => router.push(`/shop/order/${order.id}` as any)}
              >
                <View>
                  <Text style={styles.completedId}>#{order.id}</Text>
                  <Text style={styles.completedName}>{order.customerName}</Text>
                </View>
                <Text style={styles.completedStatus}>
                  {order.status.replaceAll("_", " ")}
                </Text>
              </TouchableOpacity>
            ))
          ))}
      </ScrollView>

      {/* MANDATORY REJECT REASON MODAL (P0) */}
      <Modal
        visible={rejectModalOrderId !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectModalOrderId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Order</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setRejectModalOrderId(null)}
              >
                <Ionicons name="close" size={20} color="#707881" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Select a reason (required)</Text>
            <View style={{ gap: 10, width: "100%", marginBottom: 20 }}>
              {REJECT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonOption,
                    selectedRejectReason === reason &&
                      styles.reasonOptionSelected,
                  ]}
                  onPress={() => setSelectedRejectReason(reason)}
                >
                  <Ionicons
                    name={
                      selectedRejectReason === reason
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={20}
                    color={
                      selectedRejectReason === reason ? "#ba1a1a" : "#94a3b8"
                    }
                  />
                  <Text
                    style={[
                      styles.reasonText,
                      selectedRejectReason === reason &&
                        styles.reasonTextSelected,
                    ]}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[
                styles.confirmRejectBtn,
                !selectedRejectReason && { opacity: 0.4 },
              ]}
              onPress={confirmReject}
            >
              <Ionicons name="close-circle" size={18} color="white" />
              <Text style={styles.confirmRejectText}>Confirm Rejection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9ff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandName: {
    fontSize: 20,
    fontWeight: "900",
    color: "#003a5c",
    letterSpacing: -0.5,
  },
  roleLabel: {
    fontSize: 8,
    fontWeight: "700",
    color: "#006878",
    letterSpacing: 1.2,
    marginTop: 2,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f4f9",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  deliveryHeroCard: {
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    overflow: "hidden",
    shadowColor: "#004e5b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  heroLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 16 },
  heroIconBackground: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: { fontSize: 18, fontWeight: "900", color: "white" },
  heroSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  heroAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: "#ba1a1a",
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#f1f4f9",
  },

  pageTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#181c20",
    letterSpacing: -0.5,
    marginTop: 10,
    marginBottom: 12,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: "#f1f4f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "600", color: "#181c20" },

  tabsWrap: {
    flexDirection: "row",
    backgroundColor: "#ebeef4",
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { fontSize: 13, fontWeight: "600", color: "#707881" },
  tabTextActive: { color: "#005d90", fontWeight: "800" },

  sectionHeader: {
    fontSize: 13,
    fontWeight: "800",
    color: "#707881",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  opsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    gap: 14,
    marginBottom: 16,
  },
  opsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  opsTitle: { fontSize: 15, fontWeight: "800", color: "#181c20" },
  opsSub: { color: "#707881", width: 220, lineHeight: 18, fontSize: 12 },
  dividerLine: { height: 1, backgroundColor: "#f1f4f9" },
  statePill: {
    borderRadius: 999,
    backgroundColor: "#f1f4f9",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statePillActive: { backgroundColor: "#E0F7FA" },
  statePillWarn: { backgroundColor: "#FFF3E0" },
  statePillText: { color: "#707881", fontWeight: "800" },
  statePillTextActive: { color: "#006878" },
  statePillWarnText: { color: "#E67E22" },
  capacityRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  capacityCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
  },
  capacityLabel: {
    color: "#707881",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  capacityValue: {
    color: "#181c20",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 6,
  },

  orderCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#003a5c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  orderTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  orderIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#a7edff",
    alignItems: "center",
    justifyContent: "center",
  },
  priorityLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#006878",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  customerName: { fontSize: 18, fontWeight: "900", color: "#181c20" },
  orderIdBadge: {
    backgroundColor: "#e0f0ff",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  orderIdText: { color: "#005d90", fontWeight: "800", fontSize: 11 },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  detailIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#f1f4f9",
    alignItems: "center",
    justifyContent: "center",
  },
  detailValue: { fontSize: 16, fontWeight: "900", color: "#181c20" },
  detailValueSub: { fontSize: 13, fontWeight: "500", color: "#707881" },
  addressText: { fontSize: 13, color: "#181c20", lineHeight: 18, flex: 1 },

  actionGrid: { flexDirection: "row", gap: 10, marginVertical: 12 },
  acceptBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  acceptBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#ffdad6",
  },
  rejectBtnText: { color: "#ba1a1a", fontWeight: "800", fontSize: 13 },
  deliveredBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#006878",
    borderRadius: 16,
    paddingVertical: 14,
  },
  deliveredBtnText: { color: "white", fontWeight: "800", fontSize: 13 },

  statusMsg: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  statusMsgSuccess: { backgroundColor: "#006878" },
  statusMsgError: { backgroundColor: "#ba1a1a" },
  statusMsgInfo: { backgroundColor: "#005d90" },
  statusMsgText: {
    color: "white",
    fontWeight: "700",
    fontSize: 13,
    marginLeft: 8,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#181c20",
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: "#707881",
    marginTop: 4,
    textAlign: "center",
  },
  completedCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  completedId: { color: "#005d90", fontWeight: "800", fontSize: 12 },
  completedName: {
    color: "#181c20",
    fontWeight: "800",
    fontSize: 16,
    marginTop: 4,
  },
  completedStatus: {
    color: "#006878",
    fontWeight: "700",
    textTransform: "capitalize",
  },

  insightsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#e6f7f9",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 24,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#006878",
  },
  insightsLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  insightsText: { fontSize: 13, fontWeight: "700", color: "#006878" },

  // ── Reject Reason Modal ──────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,58,92,0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 4,
  },
  modalTitle: { fontSize: 22, fontWeight: "900", color: "#181c20" },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f4f9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#707881",
    alignSelf: "flex-start",
    marginBottom: 16,
    fontWeight: "500",
  },
  reasonOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#f1f4f9",
    backgroundColor: "#fafafa",
  },
  reasonOptionSelected: { borderColor: "#ffdad6", backgroundColor: "#fff5f4" },
  reasonText: { fontSize: 14, color: "#404850", fontWeight: "600", flex: 1 },
  reasonTextSelected: { color: "#ba1a1a", fontWeight: "800" },
  confirmRejectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ba1a1a",
    borderRadius: 18,
    paddingVertical: 16,
    width: "100%",
  },
  confirmRejectText: { color: "white", fontWeight: "800", fontSize: 15 },
});


