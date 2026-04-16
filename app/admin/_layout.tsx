import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppSession } from '@/providers/AppSessionProvider';
import { View, ActivityIndicator } from 'react-native';

export default function AdminRootLayout() {
  const { user, status } = useAppSession();
  const router = useRouter();

  // Redundant local guard removed: RouteGuard in AppSessionProvider handles role redirection.


  // Ensure we have a user and they are an admin before rendering the stack.
  // We show a loading spinner if the user object is not yet available,
  // preventing a black screen during the transition.
  if (status === 'authenticated' && (!user || user.role !== 'admin')) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f9ff' }}>
        <ActivityIndicator size="large" color="#005d90" />
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


