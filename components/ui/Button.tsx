import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  icon,
  isLoading = false,
  disabled = false,
  className = '',
}: ButtonProps) {
  const baseClasses = "flex-row items-center justify-center rounded-xl";
  
  const variantClasses = {
    primary: "bg-blue-600 active:bg-blue-700",
    secondary: "bg-gray-200 active:bg-gray-300 dark:bg-gray-800 dark:active:bg-gray-700",
    outline: "border-2 border-blue-600 active:bg-blue-50 dark:active:bg-gray-900",
    ghost: "active:bg-gray-100 dark:active:bg-gray-800",
  };

  const sizeClasses = {
    sm: "px-3 py-2",
    md: "px-5 py-3",
    lg: "px-8 py-4",
  };

  const textVariantClasses = {
    primary: "text-white font-semibold flex-1 text-center",
    secondary: "text-gray-900 dark:text-gray-100 font-semibold flex-1 text-center",
    outline: "text-blue-600 font-semibold flex-1 text-center",
    ghost: "text-gray-700 dark:text-gray-300 font-semibold flex-1 text-center",
  };

  const currentVariantClass = variantClasses[variant];
  const currentSizeClass = sizeClasses[size];
  const currentTextClass = textVariantClasses[variant];
  
  const opacityClass = disabled || isLoading ? "opacity-50" : "opacity-100";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${currentVariantClass} ${currentSizeClass} ${opacityClass} ${className}`}
      activeOpacity={0.8}
    >
      {icon && !isLoading && (
        <Ionicons
          name={icon}
          size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20}
          className={variant === 'primary' ? 'text-white' : variant === 'outline' ? 'text-blue-600' : 'text-gray-900 dark:text-gray-100'}
        />
      )}
      {isLoading && (
        <ActivityIndicator 
          color={variant === 'primary' ? 'white' : '#2563eb'} 
          className="mr-2"
        />
      )}
      <Text className={currentTextClass}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
