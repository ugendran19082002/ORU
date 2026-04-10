import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

// Custom tab bar icon with active pill style (Unified theme)
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
        paddingHorizontal: focused ? 12 : 0,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: focused ? "#e0f4f4" : "transparent",
        minWidth: 80, // Increased for more prominent pill
        minHeight: 45,
      }}
    >
      <Ionicons name={name} size={22} color={focused ? "#006878" : "#94a3b8"} />
      <Text
        style={{
          fontSize: 9, // Slightly smaller for 5-tab layout
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
        tabBarActiveTintColor: "#006878", // Shop accent color
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
      {/* Hide the old dashboard file from tabs / Redirect */}
      <Tabs.Screen name="dashboard" options={{ href: null }} />
      <Tabs.Screen name="inventory" options={{ href: null }} />

      {/* Hide tab bar for specific order success screen */}
      <Tabs.Screen
        name="order/[id]"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />

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
      <Tabs.Screen
        name="customers"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "people" : "people-outline"}
              focused={focused}
              color={color}
              label="Customers"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "wallet" : "wallet-outline"}
              focused={focused}
              color={color}
              label="Earnings"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "storefront" : "storefront-outline"}
              focused={focused}
              color={color}
              label="Profile"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "cog" : "cog-outline"}
              focused={focused}
              color={color}
              label="Settings"
            />
          ),
        }}
      />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="promotions" options={{ href: null }} />
      <Tabs.Screen name="delivery" options={{ href: null }} />
    </Tabs>
  );
}
