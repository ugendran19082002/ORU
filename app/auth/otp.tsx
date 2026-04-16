import { BackButton } from "@/components/ui/BackButton";
import { Logo } from "@/components/ui/Logo";
import { useAppNavigation } from "@/hooks/use-app-navigation";
import { useAndroidBackHandler } from "@/hooks/use-back-handler";

import { authApi } from "@/api/authApi";
import { roleAccent, roleGradients } from "@/constants/theme";
import { useAppSession } from "@/hooks/use-app-session";
import type { AppRole, AppUser } from "@/types/session";
import { getOriginalDeviceId } from "@/utils/device";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import Toast from 'react-native-toast-message';
import { SafeAreaView } from "react-native-safe-area-context";

const OTP_LENGTH = 6;

export default function OTPScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const { signIn, setPreferredRole } = useAppSession();

  useAndroidBackHandler(() => {
    safeBack("/auth/login");
  });

  // 🔥 FIREBASE MOCKS: Temporarily suppress TS Errors before AuthContext is built
  const auth = () => ({ signInWithPhoneNumber: async (p: string) => ({}) });
  const globalStore = { setConfirmation: (c: any) => {} };
  const confirm: any = null;

  const { phone = "9876543210", role = "customer" } = useLocalSearchParams<{
    phone: string;
    role: AppRole;
  }>();
  const theme = roleGradients[role] ?? roleGradients.customer;
  const accent = roleAccent[role] ?? roleAccent.customer;

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const successAnim = useRef(new Animated.Value(0)).current;

  // Countdown resend timer
  useEffect(() => {
    const interval = setInterval(() => {
      setResendTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (val: string, index: number) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH || loading || verified) return;
    setLoading(true);

    try {
      const deviceId = await getOriginalDeviceId();
      const response = await authApi.verifyOtp(`+91${phone}`, code, deviceId);

      if (response.status === 1) {
        setVerified(true);

        // 1. Persist tokens and user into global session
        await signIn({
          user: response.data.user as AppUser,
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
          nextStep: response.data.next_step,
        });

        Animated.spring(successAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
        }).start();

        // 2. Navigate — single path via next_step or role root.
        // RouteGuard handles stack correction after hydration; we do one explicit
        // push here so the user doesn't stay on the OTP screen while waiting.
        const { user, next_step, is_new_user } = response.data;
        const destination = (() => {
          if (is_new_user || !user.onboarding_completed) {
            return (next_step?.screen_route || '/auth/role') as string;
          }
          if (user.role === 'admin') return '/admin';
          if (user.role === 'shop_owner') return '/shop';
          if (user.role === 'delivery') return '/delivery';
          return '/(tabs)';
        })();
        router.replace(destination as any);
      } else {
        throw new Error(response.message || "Verification failed");
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: err?.response?.data?.message || err?.message || "Please check your OTP and try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const deviceId = await getOriginalDeviceId();
      const response = await authApi.sendOtp(`+91${phone}`, deviceId);
      if (response.status === 1) {
        setResendTimer(30);
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err?.message || "Could not resend OTP. Try again."
      });
    }
  };

  const maskedPhone = `+91 ${phone.slice(0, 5)} ${"*".repeat(5)}`;
  const isComplete = otp.every((d) => d !== "");

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe}>
        {/* HEADER */}
        <View style={styles.header}>
          <BackButton fallback="/auth/login" iconColor="#005d90" />
          <View style={styles.brandRow}>
            <Logo size="sm" />
            <Text style={styles.brandName}>ThanniGo</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* TITLE */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{"\n"}
            <Text style={[styles.phoneHighlight, { color: accent }]}>
              {maskedPhone}
            </Text>
          </Text>
        </View>

        {/* OTP BOXES */}
        <View style={styles.otpRow}>
          {Array.from({ length: OTP_LENGTH }).map((_, i) => (
            <TextInput
              key={i}
              ref={(ref) => {
                inputRefs.current[i] = ref;
              }}
              style={[
                styles.otpBox,
                otp[i] && {
                  borderColor: accent,
                  backgroundColor: "#e0f7fa",
                  elevation: 0,
                },
                verified && {
                  borderColor: "#006878",
                  backgroundColor: "#e0f7fa",
                  elevation: 0,
                },
              ]}
              value={otp[i]}
              onChangeText={(v) => handleOtpChange(v, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        {/* SUCCESS ANIMATION */}
        {verified && (
          <Animated.View
            style={[
              styles.successBadge,
              { opacity: successAnim, transform: [{ scale: successAnim }] },
            ]}
          >
            <Ionicons name="checkmark-circle" size={22} color="#006878" />
            <Text style={styles.successText}>Verified! Redirecting...</Text>
          </Animated.View>
        )}

        {/* RESEND */}
        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn&apos;t receive the code?</Text>
          {resendTimer > 0 ? (
            <Text style={styles.resendTimer}>Resend in {resendTimer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResendOtp}>
              <Text style={[styles.resendBtn, { color: accent }]}>
                Resend OTP
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {__DEV__ && (
          <View style={styles.hintCard}>
            <Ionicons name="warning-outline" size={16} color="#e07b00" />
            <Text style={[styles.hintText, { color: "#e07b00" }]}>
              DEV MODE — any 6 digits accepted. Firebase auth required in
              production.
            </Text>
          </View>
        )}
      </SafeAreaView>

      {/* VERIFY BUTTON */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={isComplete ? 0.9 : 1}
          onPress={handleVerify}
          style={[!isComplete && { opacity: 0.4 }]}
        >
          <LinearGradient
            colors={[theme.start, theme.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.ctaBtn,
              !isComplete && { elevation: 0, shadowOpacity: 0 },
            ]}
          >
            {loading ? (
              <Text style={styles.ctaText}>Verifying...</Text>
            ) : (
              <>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color="white"
                />
                <Text style={styles.ctaText}>Verify & Continue</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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

  titleBlock: { marginTop: 16, marginBottom: 36 },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#181c20",
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: { fontSize: 15, color: "#707881", lineHeight: 22 },
  phoneHighlight: { fontWeight: "800" },

  otpRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginBottom: 28,
  },
  otpBox: {
    width: 48,
    height: 60,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e0e2e8",
    backgroundColor: "white",
    fontSize: 24,
    fontWeight: "900",
    color: "#181c20",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    backgroundColor: "#e0f7fa",
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  successText: { color: "#006878", fontWeight: "700", fontSize: 14 },

  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    marginBottom: 24,
  },
  resendLabel: { fontSize: 13, color: "#707881" },
  resendTimer: { fontSize: 13, color: "#005d90", fontWeight: "700" },
  resendBtn: {
    fontSize: 13,
    fontWeight: "800",
    textDecorationLine: "underline",
  },

  referralSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  referralInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e0e2e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  referralIcon: { marginRight: 12 },
  referralInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#181c20',
  },

  hintCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ebeef4",
    borderRadius: 14,
    padding: 12,
  },
  hintText: { fontSize: 12, color: "#707881", flex: 1 },

  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: "#f7f9ff",
  },
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


