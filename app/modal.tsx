import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';


import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ModalScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();

  useAndroidBackHandler(() => {
    safeBack();
  });



  return (
    <View className="flex-1 items-center justify-center bg-white/90 p-6">
      <StatusBar style="dark" />
      <Card variant="elevated" className="w-full max-w-sm p-8 items-center bg-white">
        <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-6">
          <Ionicons name="notifications" size={40} color="#005d90" />
        </View>
        <Text className="text-2xl font-black text-slate-900 mb-2">Thannigo</Text>
        <Text className="text-slate-500 font-medium text-center mb-8">
          Stay hydrated! Would you like to enable notifications for delivery updates?
        </Text>
        <View className="w-full gap-3">
          <Button 
            title="Enable Now" 
            variant="primary" 
            onPress={() => safeBack()} 
          />
          <Button 
            title="Maybe Later" 
            variant="secondary" 
            onPress={() => safeBack()} 
          />

        </View>
      </Card>
    </View>
  );
}
