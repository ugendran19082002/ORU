import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, AppState, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { BackButton } from '@/components/ui/BackButton';
import { useAppSession } from '@/hooks/use-app-session';
import { roleAccent, Radius, makeShadow } from '@/constants/theme';
import { useAppTheme } from '@/providers/ThemeContext';

const ACCENT = roleAccent.customer;

export default function EnableLocationScreen() {
  const router = useRouter();
  const { setIsLocationVerified } = useAppSession();
  const { colors, isDark } = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (status === 'granted' && servicesEnabled) {
          setIsLocationVerified(true);
          router.replace('/(tabs)/' as any);
        }
      } catch {
        // silent
      }
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

  const shadow = makeShadow(isDark);
  const bg = colors.background;
  const surf = colors.surface;
  const text = colors.text;
  const muted = colors.muted;
  const border = colors.border;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
        <BackButton fallback="/auth/role" variant="transparent" />
      </View>

      <View style={styles.content}>
        {/* Icon circle */}
        <View style={[styles.iconCircle, { backgroundColor: surf, borderColor: border }, shadow.lg]}>
          <LinearGradient
            colors={isDark ? ['#0A1929', bg] : ['#E8F4FD', bg]}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="location" size={72} color={ACCENT} style={{ transform: [{ translateY: -4 }] }} />
          </LinearGradient>
        </View>

        <Text style={[styles.title, { color: text }]}>Enable Location</Text>
        <Text style={[styles.subtitle, { color: muted }]}>
          We need your location to find the best water shops near you and calculate fast delivery times.
        </Text>

        {/* Feature pills */}
        <View style={styles.featurePills}>
          {[
            { icon: 'storefront-outline', label: 'Find nearby shops' },
            { icon: 'time-outline', label: 'Accurate ETA' },
            { icon: 'shield-checkmark-outline', label: 'Secure & private' },
          ].map((f) => (
            <View key={f.label} style={[styles.featurePill, { backgroundColor: surf, borderColor: border }]}>
              <Ionicons name={f.icon as any} size={14} color={ACCENT} />
              <Text style={[styles.featurePillText, { color: text }]}>{f.label}</Text>
            </View>
          ))}
        </View>

        {errorMsg && (
          <View style={[styles.errorBox, { backgroundColor: isDark ? '#2d0a0a' : '#fff0f0', borderColor: isDark ? '#7f1d1d' : '#fecaca' }]}>
            <Ionicons name="warning-outline" size={18} color="#f87171" />
            <Text style={[styles.errorText, { color: isDark ? '#f87171' : '#b91c1c' }]}>{errorMsg}</Text>
          </View>
        )}
      </View>

      <View style={styles.bottomBar}>
        {denied ? (
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.button, { backgroundColor: ACCENT }, shadow.md]}
              onPress={handleEnableLocation}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.buttonText}>I've Enabled It — Retry</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.button, { backgroundColor: isDark ? '#1f2937' : '#64748b', paddingVertical: 14 }]}
              onPress={() => Linking.openSettings()}
            >
              <Ionicons name="settings" size={18} color="white" />
              <Text style={[styles.buttonText, { fontSize: 15 }]}>Open Device Settings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.button, { backgroundColor: ACCENT }, shadow.md]}
            onPress={handleEnableLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="locate" size={20} color="white" />
                <Text style={styles.buttonText}>Enable Location</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => {
            setIsLocationVerified(true);
            router.replace('/(tabs)/' as any);
          }}
        >
          <Text style={[styles.skipText, { color: muted }]}>Skip for now (Test Mode)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  iconCircle: {
    width: 148, height: 148, borderRadius: 74,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 36, borderWidth: 1,
  },
  iconGradient: { width: '100%', height: '100%', borderRadius: 74, alignItems: 'center', justifyContent: 'center' },

  title: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 8, marginBottom: 24 },

  featurePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 },
  featurePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  featurePillText: { fontSize: 12, fontWeight: '600' },

  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 14, borderRadius: Radius.lg, width: '100%',
    borderWidth: 1,
  },
  errorText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },

  bottomBar: { paddingHorizontal: 24, paddingBottom: 36, paddingTop: 16 },
  button: {
    borderRadius: Radius.xl, paddingVertical: 17,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },

  skipBtn: { alignItems: 'center', paddingVertical: 16 },
  skipText: { fontSize: 13, fontWeight: '600' },
});
