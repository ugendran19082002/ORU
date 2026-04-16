import { Stack } from "expo-router";

/**
 * Shop root layout — Stack navigator.
 *
 * The four main tab screens live in the nested (tabs) group.
 * All other shop screens are Stack screens that push onto the navigation
 * history, so the hardware/UI back button always returns to the correct
 * previous screen instead of jumping to Home.
 */
export default function ShopLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      {/* Nested tabs (index / inventory / earnings / settings) */}
      <Stack.Screen name="(tabs)" options={{ animation: "none" }} />

      {/* Sub-screens — each push onto the stack */}
      <Stack.Screen name="order/[id]" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="delivery-fleet" />
      <Stack.Screen name="manual-order" />
      <Stack.Screen name="promotions" />
      <Stack.Screen name="delivery" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="vendor-register" />
      <Stack.Screen name="subscription-plans" />
    </Stack>
  );
}
