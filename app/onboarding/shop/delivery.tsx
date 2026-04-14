import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppSession } from '@/hooks/use-app-session';
import { onboardingApi } from '@/api/onboardingApi';
import { BackButton } from '@/components/ui/BackButton';

export default function ShopDeliveryConfigScreen() {
  const router = useRouter();
  const { user, status } = useAppSession();
  const [loading, setLoading] = useState(false);
  const [fetchingShop, setFetchingShop] = useState(true);
  const [shopId, setShopId] = useState<number | null>(null);

  // 1. Resolve actual Shop ID
  React.useEffect(() => {
    (async () => {
      try {
        const res = await onboardingApi.getMerchantShop();
        if (res.data) {
          setShopId(res.data.id);
        } else {
          router.replace('/onboarding/shop/basic-details');
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          router.replace('/onboarding/shop/basic-details');
        }
      } finally {
        setFetchingShop(false);
      }
    })();
  }, []);

  const handleContinue = async () => {
    if (!shopId) return;

    try {
      setLoading(true);
      const res = await onboardingApi.updateDeliverySetup(shopId, { 
        is_self_delivery: true 
      });
      if (res.status === 1) {
        router.replace('/onboarding/shop');
      }
    } catch (error: any) {
      if (error.response?.status === 404) return;
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Could not save delivery settings.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <BackButton fallback="/onboarding/shop" style={{ marginBottom: 16 }} />
            <Text style={styles.title}>Delivery Flow</Text>
            <Text style={styles.subtitle}>Configure how orders reach your customers. Currently, ThanniGo supports shop-managed self-delivery.</Text>
          </View>

          {fetchingShop ? (
            <ActivityIndicator size="large" color="#006878" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.content}>
              <View style={styles.featureCard}>
                <View style={styles.iconCircle}>
                  <Ionicons name="bicycle" size={32} color="#006878" />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>Self-Managed Delivery</Text>
                  <Text style={styles.cardSub}>You or your staff will deliver the orders. You have full control over the delivery experience.</Text>
                </View>
                <Ionicons name="checkmark-circle" size={28} color="#10b981" />
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>How it works</Text>
                
                <View style={styles.infoRow}>
                  <View style={styles.bullet}>
                    <Text style={styles.bulletText}>1</Text>
                  </View>
                  <Text style={styles.infoItem}>Admin/Shop owner delivers by default.</Text>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.bullet}>
                    <Text style={styles.bulletText}>2</Text>
                  </View>
                  <Text style={styles.infoItem}>Add delivery persons later via your Dashboard.</Text>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.bullet}>
                    <Text style={styles.bulletText}>3</Text>
                  </View>
                  <Text style={styles.infoItem}>Delivery person uploads live image for proof of delivery.</Text>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.bullet}>
                    <Text style={styles.bulletText}>4</Text>
                  </View>
                  <Text style={styles.infoItem}>Customers track live location on their map.</Text>
                </View>
              </View>

              <View style={styles.alertBox}>
                  <Ionicons name="information-circle" size={24} color="#0369a1" />
                  <Text style={styles.alertText}>Platform delivery is currently unavailable in your region.</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleContinue} disabled={loading} activeOpacity={0.8}>
            <LinearGradient colors={['#006878', '#134e4a']} style={styles.cta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading ? <ActivityIndicator color="white" /> : (
                <>
                  <Text style={styles.ctaText}>Confirm Self-Delivery</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  safe: { flex: 1 },
  scrollContent: { paddingHorizontal: 32, paddingTop: 40 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '900', color: '#134e4a', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#64748b', marginTop: 12, lineHeight: 22 },
  content: { gap: 24, marginBottom: 40 },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#006878',
    gap: 16,
  },
  iconCircle: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#134e4a' },
  cardSub: { fontSize: 13, color: '#64748b', marginTop: 4, lineHeight: 18 },
  infoSection: { marginTop: 12, gap: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bullet: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  bulletText: { fontSize: 14, fontWeight: '800', color: '#64748b' },
  infoItem: { flex: 1, fontSize: 15, color: '#334155', fontWeight: '600' },
  alertBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f0f9ff', padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#bae6fd', marginTop: 20 },
  alertText: { flex: 1, fontSize: 13, color: '#0369a1', fontWeight: '700' },
  footer: { padding: 32 },
  cta: {
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  ctaText: { color: 'white', fontSize: 17, fontWeight: '800' }
});


