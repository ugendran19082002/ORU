import React from "react";
import { Text, View } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

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

export default function ShopTabsLayout() {
  return (
    <Tabs
      initialRouteName="index"
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
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
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
        name="inventory"
        options={{
          tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
            <TabIcon
              name={focused ? "cube" : "cube-outline"}
              focused={focused}
              color={color}
              label="Stock"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
            <TabIcon
              name={focused ? "bar-chart" : "bar-chart-outline"}
              focused={focused}
              color={color}
              label="Earnings"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
            <TabIcon
              name={focused ? "grid" : "grid-outline"}
              focused={focused}
              color={color}
              label="Settings"
            />
          ),
        }}
      />
    </Tabs>
  );
}
