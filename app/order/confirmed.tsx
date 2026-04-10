import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';

export default function OrderConfirmedScreen() {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useAndroidBackHandler(() => {
    // Prevent going back to checkout once order is confirmed
    router.replace('/(tabs)');
  });

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.15, duration: 300, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    Animated.timing(opacityAnim, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }).start();
  }, []);

  const otp = '4829';
  const orderId = '#9831';
  const shopName = 'Blue Spring Aquatics';
  const eta = '12–15 mins';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        {/* SUCCESS ICON */}
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={['#2e7d32', '#388e3c']} style={styles.iconGrad}>
            <Ionicons name="checkmark" size={56} color="white" />
          </LinearGradient>
          <View style={styles.iconRing} />
        </Animated.View>

        <Animated.View style={{ opacity: opacityAnim, alignItems: 'center', gap: 6 }}>
          <Text style={styles.title}>Order Confirmed!</Text>
          <Text style={styles.subtitle}>
            {shopName} accepted your order.{'\n'}Expected in <Text style={styles.highlight}>{eta}.</Text>
          </Text>
          <Text style={styles.orderId}>Order {orderId}</Text>
        </Animated.View>

        {/* OTP CARD */}
        <Animated.View style={[styles.otpCard, { opacity: opacityAnim }]}>
          <View style={styles.otpTop}>
            <View style={styles.otpIconWrap}>
              <Ionicons name="lock-closed" size={18} color="#005d90" />
            </View>
            <View>
              <Text style={styles.otpLabel}>DELIVERY OTP</Text>
              <Text style={styles.otpHint}>Share only with your delivery agent</Text>
            </View>
          </View>
          <Text style={styles.otpValue}>{otp}</Text>
          <View style={styles.otpDots}>
            {otp.split('').map((_, i) => (
              <View key={i} style={styles.otpDot} />
            ))}
          </View>
        </Animated.View>

        {/* ORDER SUMMARY MINI */}
        <Animated.View style={[styles.summaryCard, { opacity: opacityAnim }]}>
          {[
            { label: 'Shop', value: shopName, icon: 'storefront-outline' },
            { label: 'Item', value: '1× 20L Water Can', icon: 'water-outline' },
            { label: 'Payment', value: 'UPI · ₹50', icon: 'card-outline' },
            { label: 'ETA', value: eta, icon: 'time-outline' },
          ].map((row) => (
            <View key={row.label} style={styles.summaryRow}>
              <View style={styles.summaryIcon}>
                <Ionicons name={row.icon as any} size={16} color="#005d90" />
              </View>
              <Text style={styles.summaryLabel}>{row.label}</Text>
              <Text style={styles.summaryValue}>{row.value}</Text>
            </View>
          ))}
        </Animated.View>

        {/* ACTIONS */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace('/order/tracking' as any)}
          >
            <LinearGradient
              colors={['#005d90', '#0077b6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGrad}
            >
              <Ionicons name="location" size={18} color="white" />
              <Text style={styles.primaryBtnText}>Track Live</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.replace('/(tabs)' as any)}
          >
            <Text style={styles.secondaryBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  content: { flex: 1, paddingHorizontal: 24, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', gap: 20 },

  iconWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  iconGrad: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2e7d32', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8,
  },
  iconRing: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    borderWidth: 2, borderColor: '#c8e6c9',
  },

  title: { fontSize: 30, fontWeight: '900', color: '#181c20', letterSpacing: -0.5, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22, fontWeight: '500' },
  highlight: { color: '#005d90', fontWeight: '800' },
  orderId: { fontSize: 13, fontWeight: '700', color: '#94a3b8', marginTop: 2 },

  otpCard: {
    backgroundColor: 'white', borderRadius: 24, padding: 22, width: '100%',
    borderWidth: 2, borderColor: '#bfdbf7',
    shadowColor: '#005d90', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
    alignItems: 'center',
  },
  otpTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, alignSelf: 'flex-start' },
  otpIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  otpLabel: { fontSize: 11, fontWeight: '800', color: '#005d90', letterSpacing: 1 },
  otpHint: { fontSize: 11, color: '#707881', fontWeight: '500', marginTop: 1 },
  otpValue: { fontSize: 48, fontWeight: '900', color: '#005d90', letterSpacing: 16, marginBottom: 10 },
  otpDots: { flexDirection: 'row', gap: 8 },
  otpDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#bfdbf7' },

  summaryCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 18, width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    gap: 14,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#f0f7ff', alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { flex: 1, fontSize: 13, color: '#707881', fontWeight: '600' },
  summaryValue: { fontSize: 13, fontWeight: '800', color: '#181c20' },

  actions: { width: '100%', gap: 10 },
  primaryBtn: { borderRadius: 18, overflow: 'hidden' },
  primaryBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  secondaryBtn: { paddingVertical: 14, alignItems: 'center', borderRadius: 18, backgroundColor: 'white', borderWidth: 1, borderColor: '#e0e2e8' },
  secondaryBtnText: { fontSize: 15, fontWeight: '700', color: '#64748b' },
});
