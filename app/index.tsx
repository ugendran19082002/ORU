import { View, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/providers/ThemeContext';

/**
 * Root index file.
 * This is the entry point for / which is handled by AppRouteGuard in _layout.tsx.
 * We render a simple loading state while the guard decides where to send the user.
 */
export default function RootIndex() {
  const { colors } = useAppTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

