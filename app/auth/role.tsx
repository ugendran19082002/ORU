import { BackButton } from "@/components/ui/BackButton";
import { useAppNavigation } from "@/hooks/use-app-navigation";
import { useAndroidBackHandler } from "@/hooks/use-back-handler";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState, useRef } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';

import { userApi } from "@/api/userApi";
import { Logo } from "@/components/ui/Logo";
import { roleAccent, roleGradients, roleSurface } from "@/constants/theme";
import { useAppSession } from "@/hooks/use-app-session";
import { useAppTheme } from "@/providers/ThemeContext";
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
    bg: roleSurface.customer,
    gradient: [roleGradients.customer.start, roleGradients.customer.end] as [string, string],
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
    bg: roleSurface.shop_owner,
    gradient: [roleGradients.shop_owner.start, roleGradients.shop_owner.end] as [string, string],
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
  const { colors, isDark } = useAppTheme();
  const [selected, setSelected] = useState<Role | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [referralY, setReferralY] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

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
      const response = await userApi.updateProfile({ 
        role: selectedRole,
        referral_code: referralCode || undefined
      } as any);

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safe}>
        {/* HEADER */}
        <View style={styles.header}>
          <BackButton variant="transparent" fallback="/auth" onPress={handleSignOut} />
          <View style={styles.brandRow}>
            <Logo size="sm" />
            <Text style={[styles.brandName, { color: colors.text }]}>ThanniGo</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.text }]}>Who are you?</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Choose your role to continue</Text>
        </View>

        {/* ROLE CARDS */}
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.roleList}
        >
          <View style={styles.roleList}>
            {ROLES.map((role) => {
              const isSelected = selected === role.id;
              return (
                <TouchableOpacity
                  key={role.id}
                  activeOpacity={0.88}
                  style={[
                    styles.roleCard,
                    { backgroundColor: colors.surface, borderColor: isSelected ? role.accent : colors.border },
                    isSelected && { borderWidth: 2.5 },
                  ]}
                  onPress={() => setSelected(role.id)}
                >
                  {/* Radio */}
                  <View
                    style={[
                      styles.radioOuter,
                      { borderColor: isSelected ? role.accent : colors.border },
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
                        { color: isSelected ? role.accent : colors.text },
                      ]}
                    >
                      {role.title}
                    </Text>
                    <Text style={[styles.roleSubtitle, { color: colors.muted }]}>{role.subtitle}</Text>
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
          </View>

          {/* REFERRAL CODE */}
          <View
            style={styles.referralSection}
            onLayout={(e) => setReferralY(e.nativeEvent.layout.y)}
          >
            <View style={[styles.referralInputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons
                name="gift-outline"
                size={18}
                color={selectedRole?.accent || colors.muted}
                style={styles.referralIcon}
              />
              <TextInput
                style={[styles.referralInput, { color: colors.text }]}
                placeholder="Referral Code? (Optional)"
                placeholderTextColor={colors.placeholder}
                value={referralCode}
                onChangeText={setReferralCode}
                autoCapitalize="characters"
                autoCorrect={false}
                onFocus={() => {
                  setTimeout(() => {
                      scrollRef.current?.scrollTo({ y: referralY - 10, animated: true });
                  }, 100);
                }}
              />
            </View>
          </View>
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
          <Text style={[styles.footerText, { color: colors.muted }]}>Logged in as {user?.phone}</Text>
          <TouchableOpacity onPress={handleSignOut}>
            <Text style={styles.footerLink}>Not you? Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  brandName: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },

  titleBlock: { marginTop: 8, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: "900", letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 15, fontWeight: "500" },

  roleList: { gap: 12, paddingBottom: 8 },
  roleCard: {
    borderRadius: 24, padding: 16,
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    borderWidth: 1.5,
    shadowColor: "#003a5c", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 3 },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  roleIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  roleTitle: { fontSize: 18, fontWeight: "900", marginBottom: 3 },
  roleSubtitle: { fontSize: 12, lineHeight: 17 },
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
  footerText: { fontSize: 13, fontWeight: "500" },
  footerLink: {
    fontSize: 13,
    color: "#005d90",
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  
  // REFERRAL STYLES
  referralSection: {
    paddingVertical: 12,
  },
  referralInputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16, height: 54 },
  referralIcon: {
    marginRight: 10,
  },
  referralInput: {
    flex: 1,
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
    fontFamily: "System",
  },
});



