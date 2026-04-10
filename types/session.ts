export type AppRole = 'customer' | 'shop' | 'admin' | 'delivery';

export type SessionStatus = 'loading' | 'anonymous' | 'authenticated';

export type AppUser = {
  id: string;
  name?: string;
  phone: string;
  role: AppRole;
};

export type PersistedSession = {
  user: AppUser | null;
  preferredRole: AppRole | null;
  biometricEnabled: boolean;
};
