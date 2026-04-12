import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as LocalAuthentication from "expo-local-authentication";
import * as Location from "expo-location";
import { usePathname, useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";

import { onboardingApi } from "@/api/onboardingApi";
import type {
  AppRole,
  AppUser,
  PersistedSession,
  SessionStatus,
} from "@/types/session";

const SESSION_KEY = "thannigo_session";

type SessionContextValue = {
  status: SessionStatus;
  isHydrated: boolean;
  user: AppUser | null;
  access_token: string | null;
  refresh_token: string | null;
  preferredRole: AppRole | null;
  biometricEnabled: boolean;
  isBiometricVerified: boolean;
  setIsBiometricVerified: (verified: boolean) => void;
  setPreferredRole: (role: AppRole | null) => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  signIn: (data: {
    user: AppUser;
    access_token: string | null;
    refresh_token: string | null;
    nextStep?: any;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<AppUser>) => Promise<void>;
  refreshShopStatus: () => Promise<void>;
  nextStep: any;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const defaultSession: PersistedSession = {
  user: null,
  access_token: null,
  refresh_token: null,
  preferredRole: null,
  biometricEnabled: false,
};

async function readSession() {
  const raw =
    Platform.OS === "web"
      ? await AsyncStorage.getItem(SESSION_KEY)
      : await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return defaultSession;

  try {
    return { ...defaultSession, ...JSON.parse(raw) } as PersistedSession;
  } catch {
    return defaultSession;
  }
}

async function writeSession(value: PersistedSession) {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(value));
  } else {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(value));
  }
}

export function AppSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [isHydrated, setIsHydrated] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [preferredRole, setPreferredRoleState] = useState<AppRole | null>(null);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [isBiometricVerified, setIsBiometricVerified] = useState(false);
  const [nextStep, setNextStepState] = useState<any>(null);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      const session = await readSession();
      if (!active) return;

      setUser(session.user);
      setAccessToken(session.access_token);
      setRefreshToken(session.refresh_token);
      setPreferredRoleState(session.preferredRole);
      setBiometricEnabledState(session.biometricEnabled);
      setNextStepState(session.nextStep);
      setStatus(session.access_token ? "authenticated" : "anonymous");
      setIsHydrated(true);
    }

    hydrate();
    return () => {
      active = false;
    };
  }, []);

  // MERCHANT STATUS POLLING / REFRESH
  const refreshShopStatus = async () => {
    if (!user || user.role !== "shop_owner") return;
    try {
      const res = await onboardingApi.getMerchantShop();
      if (res.data) {
        const nextUser = {
          ...user,
          shopStatus: res.data.status,
          adminNotes: res.data.admin_notes,
        };
        setUser(nextUser);
      }
    } catch (err) {
      console.error("[Session] Refresh Shop Status Error:", err);
    }
  };

  // Auto-refresh for merchants in Waitlist
  useEffect(() => {
    if (
      status === "authenticated" &&
      user?.role === "shop_owner" &&
      user?.shopStatus !== "active"
    ) {
      const interval = setInterval(refreshShopStatus, 15000); // 15s global poll
      return () => clearInterval(interval);
    }
  }, [user?.role, user?.shopStatus, status]);

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      isHydrated,
      user,
      access_token: accessToken,
      refresh_token: refreshToken,
      preferredRole,
      biometricEnabled,
      async setPreferredRole(role) {
        const next = {
          user,
          access_token: accessToken,
          refresh_token: refreshToken,
          preferredRole: role,
          biometricEnabled,
        };
        setPreferredRoleState(role);
        await writeSession(next);
      },
      async setBiometricEnabled(enabled) {
        const next = {
          user,
          access_token: accessToken,
          refresh_token: refreshToken,
          preferredRole,
          biometricEnabled: enabled,
        };
        setBiometricEnabledState(enabled);
        await writeSession(next);
      },
      async signIn({
        user,
        access_token,
        refresh_token,
        nextStep: resNextStep,
      }) {
        const nextUser = user;
        const nextAccessToken = access_token || accessToken;
        const nextRefreshToken = refresh_token || refreshToken;

        setUser(nextUser);
        setAccessToken(nextAccessToken);
        setRefreshToken(nextRefreshToken);
        setNextStepState(resNextStep || null);
        setPreferredRoleState(nextUser.role as AppRole);
        setStatus(nextAccessToken ? "authenticated" : "anonymous");

        await writeSession({
          user: nextUser,
          access_token: nextAccessToken,
          refresh_token: nextRefreshToken,
          preferredRole: nextUser.role as AppRole,
          biometricEnabled,
          nextStep: resNextStep || null,
        });

        // Trigger immediate status check for merchants
        if (nextUser.role === "shop_owner") {
          try {
            const res = await onboardingApi.getMerchantShop();
            if (res.data) {
              const enrichedUser = {
                ...nextUser,
                shopStatus: res.data.status,
                adminNotes: res.data.admin_notes,
              };
              setUser(enrichedUser);
              await writeSession({
                user: enrichedUser,
                access_token: nextAccessToken,
                refresh_token: nextRefreshToken,
                preferredRole: nextUser.role as AppRole,
                biometricEnabled,
                nextStep: resNextStep || null,
              });
            }
          } catch (e) {
            console.error("[Session] Post-SignIn Shop Check Fail:", e);
          }
        }
      },
      async signOut() {
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        setNextStepState(null);
        setStatus("anonymous");
        await writeSession({
          user: null,
          access_token: null,
          refresh_token: null,
          preferredRole,
          biometricEnabled,
          nextStep: null,
        });
      },
      async updateUser(partialUser) {
        if (!user) return;

        // If role is changing, we MUST clear stale nextStep metadata
        // belonging to the previous role to prevent 403 errors.
        const roleChanged = partialUser.role && partialUser.role !== user.role;
        const nextUser = { ...user, ...partialUser };
        const updatedNextStep = roleChanged ? null : nextStep;

        if (roleChanged) setNextStepState(null);
        setUser(nextUser);

        await writeSession({
          user: nextUser,
          access_token: accessToken,
          refresh_token: refreshToken,
          preferredRole: nextUser.role as AppRole,
          biometricEnabled,
          nextStep: updatedNextStep,
        });
      },
      refreshShopStatus,
      isBiometricVerified,
      setIsBiometricVerified,
      nextStep,
    }),
    [
      accessToken,
      refreshToken,
      biometricEnabled,
      isBiometricVerified,
      isHydrated,
      preferredRole,
      status,
      user,
      nextStep,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useAppSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useAppSession must be used inside AppSessionProvider");
  }
  return context;
}

export function AppRouteGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const session = useAppSession() as any;
  const {
    isHydrated,
    status,
    user,
    biometricEnabled,
    isBiometricVerified,
    setIsBiometricVerified,
  } = session;
  const nextStep = session.nextStep;

  useEffect(() => {
    if (!isHydrated) return;

    const firstSegment = segments[0] ?? "";
    const isAuthRoute = firstSegment === "auth";
    const isOnboardingRoute = firstSegment === "onboarding";

    // Anonymous User Handling
    if (status === "anonymous") {
      if (!isAuthRoute && !isOnboardingRoute) {
        console.log("🛡️ [Guard] Redirecting anonymous user to /auth");
        router.replace("/auth");
      }
      return;
    }

    if (!user) return;

    // --- CHECKLIST: SECURITY & PERMISSIONS ---

    const runChecklist = async () => {
      // 1. Biometric Check
      if (biometricEnabled && !isBiometricVerified) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (hasHardware && isEnrolled) {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: "Unlock ThanniGo",
            fallbackLabel: "Use PIN",
          });
          if (result.success) {
            setIsBiometricVerified(true);
          } else {
            return; // Stay here or show error
          }
        } else {
          setIsBiometricVerified(true); // No hardware, skip
        }
      }

      // 2. Location Check (Only for Customer/Shop/Delivery)
      if (
        user.role !== "admin" &&
        firstSegment !== "location" &&
        firstSegment !== "enable-notifications"
      ) {
        const { status: locStatus } =
          await Location.getForegroundPermissionsAsync();
        if (locStatus !== "granted") {
          console.log(
            "🛡️ [Guard] Location not granted: Redirecting to /location",
          );
          router.replace("/location");
          return;
        }
      }

      // 3. Notification Check (Skip in Expo Go SDK 53+ to avoid error)
      if (
        firstSegment !== "enable-notifications" &&
        firstSegment !== "location"
      ) {
        if (Constants.appOwnership === "expo") {
          console.warn(
            "🛡️ [Guard] Skipping notification permission check in Expo Go (SDK 53+ restriction).",
          );
        } else {
          // Dynamic import to avoid top-level side-effects in Expo Go
          const Notifications = require("expo-notifications");
          const { status: notifStatus } =
            await Notifications.getPermissionsAsync();
          if (notifStatus !== "granted") {
            console.log(
              "🛡️ [Guard] Notifications not granted: Redirecting to /enable-notifications",
            );
            router.replace({
              pathname: "/enable-notifications",
              params: { next: pathname },
            } as any);
            return;
          }
        }
      }

      // 4. Determination of Ideal Destination
      let idealRoute: any = "/(tabs)";

      if (user.onboarding_completed) {
        // A. Final Destination: Standard role-based dashboards
        if (user.role === "shop_owner") {
          // Gated by Shop Approval Status
          idealRoute =
            user.shopStatus === "active" ? "/shop" : "/onboarding/shop/waitlist";
        } else if (user.role === "admin") {
          idealRoute = "/admin";
        } else if (user.role === "delivery") {
          idealRoute = "/delivery";
        } else {
          idealRoute = "/(tabs)";
        }
      } else {
        // B. Onboarding Path
        const backendNextStep = nextStep as any;
        if (user.role === "shop_owner") {
          // For merchants, we always pivot through the waitlist if not active
          // unless they are explicitly in the middle of a sub-onboarding screen.
          const isOnboardingSubScreen =
            pathname.includes("/onboarding/shop/") &&
            pathname !== "/onboarding/shop/waitlist";

          if (isOnboardingSubScreen) {
            idealRoute = pathname;
          } else {
            idealRoute = "/onboarding/shop/waitlist";
          }
        } else if (backendNextStep?.screen_route) {
          // Backend dictated step takes priority for other roles
          idealRoute = backendNextStep.screen_route;
        } else {
          // Fallback Force onboarding flow
          if (user.role === "customer") idealRoute = "/onboarding/customer";
          else idealRoute = "/auth/role";
        }
      }

      // 5. Redirection Logic (with Role Sanitizer)

      // A. Role-Route Mismatch Sanitizer
      // If the backend nextStep route belongs to a DIFFERENT role, override it.
      if (!user.onboarding_completed) {
        const routeIsShop = idealRoute.includes("/shop/");
        const routeIsCustomer = idealRoute.includes("/customer/");

        if (
          (user.role === "customer" && routeIsShop) ||
          (user.role === "shop_owner" && routeIsCustomer)
        ) {
          console.warn(
            `🛡️ [Guard] Role Mismatch! Overriding ${idealRoute} for role ${user.role}`,
          );
          idealRoute =
            user.role === "customer"
              ? "/onboarding/customer"
              : "/onboarding/shop";
        }
      }

      // B. Escape from Auth Route (Login/Register/OTP)
      if (isAuthRoute) {
        if (pathname !== idealRoute) {
          console.log(
            `🛡️ [Guard] Escaping auth route to ideal destination: ${idealRoute}`,
          );
          router.replace(idealRoute);
        }
        return;
      }

      // B. Enforcement (If not on onboarding/auth but onboarding is incomplete)
      if (!user.onboarding_completed && !isOnboardingRoute) {
        if (pathname !== idealRoute) {
          console.log(
            `🛡️ [Guard] Enforcing onboarding checklist: ${idealRoute}`,
          );
          router.replace(idealRoute);
        }
        return;
      }

      // C. Role-based Access Control (Prevent customers from entering /shop etc.)
      const currentSegment = segments[0] ?? "";
      const isIllegalCustomer =
        user.role === "customer" &&
        (currentSegment === "shop" ||
          currentSegment === "admin" ||
          currentSegment === "delivery");
      const isIllegalShop = user.role === "shop" && currentSegment === "admin";
      const isIllegalAdmin =
        user.role === "admin" &&
        (currentSegment === "(tabs)" ||
          currentSegment === "shop" ||
          currentSegment === "delivery");
      const isIllegalDelivery =
        user.role === "delivery" &&
        (currentSegment === "(tabs)" ||
          currentSegment === "shop" ||
          currentSegment === "admin");

      if (
        isIllegalCustomer ||
        isIllegalShop ||
        isIllegalAdmin ||
        isIllegalDelivery
      ) {
        if (pathname !== idealRoute) {
          console.log(
            `🛡️ [Guard] Illegal access for role ${user.role}: Redirecting to ${idealRoute}`,
          );
          router.replace(idealRoute);
        }
        return;
      }

      // Root Path Handling
      if (pathname === "/") {
        if (pathname !== idealRoute) {
          console.log(`🛡️ [Guard] Root hit: Redirecting to ${idealRoute}`);
          router.replace(idealRoute);
        }
      }
    };

    runChecklist();
  }, [
    isHydrated,
    pathname,
    router,
    segments,
    status,
    user,
    biometricEnabled,
    isBiometricVerified,
  ]);

  return null;
}
