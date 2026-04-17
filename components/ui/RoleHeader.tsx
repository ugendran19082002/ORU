import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Shadow, Typography, Radius, roleAccent, roleGradients, thannigoPalette } from '@/constants/theme';
import { Logo } from '@/components/ui/Logo';
import type { AppRole } from '@/types/session';

interface RoleHeaderProps {
  role: AppRole;
  title: string;
  subtitle?: string;
  onNotif?: () => void;
  onSettings?: () => void;
  /** Optional slot for extra right-side content (e.g. location chip) */
  rightSlot?: React.ReactNode;
  /** Whether to show a notification red dot */
  hasNotif?: boolean;
  style?: ViewStyle;
}

/**
 * Unified dashboard header component used by all role dashboards.
 * Automatically uses the correct accent/gradient for the given role.
 */
export function RoleHeader({
  role,
  title,
  subtitle,
  onNotif,
  onSettings,
  rightSlot,
  hasNotif = false,
  style,
}: RoleHeaderProps) {
  const accent = roleAccent[role] ?? thannigoPalette.primary;

  return (
    <View style={[styles.container, style]}>
      {/* LEFT: Brand + role label */}
      <View style={styles.left}>
        <View style={styles.brandRow}>
          <Logo size="sm" />
          <Text style={styles.brandName}>ThanniGo</Text>
        </View>
        <Text style={[styles.roleLabel, { color: accent }]}>
          {title.toUpperCase()}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* RIGHT: action buttons + custom slot */}
      <View style={styles.right}>
        {rightSlot}
        {onSettings && (
          <TouchableOpacity
            style={[styles.iconBtn, { ...Shadow.xs }]}
            onPress={onSettings}
            activeOpacity={0.8}
          >
            <Ionicons name="settings-outline" size={20} color={accent} />
          </TouchableOpacity>
        )}
        {onNotif && (
          <TouchableOpacity
            style={[styles.iconBtn, { ...Shadow.xs }]}
            onPress={onNotif}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={22} color={accent} />
            {hasNotif && <View style={[styles.notifDot, { backgroundColor: accent }]} />}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: thannigoPalette.surface,
    borderBottomWidth: 1,
    borderBottomColor: thannigoPalette.borderSoft,
  },
  left: {
    gap: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    ...Typography.h4,
    color: thannigoPalette.darkText,
    letterSpacing: -0.5,
  },
  roleLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginTop: 1,
  },
  subtitle: {
    fontSize: 11,
    color: thannigoPalette.neutral,
    fontWeight: '500',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: thannigoPalette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: thannigoPalette.borderSoft,
  },
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: thannigoPalette.surface,
  },
});
