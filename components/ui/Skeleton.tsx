import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';

const SHIMMER_START = '#E8EDF2';
const SHIMMER_END = '#F5F8FC';
const DURATION = 1000;

function useShimmer() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: DURATION, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: DURATION, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHIMMER_START, SHIMMER_END],
  });

  return backgroundColor;
}

// ── SkeletonLine ────────────────────────────────────────────────────────────

interface SkeletonLineProps {
  width?: number | `${number}%`;
  height?: number;
  style?: ViewStyle;
}

export function SkeletonLine({ width = '100%', height = 14, style }: SkeletonLineProps) {
  const backgroundColor = useShimmer();
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
  const backgroundColor = useShimmer();
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
  const backgroundColor = useShimmer();
  return (
    <View style={[styles.card, { height }, style]}>
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

const styles = StyleSheet.create({
  line: {
    borderRadius: 8,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: SHIMMER_START,
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
});
