import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppState } from '@/hooks/use-app-state';

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { orders } = useAppState();
  const order = orders.find((item) => item.id === orderId) ?? orders[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={72} color="#27AE60" />
        </View>
        <Text style={styles.title}>Order placed successfully</Text>
        <Text style={styles.copy}>
          {order.shopName} has received your order. Track status changes and share the delivery OTP only with the assigned rider.
        </Text>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>DELIVERY OTP</Text>
          <Text style={styles.codeValue}>{order.otp}</Text>
          <Text style={styles.codeHelp}>Order ID {order.id}</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace(`/order/tracking?orderId=${order.id}` as any)}>
          <Text style={styles.primaryText}>Track Order</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/(tabs)' as any)}>
          <Text style={styles.secondaryText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 112,
    height: 112,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
  },
  title: {
    marginTop: 24,
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  copy: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 320,
  },
  codeCard: {
    width: '100%',
    marginTop: 28,
    padding: 22,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0077B6',
    letterSpacing: 0.8,
  },
  codeValue: {
    marginTop: 10,
    fontSize: 34,
    fontWeight: '900',
    color: '#0077B6',
    letterSpacing: 6,
  },
  codeHelp: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  primaryButton: {
    width: '100%',
    marginTop: 24,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: '#0077B6',
  },
  primaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    width: '100%',
    marginTop: 12,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  secondaryText: {
    color: '#0077B6',
    fontSize: 15,
    fontWeight: '800',
  },
});
