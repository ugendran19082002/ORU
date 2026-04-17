import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { Shadow, Radius, thannigoPalette } from '@/constants/theme';
import { useAppTheme } from '@/providers/ThemeContext';

type ShadowLevel = 'none' | 'xs' | 'sm' | 'md' | 'lg';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'flat' | 'outline';
  /** Shadow depth. Defaults to 'sm' for elevated, 'none' for flat/outline. */
  shadow?: ShadowLevel;
}

export function Card({
  children,
  variant = 'elevated',
  shadow,
  style,
  ...props
}: CardProps) {
  const { colors } = useAppTheme();
  const resolvedShadow = shadow ?? (variant === 'elevated' ? 'sm' : 'none');

  const variantStyle = {
    elevated: { backgroundColor: colors.surface },
    flat: { backgroundColor: colors.background },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
  }[variant];

  return (
    <View
      style={[
        styles.base,
        variantStyle,
        Shadow[resolvedShadow],
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.xl,
    padding: 16,
  },
});
