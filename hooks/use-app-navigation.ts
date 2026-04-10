import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/**
 * Best Practice Navigation Hook for ThanniGo
 * Provides a 'safeBack' method to prevent 'GO_BACK' unhandled action errors.
 */
export function useAppNavigation() {
  const router = useRouter();

  /**
   * Attempts to go back. If no history exists, replaces current route with fallback.
   * @param fallback The route to replace if history is empty. Defaults to Home tab.
   */
  const safeBack = useCallback((fallback: string = '/(tabs)' as any) => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback as any);
    }
  }, [router]);

  return {
    ...router,
    safeBack,
  };
}
