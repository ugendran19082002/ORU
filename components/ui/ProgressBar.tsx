import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoleTheme } from '@/hooks/use-role-theme';
import { Typography, thannigoPalette } from '@/constants/theme';

interface ProgressBarProps {
  progress: number; // 0–1
  label?: string;
  showPercentage?: boolean;
  /** Override gradient colours. Defaults to the current role's gradient. */
  colors?: [string, string];
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  label,
  showPercentage = false,
  colors,
  height = 10,
  style,
}: ProgressBarProps) {
  const { gradientStart, gradientEnd } = useRoleTheme();
  const resolvedColors: [string, string] = colors ?? [gradientStart, gradientEnd];
  const pct = Math.min(1, Math.max(0, progress));

  return (
    <View style={[styles.wrapper, style]}>
      {(label || showPercentage) && (
        <View style={styles.labelRow}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {showPercentage && (
            <Text style={[styles.pct, { color: resolvedColors[0] }]}>
              {Math.round(pct * 100)}%
            </Text>
          )}
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <LinearGradient
          colors={resolvedColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${pct * 100}%` as any }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    ...Typography.label,
    color: thannigoPalette.darkText,
  },
  pct: {
    ...Typography.label,
  },
  track: {
    width: '100%',
    backgroundColor: '#E0EAF5',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 9999,
  },
});
