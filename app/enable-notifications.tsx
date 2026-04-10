import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';
import { registerForPushNotificationsAsync } from '@/utils/notifications';

export default function EnableNotificationsScreen() {
  const router = useRouter();
  const { next = '/(tabs)' } = useLocalSearchParams<{ next: string }>();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status === 'granted') {
          router.replace(next as any);
        }
      } catch (e) {
        // Silently fail
      }
    };

    checkStatus();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkStatus();
      }
    });

    return () => subscription.remove();
  }, [next]);

  const handleEnableNotifications = async () => {
    setLoading(true);
    setErrorMsg(null);
    setDenied(false);

    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        router.replace(next as any);
      } else {
        // Check permissions again
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Notification permission is required for order updates.');
          setDenied(true);
        } else {
           router.replace(next as any);
        }
      }
    } catch (err) {
      setErrorMsg('Failed to enable notifications. Please try again.');
      setDenied(true);
    }
    
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <LinearGradient
            colors={['#fdf4ff', '#f5f3ff']}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="notifications" size={80} color="#7c3aed" style={{ transform: [{ translateY: -2 }] }} />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Enable Notifications</Text>
        <Text style={styles.subtitle}>
          Get real-time updates on your water delivery, exclusive offers, and important account alerts.
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
              style={[styles.button, { backgroundColor: '#7c3aed' }]}
              onPress={handleEnableNotifications}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.buttonText}>Try Again</Text>
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
            onPress={handleEnableNotifications}
            disabled={loading}
          >
            {loading ? (
               <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="notifications-outline" size={20} color="white" />
                <Text style={styles.buttonText}>Enable Notifications</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace(next as any)}>
          <Text style={styles.skipText}>Not Now, I'll do it later</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  iconCircle: { width: 160, height: 160, borderRadius: 80, marginBottom: 40, overflow: 'hidden' },
  iconGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#1a1c1e', marginBottom: 16, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#44474e', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ffdad6', padding: 16, borderRadius: 12, marginTop: 10 },
  errorText: { flex: 1, color: '#410002', fontSize: 14, fontWeight: '600' },
  bottomBar: { paddingHorizontal: 24, paddingBottom: 32 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#7c3aed', paddingVertical: 18, borderRadius: 20, shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
  buttonText: { color: 'white', fontSize: 17, fontWeight: '800' },
  skipBtn: { marginTop: 20, paddingVertical: 10, alignItems: 'center' },
  skipText: { color: '#44474e', fontSize: 15, fontWeight: '600' },
});
