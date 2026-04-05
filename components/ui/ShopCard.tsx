import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { Ionicons } from '@expo/vector-icons';

export interface Shop {
  id: string;
  name: string;
  rating: number;
  distance: string;
  price: string;
  deliveryTime: string;
  image: string;
  isVerified?: boolean;
  tags?: string[];
}

interface ShopCardProps {
  shop: Shop;
  onPress?: (shop: Shop) => void;
  onOrder?: (shop: Shop) => void;
  className?: string;
}

export function ShopCard({ 
  shop, 
  onPress, 
  onOrder, 
  className = '' 
}: ShopCardProps) {
  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={() => onPress?.(shop)}
      className={`mb-6 ${className}`}
    >
      <Card variant="elevated" className="overflow-hidden p-0 rounded-[32px]">
        {/* SHOP IMAGE & BADGES */}
        <View className="h-48 w-full relative">
          <Image 
            source={{ uri: shop.image }} 
            className="w-full h-full"
            resizeMode="cover"
          />
          {shop.isVerified && (
            <View className="absolute top-4 left-4">
              <Badge 
                label="Verified" 
                variant="glass" 
                icon="checkmark-circle" 
                size="sm" 
              />
            </View>
          )}
          <View className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl px-3 py-1 shadow-sm">
            <Text className="text-blue-600 font-bold text-xs">
              {shop.deliveryTime}
            </Text>
          </View>
        </View>

        {/* SHOP DETAILS */}
        <View className="p-6">
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1 mr-4">
              <Text className="text-xl font-bold text-gray-900 dark:text-white mb-1 leading-tight">
                {shop.name}
              </Text>
              <View className="flex-row items-center">
                <View className="flex-row items-center mr-2">
                  <Ionicons name="star" size={14} color="#f59e0b" />
                  <Text className="text-sm font-bold text-gray-900 dark:text-white ml-1">
                    {shop.rating}
                  </Text>
                </View>
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  • {shop.distance}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-xl font-black text-blue-600 dark:text-blue-400 leading-tight">
                {shop.price}
              </Text>
              <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                Per Can
              </Text>
            </View>
          </View>

          {/* TAGS & CTA */}
          <View className="flex-row items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800 mt-2">
            <View className="flex-row flex-wrap flex-1 gap-1.5">
              {shop.tags?.map((tag, index) => (
                <Badge 
                  key={index}
                  label={tag} 
                  variant="secondary" 
                  size="sm" 
                  className="bg-gray-100 dark:bg-gray-800"
                />
              ))}
            </View>
            <Button 
              title="Order" 
              variant="primary" 
              size="sm" 
              onPress={() => onOrder?.(shop)}
              className="px-6 rounded-xl"
            />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}
