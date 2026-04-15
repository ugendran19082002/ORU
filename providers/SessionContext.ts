/**
 * Session context definition — kept in its own file to break the circular
 * dependency between AppSessionProvider (which renders RouteGuard) and
 * RouteGuard (which needs the session hook).
 *
 * Import { useAppSession } from here in any component that needs session data.
 */

import { createContext, useContext } from 'react';
import type { AppRole, AppUser, SessionStatus } from '@/types/session';

type NextStepData = {
  step_key: string;
  screen_route: string;
  title?: string;
} | null;

export type SessionContextValue = {
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
    nextStep?: NextStepData;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<AppUser>) => Promise<void>;
  refreshShopStatus: () => Promise<void>;
  syncSession: (providedUser?: AppUser) => Promise<void>;
  emergencyReset: () => Promise<void>;
  nextStep: NextStepData;
  isSyncingShop: boolean;
};

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useAppSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useAppSession must be used inside AppSessionProvider');
  }
  return context;
}
