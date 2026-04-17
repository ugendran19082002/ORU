import React, { forwardRef, useRef } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { thannigoPalette, Radius } from '@/constants/theme';
import { useAppTheme } from '@/providers/ThemeContext';

export type AppTextInputProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  /** Icon name from Ionicons shown on the left */
  leftIcon?: keyof typeof Ionicons.glyphMap;
  /** Icon name from Ionicons shown on the right (e.g. eye toggle) */
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  /** Optional role accent color used for focus ring */
  accentColor?: string;
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
      accentColor,
      style,
      onFocus,
      onBlur,
      ...rest
    },
    ref,
  ) => {
    const { colors, isDark } = useAppTheme();
    const hasError = Boolean(error);
    const borderAnim = useRef(new Animated.Value(0)).current;

    const focusColor = accentColor ?? thannigoPalette.primary;

    const handleFocus = (e: any) => {
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      Animated.timing(borderAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
      onBlur?.(e);
    };

    const borderColor = hasError
      ? thannigoPalette.error
      : borderAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [colors.border, focusColor],
        });

    const inputBg = hasError
      ? thannigoPalette.dangerSoft
      : isDark
      ? colors.surface
      : colors.background;

    return (
      <View style={styles.wrapper}>
        {label ? (
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        ) : null}

        <Animated.View
          style={[
            styles.inputRow,
            {
              borderColor,
              backgroundColor: inputBg,
            },
          ]}
        >
          {leftIcon ? (
            <Ionicons
              name={leftIcon}
              size={18}
              color={hasError ? thannigoPalette.error : colors.muted}
              style={styles.leftIcon}
            />
          ) : null}

          <TextInput
            ref={ref}
            style={[styles.input, { color: colors.text }, style]}
            placeholderTextColor={colors.muted}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...rest}
          />

          {rightIcon ? (
            <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
              <Ionicons
                name={rightIcon}
                size={18}
                color={hasError ? thannigoPalette.error : colors.muted}
              />
            </TouchableOpacity>
          ) : null}
        </Animated.View>

        {hasError ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : hint ? (
          <Text style={[styles.hintText, { color: colors.muted }]}>{hint}</Text>
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
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.xl,
    paddingHorizontal: 14,
    minHeight: 52,
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
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 12,
    color: thannigoPalette.error,
    fontWeight: '500',
  },
  hintText: {
    fontSize: 12,
  },
});
