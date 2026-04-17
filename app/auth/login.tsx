import { Logo } from "@/components/ui/Logo";
import { BackButton } from "@/components/ui/BackButton";
import { useAppNavigation } from "@/hooks/use-app-navigation";
import { useAndroidBackHandler } from "@/hooks/use-back-handler";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect, useRef } from "react";
import * as LocalAuthentication from 'expo-local-authentication';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
  Animated,
} from "react-native";
import Toast from 'react-native-toast-message';
import { SafeAreaView } from "react-native-safe-area-context";
import {
  roleAccent,
  roleGradients,
  thannigoPalette,
  Radius,
  Shadow,
  Typography,
  Spacing,
} from '@/constants/theme';
import { useAppTheme } from '@/providers/ThemeContext';

const NEUTRAL_ACCENT = thannigoPalette.primary;
import { useAppSession } from '@/hooks/use-app-session';
import { authApi } from '@/api/authApi';
import type { AppRole } from '@/types/session';
import { getOriginalDeviceId } from '@/utils/device';
import { useSecurityStore } from "@/stores/securityStore";

const ROLE_LABELS: Record<string, string> = {
  customer: "Customer",
  shop_owner: "Shop Owner",
  admin: "Admin",
  delivery: "Delivery Agent",
  staff: "Shop Staff",
};

export default function LoginScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const { preferredRole, user, setPreferredRole } = useAppSession();
  const { isBiometricsEnabled: biometricEnabled } = useSecurityStore();
  const { colors, isDark } = useAppTheme();

  // Screen fade-in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  useAndroidBackHandler(() => {
    safeBack("/auth");
  });

  const searchParams = useLocalSearchParams<{ role: AppRole }>();
  const [role, setRole] = useState<AppRole | null>(searchParams.role || preferredRole || null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  const displayRole = role || 'customer';
  const theme = roleGradients[displayRole] || roleGradients.customer;
  const accent = roleAccent[displayRole] || NEUTRAL_ACCENT;
  const roleLabel = displayRole ? ROLE_LABELS[displayRole] : "Guest";

  // Check for Biometric Auto-Login
  useEffect(() => {
    const checkBiometrics = async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (biometricEnabled && user?.role === role && hasHardware) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Login with Biometrics',
          fallbackLabel: 'Use PIN',
        });
        if (result.success) {
          if (role === 'shop_owner') router.replace('/shop' as any);
          else if (role === 'admin') router.replace('/admin' as any);
          else if (role === 'delivery') router.replace('/delivery' as any);
          else router.replace('/(tabs)' as any);
        }
      }
    };
    checkBiometrics();
  }, [biometricEnabled, role, router, user?.role]);

  const handleSendOTP = async () => {
    if (phone.length < 10) return;
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setLoading(true);

    try {
      const deviceId = await getOriginalDeviceId();
      const response = await authApi.sendOtp(`+91${phone}`, deviceId);
      if (response.status === 1) {
        router.push({ pathname: "/auth/otp", params: { phone, role: role || "" } });
      } else {
        throw new Error(response.message || "Failed to send OTP");
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: err?.response?.data?.message || err?.message || "Failed to send OTP. Please try again.",
      });
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <StatusBar style={isDark ? "light" : "dark"} />
          <SafeAreaView style={styles.safe}>
            {/* HEADER */}
            <View style={styles.header}>
              <BackButton fallback="/auth" iconColor={accent} />
              <View style={styles.brandRow}>
                <Logo size="sm" />
                <Text style={[styles.brandName, { color: colors.text }]}>ThanniGo</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>

            {/* ROLE BADGE */}
            {role && (
              <View style={[styles.roleBadge, { backgroundColor: `${accent}18` }]}>
                <Ionicons name="person-circle-outline" size={15} color={accent} />
                <Text style={[styles.roleBadgeText, { color: accent }]}>
                  Signing in as {roleLabel}
                </Text>
              </View>
            )}

            {/* TITLE */}
            <View style={styles.titleBlock}>
              <Text style={[styles.title, { color: colors.text }]}>
                Enter your{"\n"}phone number
              </Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                We&apos;ll send a 6-digit OTP to verify your identity
              </Text>
            </View>

            {/* PHONE INPUT */}
            <View
              style={[
                styles.inputCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: phone.length === 10 ? accent : colors.border,
                },
                Shadow.md,
              ]}
            >
              <View style={styles.countryCode}>
                <Text style={styles.flag}>🇮🇳</Text>
                <Text style={[styles.dialCode, { color: colors.text }]}>+91</Text>
                <Ionicons name="chevron-down" size={13} color={colors.muted} />
              </View>
              <View style={[styles.inputDivider, { backgroundColor: colors.border }]} />
              <TextInput
                style={[styles.phoneInput, { color: colors.text }]}
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/\D/g, "").slice(0, 10))}
                placeholder="98765 43210"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                maxLength={10}
                autoFocus
              />
              {phone.length === 10 && (
                <Ionicons name="checkmark-circle" size={20} color={thannigoPalette.success} />
              )}
            </View>

            {/* TERMS */}
            <Text style={[styles.terms, { color: colors.muted }]}>
              By continuing you agree to ThanniGo&apos;s{" "}
              <Text
                style={[styles.termsLink, { color: accent }]}
                onPress={() => router.push('/terms' as any)}
              >
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text
                style={[styles.termsLink, { color: accent }]}
                onPress={() => router.push('/privacy-policy' as any)}
              >
                Privacy Policy
              </Text>
            </Text>

            <TouchableOpacity
              style={{ alignSelf: 'center', marginBottom: Spacing.lg }}
              onPress={() => Linking.openURL('whatsapp://send?phone=919876543210&text=Help with Login')}
            >
              <Text style={{ fontSize: 13, color: accent, fontWeight: '600', textDecorationLine: 'underline' }}>
                Facing issues? Chat with Support
              </Text>
            </TouchableOpacity>

            {/* DIVIDER */}
            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.muted }]}>or continue with</Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </View>

            {/* SOCIAL */}
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={[styles.socialBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Ionicons name="logo-google" size={20} color="#ea4335" />
                <Text style={[styles.socialBtnText, { color: colors.text }]}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Ionicons name="logo-apple" size={20} color={isDark ? '#fff' : '#181c20'} />
                <Text style={[styles.socialBtnText, { color: colors.text }]}>Apple</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* SEND OTP BUTTON */}
          <View style={[styles.bottomBar, { backgroundColor: colors.background }]}>
            <TouchableOpacity
              activeOpacity={phone.length === 10 && !loading ? 0.9 : 1}
              onPress={handleSendOTP}
              disabled={loading}
              style={[(phone.length < 10 || loading) && { opacity: 0.4 }]}
            >
              <LinearGradient
                colors={[theme.start, theme.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.ctaBtn, { shadowColor: theme.start }]}
              >
                {loading ? (
                  <Text style={styles.ctaText}>Sending OTP...</Text>
                ) : (
                  <>
                    <Text style={styles.ctaText}>Send OTP</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: Spacing.xl },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandName: {
    ...Typography.h4,
    letterSpacing: -0.5,
  },

  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
    marginBottom: 24,
  },
  roleBadgeText: { fontSize: 12, fontWeight: "700" },

  titleBlock: { marginBottom: 28 },
  title: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.5,
    lineHeight: 42,
    marginBottom: 10,
  },
  subtitle: { fontSize: 14, lineHeight: 20 },

  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.xl,
    paddingHorizontal: 16,
    height: 64,
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
  },
  countryCode: { flexDirection: "row", alignItems: "center", gap: 4 },
  flag: { fontSize: 20 },
  dialCode: { fontSize: 15, fontWeight: "700" },
  inputDivider: {
    width: 1,
    height: 28,
    marginHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 1,
  },

  terms: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  termsLink: { fontWeight: "700" },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: Spacing.md,
  },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: "500" },

  socialRow: { flexDirection: "row", gap: 12 },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: Radius.xl,
    paddingVertical: 14,
    borderWidth: 1.5,
    ...Shadow.xs,
  },
  socialBtnText: { fontSize: 14, fontWeight: "700" },

  bottomBar: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 32,
    paddingTop: Spacing.md,
  },
  ctaBtn: {
    borderRadius: Radius.xl,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  ctaText: { color: "white", fontSize: 17, fontWeight: "900" },
});
