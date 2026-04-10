import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StitchScreenNote } from '@/components/stitch/StitchScreenNote';
import { stitchRegistry } from '@/utils/stitchRegistry';

type StitchScreenKey = keyof typeof stitchRegistry;

export function StitchScreenShell({
  title,
  subtitle,
  accent = '#0077B6',
  screen,
  onBack,
  rightAction,
  children,
}: {
  title: string;
  subtitle?: string;
  accent?: string;
  screen: StitchScreenKey;
  onBack: () => void;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={18} color={accent} />
          </TouchableOpacity>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {rightAction ?? <View style={styles.iconBtn} />}
        </View>

        <StitchScreenNote screen={screen} />
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9FF' },
  content: { padding: 20, gap: 16, paddingBottom: 80 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { flex: 1 },
  title: { fontSize: 24, fontWeight: '900', color: '#1A1A2E' },
  subtitle: { color: '#74777C', marginTop: 3, lineHeight: 18 },
});
