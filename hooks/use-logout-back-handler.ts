import { useEffect, useCallback } from 'react';
import { BackHandler, Alert } from 'react-native';
import { useAppSession } from '@/providers/AppSessionProvider';
import { useAppNavigation } from './use-app-navigation';

/**
 * Hook to prevent accidental logout on onboarding/waitlist screens.
 * Shows a confirmation alert when the user attempts to go back.
 * Unifies Hardware Back (Android) and UI Back button logic.
 */
export function useLogoutBackHandler() {
  const { status, signOut } = useAppSession();
  const { safeBack } = useAppNavigation();

  const onBackPress = useCallback(() => {
    if (status !== 'authenticated') {
      safeBack();
      return true;
    }

    Alert.alert(
      "Logout Confirmation",
      "Are you sure you want to logout? You will need to sign in again to continue.",
      [
        { text: "Continue Work", style: "cancel", onPress: () => {} },
        { 
          text: "Yes, Logout", 
          style: "destructive", 
          onPress: async () => {
            await signOut();
          } 
        }
      ]
    );
    
    return true; // Consume event
  }, [status, signOut, safeBack]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => backHandler.remove();
  }, [onBackPress]);

  // Return helper for manual UI back buttons
  return {
    handleAuthBack: onBackPress
  };
}
