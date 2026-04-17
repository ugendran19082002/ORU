import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { Shadow, thannigoPalette } from '@/constants/theme';

interface BackButtonProps {
  style?: ViewStyle;
  iconColor?: ColorValue;
  iconSize?: number;
  fallback?: string;
  variant?: 'light' | 'dark' | 'transparent';
  onPress?: () => void;
  show?: boolean;
}

/** Centralizes safe navigation and provides consistent back-button styling. */
export const BackButton: React.FC<BackButtonProps> = ({
  style,
  iconColor,
  iconSize = 20,
  fallback = '/(tabs)',
  variant = 'light',
  onPress,
  show = true,
}) => {
  const { safeBack } = useAppNavigation();

  if (!show) return null;

  const handlePress = () => {
    if (onPress) onPress();
    else safeBack(fallback as any);
  };

  const bgMap: Record<string, string> = {
    light:       '#FFFFFF',
    dark:        thannigoPalette.darkText,
    transparent: 'transparent',
  };

  const resolvedIconColor = iconColor
    ?? (variant === 'dark' ? '#FFFFFF' : thannigoPalette.darkText);

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        { backgroundColor: bgMap[variant] },
        variant !== 'transparent' && Shadow.sm,
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <Ionicons name="arrow-back" size={iconSize} color={resolvedIconColor as string} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
