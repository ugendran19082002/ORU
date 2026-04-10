import React from 'react';
import { Text, type TextProps, StyleSheet } from 'react-native';

export function ThemedText({ style, ...props }: TextProps & { type?: 'default' | 'defaultSemiBold' }) {
  return <Text {...props} style={[styles.defaultText, style]} />;
}

const styles = StyleSheet.create({
  defaultText: {
    color: '#1A1A2E',
    fontSize: 14,
  },
});
