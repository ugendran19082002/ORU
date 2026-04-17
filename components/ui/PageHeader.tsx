import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { thannigoPalette, Typography, Radius, Shadow } from '@/constants/theme';
import { useAppTheme } from '@/providers/ThemeContext';

interface PageHeaderProps {
  title: string;
  /** Optional subtitle shown below title */
  subtitle?: string;
  /** Override back destination route (defaults to router.back()) */
  fallback?: string;
  /** Right-side action */
  action?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    label?: string;
  };
  /** Accent color for back button and action */
  accentColor?: string;
  style?: ViewStyle;
  /** Hide the back button (for modal-style screens) */
  hideBack?: boolean;
}

/**
 * Standard sub-screen header with back button, title, and optional action.
 * Replaces the ad-hoc View + BackButton patterns across 40+ sub-screens.
 */
export function PageHeader({
  title,
  subtitle,
  fallback,
  action,
  accentColor,
  style,
  hideBack = false,
}: PageHeaderProps) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const accent = accentColor ?? thannigoPalette.primary;

  const handleBack = () => {
    if (fallback) {
      router.push(fallback as any);
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderBottomColor: colors.border },
        style,
      ]}
    >
      {/* Back button */}
      {!hideBack ? (
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.background }]}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={accent} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 40 }} />
      )}

      {/* Title block */}
      <View style={styles.center}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.muted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Right action */}
      {action ? (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.background }]}
          onPress={action.onPress}
          activeOpacity={0.7}
        >
          {action.label ? (
            <Text style={[styles.actionLabel, { color: accent }]}>{action.label}</Text>
          ) : (
            <Ionicons name={action.icon} size={20} color={accent} />
          )}
        </TouchableOpacity>
      ) : (
        <View style={{ width: 40 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    ...Typography.h4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 1,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
});
