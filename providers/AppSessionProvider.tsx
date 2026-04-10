import * as SecureStore from 'expo-secure-store';
import { usePathname, useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '@/utils/notifications';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

import type { AppRole, AppUser, PersistedSession, SessionStatus } from '@/types/session';

const SESSION_KEY = 'thannigo_session';

type SessionContextValue = {
  status: SessionStatus;
  isHydrated: boolean;
  user: AppUser | null;
  preferredRole: AppRole | null;
  biometricEnabled: boolean;
  isBiometricVerified: boolean;
  setIsBiometricVerified: (verified: boolean) => void;
  setPreferredRole: (role: AppRole | null) => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  signIn: (params: { role: AppRole; phone: string; name?: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const defaultSession: PersistedSession = {
  user: null,
  preferredRole: null,
  biometricEnabled: false,
};

async function readSession() {
  const raw = Platform.OS === 'web'
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
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(value));
  } else {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(value));
  }
}

export function AppSessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [isHydrated, setIsHydrated] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [preferredRole, setPreferredRoleState] = useState<AppRole | null>(null);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [isBiometricVerified, setIsBiometricVerified] = useState(false);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      const session = await readSession();
      if (!active) return;

      setUser(session.user);
      setPreferredRoleState(session.preferredRole);
      setBiometricEnabledState(session.biometricEnabled);
      setStatus(session.user ? 'authenticated' : 'anonymous');
      setIsHydrated(true);
    }

    hydrate();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      isHydrated,
      user,
      preferredRole,
      biometricEnabled,
      async setPreferredRole(role) {
        const next = { user, preferredRole: role, biometricEnabled };
        setPreferredRoleState(role);
        await writeSession(next);
      },
      async setBiometricEnabled(enabled) {
        const next = { user, preferredRole, biometricEnabled: enabled };
        setBiometricEnabledState(enabled);
        await writeSession(next);
      },
      async signIn({ role, phone, name }) {
        const nextUser: AppUser = {
          id: `${role}-${phone}`,
          name,
          phone,
          role,
        };
        setUser(nextUser);
        setPreferredRoleState(role);
        setStatus('authenticated');
        await writeSession({
          user: nextUser,
          preferredRole: role,
          biometricEnabled,
        });
      },
      async signOut() {
        setUser(null);
        setStatus('anonymous');
        await writeSession({
          user: null,
          preferredRole,
          biometricEnabled,
        });
      },
      isBiometricVerified,
      setIsBiometricVerified,
    }),
    [biometricEnabled, isBiometricVerified, isHydrated, preferredRole, status, user]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useAppSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useAppSession must be used inside AppSessionProvider');
  }
  return context;
}

export function AppRouteGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const { isHydrated, status, user, biometricEnabled, isBiometricVerified, setIsBiometricVerified } = useAppSession() as any;

  useEffect(() => {
    if (!isHydrated) return;

    const firstSegment = segments[0] ?? '';
    const isAuthRoute = firstSegment === 'auth';
    const isOnboardingRoute = firstSegment === 'onboarding';
    
    // Anonymous User Handling
    if (status === 'anonymous') {
      if (!isAuthRoute && !isOnboardingRoute) {
        console.log('🛡️ [Guard] Redirecting anonymous user to /auth');
        router.replace('/auth');
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
            promptMessage: 'Unlock ThanniGo',
            fallbackLabel: 'Use PIN',
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
      if (user.role !== 'admin' && firstSegment !== 'location' && firstSegment !== 'enable-notifications') {
        const { status: locStatus } = await Location.getForegroundPermissionsAsync();
        if (locStatus !== 'granted') {
          console.log('🛡️ [Guard] Location not granted: Redirecting to /location');
          router.replace('/location');
          return;
        }
      }

      // 3. Notification Check
      if (firstSegment !== 'enable-notifications' && firstSegment !== 'location') {
        const { status: notifStatus } = await Notifications.getPermissionsAsync();
        if (notifStatus !== 'granted') {
          console.log('🛡️ [Guard] Notifications not granted: Redirecting to /enable-notifications');
          router.replace({ pathname: '/enable-notifications', params: { next: pathname } } as any);
          return;
        }
      }

      // Role-based target determination
      let target: any = '/(tabs)';
      if (user.role === 'shop') target = '/shop';
      else if (user.role === 'admin') target = '/admin';
      else if (user.role === 'delivery') target = '/delivery';

      // Auth Route Escape (send logged in users away from login)
      if (isAuthRoute) {
        console.log(`🛡️ [Guard] Logged-in user on auth route: Redirecting to ${target}`);
        router.replace(target);
        return;
      }

      // Role-based Access Control
      const isIllegalCustomer = user.role === 'customer' && (segments[0] === 'shop' || segments[0] === 'admin' || segments[0] === 'delivery');
      const isIllegalShop = user.role === 'shop' && segments[0] === 'admin';
      const isIllegalAdmin = user.role === 'admin' && (segments[0] === '(tabs)' || segments[0] === 'shop' || segments[0] === 'delivery');
      const isIllegalDelivery = user.role === 'delivery' && (segments[0] === '(tabs)' || segments[0] === 'shop' || segments[0] === 'admin');

      if (isIllegalCustomer || isIllegalShop || isIllegalAdmin || isIllegalDelivery) {
        console.log('🛡️ [Guard] Illegal route access: Redirecting to', target);
        router.replace(target);
        return;
      }

      // Root Path Handling
      if (pathname === '/') {
        console.log(`🛡️ [Guard] Root hit: Redirecting to ${target}`);
        router.replace(target);
      }
    };

    runChecklist();
  }, [isHydrated, pathname, router, segments, status, user, biometricEnabled, isBiometricVerified]);

  return null;
}
