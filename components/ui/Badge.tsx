import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'glass';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Badge({ 
  label, 
  variant = 'primary', 
  icon, 
  size = 'md', 
  className = '' 
}: BadgeProps) {
  const variantClasses = {
    primary: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300',
    secondary: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    success: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300',
    warning: 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300',
    error: 'bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300',
    outline: 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300',
    glass: 'bg-white/20 dark:bg-black/20 backdrop-blur-md text-white border border-white/30',
  };

  const textSizes = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14,
  };

  const currentVariant = variantClasses[variant];
  const currentTextSize = textSizes[size];
  const currentIconSize = iconSizes[size];

  // Logic to separate text color from background color if needed
  const textColor = variant === 'glass' ? 'text-white' : currentVariant.split(' ').pop();
  const bgColor = currentVariant.split(' ').slice(0, -2).join(' ');

  return (
    <View 
      className={`rounded-full flex-row items-center justify-center ${currentVariant} ${currentTextSize} ${className}`}
    >
      {icon && (
        <Ionicons 
          name={icon} 
          size={currentIconSize} 
          className={`mr-1 ${textColor}`} 
        />
      )}
      <Text className={`font-bold tracking-tight ${textColor}`}>
        {label}
      </Text>
    </View>
  );
}
