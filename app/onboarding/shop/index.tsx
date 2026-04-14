import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { onboardingApi } from '@/api/onboardingApi';
import { authApi } from '@/api/authApi';
import type { OnboardingStatus } from '@/types/onboarding';
import { useAppSession } from '@/hooks/use-app-session';
import { BackButton } from '@/components/ui/BackButton';
import { useLogoutBackHandler } from '@/hooks/use-logout-back-handler';

export default function ShopOnboardingDashboard() {
  const router = useRouter();
  const { user, updateUser, status, refreshShopStatus, syncSession } = useAppSession();
  const { handleAuthBack } = useLogoutBackHandler();
  const [loading, setLoading] = useState(true);
  const [resubmitting, setResubmitting] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [data, setData] = useState<OnboardingStatus | null>(null);


  const fetchStatus = async () => {
    try {
      setLoading(true);

      // 1. Dynamic Shop Discovery
      let shopId = null;
      try {
        const shopRes = await onboardingApi.getMerchantShop();
        if (shopRes.data) shopId = shopRes.data.id;
      } catch (err: any) {
        // 404 means no shop yet, which is fine, we continue to get steps (null shopId)
        if (err.response?.status !== 404) throw err; 
      }
      
      // 2. Fetch steps (backend now handles null shopId by returning default pending steps)
      const res = await onboardingApi.getShopSteps(shopId);
      if (res.status === 1) {
        setData(res.data);

        // If completed, update session and navigate
        if (res.data.onboarding_completed && shopId) {
          await updateUser({ onboarding_completed: true });
          router.replace('/shop' as any);
        }
      }
    } catch (error: any) {
      if (error.response?.status === 404) return;
      
      if (error.response?.status === 403) {
        Toast.show({
          type: 'error',
          text1: 'Permission Denied',
          text2: 'You do not have access to shop owner features.'
        });
        router.replace('/auth/role');
      }
      // If error is 404, we don't redirect anymore, we just let the empty state show
      // though the backend now returns 200 with pending steps even if shop is null.
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStatus();
    }, [])
  );

  const handleStepPress = (step: any) => {
    if (isSubmissionLocked) return;
    
    if (step.screen_route) {
      router.push(step.screen_route as any);
    } else {
      Toast.show({
        type: 'info',
        text1: 'Verification Step',
        text2: `Please prepare your ${step.title} for upload.`
      });
    }
  };

  const handleResubmit = async () => {
    if (!data?.is_ready_for_review || isSubmissionLocked) return;
    
    try {
      setResubmitting(true);
      // We fetch the shop ID from the loaded data
      const shopRes = await onboardingApi.getMerchantShop();
      const shopId = shopRes.data.id;

      const res = await onboardingApi.resubmitShop(shopId);
      if (res.status === 1) {
        Toast.show({
          type: 'success',
          text1: 'Submission Successful',
          text2: 'Your application is now under review.'
        });
        await refreshShopStatus();
        router.replace('/onboarding/shop/waitlist');
      }
    } catch (error: any) {
      if (error.response?.status === 404) return;
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to resubmit application.'
      });
    } finally {
      setResubmitting(false);
    }
  };

  const handleRoleReset = async () => {
    Alert.alert(
      "Confirm Role Change",
      "Are you sure you want to switch to a Customer account? All your current shop data, progress, and settings will be permanently deleted.",
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
                // Sync session with the fresh user data returned from reset
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
  if (status === 'authenticated' && user?.role !== 'shop_owner' && user?.role !== 'admin') {
    return null;
  }

  if (loading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006878" />
      </View>
    );
  }

  const progressPercent = data ? (data.completed_mandatory / data.total_mandatory) * 100 : 0;
  const isSubmissionLocked = user?.shopStatus === 'pending_review' || user?.shopStatus === 'under_review' || user?.shopStatus === 'active';
  const canShowSubmit = (data?.is_ready_for_review && !isSubmissionLocked);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <BackButton 
            fallback="/auth/role" 
            onPress={isSubmissionLocked ? undefined : handleRoleReset} 
            show={!isSubmissionLocked}
          />
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.welcome}>Partner Onboarding</Text>
            <Text style={styles.subtitle}>Verify your business to start selling</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: '#006878' }]}>
            <Ionicons name="business" size={20} color="white" />
          </View>
        </View>

        {!isSubmissionLocked && (
            <View style={styles.roleSwitchTip}>
                <Ionicons name="help-circle-outline" size={16} color="#64748b" />
                <Text style={styles.roleSwitchText}>Wrong role?</Text>
                <TouchableOpacity onPress={handleRoleReset}>
                    <Text style={styles.roleSwitchLink}>Switch to Customer</Text>
                </TouchableOpacity>
            </View>
        )}

        <LinearGradient
          colors={['#006878', '#004a55']}
          style={styles.progressCard}
        >
          <Text style={styles.progressTitle}>Business Verification</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressStatus}>
            {data?.completed_mandatory} of {data?.total_mandatory} mandatory requirements met
          </Text>
        </LinearGradient>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStatus} />}
        >
          {user?.shopStatus === 'rejected' && (
            <View style={styles.rejectionBanner}>
              <View style={styles.rejectionIcon}>
                <Ionicons name="alert-circle" size={24} color="#ba1a1a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rejectionTitle}>Action Required: Changes Needed</Text>
                <Text style={styles.rejectionMsg}>Please correct the items marked and resubmit for approval.</Text>
              </View>
            </View>
          )}

          {isSubmissionLocked && (
            <View style={[styles.rejectionBanner, { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }] as any}>
              <View style={[styles.rejectionIcon, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="time" size={24} color="#0369a1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rejectionTitle, { color: '#0369a1' }]}>Under Review</Text>
                <Text style={[styles.rejectionMsg, { color: '#0c4a6e' }]}>We are currently verifying your business details. We'll notify you once approved.</Text>
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>Verification Checklist</Text>
          
          {data?.steps.map((step) => {
            const isCompleted = step.status === 'completed';
            const isReview = step.status === 'under_review';
            const isRejected = step.status === 'rejected';
            const isSkipped = step.status === 'skipped';
            const isInProgress = step.status === 'in_progress';
            
            const canEdit = !isSubmissionLocked;
            const hasData = isCompleted || isRejected || isSkipped || isInProgress || isReview;

            return (
              <TouchableOpacity
                key={step.id}
                style={[
                  styles.stepCard,
                  ((isReview && isSubmissionLocked) || (isCompleted && isSubmissionLocked) ? styles.stepCardMuted : undefined) as any,
                  (isRejected ? styles.stepCardRejected : undefined) as any
                ] as any}
                onPress={() => handleStepPress(step)}
                activeOpacity={((isReview && isSubmissionLocked) || (isCompleted && isSubmissionLocked)) ? 1 : 0.7}
              >
                <View style={[
                  styles.iconWrap,
                  { backgroundColor: isCompleted ? '#ecfdf5' : isReview ? '#fff7ed' : isRejected ? '#fef2f2' : isSkipped ? '#f1f5f9' : '#f8fafc' }
                ]}>
                  <Ionicons
                    name={isCompleted ? "checkmark-circle" : isReview ? "time" : isRejected ? "close-circle" : isSkipped ? "eye-off" : (step.icon_name as any || "document-text")}
                    size={22}
                    color={isCompleted ? "#059669" : isReview ? "#d97706" : isRejected ? "#dc2626" : isSkipped ? "#94a3b8" : "#006878"}
                  />
                </View>

                <View style={styles.stepInfo}>
                  <Text style={[styles.stepTitle, isRejected ? { color: '#991b1b' } : undefined]}>{step.title}</Text>
                  <Text style={styles.stepDesc} numberOfLines={1}>{step.description}</Text>
                  
                  {isReview && (
                    <Text style={[styles.reviewTag, !isSubmissionLocked && { color: '#0369a1' }]}>
                        {isSubmissionLocked ? 'Under Admin Review' : 'Ready for Review'}
                    </Text>
                  )}
                  
                  {canEdit && hasData && (
                    <View style={styles.editBadge}>
                      <Ionicons name="create-outline" size={12} color="white" />
                      <Text style={styles.editBadgeText}>EDIT DATA</Text>
                    </View>
                  )}

                  {isRejected && (
                      <View style={styles.notesBox}>
                          <Text style={styles.notesLabel}>REJECTION NOTE:</Text>
                          <Text style={styles.notesText}>{step.admin_notes || "Information incomplete or incorrect."}</Text>
                      </View>
                  )}
                  {isSkipped && !canEdit && <Text style={[styles.reviewTag, { color: '#94a3b8' }]}>Skipped for now</Text>}
                </View>

                {canEdit && (
                  <Ionicons 
                    name={hasData ? "pencil" : "arrow-forward-circle-outline"} 
                    size={hasData ? 20 : 24} 
                    color={hasData ? "#94a3b8" : "#006878"} 
                  />
                )}
              </TouchableOpacity>
            );
          })}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color="#64748b" />
            <Text style={styles.infoText}>
              Verification typically takes 24-48 hours once all documents are submitted.
            </Text>
          </View>

          {canShowSubmit && (
            <TouchableOpacity 
              style={styles.resubmitBtn} 
              onPress={handleResubmit}
              disabled={resubmitting}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#006878', '#004a55']}
                style={styles.resubmitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {resubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.resubmitText}>
                      {user?.shopStatus === 'rejected' ? 'Submit for Final Review' : 'Submit Application for Review'}
                    </Text>
                    <Ionicons name="send-outline" size={18} color="white" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfdfd' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  welcome: { fontSize: 24, fontWeight: '900', color: '#134e4a', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  progressCard: { marginHorizontal: 24, borderRadius: 20, padding: 20 },
  progressTitle: { color: 'white', fontSize: 16, fontWeight: '800', marginBottom: 16 },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3 },
  progressBarFill: { height: '100%', backgroundColor: '#2dd4bf', borderRadius: 3 },
  progressStatus: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 12, fontWeight: '600' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginTop: 24, marginBottom: 16 },

  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  stepCardMuted: { opacity: 0.8, backgroundColor: '#f8fafc' },
  stepCardRejected: { borderColor: '#fecaca', backgroundColor: '#fffafb' },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepInfo: { flex: 1, marginLeft: 16 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: '#334155' },
  stepDesc: { fontSize: 13, color: '#64748b', marginTop: 2 },
  reviewTag: { fontSize: 11, fontWeight: '800', color: '#d97706', marginTop: 4, textTransform: 'uppercase' },

  notesBox: { backgroundColor: '#fef2f2', padding: 12, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: '#fee2e2' },
  notesLabel: { fontSize: 9, fontWeight: '900', color: '#dc2626', letterSpacing: 1 },
  notesText: { fontSize: 13, color: '#991b1b', marginTop: 4, fontWeight: '600', lineHeight: 18 },
  
  editBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 6,
    gap: 4
  },
  editBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5
  },

  infoBox: { flexDirection: 'row', gap: 10, backgroundColor: '#f1f5f9', padding: 16, borderRadius: 12, marginTop: 20 },
  infoText: { flex: 1, fontSize: 12, color: '#64748b', lineHeight: 18 },

  rejectionBanner: {
    backgroundColor: '#fff5f5',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#feb2b2',
    gap: 12
  },
  rejectionIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#ffe4e4', alignItems: 'center', justifyContent: 'center' },
  rejectionTitle: { fontSize: 14, fontWeight: '800', color: '#ba1a1a' },
  rejectionMsg: { fontSize: 12, color: '#7f1d1d', marginTop: 2 },

  resubmitBtn: { marginTop: 32, shadowColor: '#005d90', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
  resubmitGradient: { height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  resubmitText: { color: 'white', fontSize: 16, fontWeight: '800' },

  roleSwitchTip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 24, marginBottom: 16, backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  roleSwitchText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  roleSwitchLink: { fontSize: 13, color: '#006878', fontWeight: '800', textDecorationLine: 'underline' }
});
