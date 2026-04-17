import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoleTheme } from '@/hooks/use-role-theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  disabled?: boolean;
  /** Override the accent color for primary/outline variants. Defaults to role accent. */
  accentColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  disabled = false,
  accentColor,
  style,
  textStyle,
}: ButtonProps) {
  const { accent } = useRoleTheme();
  const resolvedAccent = accentColor ?? accent;

  const sizeStyle = sizeMap[size];
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18;
  const isDisabled = disabled || isLoading;

  const containerStyle: ViewStyle = {
    ...baseContainer,
    ...sizeStyle.container,
    opacity: isDisabled ? 0.5 : 1,
    ...(variant === 'primary' && { backgroundColor: resolvedAccent }),
    ...(variant === 'secondary' && styles.secondary),
    ...(variant === 'outline' && { ...styles.outline, borderColor: resolvedAccent }),
    ...(variant === 'ghost' && styles.ghost),
    ...(variant === 'danger' && styles.danger),
    ...style,
  };

  const labelColor = (() => {
    if (variant === 'primary') return '#fff';
    if (variant === 'danger') return '#fff';
    if (variant === 'outline') return resolvedAccent;
    if (variant === 'secondary') return '#1A1A2E';
    return '#74777C';
  })();

  const labelStyle: TextStyle = {
    ...sizeStyle.text,
    color: labelColor,
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    ...textStyle,
  };

  const renderIcon = (position: 'left' | 'right') => {
    if (!icon || isLoading || iconPosition !== position) return null;
    return (
      <Ionicons
        name={icon}
        size={iconSize}
        color={labelColor}
        style={position === 'left' ? { marginRight: 6 } : { marginLeft: 6 }}
      />
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={containerStyle}
      activeOpacity={0.82}
    >
      {isLoading && (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? '#fff' : resolvedAccent}
          style={{ marginRight: 8 }}
        />
      )}
      {renderIcon('left')}
      <Text style={labelStyle}>{title}</Text>
      {renderIcon('right')}
    </TouchableOpacity>
  );
}

const baseContainer: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 16,
};

const sizeMap: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { paddingHorizontal: 12, paddingVertical: 8 },
    text: { fontSize: 13 },
  },
  md: {
    container: { paddingHorizontal: 20, paddingVertical: 13 },
    text: { fontSize: 15 },
  },
  lg: {
    container: { paddingHorizontal: 28, paddingVertical: 16 },
    text: { fontSize: 16 },
  },
};

const styles = StyleSheet.create({
  secondary: {
    backgroundColor: '#F1F4F9',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: '#C0392B',
  },
});
