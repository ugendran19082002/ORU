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
import { Shadow, thannigoPalette, roleAccent, Radius } from '@/constants/theme';
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
      } catch (e) {
        // Silently fail mount-checks
      }
    };

    // Run once on mount
    checkStatus();

    // Re-run checking whenever the app returns from being totally backgrounded (like coming back from OS Settings)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkStatus();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleEnableLocation = async () => {
    setLoading(true);
    setErrorMsg(null);
    setDenied(false);

    // 1. Request Permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      setErrorMsg('Location permission is required to find nearby shops.');
      setDenied(true);
      setLoading(false);
      return;
    }

    // 2. Grab current location coordinates
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        // Open the OS location settings so the user can turn GPS on directly
        if (Platform.OS === 'android') {
          Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() =>
            Linking.openSettings(),
          );
        } else {
          // iOS: cannot open the location settings page directly
          Linking.openSettings();
        }
        setErrorMsg('Location Services are off. Enable GPS and return to the app.');
        setDenied(true);
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      console.log('Location matched:', location.coords);
      
      // 3. Update Session and Navigate
      setIsLocationVerified(true);
      router.replace('/(tabs)/' as any);
    } catch (err) {
      setErrorMsg('Failed to determine your location. Please ensure GPS is turned on.');
      setDenied(true);
    }
    
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* HEADER ESCAPE */}
      <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
        <BackButton fallback="/auth/role" variant="transparent" />
      </View>
      
      <View style={styles.content}>
        {/* BIG LOCATION ICON */}
        <View style={styles.iconCircle}>
          <LinearGradient
            colors={[thannigoPalette.infoSoft, colors.background]}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="location" size={80} color={ACCENT} style={{ transform: [{ translateY: -4 }] }} />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Enable Location</Text>
        <Text style={styles.subtitle}>
          We need your location to find the best water shops near you and calculate fast delivery times.
        </Text>

        {errorMsg && (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={20} color={thannigoPalette.adminRed} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}
      </View>

      <View style={styles.bottomBar}>
        {denied ? (
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.button, { backgroundColor: thannigoPalette.shopTeal }]}
              onPress={handleEnableLocation}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.buttonText}>I've Enabled It - Retry</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.button, { backgroundColor: thannigoPalette.neutral, paddingVertical: 14 }]}
              onPress={() => Linking.openSettings()}
            >
              <Ionicons name="settings" size={18} color="white" />
              <Text style={[styles.buttonText, { fontSize: 15 }]}>Open Device Settings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.button}
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
        <TouchableOpacity style={styles.skipBtn} onPress={() => {
            // Usually we must block, but providing a safe-fallback debug escape loop can help testing.
            setIsLocationVerified(true);
            router.replace('/(tabs)/' as any);
        }}>
           <Text style={styles.skipText}>Skip (Test Mode)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  iconCircle: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: thannigoPalette.surface, alignItems: 'center', justifyContent: 'center',
    ...Shadow.lg, marginBottom: 40,
  },
  iconGradient: { width: '100%', height: '100%', borderRadius: 80, alignItems: 'center', justifyContent: 'center' },

  title: { fontSize: 28, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5, marginBottom: 12 },
  subtitle: { fontSize: 16, color: thannigoPalette.neutral, textAlign: 'center', lineHeight: 24, paddingHorizontal: 12 },

  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: thannigoPalette.adminRedLight, padding: 16, borderRadius: Radius.lg, width: '100%', marginTop: 24,
  },
  errorText: { flex: 1, color: thannigoPalette.adminRed, fontSize: 13, fontWeight: '600', lineHeight: 18 },

  bottomBar: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20 },
  button: {
    backgroundColor: ACCENT, borderRadius: Radius.xl, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    ...Shadow.lg,
  },
  buttonText: { color: 'white', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },

  skipBtn: { alignItems: 'center', paddingVertical: 18 },
  skipText: { fontSize: 13, color: thannigoPalette.neutral, fontWeight: '700' }
});





