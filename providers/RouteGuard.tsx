/**
 * AppRouteGuard
 *
 * Centralised navigation guard that enforces:
 *  1. Hydration gate  — waits until session is loaded
 *  2. Anonymous guard — redirects unauthenticated users to /auth
 *  3. Security gate   — blocks navigation until PIN/biometric verified
 *  4. Stack guard     — keeps each role inside its own route stack
 *  5. Back-button hardening (Android)
 *
 * The guard is rendered as a null-returning component inside AppSessionProvider
 * so it always has access to the session context.
 */

import { useCallback, useEffect, useRef } from 'react';
import { BackHandler, Platform } from 'react-native';
import { usePathname, useRouter, useSegments } from 'expo-router';

import { log } from '@/utils/logger';
import { useSecurityStore } from '@/stores/securityStore';
import { useAppSession } from './SessionContext';
import type { AppRole } from '@/types/session';

// ─── Route hierarchy ───────────────────────────────────────────────────────────
// Defines which URL prefixes belong to each role.
// The guard uses this to detect "already in the correct stack" without fragile
// string normalisation logic.

const ROLE_ROUTES: Record<AppRole, string[]> = {
  customer:   ['', 'tabs', 'order', 'orders', 'addresses', 'shop-detail', 'subscriptions', 'notifications', 'edit-profile', 'rewards', 'onboarding'],
  shop_owner: ['shop', 'onboarding'],
  admin:      ['admin'],
  delivery:   ['delivery'],
  guest:      ['auth'],
};

// Screens accessible regardless of role (profile editing, notifications, etc.)
const NEUTRAL_PREFIXES = new Set(['edit-profile', 'notifications', 'location', 'quick-login', 'terms', 'privacy-policy', 'report-issue', 'emergency-help', 'privacy-security', 'map-preview', 'search-map', 'addresses', 'forgot-pin', 'security-setup']);

// Screens that belong to the security / auth setup flow — guard should not redirect from these
const SECURITY_PREFIXES = new Set(['security-setup', 'location', 'quick-login']);

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Strip Expo Router group segments like (tabs) and leading slashes, return the first meaningful segment */
function firstSegment(path: string): string {
  return path
    .split('/')
    .filter((s) => s && !s.startsWith('('))
    .at(0) ?? '';
}

/** Return the canonical home route for the current user state */

// ─── Component ─────────────────────────────────────────────────────────────────

export function AppRouteGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();

  const {
    isHydrated,
    status,
    user,
  } = useAppSession();

  const {
    isLocked,
    setLocked,
    isVerified,
    isPinEnabled,
    isBiometricsEnabled,
    authenticateBiometrics,
  } = useSecurityStore();

  const securityEnabled = isPinEnabled || isBiometricsEnabled;

  // ── Guards against duplicate concurrent navigations ──
  const isNavigatingRef = useRef(false);
  // ── Prevents multiple biometric auth prompts firing simultaneously ──
  const biometricInProgressRef = useRef(false);

  // ─── Resolve where this user should live ──────────────────────────────────

  const resolveTargetRoute = useCallback((): string => {
    if (!user) return '/auth';

    // Professional roles bypass onboarding
    if (user.role === 'admin') return '/admin';
    if (user.role === 'delivery') return '/delivery';

    // Guest hasn't picked a role yet — keep them in auth flow
    if (user.role === 'guest') return '/auth/role';

    if (!user.onboarding_completed) {
      if (user.role === 'customer') return '/onboarding/customer';
      if (user.role === 'shop_owner') {
        if (
          user.shopStatus === 'pending_review' ||
          user.shopStatus === 'under_review'
        ) return '/onboarding/shop/waitlist';
        if (user.onboardingStatus === 'partially_rejected') return '/onboarding/shop';
        if (user.shopStatus === 'rejected') return '/onboarding/shop';
        return '/onboarding/shop';
      }
    }

    if (user.role === 'shop_owner') return '/shop';
    return '/(tabs)';
  }, [user]);

  // ─── Android hardware back-button hardening ───────────────────────────────

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const onBackPress = (): boolean => {
      const curFirst = (segments[0] as string) ?? '';
      const target = resolveTargetRoute();
      const targetFirst = firstSegment(target);

      if (status !== 'authenticated') return false;

      // Block navigating back into auth when authenticated
      if (curFirst === 'auth' || curFirst === '') {
        router.replace(target as never);
        return true;
      }

      // Prevent going back into onboarding once graduated
      if (curFirst === 'onboarding' && targetFirst !== 'onboarding') {
        router.replace(target as never);
        return true;
      }

      // Exit app when at root home
      if (curFirst === targetFirst && segments.length <= 1) {
        BackHandler.exitApp();
        return true;
      }

      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [status, segments, resolveTargetRoute]);

  // ─── Main guard effect ─────────────────────────────────────────────────────

  useEffect(() => {
    // 1. Wait for hydration
    if (!isHydrated || status === 'loading') return;

    const first = (segments[0] as string) ?? '';
    const currentPath = pathname ?? '';
    const isAuthRoute = first === 'auth';
    const isSecurityRoute = SECURITY_PREFIXES.has(first) || SECURITY_PREFIXES.has(currentPath.split('/')[1] ?? '');
    const isNeutralZone = NEUTRAL_PREFIXES.has(first);

    // 2. Security routes are always passthrough
    if (isSecurityRoute) return;

    // 3. Anonymous guard
    if (status === 'anonymous') {
      if (!isAuthRoute && first !== 'onboarding') {
        log.info('🛡️ [Guard] Anonymous → /auth');
        navigate('/auth');
      }
      return;
    }

    if (!user) return;

    // 4. Security gate — block until PIN/biometric confirmed
    if (securityEnabled && !isVerified && !isAuthRoute) {
      log.info('🛡️ [Guard] Gated — awaiting security verification');

      if (!isLocked) {
        if (isBiometricsEnabled && !biometricInProgressRef.current) {
          biometricInProgressRef.current = true;
          authenticateBiometrics().finally(() => {
            biometricInProgressRef.current = false;
          });
        } else if (!isBiometricsEnabled) {
          setLocked(true);
        }
      }
      return;
    }

    // 5. Stack guard
    const targetRoute = resolveTargetRoute();
    const targetFirst = firstSegment(targetRoute);

    // Already in the correct stack?
    const roleRoutes = ROLE_ROUTES[user.role] ?? [];
    const inCorrectStack =
      isNeutralZone ||
      roleRoutes.some((prefix) =>
        prefix === '' ? first === '' || !['admin', 'shop', 'delivery', 'onboarding', 'auth'].includes(first) : first === prefix || currentPath.startsWith(`/${prefix}`),
      );

    const isAtRoot = currentPath === '/' || currentPath === '';

    if (!isAtRoot && inCorrectStack) return;

    // 6. Perform navigation
    if (isAuthRoute) {
      log.info(`🛡️ [Guard] Escaping auth → ${targetFirst}`);
      navigate(targetRoute);
    } else if (!isNavigatingRef.current) {
      log.info(`🛡️ [Guard] Stack correction: ${first || '/'} → ${targetFirst}`);
      navigate(targetRoute);
    }

    function navigate(path: string) {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;
      router.replace(path as never);
      // Release the lock after the navigation animation settles
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 600);
    }
  }, [isHydrated, status, pathname, segments, user, isVerified, isLocked, securityEnabled]);

  return null;
}
