import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from './Badge';

interface PromoBannerProps {
  title: string;
  subtitle: string;
  onPress?: () => void;
  className?: string;
}

export function PromoBanner({ 
  title, 
  subtitle, 
  onPress, 
  className = '' 
}: PromoBannerProps) {
  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress}
      className={`rounded-[32px] overflow-hidden shadow-lg shadow-blue-600/20 ${className}`}
    >
      <LinearGradient
        colors={['#005d90', '#0077b6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-8 relative"
      >
        {/* Abstract background element */}
        <View className="absolute -right-8 -bottom-8 opacity-20">
          <Ionicons name="water" size={240} color="white" />
        </View>

        <View className="relative z-10">
          <Badge 
            label="Active Hydration" 
            variant="glass" 
            icon="water" 
            size="sm" 
            className="mb-4 self-start"
          />
          
          <Text className="text-3xl font-extrabold text-white mb-2 leading-tight">
            {title}
          </Text>
          
          <Text className="text-blue-100/90 text-sm mb-6 max-w-[240px] leading-relaxed">
            {subtitle}
          </Text>
          
          <View className="bg-white px-8 py-4 rounded-xl self-start flex-row items-center shadow-xl shadow-black/10">
            <Ionicons name="refresh" size={20} color="#005d90" className="mr-2" />
            <Text className="text-[#005d90] font-bold">
              Reorder Now
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
