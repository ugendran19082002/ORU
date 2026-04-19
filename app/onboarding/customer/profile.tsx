import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, TextInput
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppSession } from '@/hooks/use-app-session';
import { userApi } from '@/api/userApi';
import { onboardingApi } from '@/api/onboardingApi';
import { useStepBackHandler } from '@/hooks/use-step-back-handler';
import { BackButton } from '@/components/ui/BackButton';
import { EmailVerificationModal } from '@/components/ui/EmailVerificationModal';
import { useAppTheme } from '@/providers/ThemeContext';

export default function CustomerProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user, updateUser, status, syncSession } = useAppSession();
  const [loading, setLoading] = useState(false);

  useStepBackHandler('/onboarding/customer');

  // 0. Role Bouncer
  if (status === 'authenticated' && user?.role !== 'customer') {
    return null;
  }

  const [customerType, setCustomerType] = useState<'individual' | 'business'>(user?.customer_type || 'individual');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isEmailVerified, setIsEmailVerified] = useState(user?.email_verified || false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  const handleContinue = async () => {
    if (!name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Details Required',
        text2: 'Please enter your full name to continue.'
      });
      return;
    }

    try {
      setLoading(true);

      // 1. Update permanent profile
      await userApi.updateProfile({
        name,
        email: email || undefined,
        customer_type: customerType,
        referral_code: referralCode || undefined
      } as any);

      // 2. Mark onboarding step as complete
      const res = await onboardingApi.completeCustomerStep('set_profile', { email });

      if (res.status === 1) {
        // 3. Refresh full session to ensure next_step and onboarding_completed are updated
        await syncSession();

        // 4. Return to checklist
        router.replace('/onboarding/customer');
      }
    } catch (error: any) {
      if (error.response?.status === 404) return;

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
            <BackButton fallback="/onboarding/customer" variant="transparent" />
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {/* STEP INDICATOR */}
            <View style={styles.stepContainer}>
              <View style={[styles.stepDot, styles.stepDotActive]} />
              <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
              <View style={[styles.stepDot, { backgroundColor: colors.border }]} />
            </View>

            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Complete Your Profile</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>Tell us a bit about yourself so we can give you the best experience.</Text>
            </View>

            <View style={styles.form}>
              {/* Customer Type Selector */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.muted }]}>Account Type</Text>
                <View style={styles.typeRow}>
                  {([
                    { key: 'individual', label: 'Individual', icon: 'person-outline', sub: 'Personal use' },
                    { key: 'business',   label: 'Business',   icon: 'business-outline', sub: 'Office / bulk orders' },
                  ] as const).map(opt => {
                    const active = customerType === opt.key;
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        style={[styles.typeCard, { borderColor: active ? '#005d90' : colors.border, backgroundColor: active ? '#005d9010' : colors.inputBg }]}
                        onPress={() => setCustomerType(opt.key)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.typeIconWrap, { backgroundColor: active ? '#005d9018' : colors.background }]}>
                          <Ionicons name={opt.icon} size={22} color={active ? '#005d90' : colors.muted} />
                        </View>
                        <Text style={[styles.typeLabel, { color: active ? '#005d90' : colors.text }]}>{opt.label}</Text>
                        <Text style={[styles.typeSub, { color: colors.muted }]}>{opt.sub}</Text>
                        {active && (
                          <View style={styles.typeCheck}>
                            <Ionicons name="checkmark-circle" size={18} color="#005d90" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.muted }]}>Full Name</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor={colors.placeholder}
                    value={name}
                    onChangeText={setName}
                    autoFocus
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.muted }]}>Email Address (Optional)</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text, paddingRight: 80 }]}
                    placeholder="rahul@example.com"
                    placeholderTextColor={colors.placeholder}
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      setIsEmailVerified(false);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {email ? (!isEmailVerified ? (
                    <TouchableOpacity style={styles.verifyBtn} onPress={() => setShowOtpModal(true)}>
                      <Text style={styles.verifyText}>Verify</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={18} color={isDark ? '#4ade80' : '#16a34a'} />
                    </View>
                  )) : null}
                </View>
                <Text style={[styles.helper, { color: colors.muted }]}>We use this to send order receipts and updates.</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.muted }]}>Referral Code (Optional)</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Ionicons name="gift-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="TG-XXXX-XXXX"
                    placeholderTextColor={colors.placeholder}
                    value={referralCode}
                    onChangeText={setReferralCode}
                    autoCapitalize="characters"
                  />
                </View>
                <Text style={[styles.helper, { color: colors.muted }]}>Have a friend's code? Enter it here for rewards!</Text>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={handleContinue} disabled={loading} activeOpacity={0.8}>
              <LinearGradient
                colors={['#005d90', '#0077b6']}
                style={styles.cta}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.ctaText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        <EmailVerificationModal 
          visible={showOtpModal} 
          email={email} 
          onClose={() => setShowOtpModal(false)}
          onSuccess={() => setIsEmailVerified(true)} 
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scrollContent: { paddingHorizontal: 32, paddingTop: 20 },

  stepContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  stepDot: { width: 10, height: 10, borderRadius: 5 },
  stepDotActive: { backgroundColor: '#005d90', width: 24 },
  stepLine: { width: 30, height: 2, marginHorizontal: 8 },

  header: { marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, marginTop: 12, lineHeight: 22 },

  form: { gap: 24 },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: '800', marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 60,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '600' },
  helper: { fontSize: 12, fontStyle: 'italic', marginLeft: 4 },

  verifyBtn: { position: 'absolute', right: 8, top: 10, bottom: 10, backgroundColor: '#005d9020', paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' },
  verifyText: { fontSize: 13, fontWeight: '800', color: '#005d90' },
  verifiedBadge: { position: 'absolute', right: 16, justifyContent: 'center' },

  typeRow: { flexDirection: 'row', gap: 12 },
  typeCard: { flex: 1, borderRadius: 18, borderWidth: 1.5, padding: 14, alignItems: 'center', gap: 6, position: 'relative' },
  typeIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { fontSize: 14, fontWeight: '800' },
  typeSub: { fontSize: 11, textAlign: 'center' },
  typeCheck: { position: 'absolute', top: 8, right: 8 },

  footer: { padding: 32 },
  cta: {
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#005d90',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  ctaText: { color: 'white', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 }
});

