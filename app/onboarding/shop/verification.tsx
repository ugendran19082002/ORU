import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAppSession } from '@/hooks/use-app-session';
import { onboardingApi } from '@/api/onboardingApi';
import { useLogoutBackHandler } from '@/hooks/use-logout-back-handler';
import { BackButton } from '@/components/ui/BackButton';

export default function ShopVerificationScreen() {
  const router = useRouter();
  const { user, status } = useAppSession();
  const { handleAuthBack } = useLogoutBackHandler();
  const [loading, setLoading] = useState(false);
  const [fetchingShop, setFetchingShop] = useState(true);
  const [shopId, setShopId] = useState<number | null>(null);

  const [idProof, setIdProof] = useState<string | null>(null);
  const [shopPhoto, setShopPhoto] = useState<string | null>(null);

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
        if (err.response?.status === 404) {
          router.replace('/onboarding/shop/create');
        }
      } finally {
        setFetchingShop(false);
      }
    })();
  }, []);

  const pickImage = async (type: 'id' | 'shop') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permission denied', text2: 'Need camera roll access to upload photos.' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (type === 'id') setIdProof(result.assets[0].uri);
        else setShopPhoto(result.assets[0].uri);
      }
    } catch (err) {
      console.error('[Verification] Pick Error:', err);
    }
  };

  const handleContinue = async () => {
    if (!shopId) return;

    // Both are optional according to diagram, but we should at least try to save if provided
    try {
      setLoading(true);

      if (idProof) {
        await onboardingApi.uploadShopDocument('verification', shopId, {
          uri: idProof,
          name: 'id_proof.jpg',
          type: 'image/jpeg'
        });
      }

      if (shopPhoto) {
        await onboardingApi.uploadShopDocument('verification', shopId, {
          uri: shopPhoto,
          name: 'shop_photo.jpg',
          type: 'image/jpeg'
        });
      }

      // Mark step as complete (even if no docs, since optional)
      await onboardingApi.completeShopStep('verification', shopId, { 
        id_provided: !!idProof, 
        photo_provided: !!shopPhoto 
      });

      router.replace('/onboarding/shop');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Upload Error',
        text2: error.response?.data?.message || 'Could not save verification info.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <BackButton fallback="/onboarding/shop" style={{ marginBottom: 16 }} onPress={handleAuthBack} />
              <Text style={styles.title}>Verification</Text>
              <Text style={styles.subtitle}>Upload your ID proof or a photo of your shop. This helps us verify your account faster.</Text>
            </View>

            {fetchingShop ? (
              <ActivityIndicator size="large" color="#006878" style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ID Proof (Optional)</Text>
                  <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage('id')}>
                    {idProof ? (
                      <Image source={{ uri: idProof }} style={styles.previewImage} />
                    ) : (
                      <View style={styles.uploadPlaceholder}>
                        <Ionicons name="card-outline" size={32} color="#94a3b8" />
                        <Text style={styles.uploadText}>Aadhar, License or Voter ID</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Shop Photo (Optional)</Text>
                  <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage('shop')}>
                    {shopPhoto ? (
                      <Image source={{ uri: shopPhoto }} style={styles.previewImage} />
                    ) : (
                      <View style={styles.uploadPlaceholder}>
                        <Ionicons name="image-outline" size={32} color="#94a3b8" />
                        <Text style={styles.uploadText}>Frontend view of your shop</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleContinue} disabled={loading} activeOpacity={0.8}>
              <LinearGradient colors={['#006878', '#134e4a']} style={styles.cta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading ? <ActivityIndicator color="white" /> : (
                  <>
                    <Text style={styles.ctaText}>{idProof || shopPhoto ? 'Upload and Continue' : 'Skip and Continue'}</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  form: { gap: 32, marginBottom: 40 },
  inputGroup: { gap: 12 },
  label: { fontSize: 13, fontWeight: '800', color: '#475569', marginLeft: 4, textTransform: 'uppercase' },
  uploadCard: {
    height: 180,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  uploadPlaceholder: { alignItems: 'center', gap: 8 },
  uploadText: { fontSize: 14, color: '#94a3b8', fontWeight: '600' },
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
