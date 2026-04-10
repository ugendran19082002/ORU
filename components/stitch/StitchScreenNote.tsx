import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getStitchAssetPath, stitchRegistry } from '@/utils/stitchRegistry';

type StitchScreenKey = keyof typeof stitchRegistry;

export function StitchScreenNote({
  screen,
  label,
}: {
  screen: StitchScreenKey;
  label?: string;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.kicker}>{label ?? 'OpenSpec + Stitch Source'}</Text>
      <Text style={styles.path}>{getStitchAssetPath(screen)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#E8F4FD',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ADEBF4',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  kicker: {
    color: '#005D90',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  path: {
    color: '#1A1A2E',
    fontSize: 12,
    fontWeight: '600',
  },
});
