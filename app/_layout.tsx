import '../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Platform } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AppRouteGuard, AppSessionProvider } from '@/providers/AppSessionProvider';
import { NoInternetBanner } from '@/components/ui/NoInternetBanner';

// Suppress known SDK 53 informational warning inside Expo Go for Push Notifications
import { LogBox } from 'react-native';
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'Style property \'width\' is not supported by native animated module', // Fallback ignoring if hermes caches it briefly
]);

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ErrorBoundary>
      <AppSessionProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AppRouteGuard />
          <Stack screenOptions={{ headerShown: false }}>

            {/* AUTH & ONBOARDING */}
            <Stack.Screen name="auth" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="enable-notifications" options={{ headerShown: false, animation: 'fade' }} />

            {/* CUSTOMER TABS */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />

            {/* ORDER SCREENS */}
            <Stack.Screen name="order/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="order/confirmed" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="order/tracking" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="order/cancel" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="order/schedule" options={{ animation: 'slide_from_bottom' }} />

            {/* CUSTOMER SCREENS */}
            <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="subscriptions" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="rewards" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="report-issue" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="emergency-help" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="search-map" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            <Stack.Screen name="shop-alternatives" options={{ animation: 'slide_from_bottom' }} />
            
            {/* LEGAL SCREENS */}
            <Stack.Screen name="privacy-policy" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="terms" options={{ animation: 'slide_from_bottom' }} />

            {/* SHOP DETAIL — Customer view of a shop's products */}
            <Stack.Screen name="shop-detail/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />

            {/* SHARED SCREENS */}
            <Stack.Screen name="map-preview" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            <Stack.Screen name="addresses" options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="edit-profile" options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="location" options={{ headerShown: false, animation: 'slide_from_bottom' }} />

            {/* SHOP OWNER SCREENS */}
            <Stack.Screen name="shop" options={{ headerShown: false, animation: 'fade' }} />

            {/* DELIVERY SCREENS */}
            <Stack.Screen name="delivery" options={{ headerShown: false, animation: 'fade' }} />

            {/* ADMIN SCREENS */}
            <Stack.Screen name="admin" options={{ headerShown: false, animation: 'fade' }} />

            {/* MODAL */}
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />

          </Stack>
          <NoInternetBanner />
          <StatusBar style="auto" />
        </ThemeProvider>
      </AppSessionProvider>
    </ErrorBoundary>
  );
}
