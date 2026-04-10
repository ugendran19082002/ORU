import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import React from "react";
import { Alert, Text, View } from "react-native";

function TabIcon({
  name,
  focused,
  color,
  label,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
  label: string;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: focused ? 10 : 0,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: focused ? "#e0f4f4" : "transparent",
        minWidth: 64,
        minHeight: 45,
      }}
    >
      <Ionicons name={name} size={22} color={focused ? "#006878" : "#94a3b8"} />
      <Text
        style={{
          fontSize: 9,
          fontWeight: "700",
          color: focused ? "#006878" : "#94a3b8",
          marginTop: 2,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function ShopLayout() {
  const router = useRouter();

  const handleDeliverySwitch = () => {
    Alert.alert(
      "Switch to Delivery Mode",
      "You will be redirected to the Delivery Agent dashboard. Switch back anytime from the delivery menu.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Switch Now",
          onPress: () => router.replace("/delivery" as any),
        },
      ],
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 20,
          height: 72,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          position: "absolute",
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#006878",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarItemStyle: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          height: 72,
        },
        animation: "fade",
      }}
    >
      {/* Hidden screens (no tab icon) */}
      <Tabs.Screen
        name="order/[id]"
        options={{ href: null, tabBarStyle: { display: "none" } }}
      />
      <Tabs.Screen name="vendor-register" options={{ href: null }} />
      <Tabs.Screen name="subscription-plans" options={{ href: null }} />
      <Tabs.Screen name="manual-order" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="analytics.next" options={{ href: null }} />
      <Tabs.Screen name="delivery-fleet" options={{ href: null }} />

      {/* TAB 1 — Orders (Home) */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "receipt" : "receipt-outline"}
              focused={focused}
              color={color}
              label="Orders"
            />
          ),
        }}
      />

      {/* TAB 2 — Inventory */}
      <Tabs.Screen
        name="inventory"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "cube" : "cube-outline"}
              focused={focused}
              color={color}
              label="Stock"
            />
          ),
        }}
      />

      {/* TAB 4 — Earnings */}
      <Tabs.Screen
        name="earnings"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "bar-chart" : "bar-chart-outline"}
              focused={focused}
              color={color}
              label="Earnings"
            />
          ),
        }}
      />

      {/* TAB 5 — More (Profile / Settings / Promotions / Delivery) */}
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "grid" : "grid-outline"}
              focused={focused}
              color={color}
              label="Settings"
            />
          ),
        }}
      />

      {/* Hidden but accessible via push */}
      <Tabs.Screen name="customers" options={{ href: null }} />
      <Tabs.Screen name="promotions" options={{ href: null }} />
      <Tabs.Screen name="delivery" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
