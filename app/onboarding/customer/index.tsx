import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { onboardingApi } from '@/api/onboardingApi';
import type { OnboardingStatus } from '@/types/onboarding';
import { useAppSession } from '@/hooks/use-app-session';
import { useLogoutBackHandler } from '@/hooks/use-logout-back-handler';
import { BackButton } from '@/components/ui/BackButton';

export default function CustomerOnboardingScreen() {
  const router = useRouter();
  const { user, updateUser, status } = useAppSession();
  const { handleAuthBack } = useLogoutBackHandler();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OnboardingStatus | null>(null);

  // 0. Component Bouncer - prevent incorrect roles from hitting these APIs
  if (status === 'authenticated' && user?.role !== 'customer') {
    return null;
  }

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await onboardingApi.getCustomerSteps();
      if (res.status === 1) {
        setData(res.data);
        
        // If completed by steps, update session and move to home
        // ADDED: Double check that we aren't already marked as completed to avoid loops
        if (res.data.onboarding_completed && user && !user.onboarding_completed) {
          console.log('[Onboarding] Completion detected. Syncing session...');
          await updateUser({ onboarding_completed: true });
          
          // Small delay to allow session state to propagate before redirecting
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 100);
        } else if (res.data.onboarding_completed) {
          // Already synced, just move if we are somehow stuck here
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
      console.error('[Onboarding] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleStepPress = (step: any) => {
    if (step.status === 'completed') return;
    
    // Navigate to the step's specific route
    if (step.screen_route) {
      router.push(step.screen_route as any);
    } else {
      Toast.show({
        type: 'info',
        text1: 'Coming Soon',
        text2: 'This onboarding step will be available shortly.'
      });
    }
  };

  if (loading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#005d90" />
      </View>
    );
  }

  const progressPercent = data ? (data.completed_steps / data.total_steps) * 100 : 0;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* HEADER */}
        <View style={styles.header}>
          <BackButton fallback="/auth/role" onPress={handleAuthBack} />
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.welcome}>Welcome, {user?.name || 'Guest'}</Text>
            <Text style={styles.subtitle}>Complete these steps to get started</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
          </View>
        </View>

        {/* PROGRESS CARD */}
        <LinearGradient
          colors={['#005d90', '#0077b6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.progressCard}
        >
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Your Progress</Text>
            <Text style={styles.progressCount}>{data?.completed_steps} of {data?.total_steps} steps</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressTag}>
            {progressPercent === 100 ? 'All set! Finalizing...' : 'Almost there! Help us know you better.'}
          </Text>
        </LinearGradient>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStatus} />}
        >
          <Text style={styles.sectionTitle}>Required Steps</Text>
          
          {data?.steps.map((step, index) => (
            <TouchableOpacity
              key={step.id}
              style={[
                styles.stepCard,
                step.status === 'completed' && styles.stepCardCompleted
              ]}
              onPress={() => handleStepPress(step)}
              activeOpacity={step.status === 'completed' ? 1 : 0.7}
            >
              <View style={[
                styles.iconWrap,
                { backgroundColor: step.status === 'completed' ? '#e0f7fa' : '#f0f4f8' }
              ]}>
                <Ionicons
                  name={(step.icon_name || 'document-text') as any}
                  size={24}
                  color={step.status === 'completed' ? '#006878' : '#64748b'}
                />
              </View>
              
              <View style={styles.stepInfo}>
                <Text style={[styles.stepTitle, step.status === 'completed' && styles.stepTitleDone]}>
                  {step.title}
                </Text>
                <Text style={styles.stepDesc} numberOfLines={1}>{step.description}</Text>
              </View>

              <View style={styles.stepAction}>
                {step.status === 'completed' ? (
                  <Ionicons name="checkmark-circle" size={24} color="#006878" />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                )}
              </View>
            </TouchableOpacity>
          ))}
          
          <View style={styles.footer}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#94a3b8" />
            <Text style={styles.footerText}>Your data is secure and encrypted</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  safe: { flex: 1 },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  welcome: { fontSize: 24, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#475569' },

  progressCard: {
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#005d90',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  progressTitle: { fontSize: 18, fontWeight: '800', color: 'white' },
  progressCount: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: 'white', borderRadius: 4 },
  progressTag: { marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },

  scroll: { flex: 1, marginTop: 12 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginTop: 20, marginBottom: 16 },

  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  stepCardCompleted: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepInfo: { flex: 1, marginLeft: 16 },
  stepTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
  stepTitleDone: { color: '#94a3b8', textDecorationLine: 'none' },
  stepDesc: { fontSize: 13, color: '#64748b', marginTop: 2 },
  stepAction: { marginLeft: 8 },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
  footerText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' }
});

