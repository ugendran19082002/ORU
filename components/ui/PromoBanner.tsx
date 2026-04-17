import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from './Badge';
import { useRoleTheme } from '@/hooks/use-role-theme';
import { Shadow, Typography } from '@/constants/theme';

interface PromoBannerProps {
  title: string;
  subtitle: string;
  ctaLabel?: string;
  badgeLabel?: string;
  badgeIcon?: keyof typeof Ionicons.glyphMap;
  ctaIcon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  style?: ViewStyle;
}

export function PromoBanner({
  title,
  subtitle,
  ctaLabel = 'Reorder Now',
  badgeLabel = 'Active Hydration',
  badgeIcon = 'water',
  ctaIcon = 'refresh',
  onPress,
  style,
}: PromoBannerProps) {
  const { gradientStart, gradientEnd, accent } = useRoleTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.wrapper, Shadow.md, style]}
    >
      <LinearGradient
        colors={[gradientStart, gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.decor} pointerEvents="none">
          <Ionicons name="water" size={220} color="rgba(255,255,255,0.08)" />
        </View>

        <View style={styles.content}>
          <Badge label={badgeLabel} variant="glass" icon={badgeIcon} size="sm" style={styles.badge} />

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.cta}>
            <Ionicons name={ctaIcon} size={18} color={accent} style={{ marginRight: 8 }} />
            <Text style={[styles.ctaText, { color: accent }]}>{ctaLabel}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradient: {
    padding: 28,
    position: 'relative',
  },
  decor: {
    position: 'absolute',
    right: -32,
    bottom: -32,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  badge: {
    marginBottom: 16,
  },
  title: {
    ...Typography.h2,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 24,
    maxWidth: 240,
    lineHeight: 22,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    ...Shadow.sm,
  },
  ctaText: {
    ...Typography.label,
    fontWeight: '800',
  },
});
