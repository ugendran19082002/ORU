import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface TimelineStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  icon: keyof typeof Ionicons.glyphMap;
}

interface TimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export function Timeline({ steps, className = '' }: TimelineProps) {
  return (
    <View className={`px-4 ${className}`}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isCompleted = step.status === 'completed';
        const isCurrent = step.status === 'current';
        
        return (
          <View key={step.id} className="flex-row">
            {/* LEFT COLUMN: ICON & LINE */}
            <View className="items-center mr-4">
              <View 
                className={`w-10 h-10 rounded-full items-center justify-center z-10 
                  ${isCompleted ? 'bg-blue-600' : isCurrent ? 'bg-blue-100 border-2 border-blue-600' : 'bg-gray-100'}`}
              >
                <Ionicons 
                  name={isCompleted ? 'checkmark' : step.icon} 
                  size={18} 
                  color={isCompleted ? 'white' : isCurrent ? '#2563eb' : '#94a3b8'} 
                />
              </View>
              {!isLast && (
                <View 
                  className={`w-0.5 flex-1 -my-1 
                    ${isCompleted ? 'bg-blue-600' : 'bg-gray-200'}`} 
                />
              )}
            </View>

            {/* RIGHT COLUMN: TEXT */}
            <View className={`pb-8 flex-1 ${isCurrent ? 'opacity-100' : isCompleted ? 'opacity-90' : 'opacity-40'}`}>
              <Text className={`text-base font-bold mb-1 ${isCurrent ? 'text-blue-600' : 'text-slate-900 group-dark:text-white'}`}>
                {step.title}
              </Text>
              <Text className="text-sm font-medium text-slate-500 leading-relaxed">
                {step.description}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
