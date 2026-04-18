import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, AppState, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { BackButton } from '@/components/ui/BackButton';
import { useAppSession } from '@/hooks/use-app-session';
import { roleAccent, Radius } from '@/constants/theme';
import { useAppTheme } from '@/providers/ThemeContext';

const ACCENT = roleAccent.customer;
const ACCENT_SOFT = '#dbeafe';
const GRAD: [string, string] = ['#005d90', '#0077b6'];

export default function EnableLocationScreen() {
  const router = useRouter();
  const { setIsLocationVerified } = useAppSession();
  const { colors, isDark } = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  // Animations
  const floatY   = useRef(new Animated.Value(0)).current;
  const pulseS   = useRef(new Animated.Value(1)).current;
  const ring1S   = useRef(new Animated.Value(1)).current;
  const ring1O   = useRef(new Animated.Value(0.6)).current;
  const ring2S   = useRef(new Animated.Value(1)).current;
  const ring2O   = useRef(new Animated.Value(0.4)).current;
  const contentO = useRef(new Animated.Value(0)).current;
  const contentT = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(contentO, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(contentT, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();

    // Icon float loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -10, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // Pulse rings
    const startRings = () => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ring1S, { toValue: 1.7, duration: 1400, useNativeDriver: true }),
            Animated.timing(ring1O, { toValue: 0, duration: 1400, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(ring1S, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(ring1O, { toValue: 0.5, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();

      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(ring2S, { toValue: 1.7, duration: 1400, useNativeDriver: true }),
              Animated.timing(ring2O, { toValue: 0, duration: 1400, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(ring2S, { toValue: 1, duration: 0, useNativeDriver: true }),
              Animated.timing(ring2O, { toValue: 0.35, duration: 0, useNativeDriver: true }),
            ]),
          ])
        ).start();
      }, 700);
    };
    startRings();

    const checkStatus = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (status === 'granted' && servicesEnabled) {
          setIsLocationVerified(true);
          router.replace('/(tabs)/' as any);
        }
      } catch {}
    };

    checkStatus();
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') checkStatus();
    });
    return () => subscription.remove();
  }, []);

  const handleEnableLocation = async () => {
    setLoading(true);
    setErrorMsg(null);
    setDenied(false);
    Animated.sequence([
      Animated.timing(pulseS, { toValue: 0.92, duration: 100, useNativeDriver: true }),
      Animated.spring(pulseS, { toValue: 1, useNativeDriver: true }),
    ]).start();

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Location permission is required to find nearby shops.');
      setDenied(true);
      setLoading(false);
      return;
    }

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        if (Platform.OS === 'android') {
          Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() => Linking.openSettings());
        } else {
          Linking.openSettings();
        }
        setErrorMsg('Location Services are off. Enable GPS and return to the app.');
        setDenied(true);
        setLoading(false);
        return;
      }
      await Location.getCurrentPositionAsync({});
      setIsLocationVerified(true);
      router.replace('/(tabs)/' as any);
    } catch {
      setErrorMsg('Failed to determine your location. Please ensure GPS is turned on.');
      setDenied(true);
    }

    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Back */}
      <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
        <BackButton fallback="/auth/role" variant="transparent" />
      </View>

      {/* CONTENT */}
      <Animated.View style={[styles.content, { opacity: contentO, transform: [{ translateY: contentT }] }]}>

        {/* Pulse rings + icon */}
        <View style={styles.iconArea}>
          {/* Outer ring */}
          <Animated.View style={[styles.pulseRing, {
            backgroundColor: isDark ? `rgba(0,93,144,0.12)` : `rgba(0,93,144,0.08)`,
            transform: [{ scale: ring2S }], opacity: ring2O,
          }]} />
          {/* Inner ring */}
          <Animated.View style={[styles.pulseRing, styles.pulseRingInner, {
            backgroundColor: isDark ? `rgba(0,93,144,0.2)` : `rgba(0,93,144,0.12)`,
            transform: [{ scale: ring1S }], opacity: ring1O,
          }]} />
          {/* Icon circle */}
          <Animated.View style={{ transform: [{ translateY: floatY }, { scale: pulseS }] }}>
            <LinearGradient
              colors={isDark ? ['#0c2a3d', '#1e3a5f'] : ['#dbeafe', '#bfdbfe']}
              style={styles.iconCircle}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <LinearGradient
                colors={[ACCENT, '#0077b6']}
                style={styles.iconInner}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Ionicons name="location" size={40} color="white" />
              </LinearGradient>
            </LinearGradient>
          </Animated.View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Enable Location</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          We need your location to find the best water shops near you and calculate accurate delivery times.
        </Text>

        {/* Feature pills */}
        <View style={styles.featurePills}>
          {[
            { icon: 'storefront-outline', label: 'Find nearby shops', color: ACCENT },
            { icon: 'time-outline', label: 'Accurate ETAs', color: '#7c3aed' },
            { icon: 'shield-checkmark-outline', label: 'Secure & private', color: '#059669' },
          ].map((f) => (
            <View key={f.label} style={[styles.featurePill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.pillIcon, { backgroundColor: isDark ? `${f.color}22` : `${f.color}15` }]}>
                <Ionicons name={f.icon as any} size={14} color={f.color} />
              </View>
              <Text style={[styles.featurePillText, { color: colors.text }]}>{f.label}</Text>
            </View>
          ))}
        </View>

        {errorMsg && (
          <View style={[styles.errorBox, {
            backgroundColor: isDark ? 'rgba(127,17,17,0.25)' : '#fff0f0',
            borderColor: isDark ? '#7f1d1d' : '#fecaca',
          }]}>
            <Ionicons name="warning-outline" size={18} color={isDark ? '#f87171' : '#dc2626'} />
            <Text style={[styles.errorText, { color: isDark ? '#f87171' : '#b91c1c' }]}>{errorMsg}</Text>
          </View>
        )}
      </Animated.View>

      {/* BOTTOM */}
      <View style={styles.bottomBar}>
        {denied ? (
          <View style={{ gap: 12 }}>
            <TouchableOpacity activeOpacity={0.85} style={styles.btnWrap} onPress={handleEnableLocation}>
              <LinearGradient colors={GRAD} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.btnText}>I've Enabled It — Retry</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.btnWrap, { backgroundColor: isDark ? '#1f2937' : '#f1f5f9', borderRadius: Radius.xl }]}
              onPress={() => Linking.openSettings()}
            >
              <View style={[styles.btn, { backgroundColor: 'transparent' }]}>
                <Ionicons name="settings-outline" size={18} color={colors.muted} />
                <Text style={[styles.btnText, { color: colors.muted, fontSize: 15 }]}>Open Device Settings</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity activeOpacity={0.85} style={styles.btnWrap} onPress={handleEnableLocation} disabled={loading}>
            <LinearGradient colors={GRAD} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading ? <ActivityIndicator color="white" /> : (
                <>
                  <Ionicons name="locate" size={20} color="white" />
                  <Text style={styles.btnText}>Enable Location</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => { setIsLocationVerified(true); router.replace('/(tabs)/' as any); }}
        >
          <Text style={[styles.skipText, { color: colors.muted }]}>Skip for now (Test Mode)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },

  iconArea: { alignItems: 'center', justifyContent: 'center', marginBottom: 36, width: 200, height: 200 },
  pulseRing: {
    position: 'absolute',
    width: 180, height: 180, borderRadius: 90,
  },
  pulseRingInner: { width: 140, height: 140, borderRadius: 70 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  iconInner: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },

  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.6, marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 23, paddingHorizontal: 4, marginBottom: 28 },

  featurePills: { gap: 10, alignSelf: 'stretch', marginBottom: 20 },
  featurePill: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1 },
  pillIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  featurePillText: { fontSize: 14, fontWeight: '600' },

  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 16, width: '100%', borderWidth: 1 },
  errorText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },

  bottomBar: { paddingHorizontal: 24, paddingBottom: 36, paddingTop: 8, gap: 0 },
  btnWrap: { overflow: 'hidden', borderRadius: Radius.xl },
  btn: { borderRadius: Radius.xl, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  btnText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },

  skipBtn: { alignItems: 'center', paddingVertical: 18 },
  skipText: { fontSize: 13, fontWeight: '600' },
});
