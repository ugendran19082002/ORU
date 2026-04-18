import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/providers/ThemeContext';
import { useAppSession } from '@/providers/AppSessionProvider';
import { View, ActivityIndicator } from 'react-native';

import { Shadow, roleAccent, roleSurface } from '@/constants/theme';

const ADMIN_ACCENT = roleAccent.admin;
const ADMIN_SURF = roleSurface.admin;

export default function AdminRootLayout() {
  const { colors, isDark } = useAppTheme();
  const { user, status, isHydrated } = useAppSession();

  // Only render the admin Stack once the session is fully confirmed as admin.
  // This covers every transition state:
  //   - status 'loading' / 'anonymous' while signIn() state batches propagate
  //   - authenticated but user object not yet available
  //   - authenticated as a different role (RouteGuard will redirect away)
  // All of the above show the same spinner to prevent a black/blank screen.
  if (!isHydrated || status !== 'authenticated' || !user || user.role !== 'admin') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={ADMIN_ACCENT} />
      </View>
    );
  }


  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Detail/Stack screens accessible from 'More' */}
        <Stack.Screen name="users" options={{ headerShown: false }} />
        <Stack.Screen name="payouts" options={{ headerShown: false }} />
        <Stack.Screen name="refunds" options={{ headerShown: false }} />
        <Stack.Screen name="complaints" options={{ headerShown: false }} />
        <Stack.Screen name="growth" options={{ headerShown: false }} />
        <Stack.Screen name="coupons" options={{ headerShown: false }} />
        <Stack.Screen name="plans" options={{ headerShown: false }} />
        <Stack.Screen name="features" options={{ headerShown: false }} />
        <Stack.Screen name="master" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}


