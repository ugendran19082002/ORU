import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import type { AppRole, AppUser, PersistedSession, SessionStatus } from '@/types/session';

const SESSION_KEY = '@thannigo/session';

type SessionContextValue = {
  status: SessionStatus;
  isHydrated: boolean;
  user: AppUser | null;
  preferredRole: AppRole | null;
  biometricEnabled: boolean;
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
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return defaultSession;

  try {
    return { ...defaultSession, ...JSON.parse(raw) } as PersistedSession;
  } catch {
    return defaultSession;
  }
}

async function writeSession(value: PersistedSession) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(value));
}

export function AppSessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [isHydrated, setIsHydrated] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [preferredRole, setPreferredRoleState] = useState<AppRole | null>(null);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);

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
    }),
    [biometricEnabled, isHydrated, preferredRole, status, user]
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
  const { isHydrated, status, user } = useAppSession();

  useEffect(() => {
    if (!isHydrated) return;

    const firstSegment = segments[0] ?? '';
    const isAuthRoute = firstSegment === 'auth';
    const isCustomerTabs = firstSegment === '(tabs)';
    const isShopRoute = firstSegment === 'shop';
    const isAdminRoute = firstSegment === 'admin';
    const isDeliveryRoute = firstSegment === 'delivery';

    if (status === 'anonymous') {
      if (!isAuthRoute) {
        router.replace('/auth');
      }
      return;
    }

    if (!user) return;

    if (isAuthRoute) {
      if (user.role === 'shop') router.replace('/shop');
      else if (user.role === 'admin') router.replace('/admin');
      else if (user.role === 'delivery') router.replace('/delivery');
      else router.replace('/(tabs)');
      return;
    }

    if (user.role === 'customer' && (isShopRoute || isAdminRoute || isDeliveryRoute)) {
      router.replace('/(tabs)');
      return;
    }

    if (user.role === 'shop' && isAdminRoute) {
      router.replace('/shop');
      return;
    }

    if (user.role === 'admin' && (isCustomerTabs || isShopRoute || isDeliveryRoute)) {
      router.replace('/admin');
      return;
    }

    if (user.role === 'delivery' && (isCustomerTabs || isShopRoute || isAdminRoute)) {
      router.replace('/delivery');
      return;
    }

    if (pathname === '/') {
      if (user.role === 'shop') router.replace('/shop');
      else if (user.role === 'admin') router.replace('/admin');
      else if (user.role === 'delivery') router.replace('/delivery');
      else router.replace('/(tabs)');
    }
  }, [isHydrated, pathname, router, segments, status, user]);

  return null;
}
