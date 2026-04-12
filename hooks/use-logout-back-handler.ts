import { useEffect } from 'react';
import { BackHandler, Alert } from 'react-native';
import { useAppSession } from '@/providers/AppSessionProvider';
import { useAppNavigation } from './use-app-navigation';

/**
 * Hook to prevent accidental logout on onboarding/waitlist screens.
 * Shows a confirmation alert when the user attempts to go back.
 */
export function useLogoutBackHandler() {
  const { status, signOut } = useAppSession();
  const { safeBack } = useAppNavigation();

  useEffect(() => {
    const onBackPress = () => {
      if (status !== 'authenticated') {
        return false; // Let default behavior take over if not logged in
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
      
      return true; // Handle it ourselves
    };

    // UI Back Button interceptor function (usage: <BackButton onPress={handleBack} />)
    const handleBack = () => {
        onBackPress();
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => backHandler.remove();
  }, [status, signOut]);

  // Return helper for manual UI back buttons
  return {
    handleAuthBack: () => {
        if (status === 'authenticated') {
            Alert.alert(
                "Logout Confirmation",
                "Are you sure you want to logout?",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Logout", style: "destructive", onPress: async () => await signOut() }
                ]
            );
        } else {
            safeBack();
        }
    }
  };
}
