import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export type AppCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  /** Accent colour for the checked state. Defaults to brand primary. */
  color?: string;
};

export function AppCheckbox({
  checked,
  onChange,
  label,
  disabled = false,
  color = '#0077B6',
}: AppCheckboxProps) {
  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(!checked);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.row}
      activeOpacity={0.7}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
    >
      <View
        style={[
          styles.box,
          checked && { backgroundColor: color, borderColor: color },
          disabled && styles.boxDisabled,
        ]}
      >
        {checked ? (
          <Ionicons name="checkmark" size={14} color="#fff" />
        ) : null}
      </View>

      {label ? (
        <Text style={[styles.label, disabled && styles.labelDisabled]}>
          {label}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxDisabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 14,
    color: '#1A1A2E',
    flexShrink: 1,
  },
  labelDisabled: {
    opacity: 0.5,
  },
});
