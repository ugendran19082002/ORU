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
import { Platform, DeviceEventEmitter, View, ActivityIndicator, AppState, AppStateStatus, BackHandler } from "react-native";

import { apiClient, setClientToken, getClientToken } from "@/api/client";
import { authApi } from "@/api/authApi";
import { onboardingApi } from "@/api/onboardingApi";
import { userApi } from "@/api/userApi";
import type {
  AppRole,
  AppUser,
  PersistedSession,
  SessionStatus,
} from "@/types/session";
import { useSecurityStore } from "@/stores/securityStore";
import { PinEntryModal } from "@/components/security/PinEntryModal";

const SESSION_KEY = "thannigo_session";
const LAST_PHONE_KEY = "thannigo_last_phone";
const LAST_NAME_KEY = "thannigo_last_name";

type SessionContextValue = {
  status: SessionStatus;
  isHydrated: boolean;
  user: AppUser | null;
  access_token: string | null;
  refresh_token: string | null;
  preferredRole: AppRole | null;
  isVerified: boolean;
  isLocationVerified: boolean;
  setIsVerified: (verified: boolean) => void;
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
  const [isLocationVerified, setIsLocationVerified] = useState(false);
  const [nextStep, setNextStepState] = useState<any>(null);
  const [isSyncingShop, setIsSyncingShop] = useState(false);
  const [lastBgTimestamp, setLastBgTimestamp] = useState<number>(0);

  const { isLocked, setLocked, isVerified, setIsVerified, isPinEnabled, isBiometricsEnabled } = useSecurityStore();
  const securityEnabled = isPinEnabled || isBiometricsEnabled;

  // Hydration logic: Fetch EVERYTHING once at boot
  useEffect(() => {
    let active = true;

    async function init() {
      try {
        // 1. Load Local Security Settings
        await useSecurityStore.getState().initialize();
        
        // 2. Load Local Session Storage
        const session = await readSession();
        if (!active) return;

        if (session.access_token) {
          // 3. Proactive Sync: Fetch Profile + Shop Status in one waterfall
          setClientToken(session.access_token);
          try {
            const res = await apiClient.get('/auth/me');
            const freshUser = res.data.data;
            
            const mappedUser = {
              ...session.user,
              ...freshUser,
              shopStatus: freshUser.shop_status || freshUser.shopStatus || 'none',
              onboardingStatus: freshUser.onboarding_status || freshUser.onboardingStatus || 'none',
            };

            setUser(mappedUser);
            setAccessToken(session.access_token);
            setRefreshToken(session.refresh_token);
            setPreferredRoleState(mappedUser.role as AppRole);
            setNextStepState(freshUser.next_step || null);
            
            // Sync security store with verified backend flags
            await useSecurityStore.getState().syncWithUser(mappedUser);
            
            setStatus("authenticated");
          } catch (syncErr) {
            console.error('🛡️ [Session] Sync failed during init:', syncErr);
            // Fallback to persisted session if sync fails but token exists
            setUser(session.user);
            setAccessToken(session.access_token);
            setRefreshToken(session.refresh_token);
            setPreferredRoleState(session.preferredRole);
            setStatus("authenticated");
          }
        } else {
          setStatus("anonymous");
        }
      } catch (err) {
        console.error('🛡️ [Session] Hydration error:', err);
        setStatus("anonymous");
      } finally {
        if (active) setIsHydrated(true);
      }
    }

    init();
    return () => { active = false; };
  }, []);

  // APP LOCK: Handle Foreground Lock
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        setLastBgTimestamp(Date.now());
      }
      
      if (nextAppState === 'active') {
        const SECONDS_SINCE_BG = lastBgTimestamp !== 0 ? (Date.now() - lastBgTimestamp) / 1000 : 0;
        
        if (__DEV__) {
            console.log(`🛡️ [App Lock Audit] App Active. Seconds since background: ${SECONDS_SINCE_BG.toFixed(2)}s`);
        }

        if (status === 'authenticated' && securityEnabled && lastBgTimestamp !== 0 && SECONDS_SINCE_BG > 5) {
          console.log(`🔐 [App Lock] Force re-verification triggered after ${Math.round(SECONDS_SINCE_BG)}s.`);
          setIsVerified(false);
        }

        // IMPORTANT: Reset the timestamp after it's been checked once.
        setLastBgTimestamp(0);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [status, lastBgTimestamp]);

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
              onboardingStatus: freshUser.onboarding_status || freshUser.onboardingStatus || 'none',
              is_security_verified: freshUser.is_security_verified
          } as AppUser;

          const nextNextStep = ('next_step' in freshUser) ? freshUser.next_step : (freshUser.role !== user?.role ? null : nextStep);
          
          setUser(nextUser);
          setNextStepState(nextNextStep);
          
          // SYNC SECURITY STATE
          await useSecurityStore.getState().syncWithUser(nextUser);

          await writeSession({
            user: nextUser,
            access_token: accessToken,
            refresh_token: refreshToken,
            preferredRole: nextUser.role as AppRole,
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


  const handleSignOut = async () => {
    try {
      console.log("🛡️ [Session] Deep Purge SignOut initiated...");
      
      // 1. Reset memory state immediately to halt ongoing guard checks
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setIsVerified(false);
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

        // 3. Clear security settings
        await useSecurityStore.getState().reset();
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
      
      await useSecurityStore.getState().reset();

      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setNextStepState(null);
      setIsVerified(false);
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
      isVerified,
      isLocationVerified,
      setIsVerified,
      setIsLocationVerified,
      isSyncingShop,
      nextStep,
      async setPreferredRole(role) {
        await writeSession({
          user,
          access_token: accessToken,
          refresh_token: refreshToken,
          preferredRole: role,
        });
        setPreferredRoleState(role);
      },
      async setBiometricEnabled(enabled) {
        useSecurityStore.getState().toggleBiometrics(enabled);
      },
      async signIn({ user: rawUser, access_token, refresh_token, nextStep: resNextStep }) {
        const nextAccessToken = access_token || accessToken;
        setClientToken(nextAccessToken);
        
        // Map snake_case fields from API to camelCase for AppUser
        const user = {
            ...rawUser,
            shopStatus: (rawUser as any).shop_status || rawUser.shopStatus,
            onboardingStatus: (rawUser as any).onboarding_status || (rawUser as any).onboardingStatus,
            is_security_verified: (rawUser as any).is_security_verified
        };

        setUser(user);
        setAccessToken(nextAccessToken);
        setRefreshToken(refresh_token || refreshToken);
        setNextStepState(resNextStep || null);
        setPreferredRoleState(user.role as AppRole);
        setStatus(nextAccessToken ? "authenticated" : "anonymous");

          await writeSession({
            user,
            access_token: nextAccessToken,
            refresh_token: refresh_token || refreshToken,
            preferredRole: user.role as AppRole,
            nextStep: resNextStep || null,
          });

          // PERSIST PHONE FOR QUICK LOGIN
          if (user.phone) {
              await SecureStore.setItemAsync(LAST_PHONE_KEY, user.phone);
          }
          if (user.name) {
              await SecureStore.setItemAsync(LAST_NAME_KEY, user.name);
          }
      },
      signOut: handleSignOut,
      async updateUser(partialUser) {
        if (!user) return;
        try {
          const responsePayload = await userApi.updateProfile(partialUser);
          const userData = responsePayload.data;
          const nextAccessToken = responsePayload.data.access_token || accessToken;
          
          setClientToken(nextAccessToken);
          const isRoleSwitch = userData.role !== user.role;
          const nextUser = { ...user, ...userData } as AppUser;
          
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
          if (userData.refresh_token) setRefreshToken(userData.refresh_token);

          await writeSession({
            user: nextUser,
            access_token: nextAccessToken,
            refresh_token: userData.refresh_token || refreshToken,
            preferredRole: nextUser.role as AppRole,
            nextStep: ('next_step' in userData) ? userData.next_step : (isRoleSwitch ? null : nextStep),
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
    [accessToken, refreshToken, isVerified, isLocationVerified, isHydrated, preferredRole, status, user, nextStep, isSyncingShop]
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
        <PinEntryModal 
          visible={isLocked}
          onSuccess={async (pin) => {
            if (pin) {
              // PIN Login (Remote Verify)
              const deviceId = useSecurityStore.getState().getDeviceId();
              const response = await authApi.loginPin(user?.phone || '', pin, deviceId);
              if (response.status === 1) {
                  setLocked(false);
                  setIsVerified(true);
              } else {
                  throw new Error(response.message || 'Invalid PIN');
              }
            } else {
                // Biometrics already verified internally in the Modal
                // but we should ideally also verify device trust if we want maximum security.
                // For now, if authenticateBiometrics succeeded (which is called inside mode='verify'),
                // we treat it as unlocked.
                setLocked(false);
                setIsVerified(true);
            }
          }}
          title="Unlock ThanniGo"
          mode="verify"
        />
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
  
  // DIRECT STORE BINDING: Bypassing context for security flags to eliminate reactivity lag
  const { 
    isLocked, 
    setLocked, 
    isVerified, 
    setIsVerified, 
    isPinEnabled, 
    isBiometricsEnabled, 
    authenticateBiometrics 
  } = useSecurityStore();

  const {
    isHydrated,
    status,
    user,
    isLocationVerified,
    setIsLocationVerified,
    isSyncingShop,
    nextStep
  } = session;

  const lastRedirectRef = React.useRef<string | null>(null);
  const guardGenerationRef = React.useRef<number>(0);
  const isNavigatingRef = React.useRef<boolean>(false);
  const lastLoggedSyncPauseRef = React.useRef<boolean>(false);

  // NATIVE BACK BUTTON HARDENING
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const onBackPress = () => {
      const firstSegment = segments[0] ?? "";
      const isAuthStack = firstSegment === "auth" || firstSegment === "onboarding";
      
      // Rule 1: NEVER allow backing into Auth/Onboarding if authenticated
      // (This prevents the 'flicker' where the OS pops the stack to OTP, then our guard pushes us back)
      if (status === "authenticated" && isAuthStack) {
          if (__DEV__) console.log('🛡️ [BackHandler] Blocked: Attempting to back into Auth stack while authenticated.');
          return true; // Intercept: Do nothing
      }

      // Rule 2: If on a Dashboard Home (Shop, Admin, etc.) and pressing back,
      // decide whether to exit app or do nothing.
      if (status === "authenticated" && !isAuthStack && segments.length <= 1) {
          return false; // Let OS handle app minimize/exit
      }

      return false; 
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSubscription.remove();
  }, [status, segments]);
  
  useEffect(() => {
    // 1. BOOT GATE: Guard must wait until hydration is complete and status is set
    if (!isHydrated || status === 'loading') {
       if (__DEV__ && !lastLoggedSyncPauseRef.current) {
          console.log('🛡️ [Guard] Paused (Waiting for Hydration/Auth State)');
          lastLoggedSyncPauseRef.current = true;
       }
       return;
    }
    lastLoggedSyncPauseRef.current = false;

    const firstSegment = segments[0] ?? "";
    const currentPath = pathname || "";
    const securityEnabled = isPinEnabled || isBiometricsEnabled;
    
    // 2. PRIORITY OVERRIDE (Security / Auth / Safe Zones)
    const isAuthRoute = (firstSegment === "auth");
    const isSecurityRoute = (firstSegment === "security-setup" || 
                            firstSegment === "location" || 
                            currentPath.includes("location") ||
                            currentPath.includes("quick-login"));
    
    // SAFE ZONES: Accessible to any authenticated user to prevent loops
    const isSafeZone = currentPath.includes("settings") || 
                       currentPath.includes("profile") || 
                         currentPath.includes("notifications") ||
                         currentPath.includes("privacy-security");

    if (isSecurityRoute || isSafeZone) {
      if (__DEV__) console.log(`🛡️ [Guard] Safe Zone/Priority: ${currentPath}. Skipping enforce.`);
      return;
    }

    // 3. ANONYMOUS GUARD
    if (status === "anonymous") {
      if (!isAuthRoute && firstSegment !== "onboarding") {
          console.log('🛡️ [Guard] Anonymous -> Redirecting to Auth');
          router.replace("/auth");
      }
      return;
    }

    if (!user) return;

    // 4. SECURITY BLOCKING (Banking Rule)
    // If security is enabled but we aren't verified yet, HALT navigation AND trigger verification
    // EXCEPTION: Allow escaping Auth routes so we don't get stuck on the OTP screen.
    if (securityEnabled && !isVerified && !isAuthRoute) {
        if (__DEV__) console.log('🛡️ [Guard] Gated: Awaiting Security verification');
        
        // AUTO-TRIGGER: Activate verification if not already locked
        if (!isLocked) {
            if (isBiometricsEnabled) {
                authenticateBiometrics();
            } else {
                setLocked(true);
            }
        }
        return;
    }

    // 5. DETERMINISTIC ZONE RESOLVER
    const resolveTargetRoute = (): string => {
        // PRIORITY: Professional roles bypass onboarding flows
        if (user.role === 'admin') return "/admin";
        if (user.role === 'delivery') return "/delivery";

        // A. ONBOARDING REQUIRED
        if (!user.onboarding_completed) {
            if (user.role === 'customer') return "/onboarding/customer";
            if (user.role === 'shop_owner') {
                if (user.shopStatus === 'pending_review' || user.shopStatus === 'under_review') return "/onboarding/shop/waitlist";
                if (user.shopStatus === 'rejected') return "/onboarding/shop/rejected";
                return "/onboarding/shop"; // Step-by-step
            }
            return "/auth/role";
        }

        // B. FULLY REGISTERED -> Map to Dashboard Home
        if (user.role === 'shop_owner') {
            if (user.shopStatus === 'active') return "/shop";
            return "/onboarding/shop/waitlist";
        }

        return "/(tabs)"; // Default Customer Home
    };

    const targetRoute = resolveTargetRoute();
    
    // 6. EXECUTION & STACK PROTECTION
    const norm = (p: string) => p.split('/').filter(s => s && !s.startsWith('(')).join('/');
    const currentNorm = norm(currentPath);
    const targetNorm = norm(targetRoute);
    
    // ZONE CHECK: Is current path already within the correct stack?
    const isInCorrectStack = (targetNorm === "shop" && (currentNorm.startsWith("shop") || currentNorm.startsWith("onboarding/shop"))) ||
                             (targetNorm === "delivery" && currentNorm.startsWith("delivery")) ||
                             (targetNorm === "admin" && currentNorm.startsWith("admin")) ||
                             (targetNorm.startsWith("onboarding") && currentNorm.startsWith("onboarding")) ||
                             (targetNorm === "" && !["admin", "shop", "delivery", "onboarding", "auth", "security-setup", "guest"].includes(firstSegment));

    // SPECIAL: If we are on the absolute root '/', we MUST push to the targetRoute 
    // to replace the Splash/Loading state, even if normalization says they are same.
    const isAtRoot = currentPath === "/" || currentPath === "";

    if ((currentNorm === targetNorm && !isAtRoot) || isInCorrectStack) {
       // All good
       return;
    }

    // 7. PERFORM NAVIGATION (Gated by Auth vs Stack Correction)
    if (isAuthRoute) {
        console.log(`🛡️ [Guard] Escaping Auth -> ${targetNorm}`);
        router.replace(targetRoute as any);
    } else if (!isNavigatingRef.current) {
        console.log(`🛡️ [Guard] Stack Correction: ${currentNorm} -> ${targetNorm}`);
        isNavigatingRef.current = true;
        router.replace(targetRoute as any);
        setTimeout(() => { isNavigatingRef.current = false; }, 800);
    }
  }, [isHydrated, status, pathname, segments, user, isVerified, isLocked]);

  return null;
}
