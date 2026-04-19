import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image, TextInput,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { onboardingApi } from '@/api/onboardingApi';
import { BackButton } from '@/components/ui/BackButton';
import { useStepBackHandler } from '@/hooks/use-step-back-handler';
import { useAppTheme } from '@/providers/ThemeContext';

const SHOP_ACCENT = '#006878';
const SHOP_GRAD: [string, string] = ['#006878', '#134e4a'];

type DocKey = 'aadhar_front' | 'aadhar_back' | 'pan';

export default function ShopVerificationScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [fetchingShop, setFetchingShop] = useState(true);
  const [shopId, setShopId] = useState<number | null>(null);

  useStepBackHandler('/onboarding/shop');

  // Aadhar
  const [aadharFront, setAadharFront] = useState<string | null>(null);
  const [aadharBack, setAadharBack] = useState<string | null>(null);

  // PAN
  const [panPhoto, setPanPhoto] = useState<string | null>(null);
  const [panNo, setPanNo] = useState('');
  const [panName, setPanName] = useState('');

  // Upload URLs returned from server
  const [uploadedUrls, setUploadedUrls] = useState<Record<string, string>>({});

  React.useEffect(() => {
    (async () => {
      try {
        const res = await onboardingApi.getMerchantShop();
        if (res.data) {
          setShopId(res.data.id);
          // Pre-populate existing values
          setPanNo(res.data.pan_no || '');
          setPanName(res.data.pan_name || '');
          if (res.data.aadhar_front_url) setUploadedUrls(p => ({ ...p, aadhar_front: res.data.aadhar_front_url }));
          if (res.data.aadhar_back_url) setUploadedUrls(p => ({ ...p, aadhar_back: res.data.aadhar_back_url }));
          if (res.data.pan_url) setUploadedUrls(p => ({ ...p, pan: res.data.pan_url }));
        } else {
          router.replace('/onboarding/shop/basic-details');
        }
      } catch (err: any) {
        if (err.response?.status === 404) router.replace('/onboarding/shop/basic-details');
      } finally {
        setFetchingShop(false);
      }
    })();
  }, []);

  const pickImage = async (key: DocKey) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permission denied', text2: 'Need gallery access to upload photos.' });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > 5_000_000) {
          Toast.show({ type: 'error', text1: 'File Too Large', text2: 'Max 5MB per image.' });
          return;
        }
        if (key === 'aadhar_front') setAadharFront(asset.uri);
        else if (key === 'aadhar_back') setAadharBack(asset.uri);
        else setPanPhoto(asset.uri);
      }
    } catch { }
  };

  const uploadDoc = async (uri: string, name: string): Promise<string | null> => {
    try {
      const res = await onboardingApi.uploadShopDocument('verification', shopId!, {
        uri, name, type: 'image/jpeg',
      });
      return res.data?.document_url ?? null;
    } catch {
      return null;
    }
  };

  const handleContinue = async () => {
    if (!shopId) {
      Toast.show({ type: 'info', text1: 'Complete Basic Details First', text2: 'Please register your shop before uploading documents.' });
      router.replace('/onboarding/shop/basic-details');
      return;
    }

    try {
      setLoading(true);
      const metadata: Record<string, any> = {};

      // Upload Aadhar Front
      if (aadharFront) {
        const url = await uploadDoc(aadharFront, 'aadhar_front.jpg');
        if (url) metadata.aadhar_front_url = url;
      } else if (uploadedUrls.aadhar_front) {
        metadata.aadhar_front_url = uploadedUrls.aadhar_front;
      }

      // Upload Aadhar Back
      if (aadharBack) {
        const url = await uploadDoc(aadharBack, 'aadhar_back.jpg');
        if (url) metadata.aadhar_back_url = url;
      } else if (uploadedUrls.aadhar_back) {
        metadata.aadhar_back_url = uploadedUrls.aadhar_back;
      }

      // Upload PAN photo
      if (panPhoto) {
        const url = await uploadDoc(panPhoto, 'pan_card.jpg');
        if (url) metadata.pan_url = url;
      } else if (uploadedUrls.pan) {
        metadata.pan_url = uploadedUrls.pan;
      }

      // PAN text fields
      if (panNo.trim()) metadata.pan_no = panNo.trim().toUpperCase();
      if (panName.trim()) metadata.pan_name = panName.trim();

      await onboardingApi.completeShopStep('verification', shopId, metadata);
      Toast.show({ type: 'success', text1: 'Verification Saved', text2: 'Documents submitted successfully.' });
      router.replace('/onboarding/shop');
    } catch (error: any) {
      if (error.response?.status === 404) return;
      Toast.show({ type: 'error', text1: 'Upload Error', text2: error.response?.data?.message || 'Could not save verification info.' });
    } finally {
      setLoading(false);
    }
  };

  const hasAny = !!(aadharFront || aadharBack || panPhoto || panNo || panName ||
    uploadedUrls.aadhar_front || uploadedUrls.aadhar_back || uploadedUrls.pan);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* Header */}
            <View style={styles.header}>
              <BackButton fallback="/onboarding/shop" style={{ marginBottom: 16 }} />
              <Text style={[styles.title, { color: colors.text }]}>Verification</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                Upload your Aadhar (front & back) and PAN card details. All fields are optional but help speed up verification.
              </Text>
            </View>

            {fetchingShop ? (
              <ActivityIndicator size="large" color={SHOP_ACCENT} style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.form}>

                {/* ── AADHAR SECTION ── */}
                <SectionHeader icon="card-outline" title="Aadhar Card" accent={SHOP_ACCENT} colors={colors} />

                <View style={styles.twoCol}>
                  <DocUploadCard
                    label="Front Side"
                    icon="id-card-outline"
                    uri={aadharFront}
                    uploadedUrl={uploadedUrls.aadhar_front}
                    onPick={() => pickImage('aadhar_front')}
                    colors={colors}
                    isDark={isDark}
                    accent={SHOP_ACCENT}
                  />
                  <DocUploadCard
                    label="Back Side"
                    icon="albums-outline"
                    uri={aadharBack}
                    uploadedUrl={uploadedUrls.aadhar_back}
                    onPick={() => pickImage('aadhar_back')}
                    colors={colors}
                    isDark={isDark}
                    accent={SHOP_ACCENT}
                  />
                </View>

                {/* ── PAN SECTION ── */}
                <SectionHeader icon="document-text-outline" title="PAN Card" accent={SHOP_ACCENT} colors={colors} />

                {/* PAN photo full width */}
                <TouchableOpacity
                  style={[styles.panPhotoCard, { borderColor: panPhoto || uploadedUrls.pan ? SHOP_ACCENT : colors.border, backgroundColor: colors.inputBg }]}
                  onPress={() => pickImage('pan')}
                  activeOpacity={0.85}
                >
                  {(panPhoto || uploadedUrls.pan) ? (
                    <>
                      <Image source={{ uri: panPhoto || uploadedUrls.pan }} style={styles.panPhotoImg} />
                      <View style={styles.reuploadBadge}>
                        <Ionicons name="camera-outline" size={14} color="white" />
                        <Text style={styles.reuploadText}>Re-upload</Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.panPhotoPlaceholder}>
                      <View style={[styles.panPhotoIcon, { backgroundColor: isDark ? `${SHOP_ACCENT}22` : '#e0f7fa' }]}>
                        <Ionicons name="document-text-outline" size={28} color={SHOP_ACCENT} />
                      </View>
                      <Text style={[styles.panPhotoTitle, { color: colors.text }]}>Upload PAN Card Photo</Text>
                      <Text style={[styles.panPhotoSub, { color: colors.muted }]}>Tap to select from gallery</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* PAN number */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>PAN Number</Text>
                  <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: panNo ? SHOP_ACCENT : colors.border }]}>
                    <Ionicons name="barcode-outline" size={18} color={panNo ? SHOP_ACCENT : '#94a3b8'} style={{ marginRight: 10 }} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="e.g. ABCDE1234F"
                      placeholderTextColor={colors.placeholder}
                      value={panNo}
                      onChangeText={v => setPanNo(v.toUpperCase())}
                      maxLength={10}
                      autoCapitalize="characters"
                    />
                    {panNo.length === 10 && (
                      <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                    )}
                  </View>
                </View>

                {/* PAN name */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Name on PAN</Text>
                  <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: panName ? SHOP_ACCENT : colors.border }]}>
                    <Ionicons name="person-outline" size={18} color={panName ? SHOP_ACCENT : '#94a3b8'} style={{ marginRight: 10 }} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Full name as on PAN card"
                      placeholderTextColor={colors.placeholder}
                      value={panName}
                      onChangeText={setPanName}
                    />
                  </View>
                </View>

                {/* Optional notice */}
                <View style={[styles.notice, { backgroundColor: isDark ? `${SHOP_ACCENT}15` : '#f0fdfa', borderColor: isDark ? `${SHOP_ACCENT}30` : '#ccfbf1' }]}>
                  <Ionicons name="information-circle-outline" size={16} color={SHOP_ACCENT} />
                  <Text style={[styles.noticeText, { color: colors.muted }]}>
                    All fields are optional. Providing documents speeds up admin verification.
                  </Text>
                </View>

              </View>
            )}
          </ScrollView>

          <View style={[styles.footer, { backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={handleContinue} disabled={loading} activeOpacity={0.8}>
              <LinearGradient colors={SHOP_GRAD} style={styles.cta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading ? <ActivityIndicator color="white" /> : (
                  <>
                    <Text style={styles.ctaText}>{hasAny ? 'Save & Continue' : 'Skip & Continue'}</Text>
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

// ── Sub-components ──────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, accent, colors }: any) {
  return (
    <View style={sStyles.sectionHeader}>
      <View style={[sStyles.sectionIconWrap, { backgroundColor: `${accent}18` }]}>
        <Ionicons name={icon} size={16} color={accent} />
      </View>
      <Text style={[sStyles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={[sStyles.sectionLine, { backgroundColor: colors.border }]} />
      <Text style={[sStyles.sectionOptional, { color: colors.muted }]}>Optional</Text>
    </View>
  );
}

function DocUploadCard({ label, icon, uri, uploadedUrl, onPick, colors, isDark, accent }: any) {
  const hasImage = !!(uri || uploadedUrl);
  return (
    <TouchableOpacity
      style={[sStyles.docCard, { borderColor: hasImage ? accent : colors.border, backgroundColor: colors.inputBg }]}
      onPress={onPick}
      activeOpacity={0.85}
    >
      {hasImage ? (
        <>
          <Image source={{ uri: uri || uploadedUrl }} style={sStyles.docImg} />
          <View style={[sStyles.docDoneOverlay, { backgroundColor: `${accent}cc` }]}>
            <Ionicons name="checkmark" size={18} color="white" />
          </View>
          <View style={[sStyles.docLabel, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
            <Text style={sStyles.docLabelText}>{label}</Text>
          </View>
        </>
      ) : (
        <View style={sStyles.docPlaceholder}>
          <View style={[sStyles.docIconWrap, { backgroundColor: isDark ? `${accent}22` : '#e0f7fa' }]}>
            <Ionicons name={icon} size={22} color={accent} />
          </View>
          <Text style={[sStyles.docLabelTitle, { color: colors.text }]}>{label}</Text>
          <Text style={[sStyles.docLabelSub, { color: colors.muted }]}>Tap to upload</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 24 },
  header: { marginBottom: 28 },
  title: { fontSize: 26, fontWeight: '900', letterSpacing: -0.4 },
  subtitle: { fontSize: 14, marginTop: 10, lineHeight: 21, fontWeight: '500' },
  form: { gap: 16, marginBottom: 20 },

  twoCol: { flexDirection: 'row', gap: 12 },

  panPhotoCard: {
    height: 140, borderRadius: 20, borderWidth: 1.5,
    borderStyle: 'dashed', overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center',
  },
  panPhotoImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  panPhotoPlaceholder: { alignItems: 'center', gap: 8 },
  panPhotoIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  panPhotoTitle: { fontSize: 14, fontWeight: '800' },
  panPhotoSub: { fontSize: 12, fontWeight: '500' },
  reuploadBadge: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  reuploadText: { color: 'white', fontSize: 11, fontWeight: '700' },

  inputGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 2 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1.5,
    paddingHorizontal: 14, height: 56,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '600' },

  notice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 12, borderRadius: 14, borderWidth: 1, marginTop: 4,
  },
  noticeText: { flex: 1, fontSize: 12, fontWeight: '500', lineHeight: 18 },

  footer: { padding: 24 },
  cta: {
    height: 58, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  ctaText: { color: 'white', fontSize: 16, fontWeight: '800' },
});

const sStyles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  sectionIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.2 },
  sectionLine: { flex: 1, height: 1 },
  sectionOptional: { fontSize: 11, fontWeight: '600', opacity: 0.6 },

  docCard: {
    flex: 1, height: 130, borderRadius: 18, borderWidth: 1.5,
    overflow: 'hidden', position: 'relative',
  },
  docImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  docDoneOverlay: {
    position: 'absolute', top: 8, right: 8,
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  docLabel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingVertical: 6, paddingHorizontal: 8,
  },
  docLabelText: { color: 'white', fontSize: 11, fontWeight: '700' },
  docPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  docIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  docLabelTitle: { fontSize: 12, fontWeight: '800' },
  docLabelSub: { fontSize: 11, fontWeight: '500' },
});
