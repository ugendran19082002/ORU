import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roleAccent } from '@/constants/theme';
import type { AppRole } from '@/types/session';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'glass';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  /** When set, uses the role's accent colour as background and white text. Overrides `variant`. */
  role?: Exclude<AppRole, 'guest'>;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: BadgeSize;
  style?: ViewStyle;
}

const variantTokens: Record<BadgeVariant, { bg: string; text: string; border?: string }> = {
  primary:   { bg: '#E8F0FA', text: '#005D90' },
  secondary: { bg: '#F1F3F5', text: '#74777C' },
  success:   { bg: '#E8F5E9', text: '#2e7d32' },
  warning:   { bg: '#FFF8E1', text: '#E67E22' },
  error:     { bg: '#FFEBEE', text: '#C0392B' },
  outline:   { bg: 'transparent', text: '#74777C', border: '#E0EAF5' },
  glass:     { bg: 'rgba(255,255,255,0.2)', text: '#fff', border: 'rgba(255,255,255,0.3)' },
};

const sizeTokens: Record<BadgeSize, { px: number; py: number; fontSize: number; iconSize: number }> = {
  sm: { px: 6,  py: 2,  fontSize: 10, iconSize: 10 },
  md: { px: 10, py: 4,  fontSize: 12, iconSize: 12 },
  lg: { px: 12, py: 6,  fontSize: 14, iconSize: 14 },
};

export function Badge({ label, variant = 'primary', role, icon, size = 'md', style }: BadgeProps) {
  const sz = sizeTokens[size];

  const bg   = role ? roleAccent[role]   : variantTokens[variant].bg;
  const text = role ? '#fff'             : variantTokens[variant].text;
  const border = !role ? variantTokens[variant].border : undefined;

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: bg,
    paddingHorizontal: sz.px,
    paddingVertical: sz.py,
    ...(border ? { borderWidth: 1, borderColor: border } : {}),
    ...style,
  };

  return (
    <View style={containerStyle}>
      {icon && (
        <Ionicons name={icon} size={sz.iconSize} color={text} style={{ marginRight: 4 }} />
      )}
      <Text style={{ fontSize: sz.fontSize, fontWeight: '700', color: text, letterSpacing: 0.2 }}>
        {label}
      </Text>
    </View>
  );
}
