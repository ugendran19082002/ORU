import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppHeader from '@/components/ui/AppHeader';
import { useAppState } from '@/hooks/use-app-state';

export default function DeliveryOtpScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { orders, verifyDeliveryOtp } = useAppState();
  const order = orders.find((item) => item.id === orderId) ?? orders[0];
  const [otp, setOtp] = useState('');

  const handleVerify = async () => {
    const success = await verifyDeliveryOtp(order.id, otp);

    if (!success) {
      Alert.alert('Invalid OTP', 'Ask the customer for the six-digit delivery code.');
      return;
    }

    router.replace(`/delivery/complete?orderId=${order.id}` as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <AppHeader title="Delivery OTP" subtitle={order.customerName} onBackPress={() => router.back()} />

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark-outline" size={44} color="#0f766e" />
        </View>
        <Text style={styles.title}>Confirm handoff with customer OTP</Text>
        <Text style={styles.copy}>For demo, use the assigned code shown in the previous screen.</Text>

        <TextInput
          value={otp}
          onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          style={styles.input}
          placeholder="Enter 6-digit OTP"
          placeholderTextColor="#94a3b8"
        />

        <TouchableOpacity style={styles.button} onPress={handleVerify}>
          <Text style={styles.buttonText}>Verify & Complete</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  content: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { width: 96, height: 96, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ccfbf1', marginBottom: 26 },
  title: { fontSize: 28, fontWeight: '900', color: '#0f172a', textAlign: 'center' },
  copy: { marginTop: 10, fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  input: { width: '100%', marginTop: 28, backgroundColor: 'white', borderRadius: 18, paddingVertical: 18, paddingHorizontal: 18, fontSize: 24, textAlign: 'center', letterSpacing: 4, color: '#0f172a' },
  button: { width: '100%', marginTop: 18, alignItems: 'center', paddingVertical: 18, borderRadius: 18, backgroundColor: '#0f766e' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '900' },
});
