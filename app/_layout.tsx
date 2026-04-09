import '../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Platform } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AppStateProvider } from '@/hooks/use-app-state';

export const unstable_settings = {
  // Start from auth welcome screen
  anchor: 'auth',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  console.log('📍 [APP] RootLayout mounted', {
    platform: Platform.OS,
    isDev: __DEV__,
  });

  return (
    <ErrorBoundary>
      <AppStateProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
          {/* AUTH FLOW — entry point */}
          <Stack.Screen name="auth" options={{ headerShown: false, animation: 'fade' }} />

          {/* CUSTOMER STACK ROUTES */}
          <Stack.Screen name="(customer)" options={{ headerShown: false, animation: 'slide_from_right' }} />

          {/* CUSTOMER TABS */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />

          {/* ORDER SCREENS */}
          <Stack.Screen name="order/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="order/tracking" options={{ animation: 'slide_from_right' }} />

          {/* DELIVERY FLOW */}
          <Stack.Screen name="delivery" options={{ headerShown: false, animation: 'fade' }} />

          {/* ADDITIONAL SCREENS */}
          <Stack.Screen name="map-preview" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="addresses" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="edit-profile" options={{ headerShown: false, animation: 'slide_from_right' }} />

          {/* SHOP OWNER SCREENS */}
          <Stack.Screen name="shop" options={{ headerShown: false, animation: 'fade' }} />

          {/* ADMIN SCREENS */}
          <Stack.Screen name="admin" options={{ headerShown: false, animation: 'fade' }} />

          {/* MODAL */}
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AppStateProvider>
    </ErrorBoundary>
  );
}
