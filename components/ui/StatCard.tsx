import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Shadow, Typography, Radius, thannigoPalette } from '@/constants/theme';
import { useAppTheme } from '@/providers/ThemeContext';

type IconColorKey = 'primary' | 'secondary' | 'success' | 'warning' | 'error';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: IconColorKey;
  /** Tint the card background to match the icon color */
  tinted?: boolean;
  style?: ViewStyle;
}

const iconColorMap: Record<IconColorKey, { icon: string; bg: string }> = {
  primary:   { icon: thannigoPalette.primary,        bg: thannigoPalette.infoSoft },
  secondary: { icon: thannigoPalette.neutral,        bg: thannigoPalette.borderSoft },
  success:   { icon: thannigoPalette.success,        bg: thannigoPalette.successSoft },
  warning:   { icon: thannigoPalette.warning,        bg: '#FFF8E1' },
  error:     { icon: thannigoPalette.error,          bg: thannigoPalette.dangerSoft },
};

export function StatCard({ label, value, icon, iconColor = 'primary', tinted = false, style }: StatCardProps) {
  const { colors } = useAppTheme();
  const { icon: iconHex, bg } = iconColorMap[iconColor];

  return (
    <View
      style={[
        styles.card,
        Shadow.sm,
        { backgroundColor: tinted ? bg : colors.surface },
        style,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={22} color={iconHex} />
      </View>
      <View style={styles.textBlock}>
        <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: 16,
    gap: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    gap: 2,
  },
  value: {
    ...Typography.h3,
  },
  label: {
    ...Typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
