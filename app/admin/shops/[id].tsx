import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Linking, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { adminApi, AdminShop } from '@/api/adminApi';
import { BackButton } from '@/components/ui/BackButton';

export default function AdminShopReviewScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [shop, setShop] = useState<AdminShop | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const shopId = Number(id);
      const [shopRes, progressRes] = await Promise.all([
        adminApi.getShopDetail(shopId),
        adminApi.getShopOnboardingProgress(shopId)
      ]);

      if (shopRes.status === 1) setShop(shopRes.data);
      if (progressRes.status === 1) setProgress(progressRes.data);
    } catch (error) {
      console.error('[Admin Review] Load Error:', error);
      Alert.alert('Error', 'Failed to load shop details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleApprove = async () => {
    if (!shop) return;
    Alert.alert(
      'Approve Shop',
      `Are you sure you want to approve "${shop.name}"? This will make them active and live on the platform.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes, Approve', 
          onPress: async () => {
            try {
              setProcessing(true);
              const res = await adminApi.approveShop(shop.id);
              if (res.status === 1) {
                Alert.alert('Success', 'Shop has been approved and is now active.');
                router.replace('/admin/shops');
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to approve shop.');
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  };

  const handleReject = async () => {
    if (!shop) return;
    if (!rejectionNotes.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejection.');
      return;
    }

    try {
      setProcessing(true);
      const res = await adminApi.rejectShop(shop.id, rejectionNotes);
      if (res.status === 1) {
        Alert.alert('Rejected', 'Application has been rejected and partner notified.');
        router.replace('/admin/shops');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to reject application.');
    } finally {
      setProcessing(false);
    }
  };

  const openDocument = (url: string | null) => {
    if (!url) {
      Alert.alert('Missing', 'No document file associated with this step.');
      return;
    }
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open the document URL.');
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#005d90" />
      </View>
    );
  }

  if (!shop) return null;

  const isPending = shop.status === 'pending_review';

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <BackButton fallback="/admin/shops" />
          <Text style={styles.headerTitle}>Review Application</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Shop Identity Card */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Identity</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons name="business" size={20} color="#64748b" />
                <View style={styles.infoTextGroup}>
                  <Text style={styles.label}>Shop Name</Text>
                  <Text style={styles.value}>{shop.name}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="person" size={20} color="#64748b" />
                <View style={styles.infoTextGroup}>
                  <Text style={styles.label}>Owner</Text>
                  <Text style={styles.value}>{shop.owner?.name} ({shop.owner?.phone})</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="ribbon" size={20} color="#64748b" />
                <View style={styles.infoTextGroup}>
                  <Text style={styles.label}>Type</Text>
                  <Text style={styles.value}>{(shop.shop_type || 'Unknown').toUpperCase()}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Evidence Checklist */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Document Evidence</Text>
            {(progress?.steps || []).map((step: any) => (
              <View key={step.id} style={styles.docRow}>
                <View style={styles.docInfo}>
                  <Text style={styles.docLabel}>{step.title}</Text>
                  <Text style={styles.docStatus}>{(step.status || 'Pending').toString().replace('_', ' ')}</Text>
                </View>
                
                <TouchableOpacity 
                  style={[styles.viewBtn, !step.document_url && styles.viewBtnDisabled]}
                  onPress={() => openDocument(step.document_url)}
                  disabled={!step.document_url}
                >
                  <Ionicons name="eye-outline" size={18} color={step.document_url ? "#005d90" : "#cbd5e1"} />
                  <Text style={[styles.viewBtnText, !step.document_url && { color: '#cbd5e1' }]}>View</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Action Area */}
          {isPending && (
            <View style={styles.actionSection}>
              {!showRejectInput ? (
                <View style={styles.btnRow}>
                  <TouchableOpacity 
                    style={styles.rejectBtn} 
                    onPress={() => setShowRejectInput(true)}
                    disabled={processing}
                  >
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.approveBtn} 
                    onPress={handleApprove}
                    disabled={processing}
                  >
                    <LinearGradient
                      colors={['#005d90', '#003a5c']}
                      style={styles.approveGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {processing ? <ActivityIndicator color="white" /> : <Text style={styles.approveBtnText}>Approve Global</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.rejectForm}>
                  <Text style={styles.inputLabel}>Reason for Rejection</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Tell the partner what to fix (e.g. FSSAI image is blurry)..."
                    value={rejectionNotes}
                    onChangeText={setRejectionNotes}
                    multiline
                  />
                  <View style={styles.btnRow}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowRejectInput(false)}>
                      <Text style={styles.cancelBtnText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmRejectBtn} onPress={handleReject} disabled={processing}>
                      {processing ? <ActivityIndicator color="white" /> : <Text style={styles.confirmRejectText}>Confirm Reject</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
  scroll: { padding: 24, paddingBottom: 60 },
  
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  
  card: { backgroundColor: '#f8fafc', borderRadius: 24, padding: 20, gap: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  infoTextGroup: { flex: 1 },
  label: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  value: { fontSize: 15, color: '#1e293b', fontWeight: '700' },

  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12
  },
  docInfo: { flex: 1 },
  docLabel: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  docStatus: { fontSize: 11, color: '#64748b', marginTop: 2, textTransform: 'capitalize' },
  
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0f9ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  viewBtnDisabled: { backgroundColor: '#f8fafc' },
  viewBtnText: { fontSize: 13, fontWeight: '800', color: '#005d90' },

  actionSection: { marginTop: 20, paddingTop: 32, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  btnRow: { flexDirection: 'row', gap: 12 },
  approveBtn: { flex: 2 },
  approveGradient: { height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  approveBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
  
  rejectBtn: { flex: 1, height: 60, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  rejectBtnText: { color: '#ef4444', fontSize: 16, fontWeight: '800' },

  rejectForm: { gap: 16 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  textInput: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, height: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: '#e2e8f0' },
  cancelBtn: { flex: 1, height: 50, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { color: '#64748b', fontWeight: '700' },
  confirmRejectBtn: { flex: 2, height: 50, borderRadius: 16, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' },
  confirmRejectText: { color: 'white', fontWeight: '800' }
});
