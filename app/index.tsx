import { View, ActivityIndicator } from 'react-native';

/**
 * Root index file.
 * This is the entry point for / which is handled by AppRouteGuard in _layout.tsx.
 * We render a simple loading state while the guard decides where to send the user.
 */
export default function RootIndex() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
      <ActivityIndicator size="large" color="#0077b6" />
    </View>
  );
}
