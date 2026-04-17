import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '@/providers/ThemeContext';

function useShimmer() {
  const { isDark } = useAppTheme();
  const anim = useRef(new Animated.Value(0)).current;

  const shimmerStart = isDark ? '#1F2937' : '#E8EDF2';
  const shimmerEnd   = isDark ? '#2D3748' : '#F5F8FC';

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [shimmerStart, shimmerEnd],
  });

  return { backgroundColor, shimmerStart };
}

// ── SkeletonLine ────────────────────────────────────────────────────────────

interface SkeletonLineProps {
  width?: number | `${number}%`;
  height?: number;
  style?: ViewStyle;
}

export function SkeletonLine({ width = '100%', height = 14, style }: SkeletonLineProps) {
  const { backgroundColor } = useShimmer();
  return (
    <Animated.View
      style={[
        styles.line,
        { width: width as any, height, backgroundColor },
        style,
      ]}
    />
  );
}

// ── SkeletonCircle ──────────────────────────────────────────────────────────

interface SkeletonCircleProps {
  size?: number;
  style?: ViewStyle;
}

export function SkeletonCircle({ size = 48, style }: SkeletonCircleProps) {
  const { backgroundColor } = useShimmer();
  return (
    <Animated.View
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor }, style]}
    />
  );
}

// ── SkeletonCard ────────────────────────────────────────────────────────────

interface SkeletonCardProps {
  height?: number;
  style?: ViewStyle;
}

export function SkeletonCard({ height = 120, style }: SkeletonCardProps) {
  const { backgroundColor, shimmerStart } = useShimmer();
  return (
    <View style={[styles.card, { height, backgroundColor: shimmerStart }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.cardInner, { backgroundColor }]} />
    </View>
  );
}

// ── SkeletonRow — convenience: circle + two lines side by side ─────────────

export function SkeletonRow() {
  return (
    <View style={styles.row}>
      <SkeletonCircle size={44} />
      <View style={styles.rowLines}>
        <SkeletonLine width="60%" height={14} style={{ marginBottom: 8 }} />
        <SkeletonLine width="40%" height={12} />
      </View>
    </View>
  );
}

// ── SkeletonShopCard — matches the shop card layout ────────────────────────

export function SkeletonShopCard() {
  return (
    <View style={styles.shopCard}>
      <SkeletonCard height={160} style={{ borderRadius: 0, marginBottom: 0 }} />
      <View style={{ padding: 16, gap: 10 }}>
        <SkeletonLine width="70%" height={18} />
        <SkeletonLine width="45%" height={13} />
        <SkeletonLine width="100%" height={40} style={{ borderRadius: 12, marginTop: 4 }} />
      </View>
    </View>
  );
}

// ── SkeletonStatRow — 4-stat grid row ────────────────────────────────────

export function SkeletonStatRow() {
  return (
    <View style={styles.statGrid}>
      {[1, 2, 3, 4].map((k) => (
        <SkeletonCard key={k} height={96} style={{ width: '48%', flexGrow: 1, borderRadius: 20 }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    borderRadius: 8,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardInner: {
    borderRadius: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLines: {
    flex: 1,
  },
  shopCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#E8EDF2',
    marginBottom: 20,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
});
