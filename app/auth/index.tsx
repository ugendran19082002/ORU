import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '@/components/ui/Logo';
import { thannigoPalette, roleGradients } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

const WELCOME_GRAD: [string, string, string] = [
  '#003a5c',
  roleGradients.customer.start,
  roleGradients.customer.end,
];
const FEATURE_ICON_COLOR = '#69e5ff';

export default function WelcomeScreen() {
  const router = useRouter();

  const logoAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.spring(logoAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(textAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(btnAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background gradient */}
      <LinearGradient
        colors={WELCOME_GRAD}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <SafeAreaView style={styles.safe}>
        {/* LOGO + BRAND */}
        <Animated.View
          style={[
            styles.logoSection,
            {
              opacity: logoAnim,
              transform: [
                {
                  translateY: logoAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Logo size="lg" style={{ marginBottom: 20 }} />
          <Text style={styles.brandName}>ThanniGo</Text>
          <Text style={styles.brandTagline}>Pure Water · Delivered Fast</Text>
        </Animated.View>

        {/* FEATURES */}
        <Animated.View style={[styles.features, { opacity: textAnim }]}>
          {[
            { icon: 'water-outline', text: 'Order 20L cans in seconds' },
            { icon: 'navigate-outline', text: 'Real-time delivery tracking' },
            { icon: 'shield-checkmark-outline', text: 'FSSAI verified shops only' },
          ].map((f) => (
            <View key={f.text} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon as any} size={18} color={FEATURE_ICON_COLOR} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </Animated.View>

        {/* ACTIONS */}
        <Animated.View style={[styles.actions, { opacity: btnAnim }]}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.getStartedBtn}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color={roleGradients.customer.start} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginLinkText}>
              Already have an account?{' '}
              <Text style={styles.loginLinkTextBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* FOOTER */}
        <Text style={styles.footer}>© 2024 ThanniGo · Made in India 🇮🇳</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 28, paddingVertical: 24 },

  circle1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.04)', top: -100, right: -80,
  },
  circle2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)', bottom: 80, left: -60,
  },
  circle3: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)', top: 200, right: 20,
  },

  logoSection: { alignItems: 'center', marginTop: 40 },
  brandName: {
    color: 'white', fontSize: 40, fontWeight: '900',
    letterSpacing: -1, marginBottom: 8,
  },
  brandTagline: {
    color: 'rgba(255,255,255,0.65)', fontSize: 15, fontWeight: '500',
    letterSpacing: 0.5,
  },

  features: {
    gap: 16, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500', flex: 1 },

  actions: { gap: 16 },
  getStartedBtn: {
    backgroundColor: 'white',
    borderRadius: 20, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8,
  },
  getStartedText: { color: roleGradients.customer.start, fontSize: 17, fontWeight: '900' },
  loginLink: { alignItems: 'center', paddingVertical: 8 },
  loginLinkText: { color: 'rgba(255,255,255,0.65)', fontSize: 14 },
  loginLinkTextBold: { color: 'white', fontWeight: '800' },

  footer: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 11 },
});
