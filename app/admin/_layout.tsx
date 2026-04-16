import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppSession } from '@/providers/AppSessionProvider';
import { View, ActivityIndicator } from 'react-native';

export default function AdminRootLayout() {
  const { user, status } = useAppSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'anonymous' || (status === 'authenticated' && user?.role !== 'admin')) {
      router.replace('/auth');
    }
  }, [status, user, router]);

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#005d90" />
      </View>
    );
  }

  // Prevent flash of content for non-admins
  if (user?.role !== 'admin') {
    return null;
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


