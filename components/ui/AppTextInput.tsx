import React, { forwardRef } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type AppTextInputProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  /** Icon name from Ionicons shown on the left */
  leftIcon?: keyof typeof Ionicons.glyphMap;
  /** Icon name from Ionicons shown on the right (e.g. eye toggle) */
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
};

export const AppTextInput = forwardRef<TextInput, AppTextInputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      onRightIconPress,
      style,
      ...rest
    },
    ref,
  ) => {
    const hasError = Boolean(error);

    return (
      <View style={styles.wrapper}>
        {label ? <Text style={styles.label}>{label}</Text> : null}

        <View
          style={[
            styles.inputRow,
            hasError && styles.inputRowError,
          ]}
        >
          {leftIcon ? (
            <Ionicons
              name={leftIcon}
              size={18}
              color={hasError ? '#C0392B' : '#74777C'}
              style={styles.leftIcon}
            />
          ) : null}

          <TextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor="#94A3B8"
            {...rest}
          />

          {rightIcon ? (
            <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
              <Ionicons
                name={rightIcon}
                size={18}
                color={hasError ? '#C0392B' : '#74777C'}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {hasError ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : hint ? (
          <Text style={styles.hintText}>{hint}</Text>
        ) : null}
      </View>
    );
  },
);

AppTextInput.displayName = 'AppTextInput';

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0EAF5',
    borderRadius: 16,
    backgroundColor: '#F5F9FF',
    paddingHorizontal: 14,
    minHeight: 52,
  },
  inputRowError: {
    borderColor: '#C0392B',
    backgroundColor: '#FFEBEE',
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 10,
    padding: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A2E',
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#C0392B',
    fontWeight: '500',
  },
  hintText: {
    fontSize: 12,
    color: '#74777C',
  },
});
