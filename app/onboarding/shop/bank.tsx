import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, TextInput, ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useAppSession } from '@/hooks/use-app-session';
import { onboardingApi } from '@/api/onboardingApi';
import { BackButton } from '@/components/ui/BackButton';
import { useAppTheme } from '@/providers/ThemeContext';

export default function ShopBankDetailsScreen() {
  const router = useRouter();
  const { user, status } = useAppSession();
  const { colors, isDark } = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [fetchingShop, setFetchingShop] = useState(true);
  const [shopId, setShopId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    bank_name: '',
    account_holder: '',
    bank_account_no: '',
    bank_ifsc: '',
    upi_id: '',
    bank_statement_password: '',
  });

  const [statementFile, setStatementFile] = useState<any>(null);

  // 1. Resolve actual Shop ID
  React.useEffect(() => {
    (async () => {
      try {
        const res = await onboardingApi.getMerchantShop();
        if (res.data) {
          setShopId(res.data.id);
          // Pre-fill if exists
          if (res.data.bank_account_no) {
            setFormData({
              bank_name: res.data.metadata?.bank_name || '',
              account_holder: res.data.metadata?.account_holder || '',
              bank_account_no: res.data.bank_account_no,
              bank_ifsc: res.data.bank_ifsc || '',
              upi_id: res.data.upi_id || '',
              bank_statement_password: res.data.bank_statement_password || '',
            });
          }
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

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        // 5MB Client-side validation
        if (file.size && file.size > 5000000) {
          Toast.show({
            type: 'error',
            text1: 'File Too Large',
            text2: 'Bank statement must be smaller than 5MB.'
          });
          return;
        }

        setStatementFile(file);
      }
    } catch (err) {
      // Silent error for document picker
    }
  };

  const handleSave = async () => {
    if (!shopId) {
      Toast.show({ type: 'info', text1: 'Complete Basic Details First', text2: 'Please fill in your shop name and details before adding bank info.' });
      router.replace('/onboarding/shop/basic-details');
      return;
    }

    // Basic Validation
    if (!formData.bank_account_no || !formData.bank_ifsc || !formData.account_holder) {
      Toast.show({
        type: 'error',
        text1: 'Required',
        text2: 'Please fill in all mandatory account fields.'
      });
      return;
    }

    try {
      setLoading(true);

      let documentUrl = undefined;

      // 1. Upload Statement if selected
      if (statementFile) {
        const uploadRes = await onboardingApi.uploadShopDocument('payment_setup', shopId, {
          uri: statementFile.uri,
          name: statementFile.name || 'bank_statement.pdf',
          type: 'application/pdf',
        });
        documentUrl = uploadRes.data.document_url;
      }

      // 2. Save final metadata
      const res = await onboardingApi.updatePaymentSetup(shopId, {
        bank_name: formData.bank_name,
        account_holder: formData.account_holder,
        bank_account_no: formData.bank_account_no,
        bank_ifsc: formData.bank_ifsc,
        upi_id: formData.upi_id,
        bank_statement_password: formData.bank_statement_password,
      } as any);

      if (res.status === 1) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Bank details & statement saved.'
        });
        router.replace('/onboarding/shop');
      }
    } catch (error: any) {
      if (error.response?.status === 404) return;

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Could not save bank details.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'authenticated' && user?.role !== 'shop_owner' && user?.role !== 'admin') {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <BackButton fallback="/onboarding/shop" />
              <View style={{ marginTop: 24 }}>
                <Text style={[styles.title, { color: colors.text }]}>Payout Settings</Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>Where should we send your earnings? Please provide your business bank account or UPI details.</Text>
              </View>
            </View>

            {fetchingShop ? (
              <ActivityIndicator size="large" color="#005d90" style={{ marginTop: 60 }} />
            ) : (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.muted }]}>Account Holder Name</Text>
                  <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="As per bank records"
                      placeholderTextColor={colors.placeholder}
                      value={formData.account_holder}
                      onChangeText={(v: string) => setFormData(p => ({ ...p, account_holder: v }))}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.muted }]}>Bank Name</Text>
                  <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <Ionicons name="business-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="e.g. HDFC Bank"
                      placeholderTextColor={colors.placeholder}
                      value={formData.bank_name}
                      onChangeText={(v: string) => setFormData(p => ({ ...p, bank_name: v }))}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.muted }]}>Account Number</Text>
                  <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <Ionicons name="card-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="0000 0000 0000"
                      placeholderTextColor={colors.placeholder}
                      value={formData.bank_account_no}
                      onChangeText={(v: string) => setFormData(p => ({ ...p, bank_account_no: v }))}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.muted }]}>IFSC Code</Text>
                  <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <Ionicons name="barcode-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="HDFC0000123"
                      placeholderTextColor={colors.placeholder}
                      value={formData.bank_ifsc}
                      onChangeText={(v: string) => setFormData(p => ({ ...p, bank_ifsc: v.toUpperCase() }))}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { marginTop: 8 }]}>
                  <Text style={[styles.label, { color: colors.muted }]}>UPI ID (Optional)</Text>
                  <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <Ionicons name="at-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="e.g. business@okaxis"
                      placeholderTextColor={colors.placeholder}
                      value={formData.upi_id}
                      onChangeText={(v: string) => setFormData(p => ({ ...p, upi_id: v }))}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.muted }]}>Bank Statement (Last 3 Months)</Text>
                    <TouchableOpacity
                        style={[styles.uploadBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }, statementFile && styles.uploadBtnActive]}
                        onPress={pickDocument}
                    >
                        {statementFile ? (
                            <>
                                <Ionicons name="document-text" size={24} color="#005d90" />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.fileName} numberOfLines={1}>{statementFile.name}</Text>
                                    <Text style={styles.fileSize}>{(statementFile.size / (1024 * 1024)).toFixed(2)} MB • PDF</Text>
                                </View>
                                <Ionicons name="checkmark-circle" size={24} color="#005d90" />
                            </>
                        ) : (
                            <>
                                <View style={styles.uploadIconCircle}>
                                    <Ionicons name="cloud-upload-outline" size={24} color="#005d90" />
                                </View>
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={[styles.uploadTitle, { color: colors.text }]}>Choose PDF File</Text>
                                    <Text style={[styles.uploadSub, { color: colors.muted }]}>Recent 3 month history</Text>
                                </View>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {statementFile && (
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.muted }]}>PDF Password (If applicable)</Text>
                        <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                            <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Unlock code for statement"
                                placeholderTextColor={colors.placeholder}
                                value={formData.bank_statement_password}
                                onChangeText={(v: string) => setFormData(p => ({ ...p, bank_statement_password: v }))}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <View style={[styles.infoBox, { backgroundColor: isDark ? '#0A1929' : '#e0f0ff', borderColor: colors.border }]}>
                  <Ionicons name="shield-checkmark" size={20} color="#005d90" />
                  <Text style={styles.infoText}>Your bank details and statements are encrypted and stored securely for payout verification purposes.</Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={[styles.footer, { backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={handleSave} disabled={loading || fetchingShop} activeOpacity={0.8}>
              <LinearGradient
                colors={['#005d90', '#003a5c']}
                style={styles.cta}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? <ActivityIndicator color="white" /> : (
                  <>
                    <Text style={styles.ctaText}>Verify & Save Details</Text>
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
  container: { flex: 1 },
  safe: { flex: 1 },
  scrollContent: { paddingHorizontal: 32, paddingBottom: 40 },

  header: { marginBottom: 30, paddingTop: 20 },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  subtitle: { fontSize: 15, marginTop: 12, lineHeight: 22 },

  form: { gap: 24 },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: '800', marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 60,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '700' },

  divider: { height: 1, marginVertical: 8 },

  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 20,
  },
  uploadBtnActive: {
    borderStyle: 'solid',
    borderColor: '#005d90',
    backgroundColor: '#f0f9ff'
  },
  uploadIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: '#e0f0ff',
      alignItems: 'center',
      justifyContent: 'center'
  },
  uploadTitle: { fontSize: 16, fontWeight: '800' },
  uploadSub: { fontSize: 12, marginTop: 2 },
  fileName: { fontSize: 15, fontWeight: '700', color: '#005d90' },
  fileSize: { fontSize: 12, color: '#64748b', marginTop: 2 },

  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    marginTop: 10,
    alignItems: 'flex-start'
  },
  infoText: { flex: 1, fontSize: 12, color: '#005d90', lineHeight: 18, fontWeight: '600' },

  footer: { paddingHorizontal: 32, paddingBottom: 32, paddingTop: 16 },
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
