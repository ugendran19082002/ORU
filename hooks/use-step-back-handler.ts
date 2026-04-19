import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';

/**
 * Hook to handle hardware back button on multi-step screens.
 * Redirects the user to a specified dashboard/index route.
 */
export function useStepBackHandler(fallbackRoute: string) {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace(fallbackRoute as any);
        return true; // Consume the event
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        subscription.remove();
      };
    }, [router, fallbackRoute])
  );
}
