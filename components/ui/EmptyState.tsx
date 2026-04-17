import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { thannigoPalette, Typography, Shadow, Radius } from '@/constants/theme';
import { useAppTheme } from '@/providers/ThemeContext';

interface EmptyStateProps {
  /** Ionicons icon name */
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  /** Optional CTA button */
  action?: {
    label: string;
    onPress: () => void;
    accentColor?: string;
  };
  style?: ViewStyle;
}

/**
 * Standardized empty state component used across all screens.
 * Replaces the 12+ inline emptyCard style objects scattered across the codebase.
 */
export function EmptyState({ icon, title, subtitle, action, style }: EmptyStateProps) {
  const { colors } = useAppTheme();
  const accentColor = action?.accentColor ?? thannigoPalette.primary;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface },
        Shadow.xs,
        style,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.background }]}>
        <Ionicons name={icon} size={40} color={colors.muted} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text>
      ) : null}
      {action ? (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: accentColor }]}
          onPress={action.onPress}
          activeOpacity={0.85}
        >
          <Text style={styles.actionLabel}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.xl,
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    ...Typography.h4,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.75,
  },
  actionBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.xl,
  },
  actionLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
});
