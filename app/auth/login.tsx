import { Logo } from "@/components/ui/Logo";
import { BackButton } from "@/components/ui/BackButton";
import { useAppNavigation } from "@/hooks/use-app-navigation";
import { useAndroidBackHandler } from "@/hooks/use-back-handler";


import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect } from "react";
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
} from "react-native";
import Toast from 'react-native-toast-message';
import { SafeAreaView } from "react-native-safe-area-context";
import { roleAccent, roleGradients } from '@/constants/theme';
import { useAppSession } from '@/hooks/use-app-session';
import { authApi } from '@/api/authApi';
import type { AppRole } from '@/types/session';
import { getOriginalDeviceId } from '@/utils/device';

const ROLE_LABELS: Record<string, string> = {
  customer: "Customer",
  shop: "Shop Owner",
  admin: "Admin",
};

export default function LoginScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const { preferredRole, biometricEnabled, user, setPreferredRole } = useAppSession();

  useAndroidBackHandler(() => {
    safeBack("/auth");
  });


  // 🔥 FIREBASE MOCKS: Temporarily suppress TS Errors before AuthContext is built

  const searchParams = useLocalSearchParams<{ role: AppRole }>();
  const [role, setRole] = useState<AppRole | null>(searchParams.role || preferredRole || null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // If no role, safe default for styles
  const displayRole = role || 'customer';
  const theme = roleGradients[displayRole] || roleGradients.customer;
  const accent = roleAccent[displayRole] || roleAccent.customer;
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
          // Success! Redirect to app
          if (role === 'shop_owner') router.replace('/shop' as any);
          else if (role === 'admin') router.replace('/admin' as any);
          else router.replace('/(tabs)' as any);
        }
      }
    };
    checkBiometrics();
  }, [biometricEnabled, role, router, user?.role]);

  // Remove auto-setting preferred role from URL params at this stage
  // as the backend should dictate the role or lead to role selection.

  const handleSendOTP = async () => {
    if (phone.length < 10) return;
    setLoading(true);

    try {
      const deviceId = await getOriginalDeviceId();
      const response = await authApi.sendOtp(`+91${phone}`, deviceId);
      
      if (response.status === 1) {
        setLoading(false);
        router.push({ pathname: "/auth/otp", params: { phone, role: role || "" } });
      } else {
        throw new Error(response.message || "Failed to send OTP");
      }
    } catch (err: any) {
      setLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: err?.response?.data?.message || err?.message || "Failed to send OTP. Please try again."
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.safe}>
          {/* HEADER */}
          <View style={styles.header}>
            <BackButton fallback="/auth" iconColor="#005d90" />
            <View style={styles.brandRow}>
              <Logo size="sm" />
              <Text style={styles.brandName}>ThanniGo</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* ROLE BADGE (Only show if role was explicitly provided) */}
          {role && (
            <View style={[styles.roleBadge, { backgroundColor: `${accent}15` }]}>
              <Ionicons name="person-circle-outline" size={16} color={accent} />
              <Text style={[styles.roleBadgeText, { color: accent }]}>
                Signing in as {roleLabel}
              </Text>
            </View>
          )}

          {/* TITLE */}
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Enter your{"\n"}phone number</Text>
            <Text style={styles.subtitle}>
              We&apos;ll send a 6-digit OTP to verify your identity
            </Text>
          </View>

          {/* PHONE INPUT */}
          <View style={styles.inputCard}>
            <View style={styles.countryCode}>
              <Text style={styles.flag}>🇮🇳</Text>
              <Text style={styles.dialCode}>+91</Text>
              <Ionicons name="chevron-down" size={14} color="#707881" />
            </View>
            <View style={styles.inputDivider} />
            <TextInput
              style={styles.phoneInput}
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, "").slice(0, 10))}
              placeholder="98765 43210"
              placeholderTextColor="#bfc7d1"
              keyboardType="phone-pad"
              maxLength={10}
              autoFocus
            />
            {phone.length === 10 && (
              <Ionicons name="checkmark-circle" size={20} color="#006878" />
            )}
          </View>

          {/* TERMS */}
          <Text style={styles.terms}>
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
            style={{ alignSelf: 'center', marginBottom: 20 }}
            onPress={() => Linking.openURL('whatsapp://send?phone=919876543210&text=Help with Login')}
          >
            <Text style={{ fontSize: 13, color: '#005d90', fontWeight: '600', textDecorationLine: 'underline' }}>
              Facing issues? Chat with Support
            </Text>
          </TouchableOpacity>

          {/* QUICK LOGIN OPTIONS */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn}>
              <Ionicons name="logo-google" size={20} color="#ea4335" />
              <Text style={styles.socialBtnText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Ionicons name="logo-apple" size={20} color="#181c20" />
              <Text style={styles.socialBtnText}>Apple</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* SEND OTP BUTTON (pinned to bottom) */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            activeOpacity={phone.length === 10 ? 0.9 : 1}
            onPress={handleSendOTP}
            style={[styles.ctaWrap, phone.length < 10 && { opacity: 0.4 }]}
          >
            <LinearGradient
              colors={[theme.start, theme.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaBtn}
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
    </KeyboardAvoidingView>
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

  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
    marginBottom: 24,
  },
  roleBadgeText: { fontSize: 13, fontWeight: "700" },

  titleBlock: { marginBottom: 28 },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#181c20",
    letterSpacing: -0.5,
    lineHeight: 40,
    marginBottom: 10,
  },
  subtitle: { fontSize: 14, color: "#707881", lineHeight: 20 },

  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 64,
    shadowColor: "#003a5c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "#e0e2e8",
  },
  countryCode: { flexDirection: "row", alignItems: "center", gap: 4 },
  flag: { fontSize: 20 },
  dialCode: { fontSize: 15, fontWeight: "700", color: "#181c20" },
  inputDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#e0e2e8",
    marginHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#181c20",
    letterSpacing: 1,
  },

  terms: {
    fontSize: 12,
    color: "#707881",
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 24,
  },
  termsLink: { fontWeight: "700" },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  divider: { flex: 1, height: 1, backgroundColor: "#e0e2e8" },
  dividerText: { fontSize: 12, color: "#707881", fontWeight: "500" },

  socialRow: { flexDirection: "row", gap: 12 },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: "#e0e2e8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  socialBtnText: { fontSize: 14, fontWeight: "700", color: "#181c20" },

  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: "#f7f9ff",
  },
  ctaWrap: {},
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
});
