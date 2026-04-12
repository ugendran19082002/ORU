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
import { BackButton } from '@/components/ui/BackButton';

export default function ShopFSSAIScreen() {
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
        console.error('[FSSAI] ID Resolution Error:', err);
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
      Alert.alert('Document Required', 'Please select your document to proceed.');
      return;
    }

    try {
      setLoading(true);
      
      const fileUri = document.assets[0].uri;
      const fileName = document.assets[0].name;
      const fileType = document.assets[0].mimeType || 'application/octet-stream';

      const res = await onboardingApi.uploadShopDocument('fssai_document', shopId, {
        uri: fileUri,
        name: fileName,
        type: fileType,
      });
      
      if (res.status === 1) {
        Alert.alert('Submitted', 'Your FSSAI document is under review.');
        router.replace('/onboarding/shop');
      }
    } catch (error: any) {
      console.error('[Shop Onboarding] FSSAI Error:', error);
      Alert.alert('Error', 'Failed to upload document.');
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
            <Text style={styles.title}>Food Safety License</Text>
            <Text style={styles.subtitle}>Upload your mandatory FSSAI food safety document for verification.</Text>
          </View>

          <View style={styles.uploadSection}>
            <TouchableOpacity 
              style={[styles.uploadBox, document && !document.canceled && styles.uploadBoxActive]} 
              onPress={pickDocument}
              activeOpacity={0.7}
            >
              <View style={styles.iconCircle}>
                <Ionicons 
                    name={document && !document.canceled ? "document-attach" : "cloud-upload-outline"} 
                    size={40} 
                    color={document && !document.canceled ? "#006878" : "#94a3b8"} 
                />
              </View>
              <Text style={styles.uploadTitle}>
                {document && !document.canceled ? document.assets[0].name : "Choose File (PDF or Image)"}
              </Text>
              <Text style={styles.uploadSub}>Max size 5MB</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.notice}>
            <Ionicons name="information-circle-outline" size={20} color="#006878" />
            <Text style={styles.noticeText}>
              Ensure all text, including the license number and expiration date, is clearly visible.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
            <LinearGradient
              colors={['#006878', '#134e4a']}
              style={styles.cta}
            >
              {loading ? <ActivityIndicator color="white" /> : (
                <>
                  <Text style={styles.ctaText}>Upload & Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
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
  
  header: { marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '900', color: '#134e4a', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#64748b', marginTop: 12, lineHeight: 22 },

  uploadSection: { marginVertical: 20 },
  uploadBox: {
    width: '100%',
    height: 200,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  uploadBoxActive: { borderColor: '#006878', backgroundColor: '#ecfdf5', borderStyle: 'solid' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  uploadTitle: { fontSize: 16, fontWeight: '700', color: '#334155', textAlign: 'center' },
  uploadSub: { fontSize: 13, color: '#94a3b8', marginTop: 6 },

  notice: { flexDirection: 'row', gap: 12, backgroundColor: '#f0f9ff', padding: 20, borderRadius: 20, marginTop: 40 },
  noticeText: { flex: 1, fontSize: 13, color: '#006878', lineHeight: 20, fontWeight: '500' },

  footer: { padding: 32 },
  cta: { height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  ctaText: { color: 'white', fontSize: 17, fontWeight: '800' }
});
