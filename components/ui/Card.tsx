import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { Shadow } from '@/constants/theme';

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
  const resolvedShadow = shadow ?? (variant === 'elevated' ? 'sm' : 'none');

  return (
    <View
      style={[
        styles.base,
        variantStyles[variant],
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
    borderRadius: 24,
    padding: 16,
  },
});

const variantStyles = StyleSheet.create({
  elevated: {
    backgroundColor: '#FFFFFF',
  },
  flat: {
    backgroundColor: '#F5F9FF',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E0EAF5',
  },
});
