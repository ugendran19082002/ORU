import { useEffect } from 'react';
import { BackHandler, Alert } from 'react-native';
import { useRouter, useSegments } from 'expo-router';

/**
 * Ensures the Android physical back button honors the Expo Router stack.
 * Prevents the app from abruptly exiting if there is history.
 * @param customFallback Optional callback if you want to override the back behavior
 */
export function useAndroidBackHandler(customFallback?: () => void) {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const onBackPress = () => {
      if (customFallback) {
        customFallback();
        return true; 
      }
      
      const isRoot = !segments || segments.length <= 1;

      if (router.canGoBack() && !isRoot) {
        router.back();
        return true; 
      }
      
      // On root screens, show exit confirmation as per best practices
      Alert.alert("Exit ThanniGo", "Do you want to close the app?", [
        { text: "No", style: "cancel" },
        { text: "Yes", onPress: () => BackHandler.exitApp() }
      ]);
      
      return true; // We handled it by showing the alert
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => backHandler.remove();
  }, [router, customFallback]);
}
