import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ProgressBarProps {
  progress: number; // 0 to 1
  label?: string;
  showPercentage?: boolean;
  className?: string;
  colors?: string[];
}

export function ProgressBar({ 
  progress, 
  label, 
  showPercentage = false, 
  className = '', 
  colors = ['#005d90', '#0077b6'] 
}: ProgressBarProps) {
  return (
    <View className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <View className="flex-row justify-between mb-2">
          {label && <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</Text>}
          {showPercentage && <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">{Math.round(progress * 100)}%</Text>}
        </View>
      )}
      <View className="h-2.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <LinearGradient
          colors={colors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: '100%', width: `${progress * 100}%`, borderRadius: 9999 }}
        />
      </View>
    </View>
  );
}
