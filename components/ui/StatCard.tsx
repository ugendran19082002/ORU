import React from 'react';
import { View, Text } from 'react-native';
import { Card } from './Card';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
}

export function StatCard({ 
  label, 
  value, 
  icon, 
  iconColor = 'primary', 
  className = '' 
}: StatCardProps) {
  const iconColors = {
    primary: 'text-blue-600 dark:text-blue-400',
    secondary: 'text-gray-600 dark:text-gray-400',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    error: 'text-rose-600 dark:text-rose-400',
  };

  return (
    <Card className={`p-6 bg-gray-50 dark:bg-gray-900 border-0 ${className}`}>
      <Ionicons 
        name={icon} 
        size={32} 
        className={iconColors[iconColor]} 
      />
      <View className="mt-3">
        <Text className="text-2xl font-extrabold text-gray-900 dark:text-white">
          {value}
        </Text>
        <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">
          {label}
        </Text>
      </View>
    </Card>
  );
}
