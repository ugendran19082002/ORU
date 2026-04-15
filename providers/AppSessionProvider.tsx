import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Platform,
  DeviceEventEmitter,
  View,
  ActivityIndicator,
  AppState,
  AppStateStatus,
} from "react-native";

import { apiClient, setClientToken, SESSION_STORAGE_KEY } from "@/api/client";
import { authApi } from "@/api/authApi";
import { onboardingApi } from "@/api/onboardingApi";
import { userApi } from "@/api/userApi";
import { log } from "@/utils/logger";
import type {
  AppRole,
  AppUser,
  PersistedSession,
} from "@/types/session";
import { useSecurityStore } from "@/stores/securityStore";
import { PinEntryModal } from "@/components/security/PinEntryModal";
import { SessionContext, type SessionContextValue } from "./SessionContext";
import { AppRouteGuard } from "./RouteGuard";

// Re-export the hook from the shared context file so callers can import from either location
export { useAppSession } from "./SessionContext";

// ─── Session storage keys ──────────────────────────────────────────────────────
// Versioned to support future schema migrations without losing user sessions.
const SESSION_KEY = SESSION_STORAGE_KEY;       // 'thannigo_session_v1'
const LAST_PHONE_KEY = "thannigo_last_phone_v1";
const LAST_NAME_KEY = "thannigo_last_name_v1";

type NextStepData = {
  step_key: string;
  screen_route: string;
  title?: string;
} | null;

const defaultSession: PersistedSession = {
  user: null,
  access_token: null,
  refresh_token: null,
  preferredRole: null,
};

// ─── Storage helpers ───────────────────────────────────────────────────────────

async function readSession(): Promise<PersistedSession> {
  const raw =
    Platform.OS === "web"
      ? await AsyncStorage.getItem(SESSION_KEY)
      : await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return defaultSession;
  try {
    return { ...defaultSession, ...(JSON.parse(raw) as Partial<PersistedSession>) };
  } catch {
    return defaultSession;
  }
}

async function writeSession(value: PersistedSession): Promise<void> {
  const serialised = JSON.stringify(value);
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(SESSION_KEY, serialised);
  } else {
    await SecureStore.setItemAsync(SESSION_KEY, serialised);
  }
}

/** Map snake_case API response fields to the AppUser shape */
function mapRawUser(rawUser: Record<string, unknown>, base?: AppUser | null): AppUser {
  return {
    ...(base ?? {}),
    ...(rawUser as Partial<AppUser>),
    shopStatus:
      (rawUser.shop_status as string | undefined) ??
      (rawUser.shopStatus as string | undefined) ??
      base?.shopStatus ??
      'none',
    onboardingStatus:
      (rawUser.onboarding_status as string | undefined) ??
      (rawUser.onboardingStatus as string | undefined) ??
      base?.onboardingStatus ??
      'none',
    is_security_verified: rawUser.is_security_verified as boolean | undefined,
  } as AppUser;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<SessionContextValue['status']>("loading");
  const [isHydrated, setIsHydrated] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [preferredRole, setPreferredRoleState] = useState<AppRole | null>(null);
  const [isLocationVerified, setIsLocationVerified] = useState(false);
  const [nextStep, setNextStepState] = useState<NextStepData>(null);
  const [isSyncingShop, setIsSyncingShop] = useState(false);
  const [lastBgTimestamp, setLastBgTimestamp] = useState<number>(0);

  const {
    isLocked,
    setLocked,
    isVerified,
    setIsVerified,
    isPinEnabled,
    isBiometricsEnabled,
  } = useSecurityStore();
  const securityEnabled = isPinEnabled || isBiometricsEnabled;

  // ─── Boot hydration ────────────────────────────────────────────────────────

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        await useSecurityStore.getState().initialize();

        const session = await readSession();
        if (!active) return;

        if (session.access_token) {
          setClientToken(session.access_token);
          try {
            const res = await apiClient.get<{ data: Record<string, unknown> }>('/auth/me');
            const freshUser = mapRawUser(res.data.data, session.user);

            setUser(freshUser);
            setAccessToken(session.access_token);
            setRefreshToken(session.refresh_token);
            setPreferredRoleState(freshUser.role as AppRole);
            setNextStepState((res.data.data.next_step as NextStepData) ?? null);

            await useSecurityStore.getState().syncWithUser(freshUser);
            setStatus("authenticated");
          } catch (syncErr) {
            log.error('🛡️ [Session] Sync failed during init — using cached session:', syncErr);
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
        log.error('🛡️ [Session] Hydration error:', err);
        setStatus("anonymous");
      } finally {
        if (active) setIsHydrated(true);
      }
    }

    init();
    return () => { active = false; };
  }, []);

  // ─── App lock: background → foreground ────────────────────────────────────

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        setLastBgTimestamp(Date.now());
      }

      if (nextAppState === 'active') {
        const secondsSinceBg =
          lastBgTimestamp !== 0 ? (Date.now() - lastBgTimestamp) / 1000 : 0;

        log.info(`🛡️ [AppLock] Active — ${secondsSinceBg.toFixed(2)}s since background`);

        if (
          status === 'authenticated' &&
          securityEnabled &&
          lastBgTimestamp !== 0 &&
          secondsSinceBg > 5
        ) {
          log.info(`🔐 [AppLock] Force re-verification after ${Math.round(secondsSinceBg)}s`);
          setIsVerified(false);
        }

        setLastBgTimestamp(0);
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [status, lastBgTimestamp, securityEnabled, setIsVerified]);

  // ─── Merchant shop status sync ─────────────────────────────────────────────

  const refreshShopStatus = async () => {
    if (!user || user.role !== "shop_owner") return;
    if (isSyncingShop || !accessToken) return;

    setIsSyncingShop(true);
    try {
      const res = await onboardingApi.getMerchantShop();
      if (res.data) {
        const nextUser: AppUser = {
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
          nextStep,
        });
      }
    } catch (err: unknown) {
      const httpStatus = (err as { response?: { status?: number } }).response?.status;
      if (httpStatus === 404) {
        const nextUser: AppUser = { ...user, shopStatus: 'none', onboardingStatus: 'none' };
        setUser(nextUser);
        await writeSession({
          user: nextUser,
          access_token: accessToken,
          refresh_token: refreshToken,
          preferredRole,
          nextStep,
        });
      } else if (httpStatus === 401 || httpStatus === 403) {
        const nextUser: AppUser = { ...user, shopStatus: 'error', onboardingStatus: 'error' };
        setUser(nextUser);
        await writeSession({
          user: nextUser,
          access_token: accessToken,
          refresh_token: refreshToken,
          preferredRole,
          nextStep,
        });
        log.warn('🛡️ [Session] Shop sync stopped — 401/403 received');
      }
    } finally {
      setIsSyncingShop(false);
    }
  };

  const syncSession = async (providedUser?: AppUser) => {
    setIsSyncingShop(true);
    try {
      let freshRaw: Record<string, unknown>;
      if (providedUser) {
        freshRaw = providedUser as unknown as Record<string, unknown>;
      } else {
        const res = await apiClient.get<{ data: Record<string, unknown> }>('/auth/me');
        freshRaw = res.data.data;
      }

      const nextUser = mapRawUser(freshRaw, user);
      const nextNextStep = ('next_step' in freshRaw)
        ? (freshRaw.next_step as NextStepData)
        : (freshRaw.role !== user?.role ? null : nextStep);

      setUser(nextUser);
      setNextStepState(nextNextStep);

      await useSecurityStore.getState().syncWithUser(nextUser);
      await writeSession({
        user: nextUser,
        access_token: accessToken,
        refresh_token: refreshToken,
        preferredRole: nextUser.role as AppRole,
        nextStep: nextNextStep,
      });

      log.info(`🛡️ [Session] Sync complete. Role: ${nextUser.role}`);
    } catch (err) {
      log.error("[Session] Sync error:", err);
    } finally {
      setIsSyncingShop(false);
    }
  };

  // ─── Sign out ──────────────────────────────────────────────────────────────

  const handleSignOut = async () => {
    log.info("🛡️ [Session] Deep purge sign-out initiated...");

    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setIsVerified(false);
    setIsLocationVerified(false);
    setPreferredRoleState(null);
    setNextStepState(null);
    setStatus("anonymous");
    setClientToken(null);

    try {
      if (Platform.OS === "web") {
        await AsyncStorage.clear();
      } else {
        await SecureStore.deleteItemAsync(SESSION_KEY);
        await AsyncStorage.clear();
        await useSecurityStore.getState().reset();
      }
      log.info("✅ [Session] Deep purge complete.");
    } catch (err) {
      log.error("[Session] Sign-out storage clear failed:", err);
    }
  };

  const emergencyReset = async () => {
    log.warn("🚨 [Session] Emergency reset triggered!");
    setClientToken(null);
    try {
      if (Platform.OS === "web") {
        await AsyncStorage.clear();
      } else {
        await SecureStore.deleteItemAsync(SESSION_KEY);
        await AsyncStorage.clear();
      }
      await useSecurityStore.getState().reset();
    } catch (err) {
      log.error("[Session] Emergency reset failed:", err);
    }

    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setNextStepState(null);
    setIsVerified(false);
    setIsLocationVerified(false);
    setPreferredRoleState(null);
    setStatus("anonymous");
  };

  // ─── 401 reactive recovery ─────────────────────────────────────────────────

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('thannigo:unauthorized', () => {
      log.warn('🛡️ [Session] Unauthorized signal — forced logout.');
      handleSignOut();
    });
    return () => sub.remove();
  }, []);

  // ─── Context value ─────────────────────────────────────────────────────────

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
        const nextAccessToken = access_token ?? accessToken;
        setClientToken(nextAccessToken);

        const mappedUser = mapRawUser(rawUser as unknown as Record<string, unknown>);

        setUser(mappedUser);
        setAccessToken(nextAccessToken);
        setRefreshToken(refresh_token ?? refreshToken);
        setNextStepState(resNextStep ?? null);
        setPreferredRoleState(mappedUser.role as AppRole);
        setStatus(nextAccessToken ? "authenticated" : "anonymous");

        await writeSession({
          user: mappedUser,
          access_token: nextAccessToken,
          refresh_token: refresh_token ?? refreshToken,
          preferredRole: mappedUser.role as AppRole,
          nextStep: resNextStep ?? null,
        });

        if (mappedUser.phone) {
          await SecureStore.setItemAsync(LAST_PHONE_KEY, mappedUser.phone);
        }
        if (mappedUser.name) {
          await SecureStore.setItemAsync(LAST_NAME_KEY, mappedUser.name);
        }
      },

      signOut: handleSignOut,

      async updateUser(partialUser) {
        if (!user) return;
        try {
          const responsePayload = await userApi.updateProfile(partialUser);
          const userData = responsePayload.data as AppUser & {
            access_token?: string;
            refresh_token?: string;
            next_step?: NextStepData;
          };
          const nextAccessToken = userData.access_token ?? accessToken;

          setClientToken(nextAccessToken);
          const isRoleSwitch = userData.role !== user.role;
          const nextUser: AppUser = {
            ...user,
            ...(userData as Partial<AppUser>),
          };

          if (isRoleSwitch) {
            log.info('🔄 [Session] Role switch — clearing role-specific metadata');
            nextUser.shopStatus = 'none';
            nextUser.onboardingStatus = 'none';
            nextUser.onboarding_completed = false;
          }

          delete (nextUser as Record<string, unknown>).access_token;
          delete (nextUser as Record<string, unknown>).refresh_token;

          setUser(nextUser);
          setAccessToken(nextAccessToken);
          if (userData.refresh_token) setRefreshToken(userData.refresh_token);

          await writeSession({
            user: nextUser,
            access_token: nextAccessToken,
            refresh_token: userData.refresh_token ?? refreshToken,
            preferredRole: nextUser.role as AppRole,
            nextStep: ('next_step' in userData)
              ? userData.next_step ?? null
              : (isRoleSwitch ? null : nextStep),
          });
        } catch (err) {
          log.error("Failed to update user:", err);
          throw err;
        }
      },

      refreshShopStatus,
      syncSession,
      emergencyReset,
    }),
    [
      accessToken,
      refreshToken,
      isVerified,
      isLocationVerified,
      isHydrated,
      preferredRole,
      status,
      user,
      nextStep,
      isSyncingShop,
    ],
  );

  if (!isHydrated) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
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
            const deviceId = useSecurityStore.getState().getDeviceId();
            const response = await authApi.loginPin(user?.phone ?? '', pin, deviceId);
            if (response.status === 1) {
              setLocked(false);
              setIsVerified(true);
            } else {
              throw new Error(response.message || 'Invalid PIN');
            }
          } else {
            // Biometrics verified inside the modal
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
