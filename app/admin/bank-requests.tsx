import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Modal, RefreshControl
} from 'react-native';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/providers/ThemeContext';
import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '@/api/adminApi';
import { BackButton } from '@/components/ui/BackButton';
import { roleAccent, roleSurface, Shadow } from '@/constants/theme';

const ADMIN_ACCENT = roleAccent.admin;
const ADMIN_SURF = roleSurface.admin;

export default function BankRequestsScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [processing, setProcessing] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await adminApi.listBankRequests();
      if (res.status === 1) {
        setRequests(res.data);
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Fetch Failed', text2: 'Could not load bank requests.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: number) => {
    setProcessing(id);
    try {
      const res = await adminApi.approveBankRequest(id);
      if (res.status === 1) {
        Toast.show({ type: 'success', text1: 'Approved', text2: 'Bank account updated successfully.' });
        setRequests(requests.filter(r => r.id !== id));
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Approve Failed', text2: error.message });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectReason.trim()) return;
    
    setProcessing(rejectingId);
    try {
      const res = await adminApi.rejectBankRequest(rejectingId, rejectReason);
      if (res.status === 1) {
        Toast.show({ type: 'info', text1: 'Rejected', text2: 'Request has been rejected.' });
        setRequests(requests.filter(r => r.id !== rejectingId));
        setRejectingId(null);
        setRejectReason('');
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Reject Failed', text2: error.message });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <BackButton fallback="/admin" />
          <View>
            <Text style={styles.pageTitle}>Bank Changes</Text>
            <Text style={styles.headerSub}>Approve or reject shop bank updates</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={false} onRefresh={fetchRequests} color={ADMIN_ACCENT} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color={ADMIN_ACCENT} style={{ marginTop: 100 }} />
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="documents-outline" size={64} color={colors.muted + '30'} />
            <Text style={styles.emptyText}>No pending bank change requests</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {requests.map((item) => (
              <View key={item.id} style={styles.requestCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.shopInfo}>
                    <View style={styles.shopLogoPlaceholder}>
                      <Text style={styles.shopLogoText}>{item.Shop?.name?.[0] || 'S'}</Text>
                    </View>
                    <View>
                      <Text style={styles.shopName}>{item.Shop?.name}</Text>
                      <Text style={styles.requestDate}>
                        Submitted: {new Date(item.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, item.status === 'VERIFIED' ? styles.statusVerified : styles.statusPending]}>
                     <Text style={[styles.statusText, item.status === 'VERIFIED' ? styles.statusTextVerified : styles.statusTextPending]}>
                        {item.status}
                     </Text>
                  </View>
                </View>

                <View style={styles.detailsBox}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>HOLDER NAME</Text>
                    <Text style={styles.detailValue}>{item.account_holder_name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>ACCOUNT NUMBER</Text>
                    <Text style={styles.detailValue}>{item.account_number}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>IFSC CODE</Text>
                    <Text style={styles.detailValue}>{item.ifsc_code}</Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity 
                    style={styles.rejectBtn} 
                    onPress={() => setRejectingId(item.id)}
                    disabled={processing !== null}
                  >
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.approveBtn} 
                    onPress={() => handleApprove(item.id)}
                    disabled={processing !== null}
                  >
                    {processing === item.id ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.approveBtnText}>Approve Change</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Reject Modal */}
      <Modal visible={rejectingId !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Bank Request</Text>
            <Text style={styles.modalSub}>Provide a reason for rejection. This will be visible to the shop owner.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Account name mismatch or invalid IFSC."
              multiline
              numberOfLines={4}
              value={rejectReason}
              onChangeText={setRejectReason}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRejectingId(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleReject} disabled={!rejectReason.trim()}>
                <Text style={styles.modalConfirmText}>Confirm Rejection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { 
    backgroundColor: colors.surface, paddingHorizontal: 24, paddingVertical: 18,
    borderBottomWidth: 1, borderBottomColor: colors.border 
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pageTitle: { fontSize: 24, fontWeight: '900', color: colors.text },
  headerSub: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  
  scroll: { padding: 20 },
  list: { gap: 16 },
  requestCard: { 
    backgroundColor: colors.surface, borderRadius: 24, padding: 20, 
    borderWidth: 1, borderColor: colors.border, ...Shadow.sm 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  shopInfo: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  shopLogoPlaceholder: { 
    width: 44, height: 44, borderRadius: 14, 
    backgroundColor: ADMIN_SURF, alignItems: 'center', justifyContent: 'center' 
  },
  shopLogoText: { fontSize: 18, fontWeight: '900', color: ADMIN_ACCENT },
  shopName: { fontSize: 16, fontWeight: '800', color: colors.text },
  requestDate: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusPending: { backgroundColor: '#fff7ed' },
  statusVerified: { backgroundColor: '#ecfdf5' },
  statusText: { fontSize: 10, fontWeight: '900' },
  statusTextPending: { color: '#d97706' },
  statusTextVerified: { color: '#059669' },
  
  detailsBox: { 
    backgroundColor: colors.background, borderRadius: 16, 
    padding: 16, gap: 12, marginBottom: 20 
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: 10, fontWeight: '800', color: colors.muted, letterSpacing: 0.5 },
  detailValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  
  actions: { flexDirection: 'row', gap: 12 },
  rejectBtn: { 
    flex: 1, paddingVertical: 14, borderRadius: 14, 
    alignItems: 'center', backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fee2e2' 
  },
  rejectBtnText: { color: '#dc2626', fontWeight: '800', fontSize: 14 },
  approveBtn: { 
    flex: 2, paddingVertical: 14, borderRadius: 14, 
    alignItems: 'center', backgroundColor: ADMIN_ACCENT, ...Shadow.sm 
  },
  approveBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },

  emptyContainer: { alignItems: 'center', marginTop: 150, gap: 16 },
  emptyText: { fontSize: 16, color: colors.muted, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: colors.surface, borderRadius: 28, padding: 24, gap: 16 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.text },
  modalSub: { fontSize: 14, color: colors.muted, lineHeight: 20, fontWeight: '500' },
  modalInput: { 
    backgroundColor: colors.background, borderRadius: 16, 
    padding: 16, fontSize: 16, height: 100, textAlignVertical: 'top' 
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  modalCancel: { flex: 1, padding: 16, alignItems: 'center' },
  modalCancelText: { fontWeight: '800', color: colors.muted },
  modalConfirm: { 
    flex: 2, padding: 16, backgroundColor: '#dc2626', 
    borderRadius: 16, alignItems: 'center' 
  },
  modalConfirmText: { color: 'white', fontWeight: '800' },
});
