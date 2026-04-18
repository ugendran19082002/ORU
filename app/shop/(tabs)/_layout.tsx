import React from "react";
import { Text, View } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { roleAccent, roleSurface } from "@/constants/theme";
import { useAppTheme } from "@/providers/ThemeContext";

const SHOP_ACCENT = roleAccent.shop_owner;
const SHOP_SURF = roleSurface.shop_owner;

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
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: focused ? 10 : 0,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: focused ? SHOP_SURF : "transparent",
        minWidth: 64,
        minHeight: 45,
      }}
    >
      <Ionicons name={name} size={22} color={focused ? SHOP_ACCENT : colors.muted} />
      <Text
        style={{
          fontSize: 9,
          fontWeight: "700",
          color: focused ? SHOP_ACCENT : colors.muted,
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
  const { colors } = useAppTheme();
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
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
        tabBarActiveTintColor: SHOP_ACCENT,
        tabBarInactiveTintColor: colors.muted,
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
            <TabIcon name={focused ? "receipt" : "receipt-outline"} focused={focused} color={color} label="Orders" />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
            <TabIcon name={focused ? "cube" : "cube-outline"} focused={focused} color={color} label="Stock" />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
            <TabIcon name={focused ? "bar-chart" : "bar-chart-outline"} focused={focused} color={color} label="Earnings" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
            <TabIcon name={focused ? "grid" : "grid-outline"} focused={focused} color={color} label="Settings" />
          ),
        }}
      />
    </Tabs>
  );
}
