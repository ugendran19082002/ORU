// ─── Roles ────────────────────────────────────────────────────────────────────

export type AppRole = 'customer' | 'shop_owner' | 'admin' | 'delivery' | 'guest';

// ─── Status enums ─────────────────────────────────────────────────────────────

/** Shop registration / onboarding lifecycle status */
export type ShopStatus =
  | 'none'
  | 'pending_review'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'error';

/** Onboarding completion status */
export type OnboardingStatus =
  | 'none'
  | 'in_progress'
  | 'submitted'
  | 'completed'
  | 'rejected'
  | 'error';

// ─── Session state ────────────────────────────────────────────────────────────

export type SessionStatus = 'loading' | 'anonymous' | 'authenticated';

// ─── User ─────────────────────────────────────────────────────────────────────

export type AppUser = {
  id: number;
  uuid: string;
  phone: string;
  name: string;
  email: string | null;
  role: AppRole;
  status: string;
  onboarding_completed: boolean;
  loyalty_points?: number | null;
  total_loyalty_points?: number | null;
  referral_code?: string | null;
  shopStatus?: ShopStatus;
  onboardingStatus?: OnboardingStatus;
  adminNotes?: string;
  biometric_enabled?: boolean;
  security_pin_enabled?: boolean;
  security_pin?: string;
  is_security_verified?: boolean;
};

// ─── Navigation next step ─────────────────────────────────────────────────────

export type NextStepData = {
  step_key: string;
  screen_route: string;
  title?: string;
} | null;

// ─── Persisted session ────────────────────────────────────────────────────────

export type PersistedSession = {
  user: AppUser | null;
  access_token: string | null;
  refresh_token: string | null;
  preferredRole: AppRole | null;
  nextStep?: NextStepData;
};
