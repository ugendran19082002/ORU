import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppSession } from '@/providers/AppSessionProvider';
import { View, ActivityIndicator } from 'react-native';

export default function AdminRootLayout() {
  const { user, status, isHydrated } = useAppSession();

  // Block rendering until session is fully hydrated — prevents blank/black screen
  // during the async transition from OTP verification into the admin stack.
  if (!isHydrated || status === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f9ff' }}>
        <ActivityIndicator size="large" color="#ba1a1a" />
      </View>
    );
  }

  // Authenticated but wrong role — RouteGuard is redirecting, show spinner to avoid flash.
  if (status === 'authenticated' && (!user || user.role !== 'admin')) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f9ff' }}>
        <ActivityIndicator size="large" color="#ba1a1a" />
      </View>
    );
  }


  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
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


