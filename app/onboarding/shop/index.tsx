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
  const { user, updateUser, status } = useAppSession();
  const [loading, setLoading] = useState(true);
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

  if (loading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006878" />
      </View>
    );
  }

  const progressPercent = data ? (data.completed_steps / data.total_steps) * 100 : 0;

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
            {data?.completed_steps} of {data?.total_steps} requirements met
          </Text>
        </LinearGradient>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStatus} />}
        >
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
                  { backgroundColor: isCompleted ? '#ecfdf5' : isReview ? '#fff7ed' : '#f8fafc' }
                ]}>
                  <Ionicons
                    name={isCompleted ? "checkmark-circle" : isReview ? "time" : (step.icon_name as any || "document-text")}
                    size={22}
                    color={isCompleted ? "#059669" : isReview ? "#d97706" : "#006878"}
                  />
                </View>

                <View style={styles.stepInfo}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.description}</Text>
                  {isReview && <Text style={styles.reviewTag}>Under Admin Review</Text>}
                </View>

                {!(isCompleted || isReview) && (
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
  infoText: { flex: 1, fontSize: 12, color: '#64748b', lineHeight: 18 }
});
