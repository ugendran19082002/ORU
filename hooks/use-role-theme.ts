import { useAppSession } from '@/providers/SessionContext';
import { roleAccent, roleGradients, roleSurface } from '@/constants/theme';
import type { AppRole } from '@/types/session';

export type RoleTheme = {
  accent: string;
  gradientStart: string;
  gradientEnd: string;
  surface: string;
  role: AppRole;
};

const FALLBACK: AppRole = 'customer';

/**
 * Returns role-specific design tokens based on the signed-in user's preferredRole.
 * Falls back to 'customer' colours when no role is available (e.g. during auth flow).
 *
 * Usage:
 *   const { accent, gradientStart, gradientEnd, surface } = useRoleTheme();
 */
export function useRoleTheme(): RoleTheme {
  const { preferredRole } = useAppSession();
  const role: AppRole = preferredRole ?? FALLBACK;

  return {
    role,
    accent: roleAccent[role],
    gradientStart: roleGradients[role].start,
    gradientEnd: roleGradients[role].end,
    surface: roleSurface[role],
  };
}
