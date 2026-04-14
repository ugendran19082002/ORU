export type AppRole = 'customer' | 'shop_owner' | 'admin' | 'delivery' | 'guest';

export type SessionStatus = 'loading' | 'anonymous' | 'authenticated';

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
  shopStatus?: string;
  onboardingStatus?: string;
  adminNotes?: string;
  biometric_enabled?: boolean;
  security_pin_enabled?: boolean;
  security_pin?: string;
};

export type NextStepData = {
  step_key: string;
  screen_route: string;
  title?: string;
} | null;

export type PersistedSession = {
  user: AppUser | null;
  access_token: string | null;
  refresh_token: string | null;
  preferredRole: AppRole | null;
  nextStep?: NextStepData;
};
