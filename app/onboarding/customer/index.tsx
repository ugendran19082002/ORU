import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { onboardingApi } from '@/api/onboardingApi';
import { authApi } from '@/api/authApi';
import type { OnboardingStatus } from '@/types/onboarding';
import { useAppSession } from '@/hooks/use-app-session';
import { useLogoutBackHandler } from '@/hooks/use-logout-back-handler';
import { BackButton } from '@/components/ui/BackButton';
import { EmailVerificationModal } from '@/components/ui/EmailVerificationModal';
import { useAppTheme, type ColorSchemeColors } from '@/providers/ThemeContext';

export default function CustomerOnboardingScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);
  const { user, updateUser, status, syncSession } = useAppSession();
  const { handleAuthBack } = useLogoutBackHandler();
  const [loading, setLoading] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);
  const [data, setData] = useState<OnboardingStatus | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await onboardingApi.getCustomerSteps();
      if (res.status === 1) {
        setData(res.data);

        if (res.data.onboarding_completed && user && !user.onboarding_completed) {
          await updateUser({ onboarding_completed: true });
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 100);
        } else if (res.data.onboarding_completed) {
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      if (error.response?.status === 404) return;

      Toast.show({
        type: 'error',
        text1: 'Fetch Error',
        text2: 'Could not load onboarding status.'
      });
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

  const handleRoleReset = async () => {
    Alert.alert(
      "Confirm Role Change",
      "Are you sure you want to switch to a Partner account? This will reset your current progress as a customer.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Reset & Switch",
          style: "destructive",
          onPress: async () => {
            try {
              setResetLoading(true);
              const res = await authApi.resetRole();
              if (res.status === 1) {
                Toast.show({
                  type: 'success',
                  text1: 'Role Reset',
                  text2: 'Redirecting to role selection...'
                });
                await syncSession(res.data);
                router.replace('/auth/role');
              }
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Reset Failed',
                text2: error.response?.data?.message || 'Could not reset role.'
              });
            } finally {
              setResetLoading(false);
            }
          }
        }
      ]
    );
  };

  // 0. Component Bouncer - prevent incorrect roles from hitting these APIs
  // Placed after hooks to comply with React Rules of Hooks
  if (status === 'authenticated' && user?.role !== 'customer') {
    return null;
  }

  if (loading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#005d90" />
      </View>
    );
  }

  const progressPercent = data ? (data.completed_steps / data.total_steps) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* HEADER */}
        <View style={styles.header}>
          <BackButton fallback="/auth/role"  onPress={handleRoleReset}/>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={[styles.welcome, { color: colors.text }]}>Welcome, {user?.name || 'Guest'}</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Complete these steps to get started</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Text style={[styles.avatarText, { color: colors.text }]}>{user?.name?.charAt(0) || 'U'}</Text>
          </View>
        </View>

        <View style={[styles.roleSwitchTip, { backgroundColor: colors.inputBg }]}>
            <Ionicons name="help-circle-outline" size={16} color={colors.muted} />
            <Text style={[styles.roleSwitchText, { color: colors.muted }]}>Wrong role?</Text>
            <TouchableOpacity onPress={handleRoleReset} disabled={resetLoading}>
                <Text style={styles.roleSwitchLink}>Switch to Partner</Text>
            </TouchableOpacity>
        </View>

        {/* Email Verification Banner */}
        {user?.email && !user?.email_verified && (
          <TouchableOpacity
            style={[styles.emailBanner, { backgroundColor: '#fff8e1', borderColor: '#f59e0b' }]}
            onPress={() => { setEmailInput(user.email || ''); setShowEmailModal(true); }}
            activeOpacity={0.8}
          >
            <Ionicons name="mail-outline" size={18} color="#b45309" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#b45309' }}>Verify your Email</Text>
              <Text style={{ fontSize: 12, color: '#92400e' }}>{user.email} — tap to verify</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#b45309" />
          </TouchableOpacity>
        )}
        {!user?.email && (
          <TouchableOpacity
            style={[styles.emailBanner, { backgroundColor: '#f0f9ff', borderColor: '#0ea5e9' }]}
            onPress={() => { setEmailInput(''); setShowEmailModal(true); }}
            activeOpacity={0.8}
          >
            <Ionicons name="mail-add-outline" size={18} color="#0369a1" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#0369a1' }}>Add & Verify Email</Text>
              <Text style={{ fontSize: 12, color: '#0369a1' }}>Enable email OTP to save SMS cost</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#0369a1" />
          </TouchableOpacity>
        )}

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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Required Steps</Text>

          {data?.steps.map((step, index) => (
            <TouchableOpacity
              key={step.id}
              style={[
                styles.stepCard,
                { backgroundColor: colors.inputBg, borderColor: colors.border },
                step.status === 'completed' && styles.stepCardCompleted
              ]}
              onPress={() => handleStepPress(step)}
              activeOpacity={step.status === 'completed' ? 1 : 0.7}
            >
              <View style={[
                styles.iconWrap,
                { backgroundColor: step.status === 'completed' ? '#e0f7fa' : colors.background }
              ]}>
                <Ionicons
                  name={(step.icon_name || 'document-text') as any}
                  size={24}
                  color={step.status === 'completed' ? '#006878' : '#64748b'}
                />
              </View>

              <View style={styles.stepInfo}>
                <Text style={[styles.stepTitle, { color: colors.text }, step.status === 'completed' && styles.stepTitleDone]}>
                  {step.title}
                </Text>
                <Text style={[styles.stepDesc, { color: colors.muted }]} numberOfLines={1}>{step.description}</Text>
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
            <Text style={[styles.footerText, { color: colors.muted }]}>Your data is secure and encrypted</Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <EmailVerificationModal
        visible={showEmailModal}
        email={emailInput}
        onClose={() => setShowEmailModal(false)}
        onSuccess={() => {
          setShowEmailModal(false);
          syncSession();
        }}
      />
    </View>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  safe: { flex: 1 },

  emailBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 24, marginTop: 8, padding: 12,
    borderRadius: 14, borderWidth: 1.5,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  welcome: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  avatarText: { fontSize: 18, fontWeight: '800' },

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
  progressBarFill: { height: '100%', backgroundColor: colors.surface, borderRadius: 4 },
  progressTag: { marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },

  scroll: { flex: 1, marginTop: 12 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginTop: 20, marginBottom: 16 },

  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  stepCardCompleted: { opacity: 0.75 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepInfo: { flex: 1, marginLeft: 16 },
  stepTitle: { fontSize: 16, fontWeight: '700' },
  stepTitleDone: { color: '#94a3b8', textDecorationLine: 'none' },
  stepDesc: { fontSize: 13, marginTop: 2 },
  stepAction: { marginLeft: 8 },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
  footerText: { fontSize: 12, fontWeight: '500' },

  roleSwitchTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14
  },
  roleSwitchText: { fontSize: 13, fontWeight: '500' },
  roleSwitchLink: { fontSize: 13, color: '#005d90', fontWeight: '800', textDecorationLine: 'underline' }
});


