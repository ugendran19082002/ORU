import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { onboardingApi } from '@/api/onboardingApi';
import { useAppSession } from '@/hooks/use-app-session';

export default function ShopGSTScreen() {
  const router = useRouter();
  const { user, status } = useAppSession();
  const [loading, setLoading] = useState(false);
  const [fetchingShop, setFetchingShop] = useState(true);
  const [shopId, setShopId] = useState<number | null>(null);
  const [document, setDocument] = useState<DocumentPicker.DocumentPickerResult | null>(null);

  // 0. Role Bouncer
  if (status === 'authenticated' && user?.role !== 'shop_owner' && user?.role !== 'admin') {
    return null;
  }

  // 1. Resolve actual Shop ID
  React.useEffect(() => {
    (async () => {
      try {
        const res = await onboardingApi.getMerchantShop();
        if (res.data) {
          setShopId(res.data.id);
        } else {
          router.replace('/onboarding/shop/create');
        }
      } catch (err: any) {
        console.error('[GST] ID Resolution Error:', err);
        if (err.response?.status === 404) {
          router.replace('/onboarding/shop/create');
        }
      } finally {
        setFetchingShop(false);
      }
    })();
  }, []);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setDocument(result);
      }
    } catch (error) {
      console.error('[DocumentPicker] Error:', error);
    }
  };

  const handleSubmit = async () => {
    if (!shopId) {
      Alert.alert('Error', 'Shop context lost. Please try again.');
      return;
    }

    if (!document || document.canceled) {
      // Optional field, but if they clicked submit they probably want to upload
      Alert.alert('Skip?', 'GST is optional. Do you want to skip for now?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: () => router.replace('/onboarding/shop' as any) }
      ]);
      return;
    }

    try {
      setLoading(true);
      const fileName = document.assets[0].name;
      const res = await onboardingApi.completeShopStep('gst_details', shopId, { fileName });
      
      if (res.status === 1) {
        router.replace('/onboarding/shop');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload GST certificate.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!shopId) return;
    try {
      setLoading(true);
      const res = await onboardingApi.skipShopStep('gst_details', shopId);
      if (res.status === 1) {
        router.replace('/onboarding/shop');
      }
    } catch (err) {
      console.error('[GST] Skip Error:', err);
      // Fallback
      router.replace('/onboarding/shop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity 
            style={styles.skipLink} 
            onPress={handleSkip}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#94a3b8" />
            ) : (
              <Text style={styles.skipLinkText}>Skip for now</Text>
            )}
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>GST Certificate</Text>
            <Text style={styles.subtitle}>Upload your GST certificate for tax compliance and higher business limits (optional).</Text>
          </View>

          <View style={styles.uploadSection}>
            <TouchableOpacity 
              style={[styles.uploadBox, document && !document.canceled && styles.uploadBoxActive]} 
              onPress={pickDocument}
            >
              <Ionicons 
                name={document && !document.canceled ? "checkmark-done-circle" : "document-text-outline"} 
                size={40} 
                color={document && !document.canceled ? "#006878" : "#94a3b8"} 
              />
              <Text style={styles.uploadTitle}>
                {document && !document.canceled ? document.assets[0].name : "Choose GST PDF/Image"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
            <LinearGradient colors={['#006878', '#134e4a']} style={styles.cta}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.ctaText}>Finish Upload</Text>}
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
  scrollContent: { paddingHorizontal: 32, paddingTop: 20 },
  skipLink: { alignSelf: 'flex-end', marginBottom: 20 },
  skipLinkText: { fontSize: 13, color: '#94a3b8', fontWeight: '700' },
  
  header: { marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '900', color: '#134e4a', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#64748b', marginTop: 12, lineHeight: 22 },

  uploadSection: { marginVertical: 20 },
  uploadBox: { width: '100%', height: 160, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: '#e2e8f0', backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 24 },
  uploadBoxActive: { borderColor: '#006878', backgroundColor: '#ecfdf5', borderStyle: 'solid' },
  uploadTitle: { fontSize: 14, fontWeight: '700', color: '#334155', textAlign: 'center', marginTop: 12 },

  footer: { padding: 32 },
  cta: { height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: 'white', fontSize: 17, fontWeight: '800' }
});
