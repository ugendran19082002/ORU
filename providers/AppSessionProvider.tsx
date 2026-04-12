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
import { Platform, DeviceEventEmitter } from "react-native";

import { apiClient, setClientToken } from "@/api/client";
import { onboardingApi } from "@/api/onboardingApi";
import { userApi } from "@/api/userApi";
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
  emergencyReset: () => Promise<void>;
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

  // Sync Token to Axios Defaults
  useEffect(() => {
    setClientToken(accessToken);
  }, [accessToken]);

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
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.error("[Session] Refresh Shop Status Error:", err);
      }
    }
  };

  // --- MERCHANT STATUS SYNC ---
  // A dedicated effect to fetch shop status exactly once when a shop owner logs in
  // or switches roles. This replaces the aggressive polling and redundant manual calls.
  useEffect(() => {
    if (status === "authenticated" && user?.role === "shop_owner" && !user.shopStatus) {
      console.log('🔄 [Session] Authenticated Shop Owner detected. Syncing shop status...');
      refreshShopStatus();
    }
  }, [status, user?.role, user?.shopStatus]);
  
  const handleSignOut = async () => {
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
  };

  const emergencyReset = async () => {
    try {
      console.warn("🚨 [Session] Emergency Reset Triggered!");
      setClientToken(null);
      if (Platform.OS === "web") {
        await AsyncStorage.clear();
      } else {
        await SecureStore.deleteItemAsync(SESSION_KEY);
        await AsyncStorage.clear();
      }
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setNextStepState(null);
      setStatus("anonymous");
    } catch (err) {
      console.error("[Session] Emergency Reset Failed:", err);
    }
  };

  // 401 / TOKEN_EXPIRED: Reactive Recovery
  useEffect(() => {
    const handleUnauthorized = (data: any) => {
      const { code, message } = data || {};
      console.warn(`🛡️ [Session] Unauthorized signal received (${code})! Forced logout triggered.`);
      handleSignOut();
    };

    const subscription = DeviceEventEmitter.addListener('thannigo:unauthorized', handleUnauthorized);
    return () => subscription.remove();
  }, []);

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

        // Push token to client instantly to prevent race conditions
        setClientToken(nextAccessToken);

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
      },
      signOut: handleSignOut,
      async updateUser(partialUser) {
        if (!user) return;
        try {
          const response = await userApi.updateProfile(partialUser);
          const updatedUserFromApi = response.data;
          
          // Sync tokens if the API returned new ones (e.g. after role change)
          const newAccessToken = updatedUserFromApi.access_token || accessToken;
          const newRefreshToken = updatedUserFromApi.refresh_token || refreshToken;

          const nextUser = { ...user, ...updatedUserFromApi } as AppUser;
          
          // Remove internal token fields from user object before state updates
          delete (nextUser as any).access_token;
          delete (nextUser as any).refresh_token;

          setUser(nextUser);
          if (updatedUserFromApi.access_token) {
            setAccessToken(updatedUserFromApi.access_token);
            setClientToken(updatedUserFromApi.access_token);
          }
          if (updatedUserFromApi.refresh_token) setRefreshToken(updatedUserFromApi.refresh_token);

          await writeSession({
            user: nextUser,
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
            preferredRole: nextUser.role as AppRole,
            biometricEnabled,
            nextStep: response.data.next_step || (updatedUserFromApi.role !== user.role ? null : nextStep),
          });
        } catch (err) {
          console.error("Failed to update user:", err);
          throw err;
        }
      },
      refreshShopStatus,
      emergencyReset,
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
  
  // REDIRECT MEMORY: Prevent "double time" redirects by tracking the last destination
  const lastRedirectRef = React.useRef<string | null>(null);

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

    // CRITICAL: If we are on a security or auth screen, STOP other competing redirects.
    // This prevents the infinite loop where the guard fights with onboarding enforcement.
    const isSecurityRoute = firstSegment === "location" || firstSegment === "enable-notifications";
    const isActuallyAuthRoute = firstSegment === "auth";
    const isPriorityRoute = isSecurityRoute || isActuallyAuthRoute;

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
          if (pathname !== "/location") {
            console.log(
              "🛡️ [Guard] Location not granted: Redirecting to /location",
            );
            router.replace("/location");
          }
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
          if (user.shopStatus === "active") {
            idealRoute = "/shop";
          } else if (user.shopStatus === "rejected") {
            idealRoute = "/onboarding/shop/rejected";
          } else {
            idealRoute = "/onboarding/shop/waitlist";
          }
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
          // Prioritize Status-based routing once a shop exists
          if (user.shopStatus === "rejected") {
            idealRoute = "/onboarding/shop/rejected";
          } else if (user.shopStatus === "pending_review") {
            idealRoute = "/onboarding/shop/waitlist";
          } else if (user.shopStatus === "in_progress") {
            // Stay on current sub-screen if already there (Business, GST, etc.)
            const isOnboardingSubScreen = pathname.startsWith("/onboarding/shop/") && pathname !== "/onboarding/shop/waitlist";
            idealRoute = isOnboardingSubScreen ? pathname : "/onboarding/shop";
          } else {
            // No shop found in session yet: follow the backend's prescribed route or default to create
            idealRoute = backendNextStep?.screen_route || "/onboarding/shop/create";
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

      // 5. Normalization & Redirection Logic (with Role Sanitizer)
      
      // A. Path Normalization: Standardize routes for navigation.
      // We avoid stripping parentheses as they are needed for Stack names in _layout.tsx.
      if (typeof idealRoute === "string" && idealRoute.includes("(tabs)")) {
        // No-op normalization, preserve the parentheses to match Stack.Screen name="(tabs)"
      }

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
      if (!user.onboarding_completed && !isOnboardingRoute && !isPriorityRoute) {
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

      // Root Path Handling: Decide where to go from / app/index.tsx
      if (pathname === "/") {
        const isInTabs = segments[0] === "(tabs)";
        // If we want to go to tabs but aren't there yet (segments is empty or different), redirect.
        const needsTabsRedirect = idealRoute === "/(tabs)" && !isInTabs;
        
        if (needsTabsRedirect || (pathname !== idealRoute && idealRoute !== "/(tabs)")) {
          if (lastRedirectRef.current !== idealRoute) {
            console.log(`🛡️ [Guard] Root hit: Redirecting to ${idealRoute}`);
            lastRedirectRef.current = idealRoute;
            router.replace(idealRoute);
          }
        }
      }
    };

    // Helper to safely navigate once
    const safeReplace = (target: string, reason: string) => {
      if (pathname === target || lastRedirectRef.current === target) return;
      console.log(`🛡️ [Guard] ${reason}: Redirecting to ${target}`);
      lastRedirectRef.current = target;
      router.replace(target as any);
    };

    // Override router.replace in runChecklist context (optional, but for readability)
    const originalReplace = router.replace;
    // @ts-ignore
    router.replace = (target: string) => safeReplace(target, "Forced");

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
