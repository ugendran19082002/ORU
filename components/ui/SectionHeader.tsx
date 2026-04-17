import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { thannigoPalette, Typography } from '@/constants/theme';
import { useAppTheme } from '@/providers/ThemeContext';

interface SectionHeaderProps {
  title: string;
  /** Action link label (e.g. "View All") */
  actionLabel?: string;
  /** Action handler */
  onAction?: () => void;
  /** Accent color for the action text */
  accentColor?: string;
  style?: ViewStyle;
}

/**
 * Standard section header row: bold title on left, optional "View All" link on right.
 * Replaces the duplicate sectionHeaderRow/sectionHeaderTitle patterns.
 */
export function SectionHeader({
  title,
  actionLabel,
  onAction,
  accentColor,
  style,
}: SectionHeaderProps) {
  const { colors } = useAppTheme();
  const accent = accentColor ?? thannigoPalette.primary;

  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={[styles.action, { color: accent }]}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  action: {
    fontSize: 14,
    fontWeight: '700',
  },
});
