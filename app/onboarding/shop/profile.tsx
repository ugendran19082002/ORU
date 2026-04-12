import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppSession } from '@/hooks/use-app-session';
import { onboardingApi } from '@/api/onboardingApi';
import { BackButton } from '@/components/ui/BackButton';
import * as ImagePicker from 'expo-image-picker';

export default function ShopProfileBrandingScreen() {
  const router = useRouter();
  const { user } = useAppSession();
  const [loading, setLoading] = useState(false);
  const [fetchingShop, setFetchingShop] = useState(true);
  const [shopId, setShopId] = useState<number | null>(null);

  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  // 1. Resolve actual Shop ID
  React.useEffect(() => {
    (async () => {
      try {
        const res = await onboardingApi.getMerchantShop();
        if (res.data) {
          setShopId(res.data.id);
          setDescription(res.data.description || '');
          setLogoUri(res.data.logo_url || null);
          setBannerUri(res.data.banner_url || null);
        } else {
          router.replace('/onboarding/shop/create');
        }
      } catch (err: any) {
        if (err.response?.status === 404) router.replace('/onboarding/shop/create');
      } finally {
        setFetchingShop(false);
      }
    })();
  }, []);

  const pickImage = async (type: 'logo' | 'banner') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (type === 'logo') setLogoUri(result.assets[0].uri);
      else setBannerUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!shopId) return;

    try {
      setLoading(true);

      let finalLogo = logoUri;
      let finalBanner = bannerUri;

      // 1. Upload Logo if changed (checking local uri)
      if (logoUri && logoUri.startsWith('file://')) {
        const logoRes = await onboardingApi.uploadFile(shopId, 'store_profile', logoUri);
        finalLogo = logoRes.data.document_url;
      }

      // 2. Upload Banner if changed
      if (bannerUri && bannerUri.startsWith('file://')) {
        const bannerRes = await onboardingApi.uploadFile(shopId, 'store_profile', bannerUri);
        finalBanner = bannerRes.data.document_url;
      }

      // 3. Save Branding
      const res = await onboardingApi.updateStoreBranding(shopId, {
        logo_url: finalLogo || undefined,
        banner_url: finalBanner || undefined,
        description,
      });

      if (res.status === 1) {
        router.replace('/onboarding/shop');
      }
    } catch (error: any) {
      console.error('[Branding] Save Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Could not save branding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <BackButton fallback="/onboarding/shop" />
              <View style={{ marginTop: 24 }}>
                <Text style={styles.title}>Shop Identity</Text>
                <Text style={styles.subtitle}>Upload your logo and shop banner to stand out in the customer app.</Text>
              </View>
            </View>

            {fetchingShop ? (
              <ActivityIndicator size="large" color="#005d90" style={{ marginTop: 60 }} />
            ) : (
              <View style={styles.form}>
                
                {/* BANNER PICKER */}
                <Text style={styles.label}>Shop Banner (16:9)</Text>
                <TouchableOpacity style={styles.bannerPicker} onPress={() => pickImage('banner')} activeOpacity={0.7}>
                  {bannerUri ? (
                    <Image source={{ uri: bannerUri }} style={styles.bannerImg} />
                  ) : (
                    <View style={styles.bannerPlaceholder}>
                      <Ionicons name="image-outline" size={32} color="#94a3b8" />
                      <Text style={styles.pickerHint}>Tap to upload banner</Text>
                    </View>
                  )}
                  <View style={styles.editBadge}>
                    <Ionicons name="camera" size={16} color="white" />
                  </View>
                </TouchableOpacity>

                {/* LOGO PICKER */}
                <View style={styles.logoRow}>
                  <TouchableOpacity style={styles.logoPicker} onPress={() => pickImage('logo')} activeOpacity={0.7}>
                    {logoUri ? (
                      <Image source={{ uri: logoUri }} style={styles.logoImg} />
                    ) : (
                      <View style={styles.logoPlaceholder}>
                        <Ionicons name="business-outline" size={24} color="#94a3b8" />
                      </View>
                    )}
                    <View style={styles.editBadgeLogo}>
                      <Ionicons name="camera" size={12} color="white" />
                    </View>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logoTitle}>Shop Logo</Text>
                    <Text style={styles.logoSub}>Square format works best.</Text>
                  </View>
                </View>

                {/* DESCRIPTION */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>About Your Shop</Text>
                  <View style={[styles.inputWrap, styles.textAreaWrap]}>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Share your story, specialities, or mission..."
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={5}
                    />
                  </View>
                </View>

              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleSave} disabled={loading || fetchingShop} activeOpacity={0.8}>
              <LinearGradient
                colors={['#005d90', '#003a5c']}
                style={styles.cta}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? <ActivityIndicator color="white" /> : (
                  <>
                    <Text style={styles.ctaText}>Finish Branding</Text>
                    <Ionicons name="sparkles-outline" size={20} color="white" />
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
  scrollContent: { paddingHorizontal: 32, paddingBottom: 40 },
  
  header: { marginBottom: 30, paddingTop: 20 },
  title: { fontSize: 32, fontWeight: '900', color: '#003a5c', letterSpacing: -1 },
  subtitle: { fontSize: 15, color: '#64748b', marginTop: 12, lineHeight: 22 },

  form: { gap: 24 },
  label: { fontSize: 13, fontWeight: '800', color: '#475569', marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  bannerPicker: {
    height: 180,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative'
  },
  bannerPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bannerImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  pickerHint: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginTop: 8 },
  editBadge: { position: 'absolute', bottom: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },

  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 10 },
  logoPicker: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#f1f5f9', borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  logoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  logoImg: { width: '100%', height: '100%', borderRadius: 22 },
  editBadgeLogo: { position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, borderRadius: 12, backgroundColor: '#005d90', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' },
  logoTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  logoSub: { fontSize: 13, color: '#64748b', marginTop: 2, fontWeight: '500' },

  inputGroup: { gap: 8, marginTop: 10 },
  inputWrap: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textAreaWrap: { height: 140 },
  input: { fontSize: 16, color: '#1e293b', fontWeight: '600' },
  textArea: { flex: 1, textAlignVertical: 'top' },

  footer: { padding: 32, backgroundColor: 'white' },
  cta: {
    height: 64,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#005d90',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  ctaText: { color: 'white', fontSize: 18, fontWeight: '800' }
});
