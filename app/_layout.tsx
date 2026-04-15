import '../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AppSessionProvider } from '@/providers/AppSessionProvider';
import { NoInternetBanner } from '@/components/ui/NoInternetBanner';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/ui/ToastConfig';

// Suppress known SDK 53 informational warning inside Expo Go for Push Notifications
import { LogBox } from 'react-native';
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'Style property \'width\' is not supported by native animated module', 
]);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ErrorBoundary>
      <AppSessionProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="auth" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="enable-notifications" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="security-setup" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="order/[id]" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="order/confirmed" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="order/tracking" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="order/cancel" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="order/schedule" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="subscriptions" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="rewards" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="report-issue" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="emergency-help" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="search-map" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
              <Stack.Screen name="shop-alternatives" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="privacy-policy" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="terms" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="shop-detail/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="map-preview" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
              <Stack.Screen name="addresses" options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="edit-profile" options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="location" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
              <Stack.Screen name="shop" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="delivery" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="admin" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            </Stack>
            <NoInternetBanner />
            <Toast config={toastConfig} />
            <StatusBar style="auto" />
        </ThemeProvider>
      </AppSessionProvider>
    </ErrorBoundary>
  );
}
