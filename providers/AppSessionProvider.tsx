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
import { Platform, DeviceEventEmitter, View, ActivityIndicator } from "react-native";

import { apiClient, setClientToken, getClientToken } from "@/api/client";
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
  isLocationVerified: boolean;
  setIsBiometricVerified: (verified: boolean) => void;
  setIsLocationVerified: (verified: boolean) => void;
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
  syncSession: (providedUser?: any) => Promise<void>;
  emergencyReset: () => Promise<void>;
  nextStep: any;
  isSyncingShop: boolean;
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
  const [isLocationVerified, setIsLocationVerified] = useState(false);
  const [nextStep, setNextStepState] = useState<any>(null);
  const [isSyncingShop, setIsSyncingShop] = useState(false);

  // Sync Token to Axios Defaults (Memory Store)
  useEffect(() => {
    // Only update if the token in memory is different to avoid redundant logs
    if (getClientToken() !== accessToken) {
      setClientToken(accessToken);
    }
  }, [accessToken]);

  // Hydration logic
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

  // MERCHANT STATUS SYNC
  const refreshShopStatus = async () => {
    if (!user || user.role !== "shop_owner") return;
    if (isSyncingShop || !accessToken) return;
    
    setIsSyncingShop(true);
    try {
      const res = await onboardingApi.getMerchantShop();
      if (res.data) {
        const nextUser = {
          ...user,
          shopStatus: res.data.status,
          onboardingStatus: res.data.onboarding_status,
          adminNotes: res.data.admin_notes,
        };
        setUser(nextUser);
        await writeSession({
            user: nextUser,
            access_token: accessToken,
            refresh_token: refreshToken,
            preferredRole,
            biometricEnabled,
            nextStep
        });
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        const nextUser = { ...user, shopStatus: 'none', onboardingStatus: 'none' };
        setUser(nextUser);
        await writeSession({
            user: nextUser,
            access_token: accessToken,
            refresh_token: refreshToken,
            preferredRole,
            biometricEnabled,
            nextStep
        });
      } else if (err.response?.status === 403 || err.response?.status === 401) {
        // Break infinite loop if unauthorized
        const nextUser = { ...user, shopStatus: 'error', onboardingStatus: 'error' };
        setUser(nextUser);
        await writeSession({
            user: nextUser,
            access_token: accessToken,
            refresh_token: refreshToken,
            preferredRole,
            biometricEnabled,
            nextStep
        });
        console.warn('🛡️ [Session] Shop sync failed (403/401). Loop broken and persisted.');
      }
    } finally {
      setIsSyncingShop(false);
    }
  };
  
  const syncSession = async (providedUser?: any) => {
    setIsSyncingShop(true);
    try {
      let freshUser = providedUser;
      if (!freshUser) {
          const res = await apiClient.get('/auth/me');
          freshUser = res.data.data;
      }
      
      if (freshUser) {
          const nextUser = {
              ...(user || {}),
              ...freshUser,
              shopStatus: freshUser.shop_status || freshUser.shopStatus || 'none',
              onboardingStatus: freshUser.onboarding_status || freshUser.onboardingStatus || 'none'
          } as AppUser;

          const nextNextStep = freshUser.next_step || (freshUser.role !== user?.role ? null : nextStep);
          
          setUser(nextUser);
          setNextStepState(nextNextStep);

          await writeSession({
            user: nextUser,
            access_token: accessToken,
            refresh_token: refreshToken,
            preferredRole: nextUser.role as AppRole,
            biometricEnabled,
            nextStep: nextNextStep
          });
          console.log(`🛡️ [Session] Sync complete. User role is now: ${nextUser.role}`);
      }
    } catch (err) {
      console.error("[Session] Sync Error:", err);
    } finally {
      setIsSyncingShop(false);
    }
  };

  // Sync shop status automatically when role changes or upon login
  useEffect(() => {
    if (status === "authenticated" && user?.role === "shop_owner" && !user.shopStatus && !isSyncingShop) {
      refreshShopStatus();
    }
  }, [status, user?.role, user?.shopStatus, isSyncingShop]);

  const handleSignOut = async () => {
    try {
      console.log("🛡️ [Session] Deep Purge SignOut initiated...");
      
      // 1. Reset memory state immediately to halt ongoing guard checks
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setIsBiometricVerified(false);
      setIsLocationVerified(false);
      setPreferredRoleState(null);
      setNextStepState(null);
      setStatus("anonymous");
      setClientToken(null);

      // 2. Perform aggressive storage clearing
      if (Platform.OS === "web") {
        await AsyncStorage.clear();
      } else {
        // Clear session specific key from SecureStore
        await SecureStore.deleteItemAsync(SESSION_KEY);
        // Clear everything else from AsyncStorage
        await AsyncStorage.clear();
      }
      
      console.log("✅ [Session] Deep Purge completed. All caches cleared.");
    } catch (err) {
      console.error("[Session] SignOut Error:", err);
      // Fallback: at least try to set status to anonymous
      setStatus("anonymous");
    }
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
      setIsBiometricVerified(false);
      setIsLocationVerified(false);
      setPreferredRoleState(null);
      setStatus("anonymous");
    } catch (err) {
      console.error("[Session] Emergency Reset Failed:", err);
    }
  };

  // 401: Reactive Recovery
  useEffect(() => {
    const handleUnauthorized = () => {
      console.warn(`🛡️ [Session] Unauthorized signal received! Forced logout.`);
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
      isBiometricVerified,
      isLocationVerified,
      setIsBiometricVerified,
      setIsLocationVerified,
      isSyncingShop,
      nextStep,
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
      async signIn({ user: rawUser, access_token, refresh_token, nextStep: resNextStep }) {
        const nextAccessToken = access_token || accessToken;
        setClientToken(nextAccessToken);
        
        // Map snake_case fields from API to camelCase for AppUser
        const user = {
            ...rawUser,
            shopStatus: (rawUser as any).shop_status || rawUser.shopStatus,
            onboardingStatus: (rawUser as any).onboarding_status || (rawUser as any).onboardingStatus
        };

        setUser(user);
        setAccessToken(nextAccessToken);
        setRefreshToken(refresh_token || refreshToken);
        setNextStepState(resNextStep || null);
        setStatus(nextAccessToken ? "authenticated" : "anonymous");

        await writeSession({
          user,
          access_token: nextAccessToken,
          refresh_token: refresh_token || refreshToken,
          preferredRole: user.role as AppRole,
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
          const nextAccessToken = updatedUserFromApi.access_token || accessToken;
          
          setClientToken(nextAccessToken);
          const isRoleSwitch = updatedUserFromApi.role !== user.role;
          const nextUser = { ...user, ...updatedUserFromApi } as AppUser;
          
          if (isRoleSwitch) {
              console.log('🔄 [Session] Role switch detected. Clearing role-specific metadata.');
              nextUser.shopStatus = 'none';
              nextUser.onboardingStatus = 'none';
              nextUser.onboarding_completed = false; // Reset completion state for new role
          }

          delete (nextUser as any).access_token;
          delete (nextUser as any).refresh_token;

          setUser(nextUser);
          setAccessToken(nextAccessToken);
          if (updatedUserFromApi.refresh_token) setRefreshToken(updatedUserFromApi.refresh_token);

          await writeSession({
            user: nextUser,
            access_token: nextAccessToken,
            refresh_token: updatedUserFromApi.refresh_token || refreshToken,
            preferredRole: nextUser.role as AppRole,
            biometricEnabled,
            nextStep: updatedUserFromApi.next_step || (isRoleSwitch ? null : nextStep),
          });
        } catch (err) {
          console.error("Failed to update user:", err);
          throw err;
        }
      },
      refreshShopStatus,
      syncSession,
      emergencyReset,
    }),
    [accessToken, refreshToken, biometricEnabled, isBiometricVerified, isLocationVerified, isHydrated, preferredRole, status, user, nextStep, isSyncingShop]
  );

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
         <ActivityIndicator size="large" color="#005d90" />
      </View>
    );
  }

  return (
    <SessionContext.Provider value={value}>
        {children}
        <AppRouteGuard />
    </SessionContext.Provider>
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
  const session = useAppSession();
  const {
    isHydrated,
    status,
    user,
    biometricEnabled,
    isBiometricVerified,
    isLocationVerified,
    setIsBiometricVerified,
    setIsLocationVerified,
    isSyncingShop,
    nextStep
  } = session;

  const lastRedirectRef = React.useRef<string | null>(null);
  const guardGenerationRef = React.useRef<number>(0);
  const isNavigatingRef = React.useRef<boolean>(false);
  const lastLoggedSyncPauseRef = React.useRef<boolean>(false);
  
  useEffect(() => {
    // Proactive Pause: If we are hydrating or if we are a shop owner who hasn't synced their shop status yet,
    // we MUST pause the guard to avoid incorrect redirections (like a false-positive Location check).
    const isShopOwner = user?.role === 'shop_owner';
    const needsShopSync = isShopOwner && user.shopStatus === undefined;
    const isPaused = !isHydrated || (isSyncingShop && isShopOwner) || needsShopSync;

    if (isPaused) {
        if (__DEV__ && (isSyncingShop || needsShopSync) && !lastLoggedSyncPauseRef.current) {
            console.log('🛡️ [Guard] Paused (Sync/Hydration in progress)');
            lastLoggedSyncPauseRef.current = true;
        }
        return;
    }
    
    // Reset log ref when we are no longer paused
    lastLoggedSyncPauseRef.current = false;

    const firstSegment = segments[0] ?? "";
    const currentPath = pathname || "";
    const isAuthRoute = firstSegment === "auth";
    const isOnboardingRoute = firstSegment === "onboarding";
    
    // Expand security routes to include ANY location picker or permission screen
    const isSecurityRoute = firstSegment === "location" || 
                            firstSegment === "enable-notifications" ||
                            currentPath.includes("location");

    const isPriorityRoute = isSecurityRoute || isAuthRoute;

    const isAdminRoute = segments[0] === 'admin';
    const isDeliveryRoute = segments[0] === 'delivery';

    if (__DEV__ && isAdminRoute) {
      console.log(`🛡️ [Guard-Admin] Status: ${status}, Path: /${segments.join('/')}, UID: ${user?.id || 'none'}`);
    }

    if (status === "anonymous") {
      if (!isAuthRoute && !isOnboardingRoute) {
        router.replace("/auth");
      }
      return;
    }

    if (!user) return;
    
    // Increment generation ID to identify this specific useEffect run
    const currentGeneration = ++guardGenerationRef.current;

    const runChecklist = async () => {
      try {
        // 0. Pre-check: If a newer generation has already started, abort this one immediately
        if (currentGeneration < guardGenerationRef.current) return;

        let hasRedirected = false;

        const navigate = (target: string, reason: string) => {
          if (hasRedirected || currentGeneration < guardGenerationRef.current || isNavigatingRef.current) return;
          
          // Production Safe Normalization: strip groups like (tabs) or (auth)
          const norm = (p: string) => p.split('/').filter(s => s && !s.startsWith('(')).join('/');
          const currentNorm = norm(pathname || "");
          const targetNorm = norm(target);

          if (currentNorm === targetNorm) {
            if (__DEV__) console.log(`🛡️ [Guard] Already at ${targetNorm}. Skipping.`);
            hasRedirected = true;
            return;
          }
          
          console.log(`🛡️ [Guard] Redirect: ${currentNorm} -> ${targetNorm} (${reason})`);
          hasRedirected = true;
          isNavigatingRef.current = true;
          router.replace(target as any);
          
          setTimeout(() => {
            isNavigatingRef.current = false;
          }, 500); // 500ms safety lock
        };

        // 1. Biometrics
        if (biometricEnabled && !isBiometricVerified) {
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();
          if (hasHardware && isEnrolled) {
            const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Unlock ThanniGo" });
            if (currentGeneration < guardGenerationRef.current) return; // ABA check
            if (result.success) setIsBiometricVerified(true);
            else return;
          } else {
            setIsBiometricVerified(true);
          }
        }

        // 2. Location
        if (user.role !== "admin" && !isSecurityRoute && !isLocationVerified) {
          const { status: locStatus } = await Location.getForegroundPermissionsAsync();
          if (currentGeneration < guardGenerationRef.current) return; // ABA check
          
          if (locStatus === "granted") {
            setIsLocationVerified(true);
          } else {
            navigate("/location", "Location required");
            return;
          }
        }

        // 3. Destinations
        let idealRoute: any = "/(tabs)";
        if (user.onboarding_completed) {
          if (user.role === "shop_owner") {
            if (user.shopStatus === "active") idealRoute = "/shop";
            else if (user.shopStatus === "rejected") idealRoute = "/onboarding/shop/rejected";
            else idealRoute = "/onboarding/shop/waitlist";
          } else if (user.role === "admin") idealRoute = "/admin";
          else if (user.role === "delivery") idealRoute = "/delivery";
          else idealRoute = "/(tabs)";
        } else {
          const backendNextStep = nextStep as any;
          if (user.role === "shop_owner") {
            const isOnboardingSubScreen = pathname.startsWith("/onboarding/shop/") && pathname !== "/onboarding/shop/waitlist";

            if (user.shopStatus === "active") idealRoute = "/shop";
            else if (user.shopStatus === "rejected") idealRoute = "/onboarding/shop/rejected";
            else if ((user.shopStatus === "pending_review" || user.shopStatus === "under_review") && user.onboardingStatus !== 'in_progress') {
                idealRoute = isOnboardingSubScreen ? pathname : "/onboarding/shop/waitlist";
            }
            else if (user.shopStatus === "in_progress" || user.onboardingStatus === 'in_progress') {
              idealRoute = isOnboardingSubScreen ? pathname : "/onboarding/shop";
            } else {
              idealRoute = backendNextStep?.screen_route || "/onboarding/shop";
            }
          } else if (user.role === "admin") {
            idealRoute = "/admin";
            const currentBase = segments[0] as string;
            if (isAdminRoute || isDeliveryRoute || currentBase === 'security') {
              if (__DEV__) console.log(`🛡️ [Guard] Already in ${currentBase} stack. Early exit.`);
              return; // Correct role in specialized route
            }
          } else if (user.role === "delivery") {
            idealRoute = "/delivery";
          } else if (backendNextStep?.screen_route) {
            idealRoute = backendNextStep.screen_route;
          } else {
            idealRoute = user.role === "customer" ? "/onboarding/customer" : "/auth/role";
          }
        }

        // Role check & Enforce flow
        if (!user.onboarding_completed) {
          const routeIsShop = idealRoute.includes("/shop/");
          const routeIsCustomer = idealRoute.includes("/customer/");
          if ((user.role === "customer" && routeIsShop) || (user.role === "shop_owner" && routeIsCustomer)) {
            idealRoute = user.role === "customer" ? "/onboarding/customer" : "/onboarding/shop";
          }
        }

        // Execute
        if (isAuthRoute) {
          navigate(idealRoute, "Escaping Auth");
        } else if (!user.onboarding_completed && !isPriorityRoute) {
          const currentPath = pathname || "";
          const isCurrentlyInExpectedFlow = (user.role === 'customer' && currentPath.startsWith('/onboarding/customer')) ||
                                             (user.role === 'shop_owner' && currentPath.startsWith('/onboarding/shop')) ||
                                             (user.role === 'admin' && currentPath.startsWith('/admin')) ||
                                             (user.role === 'delivery' && currentPath.startsWith('/delivery'));

          if (!isCurrentlyInExpectedFlow) {
              navigate(idealRoute, "Enforcing Onboarding");
          }
        } else if (pathname === "/" || pathname === "/auth") {
          navigate(idealRoute, "Root Redirection");
        } else {
            // Contextual Guard: If we are in the correct stack, don't force index
            const currentPath = pathname || "";
            const isCurrentlyInIdealStack = (idealRoute === "/shop" && currentPath.startsWith("/shop")) ||
                                              (idealRoute === "/delivery" && currentPath.startsWith("/delivery")) ||
                                              (idealRoute === "/admin" && currentPath.startsWith("/admin")) ||
                                              (idealRoute === "/(tabs)" && !["admin", "shop", "delivery", "onboarding", "auth"].includes(firstSegment));
            
            if (currentPath === idealRoute || isCurrentlyInIdealStack) {
              if (__DEV__) console.log(`🛡️ [Guard] Already at target: ${currentPath}. Skipping redundant redirect.`);
              return;
            }

            if (!isCurrentlyInIdealStack) {
                navigate(idealRoute, "Stack Correction");
            }
        }
      } catch (error) {
        console.error("🛡️ [Guard] Critical Navigation Error:", error);
        
        // Fail-safe: Only redirect if we are NOT already in a safe dashboard or auth screen
        const currentPath = pathname || "";
        const isSafePlace = currentPath.startsWith("/admin") || 
                            currentPath.startsWith("/shop") || 
                            currentPath.startsWith("/delivery") || 
                            currentPath.startsWith("/auth");

        if (!isSafePlace) {
           router.replace("/(tabs)" as any);
        }
      }
    };

    runChecklist();
  }, [isHydrated, pathname, segments, status, user, biometricEnabled, isBiometricVerified, nextStep, isSyncingShop]);

  return null;
}
