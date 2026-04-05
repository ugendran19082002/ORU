import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

export default function EnableLocationScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (status === 'granted' && servicesEnabled) {
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
        setErrorMsg('GPS hardware is turned off. Please enable Location Services in your settings.');
        setDenied(true);
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      console.log('Location matched:', location.coords);
      
      // 3. Navigate back to Home seamlessly
      router.replace('/(tabs)/' as any);
    } catch (err) {
      setErrorMsg('Failed to determine your location. Please ensure GPS is turned on.');
      setDenied(true);
    }
    
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        {/* BIG LOCATION ICON */}
        <View style={styles.iconCircle}>
          <LinearGradient
            colors={['#e0f0ff', '#f7f9ff']}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="location" size={80} color="#005d90" style={{ transform: [{ translateY: -4 }] }} />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Enable Location</Text>
        <Text style={styles.subtitle}>
          We need your location to find the best water shops near you and calculate fast delivery times.
        </Text>

        {errorMsg && (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={20} color="#ba1a1a" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}
      </View>

      <View style={styles.bottomBar}>
        {denied ? (
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.button, { backgroundColor: '#0d9488' }]}
              onPress={handleEnableLocation}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.buttonText}>I've Enabled It - Retry</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.button, { backgroundColor: '#475569', paddingVertical: 14 }]}
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
            router.replace('/(tabs)/' as any);
        }}>
           <Text style={styles.skipText}>Skip (Test Mode)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  
  iconCircle: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#005d90', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8,
    marginBottom: 40,
  },
  iconGradient: { width: '100%', height: '100%', borderRadius: 80, alignItems: 'center', justifyContent: 'center' },

  title: { fontSize: 28, fontWeight: '900', color: '#181c20', letterSpacing: -0.5, marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#707881', textAlign: 'center', lineHeight: 24, paddingHorizontal: 12 },
  
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#ffdad6', padding: 16, borderRadius: 16, width: '100%', marginTop: 24,
  },
  errorText: { flex: 1, color: '#ba1a1a', fontSize: 13, fontWeight: '600', lineHeight: 18 },

  bottomBar: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20 },
  button: {
    backgroundColor: '#005d90', borderRadius: 20, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#005d90', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  buttonText: { color: 'white', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  
  skipBtn: { alignItems: 'center', paddingVertical: 18 },
  skipText: { fontSize: 13, color: '#94a3b8', fontWeight: '700' }
});
