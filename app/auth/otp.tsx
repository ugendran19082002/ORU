import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { BackButton } from "@/components/ui/BackButton";
import { Logo } from "@/components/ui/Logo";
import { useAppNavigation } from "@/hooks/use-app-navigation";
import { useAndroidBackHandler } from "@/hooks/use-back-handler";

import { authApi } from "@/api/authApi";
import {
  roleAccent,
  roleGradients,
  Radius,
  Shadow,
  Typography,
  Spacing,
} from "@/constants/theme";
import { useAppSession } from "@/hooks/use-app-session";
import { useAppTheme } from "@/providers/ThemeContext";
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
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);
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

  // Screen fade-in
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  // Per-digit scale animations
  const digitAnims = useRef(Array.from({ length: OTP_LENGTH }, () => new Animated.Value(1))).current;

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

    if (digit) {
      // Spring animation on digit fill
      Animated.sequence([
        Animated.spring(digitAnims[index], {
          toValue: 1.08,
          useNativeDriver: true,
          speed: 50,
          bounciness: 8,
        }),
        Animated.spring(digitAnims[index], {
          toValue: 1,
          useNativeDriver: true,
          speed: 30,
          bounciness: 4,
        }),
      ]).start();

      if (index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
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

        const { user, next_step, is_new_user } = response.data;

        // New users MUST set a PIN before proceeding — spec requirement
        if (is_new_user || !user.security_pin_enabled) {
          router.replace({ pathname: '/security-setup' as any, params: { is_new_user: '1', phone } });
          return;
        }

        const destination = (() => {
          if (user.role === 'admin') return '/admin';
          if (user.role === 'delivery') return '/delivery';
          if (!user.onboarding_completed) {
            return (next_step?.screen_route || '/auth/role') as string;
          }
          if (user.role === 'shop_owner') return '/shop';
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
        text2: err?.response?.data?.message || err?.message || "Please check your OTP and try again.",
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
        text2: err?.message || "Could not resend OTP. Try again.",
      });
    }
  };

  const maskedPhone = `+91 ${phone.slice(0, 5)} ${"*".repeat(5)}`;
  const isComplete = otp.every((d) => d !== "");

  return (
    <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <SafeAreaView style={styles.safe}>
          {/* HEADER */}
          <View style={styles.header}>
            <BackButton fallback="/auth/login" iconColor={accent} />
            <View style={styles.brandRow}>
              <Logo size="sm" />
              <Text style={[styles.brandName, { color: colors.text }]}>ThanniGo</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* TITLE */}
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.text }]}>Verify OTP</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Enter the 6-digit code sent to{"\n"}
              <Text style={[styles.phoneHighlight, { color: accent }]}>
                {maskedPhone}
              </Text>
            </Text>
          </View>

          {/* OTP BOXES */}
          <View style={styles.otpRow}>
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <Animated.View
                key={i}
                style={[{ transform: [{ scale: digitAnims[i] }] }]}
              >
                <TextInput
                  ref={(ref) => {
                    inputRefs.current[i] = ref;
                  }}
                  style={[
                    styles.otpBox,
                    {
                      borderColor: otp[i]
                        ? accent
                        : colors.border,
                      backgroundColor: otp[i]
                        ? `${accent}12`
                        : colors.surface,
                      color: colors.text,
                    },
                    verified && {
                      borderColor: colors.success,
                      backgroundColor: colors.successSoft,
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
              </Animated.View>
            ))}
          </View>

          {/* SUCCESS ANIMATION */}
          {verified && (
            <Animated.View
              style={[
                styles.successBadge,
                { backgroundColor: colors.successSoft },
                { opacity: successAnim, transform: [{ scale: successAnim }] },
              ]}
            >
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={[styles.successText, { color: colors.success }]}>
                Verified! Redirecting...
              </Text>
            </Animated.View>
          )}

          {/* RESEND */}
          <View style={styles.resendRow}>
            <Text style={[styles.resendLabel, { color: colors.muted }]}>
              Didn&apos;t receive the code?
            </Text>
            {resendTimer > 0 ? (
              <Text style={[styles.resendTimer, { color: accent }]}>
                Resend in {resendTimer}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResendOtp}>
                <Text style={[styles.resendBtn, { color: accent }]}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>

          {__DEV__ && (
            <View style={[styles.hintCard, { backgroundColor: colors.border }]}>
              <Ionicons name="warning-outline" size={16} color={colors.warning} />
              <Text style={[styles.hintText, { color: colors.warning }]}>
                DEV MODE — any 6 digits accepted. Firebase auth required in production.
              </Text>
            </View>
          )}
        </SafeAreaView>

        {/* VERIFY BUTTON */}
        <View style={[styles.bottomBar, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            activeOpacity={isComplete ? 0.9 : 1}
            onPress={handleVerify}
            style={[!isComplete && { opacity: 0.4 }]}
          >
            <LinearGradient
              colors={[theme.start, theme.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.ctaBtn, { shadowColor: theme.start }]}
            >
              {loading ? (
                <Text style={styles.ctaText}>Verifying...</Text>
              ) : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={20} color="white" />
                  <Text style={styles.ctaText}>Verify &amp; Continue</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
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

  titleBlock: { marginTop: 16, marginBottom: 36 },
  title: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: { fontSize: 15, lineHeight: 22 },
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
    borderRadius: Radius.lg,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: "900",
    ...Shadow.xs,
  },

  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    borderRadius: Radius.lg,
    padding: 12,
    marginBottom: Spacing.lg,
  },
  successText: { fontWeight: "700", fontSize: 14 },

  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  resendLabel: { fontSize: 13 },
  resendTimer: { fontSize: 13, fontWeight: "700" },
  resendBtn: { fontSize: 13, fontWeight: "800", textDecorationLine: "underline" },

  hintCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: Radius.md,
    padding: 12,
  },
  hintText: { fontSize: 12, flex: 1 },

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
