import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppNavigation } from '@/hooks/use-app-navigation';

interface BackButtonProps {
  style?: ViewStyle;
  iconColor?: ColorValue;
  iconSize?: number;
  fallback?: string;
  variant?: 'light' | 'dark' | 'transparent';
  onPress?: () => void;
  show?: boolean;
}

/**
 * Premium BackButton Component
 * Centralizes the safe navigation logic for the entire app.
 */
export const BackButton: React.FC<BackButtonProps> = ({ 
  style, 
  iconColor, 
  iconSize = 22,
  fallback = "/(tabs)", 
  variant = 'light',
  onPress,
  show = true
}) => {
  const { safeBack } = useAppNavigation();
  
  if (!show) return null;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      safeBack(fallback as any);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'dark':
        return { backgroundColor: '#1e293b' };
      case 'transparent':
        return { backgroundColor: 'transparent' };
      case 'light':
      default:
        return { backgroundColor: '#f8fafc' };
    }
  };

  const getIconColor = () => {
    if (iconColor) return iconColor;
    return variant === 'dark' ? 'white' : '#0f172a';
  };

  return (
    <TouchableOpacity 
      style={[styles.backBtn, getVariantStyles(), style]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons name="arrow-back" size={iconSize} color={getIconColor()} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
