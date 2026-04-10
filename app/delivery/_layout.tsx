import { Stack } from 'expo-router';
import React from 'react';

// Delivery flow is a full-screen Stack (Dashboard → Trip → OTP → Complete)
export default function DeliveryLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
