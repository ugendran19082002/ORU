import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { roleAccent, roleSurface, thannigoPalette } from "@/constants/theme";

const CUSTOMER_ACCENT = roleAccent.customer;
const CUSTOMER_SURF = roleSurface.customer;
const TAB_INACTIVE = thannigoPalette.neutral;

// Custom tab bar icon with active pill style
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
        paddingHorizontal: focused ? 20 : 0,
        paddingVertical: 10,
        borderRadius: 22,
        backgroundColor: focused ? CUSTOMER_SURF : "transparent",
        minWidth: 80, // Increased for more prominent pill
        minHeight: 45,
      }}
    >
      <Ionicons name={name} size={22} color={focused ? CUSTOMER_ACCENT : TAB_INACTIVE} />
      <Text
        style={{
          fontSize: 10,
          fontWeight: "700",
          color: focused ? CUSTOMER_ACCENT : TAB_INACTIVE,
          marginTop: 2,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: thannigoPalette.surface,
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
        tabBarActiveTintColor: CUSTOMER_ACCENT,
        tabBarInactiveTintColor: TAB_INACTIVE,
        tabBarItemStyle: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          height: 72,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "water" : "water-outline"}
              focused={focused}
              color={color}
              label="Home"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "search" : "search-outline"}
              focused={focused}
              color={color}
              label="Search"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
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
        name="profile"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "person" : "person-outline"}
              focused={focused}
              color={color}
              label="Profile"
            />
          ),
        }}
      />
    </Tabs>
  );
}
