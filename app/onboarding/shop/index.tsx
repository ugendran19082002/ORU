import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { onboardingApi } from '@/api/onboardingApi';
import type { OnboardingStatus } from '@/types/onboarding';
import { useAppSession } from '@/hooks/use-app-session';
import { BackButton } from '@/components/ui/BackButton';

export default function ShopOnboardingDashboard() {
  const router = useRouter();
  const { user, updateUser, status, refreshShopStatus } = useAppSession();
  const [loading, setLoading] = useState(true);
  const [resubmitting, setResubmitting] = useState(false);
  const [data, setData] = useState<OnboardingStatus | null>(null);

  // 0. Role Bouncer
  if (status === 'authenticated' && user?.role !== 'shop_owner' && user?.role !== 'admin') {
    return null;
  }

  const fetchStatus = async () => {
    try {
      setLoading(true);

      // 1. Dynamic Shop Discovery
      // We fetch the merchant's actual shop detail
      const shopRes = await onboardingApi.getMerchantShop();
      const shop = shopRes.data;

      if (!shop) {
        console.log('[Shop Onboarding] No shop data, redirecting to creation');
        router.replace('/onboarding/shop/create');
        return;
      }

      const shopId = shop.id;
      
      // 2. Fetch steps for the REAL shop ID
      const res = await onboardingApi.getShopSteps(shopId);
      if (res.status === 1) {
        setData(res.data);

        // If completed, update session and navigate
        if (res.data.onboarding_completed) {
          await updateUser({ onboarding_completed: true });
          router.replace('/shop' as any);
        }
      }
    } catch (error: any) {
      console.error('[Shop Onboarding] Fetch error:', error);
      
      // If 404, it means the user has not created a shop yet
      if (error.response?.status === 404) {
        console.log('[Shop Onboarding] Shop not found (404), redirecting to create');
        router.replace('/onboarding/shop/create');
      } 
      else if (error.response?.status === 403) {
        Alert.alert('Permission Denied', 'You do not have access to shop owner features.');
        router.replace('/auth/role');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleStepPress = (step: any) => {
    if (step.status === 'completed' || step.status === 'under_review') return;
    
    if (step.screen_route) {
      router.push(step.screen_route as any);
    } else {
      Alert.alert('Verification Step', `Please prepare your ${step.title} for upload.`);
    }
  };

  const handleResubmit = async () => {
    if (!data?.is_ready_for_review || isPendingReview) return;
    
    try {
      setResubmitting(true);
      // We fetch the shop ID from the loaded data
      const shopRes = await onboardingApi.getMerchantShop();
      const shopId = shopRes.data.id;

      const res = await onboardingApi.resubmitShop(shopId);
      if (res.status === 1) {
        Alert.alert('Success', 'Your application has been resubmitted for review.');
        await refreshShopStatus();
        router.replace('/onboarding/shop/waitlist');
      }
    } catch (error: any) {
      console.error('[Resubmit] Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to resubmit application.');
    } finally {
      setResubmitting(false);
    }
  };

  if (loading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006878" />
      </View>
    );
  }

  const progressPercent = data ? (data.completed_mandatory / data.total_mandatory) * 100 : 0;
  const isPendingReview = user?.shopStatus === 'pending_review';
  const canShowSubmit = (data?.is_ready_for_review && !isPendingReview);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <BackButton fallback="/auth/role" />
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.welcome}>Partner Onboarding</Text>
            <Text style={styles.subtitle}>Verify your business to start selling</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: '#006878' }]}>
            <Ionicons name="business" size={20} color="white" />
          </View>
        </View>

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

          {isPendingReview && (
            <View style={[styles.rejectionBanner, { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }]}>
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
            
            return (
              <TouchableOpacity
                key={step.id}
                style={[
                  styles.stepCard,
                  (isCompleted || isReview) && styles.stepCardMuted
                ]}
                onPress={() => handleStepPress(step)}
                activeOpacity={(isCompleted || isReview) ? 1 : 0.7}
              >
                <View style={[
                  styles.iconWrap,
                  { backgroundColor: isCompleted ? '#ecfdf5' : isReview ? '#fff7ed' : step.status === 'skipped' ? '#f1f5f9' : '#f8fafc' }
                ]}>
                  <Ionicons
                    name={isCompleted ? "checkmark-circle" : isReview ? "time" : step.status === 'skipped' ? "eye-off" : (step.icon_name as any || "document-text")}
                    size={22}
                    color={isCompleted ? "#059669" : isReview ? "#d97706" : step.status === 'skipped' ? "#94a3b8" : "#006878"}
                  />
                </View>

                <View style={styles.stepInfo}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.description}</Text>
                  {isReview && <Text style={styles.reviewTag}>Under Admin Review</Text>}
                  {step.status === 'skipped' && <Text style={[styles.reviewTag, { color: '#94a3b8' }]}>Skipped for now</Text>}
                </View>

                {!(isCompleted || isReview || step.status === 'skipped') && (
                  <Ionicons name="arrow-forward-circle-outline" size={24} color="#006878" />
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
                      {user?.shopStatus === 'rejected' ? 'Submit for Final Review' : 'Submit Application'}
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
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepInfo: { flex: 1, marginLeft: 16 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: '#334155' },
  stepDesc: { fontSize: 13, color: '#64748b', marginTop: 2 },
  reviewTag: { fontSize: 11, fontWeight: '800', color: '#d97706', marginTop: 4, textTransform: 'uppercase' },

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
  resubmitText: { color: 'white', fontSize: 16, fontWeight: '800' }
});
