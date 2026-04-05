import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'elevated' | 'flat' | 'outline';
}

export function Card({ 
  children, 
  className = '', 
  variant = 'elevated',
  ...props 
}: CardProps) {
  const variantClasses = {
    elevated: 'bg-white dark:bg-gray-800 shadow-sm shadow-black/5',
    flat: 'bg-gray-50 dark:bg-gray-900',
    outline: 'bg-transparent border border-gray-200 dark:border-gray-700',
  };

  return (
    <View 
      className={`rounded-3xl p-4 ${variantClasses[variant]} ${className}`} 
      {...props}
    >
      {children}
    </View>
  );
}
