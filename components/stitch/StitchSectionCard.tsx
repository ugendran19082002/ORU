import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function StitchSectionCard({
  title,
  copy,
  accent = '#0077B6',
}: {
  title: string;
  copy: string;
  accent?: string;
}) {
  return (
    <View style={[styles.card, { borderLeftColor: accent }]}>
      <Text style={[styles.title, { color: accent }]}>{title}</Text>
      <Text style={styles.copy}>{copy}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    gap: 8,
    borderLeftWidth: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  copy: {
    color: '#74777C',
    lineHeight: 20,
  },
});
