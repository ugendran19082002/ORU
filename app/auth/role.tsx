import { BackButton } from "@/components/ui/BackButton";
import { useAppNavigation } from "@/hooks/use-app-navigation";
import { useAndroidBackHandler } from "@/hooks/use-back-handler";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';

import { userApi } from "@/api/userApi";
import { Logo } from "@/components/ui/Logo";
import { roleAccent } from "@/constants/theme";
import { useAppSession } from "@/hooks/use-app-session";
import type { AppRole } from "@/types/session";
import { Ionicons } from "@expo/vector-icons";

type Role = "customer" | "shop_owner";

const ROLES = [
  {
    id: "customer" as Role,
    title: "Customer",
    subtitle: "Order pure water\ndelivered to your door",
    icon: "person-outline" as const,
    accent: roleAccent.customer,
    bg: "#e0f0ff",
    gradient: ["#005d90", "#0077b6"] as [string, string],
    features: [
      "Browse nearby shops",
      "Track live delivery",
      "Pay via UPI / COD",
    ],
  },
  {
    id: "shop_owner" as Role,
    title: "Shop Owner",
    subtitle: "Manage orders &\ngrow your business",
    icon: "storefront-outline" as const,
    accent: roleAccent.shop_owner,
    bg: "#e0f7fa",
    gradient: ["#006878", "#005566"] as [string, string],
    features: [
      "Accept/reject orders",
      "Track daily earnings",
      "Inventory & analytics",
    ],
  },
];

export default function RoleSelectScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const { signIn, signOut, user } = useAppSession();
  const [selected, setSelected] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out Confirmation",
      "Are you sure you want to go back to the login screen and logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Logout",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/auth");
          },
        },
      ],
    );
  };

  useAndroidBackHandler(() => {
    handleSignOut();
  });

  const handleRoleSelect = async (selectedRole: AppRole) => {
    setLoading(true);
    try {
      // 1. Persist the role directly to the backend
      const response = await userApi.updateProfile({ role: selectedRole });

      if (response.status === 1) {
        // 2. Update local session state with fresh tokens (essential for role change)
        await signIn({
          user: response.data,
          access_token: response.data.access_token ?? null,
          refresh_token: response.data.refresh_token ?? null,
        });

        // 3. Navigation - Guard will take care of final routing,
        // but we expedite here for better UX
        if (selectedRole === "shop_owner") {
          router.replace("/onboarding/shop" as any);
        } else {
          router.replace("/onboarding/customer" as any);
        }
      }
    } catch (error: any) {
      console.error("[Role Selection] Update error:", error);
      Toast.show({
        type: 'error',
        text1: 'Selection Failed',
        text2: error.response?.data?.message || "We could not save your role choice. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = ROLES.find((r) => r.id === selected);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe}>
        {/* HEADER */}
        <View style={styles.header}>
          <BackButton variant="transparent" fallback="/auth" onPress={handleSignOut} />
          <View style={styles.brandRow}>
            <Logo size="sm" />
            <Text style={styles.brandName}>ThanniGo</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Who are you?</Text>
          <Text style={styles.subtitle}>Choose your role to continue</Text>
        </View>

        {/* ROLE CARDS */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.roleList}
        >
          {ROLES.map((role) => {
            const isSelected = selected === role.id;
            return (
              <TouchableOpacity
                key={role.id}
                activeOpacity={0.88}
                style={[
                  styles.roleCard,
                  isSelected && { borderColor: role.accent, borderWidth: 2.5 },
                ]}
                onPress={() => setSelected(role.id)}
              >
                {/* Radio */}
                <View
                  style={[
                    styles.radioOuter,
                    isSelected && { borderColor: role.accent },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        styles.radioInner,
                        { backgroundColor: role.accent },
                      ]}
                    />
                  )}
                </View>

                <View
                  style={[styles.roleIconWrap, { backgroundColor: role.bg }]}
                >
                  <Ionicons name={role.icon} size={26} color={role.accent} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.roleTitle,
                      isSelected && { color: role.accent },
                    ]}
                  >
                    {role.title}
                  </Text>
                  <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
                  {isSelected && (
                    <View style={styles.featureList}>
                      {role.features.map((f) => (
                        <View key={f} style={styles.featureRow}>
                          <Ionicons
                            name="checkmark-circle"
                            size={13}
                            color={role.accent}
                          />
                          <Text
                            style={[styles.featureText, { color: role.accent }]}
                          >
                            {f}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* CTA */}
        <TouchableOpacity
          activeOpacity={selected ? 0.9 : 1}
          onPress={() => selected && handleRoleSelect(selected as any)}
          style={[styles.ctaWrap, !selected && { opacity: 0.4 }]}
        >
          <LinearGradient
            colors={selectedRole?.gradient ?? ["#005d90", "#0077b6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBtn}
          >
            <Text style={styles.ctaText}>
              Continue as {selectedRole?.title ?? "—"}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        {/* REGISTRATION FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Logged in as {user?.phone}</Text>
          <TouchableOpacity onPress={handleSignOut}>
            <Text style={styles.footerLink}>Not you? Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9ff" },
  safe: { flex: 1, paddingHorizontal: 24 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#ebeef4",
    alignItems: "center",
    justifyContent: "center",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandName: {
    fontSize: 20,
    fontWeight: "900",
    color: "#003a5c",
    letterSpacing: -0.5,
  },

  titleBlock: { marginTop: 8, marginBottom: 16 },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#181c20",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: { fontSize: 15, color: "#707881", fontWeight: "500" },

  roleList: { gap: 12, paddingBottom: 8 },
  roleCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    borderWidth: 1.5,
    borderColor: "#ebeef4",
    shadowColor: "#003a5c",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#bfc7d1",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  roleIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#181c20",
    marginBottom: 3,
  },
  roleSubtitle: { fontSize: 12, color: "#707881", lineHeight: 17 },
  featureList: { marginTop: 10, gap: 5 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  featureText: { fontSize: 12, fontWeight: "600" },

  ctaWrap: { paddingTop: 16, paddingBottom: 8 },
  ctaBtn: {
    borderRadius: 20,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#005d90",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  ctaText: { color: "white", fontSize: 17, fontWeight: "900" },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingBottom: 32,
    marginTop: 10,
  },
  footerText: { fontSize: 13, color: "#707881", fontWeight: "500" },
  footerLink: {
    fontSize: 13,
    color: "#005d90",
    fontWeight: "800",
    textDecorationLine: "underline",
  },
});

