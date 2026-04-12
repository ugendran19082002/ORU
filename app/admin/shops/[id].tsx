import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Linking, TextInput, Modal, Image
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
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

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

  const onViewStepData = (step: any) => {
    if (!step.document_url && (!step.details || Object.keys(step.details).length === 0)) {
      Alert.alert('Empty', 'No document or data associated with this step.');
      return;
    }
    setSelectedDoc(step);
  };

  const getParsedDetails = (details: any) => {
    if (!details) return null;
    try {
      return typeof details === 'string' ? JSON.parse(details) : details;
    } catch {
      return { raw_data: details };
    }
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

          {/* Operational & Financial */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Operational & Financial</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons name="map" size={20} color="#64748b" />
                <View style={styles.infoTextGroup}>
                  <Text style={styles.label}>Delivery Radius</Text>
                  <Text style={styles.value}>{shop.delivery_radius_km ? `${shop.delivery_radius_km} km` : 'Not Configured'}</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.infoRow}>
                <Ionicons name="receipt" size={20} color="#64748b" />
                <View style={styles.infoTextGroup}>
                  <Text style={styles.label}>GSTIN (Tax ID)</Text>
                  <Text style={[styles.value, !shop.gstin && { color: '#94a3b8', fontStyle: 'italic' }]}>
                    {shop.gstin || 'No GST Details Provided'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.infoRow}>
                <Ionicons name="card" size={20} color="#64748b" />
                <View style={styles.infoTextGroup}>
                  <Text style={styles.label}>Bank Account</Text>
                  <Text style={[styles.value, !shop.bank_account_no && { color: '#94a3b8', fontStyle: 'italic' }]}>
                    {shop.bank_account_no ? `${shop.bank_account_no}\nIFSC: ${shop.bank_ifsc}` : 'No Banking Details Setup'}
                  </Text>
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
                  style={[styles.viewBtn, !(step.document_url || step.details) && styles.viewBtnDisabled]}
                  onPress={() => onViewStepData(step)}
                  disabled={!(step.document_url || step.details)}
                >
                  <Ionicons name="eye-outline" size={18} color={(step.document_url || step.details) ? "#005d90" : "#cbd5e1"} />
                  <Text style={[styles.viewBtnText, !(step.document_url || step.details) && { color: '#cbd5e1' }]}>View Data</Text>
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

        {/* Document Viewer Modal */}
        <Modal visible={!!selectedDoc} transparent animationType="fade" onRequestClose={() => setSelectedDoc(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedDoc?.title} Data</Text>
                <TouchableOpacity onPress={() => setSelectedDoc(null)} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={28} color="#64748b" />
                </TouchableOpacity>
              </View>
              
              <ScrollView contentContainerStyle={styles.modalScroll}>
                {selectedDoc?.details && (
                  <View style={styles.premiumDataContainer}>
                    <View style={styles.premiumDataHeader}>
                      <Ionicons name="document-text" size={20} color="#005d90" />
                      <Text style={styles.premiumDataTitle}>Extraction & Details</Text>
                    </View>
                    
                    <View style={styles.premiumDataGrid}>
                      {Object.entries(getParsedDetails(selectedDoc.details) || {}).map(([k, v]) => {
                         const strVal = String(v);
                         const isLong = strVal.length > 25;
                         return (
                           <View key={k} style={[styles.premiumDataCard, isLong && { width: '100%' }]}>
                              <Text style={styles.premiumDataKey}>{k.replace(/_/g, ' ')}</Text>
                              <View style={styles.premiumDataValWrap}>
                                <Text style={styles.premiumDataVal} selectable>{strVal}</Text>
                              </View>
                           </View>
                         );
                      })}
                    </View>
                  </View>
                )}

                {selectedDoc?.document_url && (
                  <View style={styles.docImgWrap}>
                    <Text style={styles.premiumDataTitle}>Attached Evidence</Text>
                    {selectedDoc.document_url.match(/\.(jpeg|jpg|gif|png)$/i) || selectedDoc.document_url.includes('firebasestorage') || selectedDoc.document_url.includes('blob:') || selectedDoc.document_url.startsWith('data:image') ? (
                      <Image source={{ uri: selectedDoc.document_url }} style={styles.docImg} resizeMode="contain" />
                    ) : (
                      <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL(selectedDoc.document_url)}>
                        <Ionicons name="open-outline" size={18} color="#fff" />
                        <Text style={styles.linkBtnText}>Open Document Link</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  cardDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: -4 },
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
  confirmRejectText: { color: 'white', fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 24, overflow: 'hidden', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  modalScroll: { padding: 20 },
  
  premiumDataContainer: { backgroundColor: '#f0f9ff', borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#bae6fd' },
  premiumDataHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  premiumDataTitle: { fontSize: 13, fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', letterSpacing: 0.5 },
  premiumDataGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  premiumDataCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, width: '48%', flexGrow: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  premiumDataKey: { fontSize: 10, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 },
  premiumDataValWrap: { backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  premiumDataVal: { fontSize: 14, fontWeight: '700', color: '#0f172a' },

  docImgWrap: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  docImg: { width: '100%', height: 250, borderRadius: 12, backgroundColor: '#f1f5f9' },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#005d90', padding: 14, borderRadius: 12, justifyContent: 'center', marginTop: 12 },
  linkBtnText: { color: 'white', fontWeight: '800', fontSize: 14 }
});
