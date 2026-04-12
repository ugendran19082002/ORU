import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppSession } from '@/hooks/use-app-session';
import { onboardingApi } from '@/api/onboardingApi';
import { Logo } from '@/components/ui/Logo';
import { BackButton } from '@/components/ui/BackButton';

export default function ShopWaitlistScreen() {
  const router = useRouter();
  const { user, signOut } = useAppSession();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // 1. Fetch & Poll Status
  const checkStatus = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await onboardingApi.getMerchantShop();
      setShop(res.data);
      
      if (res.data?.status === 'active') {
        router.replace('/shop');
      }
    } catch (err) {
      console.error('[Waitlist] Status Check Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Polling every 10 seconds as requested
    const interval = setInterval(() => {
        checkStatus();
    }, 10000);

    // Subtle pulse animation for review state
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.replace('/auth/login');
  };

  const getStatusContent = () => {
    const status = shop?.status || 'pending_review';

    if (status === 'rejected') {
      return {
        icon: 'close-circle',
        color: '#ba1a1a',
        bg: '#ffdad6',
        title: 'Shop Rejected',
        message: 'Your application was not approved at this time.',
        showReason: true,
        actionLabel: 'Fix & Resubmit',
        action: () => router.push('/onboarding/shop')
      };
    }

    if (shop?.onboarding_status === 'in_progress') {
      return {
        icon: 'alert-circle',
        color: '#b45309',
        bg: '#fef3c7',
        title: 'Onboarding Incomplete',
        message: 'Please complete all mandatory steps to submit for review.',
        showReason: false,
        actionLabel: 'Continue Setup',
        action: () => router.push('/onboarding/shop')
      };
    }

    return {
      icon: 'hourglass',
      color: '#005d90',
      bg: '#e0f0ff',
      title: 'Under Review',
      message: 'Our team is currently reviewing your shop details for quality and compliance.',
      showReason: false,
      actionLabel: null,
      action: null
    };
  };

  const content = getStatusContent();

  if (loading && !shop) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#005d90" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={{ position: 'absolute', left: 0, top: 0 }}>
              <BackButton fallback="/auth/role" variant="transparent" />
            </View>
            <Logo size="lg" />
            <Text style={styles.brandName}>ThanniGo</Text>
          </View>

          <View style={styles.card}>
            <Animated.View style={[styles.statusIconWrap, { backgroundColor: content.bg, transform: [{ scale: shop?.status === 'active' ? 1 : pulseAnim }] }]}>
              <Ionicons name={content.icon as any} size={48} color={content.color} />
            </Animated.View>

            <Text style={[styles.statusTitle, { color: content.color }]}>{content.title}</Text>
            <Text style={styles.statusMessage}>{content.message}</Text>

            {content.showReason && (
              <View style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>Feedback from Admin:</Text>
                <Text style={styles.reasonText}>{shop?.admin_notes || 'Please verify your business documents and resubmit.'}</Text>
              </View>
            )}

            {!content.showReason && shop?.status !== 'rejected' && (
              <View style={styles.timeBox}>
                <Ionicons name="time-outline" size={16} color="#64748b" />
                <Text style={styles.timeText}>Approval usually takes 24–48 hours</Text>
              </View>
            )}

            {content.actionLabel && (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: content.color }]} onPress={content.action}>
                <Text style={styles.actionBtnText}>{content.actionLabel}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.refreshBtn} onPress={() => checkStatus(true)} disabled={refreshing}>
              {refreshing ? <ActivityIndicator size="small" color="#005d90" /> : (
                <>
                  <Ionicons name="refresh-outline" size={18} color="#005d90" />
                  <Text style={styles.refreshText}>Check Status</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.supportBtn}>
              <Ionicons name="help-circle-outline" size={20} color="#64748b" />
              <Text style={styles.supportText}>Need Help? Contact Support</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#ba1a1a" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff' },
  safe: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 32, flexGrow: 1, justifyContent: 'center' },
  
  header: { alignItems: 'center', marginBottom: 40 },
  brandName: { fontSize: 24, fontWeight: '900', color: '#003a5c', marginTop: 12, letterSpacing: -0.5 },

  card: {
    backgroundColor: 'white',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#003a5c',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  
  statusIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  
  statusTitle: { fontSize: 28, fontWeight: '900', marginBottom: 12, textAlign: 'center' },
  statusMessage: { fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 24 },

  reasonBox: {
    width: '100%',
    backgroundColor: '#fff5f5',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#feb2b2',
    marginBottom: 24,
  },
  reasonLabel: { fontSize: 12, fontWeight: '800', color: '#ba1a1a', textTransform: 'uppercase', marginBottom: 8 },
  reasonText: { fontSize: 14, color: '#742a27', lineHeight: 20, fontWeight: '600' },

  timeBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  timeText: { fontSize: 13, fontWeight: '700', color: '#64748b' },

  actionBtn: { width: '100%', height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  actionBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },

  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  refreshText: { color: '#005d90', fontWeight: '800', fontSize: 14 },

  footer: { marginTop: 40, gap: 20 },
  supportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  supportText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutText: { fontSize: 14, fontWeight: '800', color: '#ba1a1a' },
});
