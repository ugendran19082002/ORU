import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking, TextInput, Modal, Image, useWindowDimensions
} from 'react-native';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { adminApi, AdminShop } from '@/api/adminApi';
import { BackButton } from '@/components/ui/BackButton';

import { Shadow, thannigoPalette, roleAccent, roleSurface } from '@/constants/theme';

const ADMIN_ACCENT = roleAccent.admin;
const ADMIN_SURF = roleSurface.admin;

export default function AdminShopReviewScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
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
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load shop details.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleApprove = async () => {
    if (!shop) return;
    require('react-native').Alert.alert(
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
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2: 'Shop has been approved and is now active.'
                });
                router.replace('/admin/vendors');
              }
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to approve shop.'
              });
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
      Toast.show({
        type: 'error',
        text1: 'Required',
        text2: 'Please provide a reason for rejection.'
      });
      return;
    }

    try {
      setProcessing(true);
      const res = await adminApi.rejectShop(shop.id, rejectionNotes);
      if (res.status === 1) {
        Toast.show({
          type: 'success',
          text1: 'Rejected',
          text2: 'Application has been rejected and partner notified.'
        });
        router.replace('/admin/vendors');
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to reject application.'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReviewStep = async (stepId: number, status: 'approved' | 'rejected', notes?: string) => {
    try {
      setProcessing(true);
      const res = await adminApi.reviewShopOnboardingStep({
        shopId: Number(id),
        stepId,
        status,
        notes
      });

      if (res.status === 1) {
        Toast.show({
          type: 'success',
          text1: status === 'approved' ? 'Step Approved' : 'Step Rejected',
          text2: 'Onboarding progress updated.'
        });
        fetchDetails(); // Reload data
        setShowStepRejectModal(null);
        setStepNotes('');
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to review step.'
      });
    } finally {
      setProcessing(false);
    }
  };

  const [showStepRejectModal, setShowStepRejectModal] = useState<number | null>(null);
  const [stepNotes, setStepNotes] = useState('');
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const getParsedDetails = (data: any) => {
    if (!data) return {};
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        return { detail: data };
      }
    }
    return data;
  };

  const resolveUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api').replace(/\/api$/, '');
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const onViewStepData = (step: any) => {
    setSelectedDoc(step);
  };

  const MetadataValueRenderer = ({ value, label }: { value: any, label: string }) => {
    if (value === null || value === undefined) return <Text style={styles.premiumDataVal}>N/A</Text>;

    if (Array.isArray(value)) {
      return (
        <View style={styles.arrayContainer}>
          {value.map((item, idx) => (
            <View key={idx} style={styles.arrayItemCard}>
              <Text style={styles.arrayItemIndex}>Item #{idx + 1}</Text>
              {Object.entries(item).map(([k, v]) => (
                <View key={k} style={styles.arrayItemRow}>
                    <Text style={styles.arrayItemKey}>{k.replace(/_/g, ' ')}:</Text>
                    <Text style={styles.arrayItemVal}>{String(v)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    }

    if (typeof value === 'object') {
        return (
            <View style={styles.nestedObjectBox}>
                {Object.entries(value).map(([k, v]) => (
                    <View key={k} style={styles.nestedEntry}>
                        <Text style={styles.nestedKey}>{k.replace(/_/g, ' ')}</Text>
                        <Text style={styles.nestedVal}>{String(v)}</Text>
                    </View>
                ))}
            </View>
        );
    }

    if (typeof value === 'boolean') {
        return (
            <View style={[styles.boolBadge, { backgroundColor: value ? '#ecfdf5' : '#fef2f2' }]}>
                <Ionicons name={value ? "checkmark-circle" : "close-circle"} size={14} color={value ? '#059669' : '#dc2626'} />
                <Text style={[styles.boolText, { color: value ? '#059669' : '#dc2626' }]}>{value ? 'YES' : 'NO'}</Text>
            </View>
        );
    }

    return <Text style={styles.premiumDataVal} selectable>{String(value)}</Text>;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={ADMIN_ACCENT} />
      </View>
    );
  }

  if (!shop) return null;

  const steps = progress?.steps || [];
  const allMandatoryApproved = steps
    .filter((s: any) => s.is_mandatory)
    .every((s: any) => s.status === 'completed');

  const canActivate = shop.status === 'pending_review' && allMandatoryApproved;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={20} color={ADMIN_ACCENT} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.pageTitle}>Shop Review</Text>
              <Text style={styles.headerSub}>{shop.name || 'Application Details'}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={[styles.scroll, { alignItems: 'center' }]}>
        <View style={{ width: '100%', maxWidth: 1200 }}>
          {/* Shop Identity Card */}
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={styles.sectionTitle}>Business Identity</Text>
                <View style={[styles.statusBadge, { backgroundColor: shop.status === 'active' ? '#ecfdf5' : '#fff7ed' }] as any}>
                    <Text style={[styles.statusBadgeText, { color: shop.status === 'active' ? '#059669' : '#d97706' }] as any}>
                        {shop.status.toUpperCase()}
                    </Text>
                </View>
            </View>
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
                <Ionicons name="location" size={20} color="#64748b" />
                <View style={styles.infoTextGroup}>
                  <Text style={styles.label}>Address</Text>
                  <Text style={styles.value}>{shop.owner?.email || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Evidence Checklist - THE MAIN REFACTOR */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Onboarding Steps Review</Text>
            {steps.map((step: any) => {
              const isUnderReview = step.status === 'under_review';
              const isApproved = step.status === 'completed';
              const isRejected = step.status === 'rejected';

              return (
                <View key={step.id} style={[
                  styles.stepCardReview, 
                  isApproved ? styles.stepCardApproved : undefined, 
                  isRejected ? styles.stepCardRejected : undefined
                ]}>
                  <View style={styles.stepHeader}>
                    <View style={styles.stepTitleGroup}>
                        <Text style={styles.stepTitleMain}>{step.title}</Text>
                        {step.is_mandatory && <Text style={styles.mandatoryTag}>Mandatory</Text>}
                    </View>
                    
                    <View style={[styles.stepStatusBadge, { 
                        backgroundColor: isApproved ? '#ecfdf5' : isRejected ? '#fef2f2' : isUnderReview ? '#fff7ed' : thannigoPalette.borderSoft 
                    }]}>
                        <Text style={[styles.stepStatusText, { 
                            color: isApproved ? '#059669' : isRejected ? '#dc2626' : isUnderReview ? '#d97706' : thannigoPalette.neutral 
                        }]}>
                            {step.status.replace('_', ' ')}
                        </Text>
                    </View>
                  </View>

                  <View style={styles.stepActionRow}>
                    <TouchableOpacity 
                      style={styles.viewDataBtn}
                      onPress={() => onViewStepData(step)}
                    >
                      <Ionicons name="eye-outline" size={16} color={ADMIN_ACCENT} />
                      <Text style={styles.viewDataBtnText}>View Data</Text>
                    </TouchableOpacity>

                    {isUnderReview && (
                        <View style={styles.decisionGroup}>
                            <TouchableOpacity 
                                style={styles.miniBtnReject} 
                                onPress={() => setShowStepRejectModal(step.id)}
                                disabled={processing}
                            >
                                <Ionicons name="close-circle-outline" size={18} color="#dc2626" />
                                <Text style={styles.miniBtnRejectText}>Reject</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.miniBtnApprove} 
                                onPress={() => handleReviewStep(step.id, 'approved')}
                                disabled={processing}
                            >
                                <LinearGradient
                                    colors={['#059669', '#047857']}
                                    style={styles.miniBtnApproveGrad}
                                >
                                    <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                                    <Text style={styles.miniBtnApproveText}>Approve</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}
                  </View>

                  {isRejected && step.admin_notes && (
                      <View style={styles.adminNotesBox}>
                          <Text style={styles.adminNotesLabel}>Admin Note:</Text>
                          <Text style={styles.adminNotesText}>{step.admin_notes}</Text>
                      </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Global Action Area */}
          <View style={styles.globalActionBox}>
              <Text style={styles.globalActionHint}>
                  {allMandatoryApproved 
                    ? "All mandatory steps are approved. You can now activate this shop." 
                    : "Some mandatory steps are still pending approval."}
              </Text>

              <TouchableOpacity 
                style={[styles.activateBtn, !canActivate && styles.activateBtnDisabled]} 
                onPress={handleApprove}
                disabled={!canActivate || processing}
              >
                <LinearGradient
                  colors={canActivate ? [ADMIN_ACCENT, ADMIN_ACCENT] : ['#e2e8f0', '#cbd5e1']}
                  style={styles.activateGradient}
                >
                  {processing ? <ActivityIndicator color="white" /> : (
                      <>
                        <Ionicons name="rocket" size={20} color="white" />
                        <Text style={styles.activateBtnText}>Activate & Publish Shop</Text>
                      </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

        {/* Individual Step Rejection Modal */}
        <Modal visible={showStepRejectModal !== null} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.bottomSheet}>
                    <Text style={styles.modalSubTitle}>Reject Step</Text>
                    <Text style={styles.modalDesc}>Please provide a specific reason for rejection. This will be shown to the merchant.</Text>
                    
                    <TextInput
                        style={styles.modalInput}
                        placeholder="e.g. FSSAI document is expired or blurry."
                        value={stepNotes}
                        onChangeText={setStepNotes}
                        multiline
                        numberOfLines={4}
                    />

                    <View style={styles.modalBtnRow}>
                        <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowStepRejectModal(null)}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.modalConfirmBtn} 
                            onPress={() => showStepRejectModal && handleReviewStep(showStepRejectModal, 'rejected', stepNotes)}
                            disabled={processing || !stepNotes.trim()}
                        >
                            <Text style={styles.modalConfirmText}>Confirm Rejection</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>

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
                {(selectedDoc?.details || selectedDoc?.metadata) && (
                  <View style={styles.premiumDataContainer}>
                    <View style={styles.premiumDataHeader}>
                      <Ionicons name="apps" size={20} color={ADMIN_ACCENT} />
                      <Text style={styles.premiumDataTitle}>Step Metadata Details</Text>
                    </View>
                    
                    <View style={styles.premiumDataGrid}>
                      {Object.entries(getParsedDetails(selectedDoc.details || selectedDoc.metadata) || {}).map(([k, v]) => {
                         const isComplex = typeof v === 'object' && v !== null;
                         return (
                           <View key={k} style={[styles.premiumDataCard, (isComplex || isDesktop) && { width: '100%' }]}>
                              <Text style={styles.premiumDataKey}>{k.replace(/_/g, ' ')}</Text>
                              <View style={styles.premiumDataValWrap}>
                                <MetadataValueRenderer value={v} label={k} />
                              </View>
                           </View>
                         );
                      })}
                    </View>
                  </View>
                )}

                {selectedDoc?.document_url && (
                  <View style={styles.premiumDataContainer}>
                    <View style={styles.premiumDataHeader}>
                      <Ionicons name="image" size={20} color={ADMIN_ACCENT} />
                      <Text style={styles.premiumDataTitle}>Attached Evidence</Text>
                    </View>

                    {/* Improved Regex to handle URLs with query parameters (common in cloud storage) */}
                    {selectedDoc.document_url.match(/\.(jpeg|jpg|gif|png)(\?.*)?$/i) || selectedDoc.document_url.includes('firebasestorage') || selectedDoc.document_url.includes('blob:') || selectedDoc.document_url.startsWith('data:image') ? (
                      <TouchableOpacity 
                        activeOpacity={0.9} 
                        onPress={() => setFullScreenImage(resolveUrl(selectedDoc.document_url))}
                        style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: thannigoPalette.borderSoft }}
                      >
                        <Image source={{ uri: resolveUrl(selectedDoc.document_url) }} style={styles.docImg} resizeMode="cover" />
                        <View style={styles.zoomOverlay}>
                            <Ionicons name="expand-outline" size={24} color="white" />
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL(resolveUrl(selectedDoc.document_url))}>
                        <Ionicons name="open-outline" size={18} color="#fff" />
                        <Text style={styles.linkBtnText}>Open Document Link Externally</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Full Screen Image Modal */}
        <Modal visible={!!fullScreenImage} transparent animationType="fade">
            <View style={styles.fullScreenOverlay}>
                <TouchableOpacity 
                    style={styles.fullScreenCloseBtn} 
                    onPress={() => setFullScreenImage(null)}
                >
                    <Ionicons name="close-circle" size={40} color="white" />
                </TouchableOpacity>
                
                {fullScreenImage && (
                    <Image 
                        source={{ uri: fullScreenImage }} 
                        style={styles.fullScreenImg} 
                        resizeMode="contain" 
                    />
                )}
            </View>
        </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: thannigoPalette.background },

  headerSafe: { 
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderBottomColor: thannigoPalette.borderSoft,
    alignItems: 'center',
  },
  headerContent: {
    width: '100%',
    maxWidth: 1200,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: thannigoPalette.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 28, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: thannigoPalette.neutral, fontWeight: '600', marginTop: 2 },
  
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusBadgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: thannigoPalette.background },
  
  scroll: { paddingBottom: 100 },
  section: { padding: 24, borderBottomWidth: 8, borderBottomColor: thannigoPalette.background },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: thannigoPalette.darkText, marginBottom: 16, letterSpacing: -0.5 },
  
  card: { backgroundColor: thannigoPalette.background, borderRadius: 24, padding: 20, gap: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  infoTextGroup: { flex: 1 },
  label: { fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
  value: { fontSize: 15, fontWeight: '700', color: thannigoPalette.darkText },

  stepCardReview: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: thannigoPalette.borderSoft, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  stepCardApproved: { borderColor: '#d1fae5', backgroundColor: '#f0fdf4' },
  stepCardRejected: { borderColor: '#fee2e2', backgroundColor: '#fef2f2' },
  
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  stepTitleGroup: { flex: 1, gap: 4 },
  stepTitleMain: { fontSize: 16, fontWeight: '800', color: thannigoPalette.darkText },
  mandatoryTag: { fontSize: 9, fontWeight: '900', color: ADMIN_ACCENT, textTransform: 'uppercase', letterSpacing: 1 },
  
  stepStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  stepStatusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  stepActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  viewDataBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0f9ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  viewDataBtnText: { fontSize: 13, fontWeight: '800', color: ADMIN_ACCENT },

  decisionGroup: { flexDirection: 'row', gap: 10 },
  miniBtnReject: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#fee2e2' },
  miniBtnRejectText: { fontSize: 12, fontWeight: '800', color: '#dc2626' },
  
  miniBtnApprove: { borderRadius: 10, overflow: 'hidden' },
  miniBtnApproveGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8 },
  miniBtnApproveText: { fontSize: 12, fontWeight: '800', color: 'white' },

  adminNotesBox: { marginTop: 16, padding: 12, backgroundColor: 'rgba(220, 38, 38, 0.05)', borderRadius: 12, borderLeftWidth: 3, borderLeftColor: '#dc2626' },
  adminNotesLabel: { fontSize: 10, fontWeight: '900', color: '#dc2626', marginBottom: 4, textTransform: 'uppercase' },
  adminNotesText: { fontSize: 13, color: '#991b1b', lineHeight: 18, fontWeight: '600' },

  globalActionBox: { marginTop: 8, padding: 32, backgroundColor: thannigoPalette.background, borderRadius: 32, alignItems: 'center', gap: 20 },
  globalActionHint: { fontSize: 13, color: thannigoPalette.neutral, textAlign: 'center', lineHeight: 20, fontWeight: '600' },
  
  activateBtn: { width: '100%', shadowColor: ADMIN_ACCENT, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
  activateBtnDisabled: { shadowOpacity: 0, elevation: 0 },
  activateGradient: { height: 64, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  activateBtnText: { color: 'white', fontSize: 18, fontWeight: '800' },

  bottomSheet: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, paddingBottom: 40, width: '100%', position: 'absolute', bottom: 0 },
  modalSubTitle: { fontSize: 24, fontWeight: '900', color: thannigoPalette.darkText, marginBottom: 12 },
  modalDesc: { fontSize: 15, color: thannigoPalette.neutral, lineHeight: 22, marginBottom: 24 },
  modalInput: { backgroundColor: thannigoPalette.borderSoft, borderRadius: 20, padding: 20, height: 120, fontSize: 16, color: thannigoPalette.darkText, textAlignVertical: 'top', marginBottom: 24 },
  modalBtnRow: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: thannigoPalette.borderSoft },
  modalCancelText: { fontSize: 16, fontWeight: '800', color: thannigoPalette.neutral },
  modalConfirmBtn: { flex: 2, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#dc2626' },
  modalConfirmText: { fontSize: 16, fontWeight: '800', color: 'white' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 24, overflow: 'hidden', maxHeight: '80%', margin: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: thannigoPalette.borderSoft },
  modalTitle: { fontSize: 18, fontWeight: '800', color: thannigoPalette.darkText },
  modalScroll: { padding: 20 },
  
  premiumDataContainer: { backgroundColor: '#f0f9ff', borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#bae6fd' },
  premiumDataHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  premiumDataTitle: { fontSize: 13, fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', letterSpacing: 0.5 },
  premiumDataGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  premiumDataCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, width: '48%', flexGrow: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  premiumDataKey: { fontSize: 10, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 },
  premiumDataValWrap: { backgroundColor: thannigoPalette.background, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: thannigoPalette.borderSoft },
  premiumDataVal: { fontSize: 14, fontWeight: '700', color: thannigoPalette.darkText },
  
  // Metadata Renderer Styles
  arrayContainer: { gap: 12, marginTop: 4 },
  arrayItemCard: { backgroundColor: 'white', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  arrayItemIndex: { fontSize: 9, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 },
  arrayItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: thannigoPalette.background },
  arrayItemKey: { fontSize: 11, fontWeight: '600', color: thannigoPalette.neutral },
  arrayItemVal: { fontSize: 11, fontWeight: '800', color: thannigoPalette.darkText },
  
  nestedObjectBox: { gap: 8 },
  nestedEntry: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nestedKey: { fontSize: 12, color: thannigoPalette.neutral, fontWeight: '500' },
  nestedVal: { fontSize: 12, color: thannigoPalette.darkText, fontWeight: '700' },
  
  boolBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  boolText: { fontSize: 10, fontWeight: '900' },

  docImg: { width: '100%', height: 250, borderRadius: 12, backgroundColor: thannigoPalette.borderSoft },
  zoomOverlay: { position: 'absolute', right: 12, bottom: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 8 },
  
  fullScreenOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  fullScreenImg: { width: '100%', height: '80%' },
  fullScreenCloseBtn: { position: 'absolute', top: 50, right: 30, zIndex: 10 },
  
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: ADMIN_ACCENT, padding: 14, borderRadius: 12, justifyContent: 'center', marginTop: 12 },
  linkBtnText: { color: 'white', fontWeight: '800', fontSize: 14 }
});

