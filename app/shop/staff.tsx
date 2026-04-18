import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, TextInput, ActivityIndicator, RefreshControl, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { apiClient } from '@/api/client';

import { Shadow, thannigoPalette, roleAccent, roleSurface, roleGradients } from '@/constants/theme';

const SHOP_ACCENT = roleAccent.shop_owner;
const SHOP_SURF = roleSurface.shop_owner;
const SHOP_GRAD: [string, string] = [roleGradients.shop_owner.start, roleGradients.shop_owner.end];

interface StaffRole {
  id: number;
  name: string;
  description?: string;
}

interface StaffMember {
  id: number;
  name: string;
  phone: string;
  role: string;
  status: 'active' | 'inactive';
  created_at: string;
}

const EMPTY_FORM = { name: '', phone: '', role: '' };

export default function ShopStaffScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();

  useAndroidBackHandler(() => {
    safeBack('/shop/settings');
  });

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Add staff modal
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [staffRes, rolesRes] = await Promise.all([
        apiClient.get('/staff'),
        apiClient.get('/staff/roles'),
      ]);
      if (staffRes.data?.status === 1) setStaff(staffRes.data.data ?? []);
      if (rolesRes.data?.status === 1) setRoles(rolesRes.data.data ?? []);
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load staff data.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleToggleStatus = async (member: StaffMember) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    setTogglingId(member.id);
    try {
      const res = await apiClient.patch(`/staff/${member.id}/status`, { status: newStatus });
      if (res.data?.status === 1) {
        setStaff((prev) =>
          prev.map((s) => s.id === member.id ? { ...s, status: newStatus } : s)
        );
        Toast.show({
          type: 'success',
          text1: `Staff ${newStatus === 'active' ? 'Activated' : 'Deactivated'}`,
          text2: `${member.name} is now ${newStatus}.`,
        });
      } else {
        throw new Error(res.data?.message ?? 'Status update failed');
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e?.response?.data?.message ?? e?.message ?? 'Could not update status.' });
    } finally {
      setTogglingId(null);
    }
  };

  const handleAddStaff = async () => {
    if (!form.name.trim()) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Name is required.' });
      return;
    }
    if (!form.phone.trim() || form.phone.length < 10) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Enter a valid phone number.' });
      return;
    }
    if (!form.role) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Please select a role.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post('/staff', {
        name: form.name.trim(),
        phone: form.phone.trim(),
        role: form.role,
      });
      if (res.data?.status === 1) {
        Toast.show({ type: 'success', text1: 'Staff Added', text2: `${form.name} has been added to your team.` });
        setModalVisible(false);
        setForm(EMPTY_FORM);
        fetchAll();
      } else {
        throw new Error(res.data?.message ?? 'Failed to add staff');
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e?.response?.data?.message ?? e?.message ?? 'Could not add staff member.' });
    } finally {
      setSubmitting(false);
    }
  };

  const activeCount = staff.filter((s) => s.status === 'active').length;
  const inactiveCount = staff.filter((s) => s.status === 'inactive').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BackButton fallback="/shop/settings" />
          <View>
            <View style={styles.brandRow}>
              <Logo size="md" />
              <Text style={styles.brandName}>ThanniGo</Text>
            </View>
            <Text style={styles.roleLabel}>SHOP PANEL</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity 
            style={styles.notifBtnSub} 
            onPress={() => router.push('/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={22} color={SHOP_ACCENT} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => { setForm(EMPTY_FORM); setModalVisible(true); }}
          >
            <Ionicons name="person-add-outline" size={18} color="white" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total', value: staff.length, color: SHOP_ACCENT, bg: '#e0f0ff', icon: 'people-outline' },
          { label: 'Active', value: activeCount, color: thannigoPalette.success, bg: '#e8f5e9', icon: 'checkmark-circle-outline' },
          { label: 'Inactive', value: inactiveCount, color: '#b45309', bg: '#fef3c7', icon: 'pause-circle-outline' },
        ].map((s) => (
          <View key={s.label} style={styles.statBox}>
            <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
              <Ionicons name={s.icon as any} size={18} color={s.color} />
            </View>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} />}
      >
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Staff Management</Text>
          <Text style={styles.pageSub}>{staff.length} members · {activeCount} active</Text>
        </View>

        {loading && <ActivityIndicator color={SHOP_ACCENT} style={{ marginTop: 40 }} />}

        {!loading && staff.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#c8d0da" />
            <Text style={styles.emptyTitle}>No Staff Yet</Text>
            <Text style={styles.emptySub}>Tap "Add" to add your first team member.</Text>
          </View>
        )}

        {!loading && staff.map((member) => (
          <View key={member.id} style={styles.staffCard}>
            <View style={styles.staffCardTop}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={22} color={SHOP_ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.staffName}>{member.name}</Text>
                <Text style={styles.staffPhone}>{member.phone}</Text>
              </View>
              {togglingId === member.id ? (
                <ActivityIndicator size="small" color={SHOP_ACCENT} />
              ) : (
                <Switch
                  value={member.status === 'active'}
                  onValueChange={() => handleToggleStatus(member)}
                  trackColor={{ false: thannigoPalette.borderSoft, true: '#bbf7d0' }}
                  thumbColor={member.status === 'active' ? thannigoPalette.success : '#94a3b8'}
                />
              )}
            </View>
            <View style={styles.staffMeta}>
              <View style={[styles.roleBadge, member.status === 'inactive' && styles.roleBadgeInactive]}>
                <Ionicons
                  name="briefcase-outline"
                  size={12}
                  color={member.status === 'active' ? SHOP_ACCENT : '#94a3b8'}
                />
                <Text style={[styles.roleText, member.status === 'inactive' && styles.roleTextInactive]}>
                  {member.role}
                </Text>
              </View>
              <View style={[styles.statusBadge, member.status === 'active' ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
                <Text style={[styles.statusBadgeText, member.status === 'active' ? styles.statusBadgeTextActive : styles.statusBadgeTextInactive]}>
                  {member.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ADD STAFF MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalPill} />
            <Text style={styles.modalTitle}>Add Staff Member</Text>

            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ravi Kumar"
              placeholderTextColor="#a0aab4"
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9876543210"
              placeholderTextColor="#a0aab4"
              value={form.phone}
              onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
              keyboardType="phone-pad"
              maxLength={13}
            />

            <Text style={styles.fieldLabel}>Role</Text>
            <TouchableOpacity style={styles.rolePicker} onPress={() => setRolePickerOpen(!rolePickerOpen)}>
              <Text style={[styles.rolePickerText, !form.role && { color: '#a0aab4' }]}>
                {form.role || 'Select a role…'}
              </Text>
              <Ionicons name={rolePickerOpen ? 'chevron-up' : 'chevron-down'} size={16} color={thannigoPalette.neutral} />
            </TouchableOpacity>
            {rolePickerOpen && (
              <View style={styles.roleDropdown}>
                {roles.length === 0 && (
                  <Text style={styles.roleDropdownEmpty}>No roles available</Text>
                )}
                {roles.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.roleOption, form.role === r.name && styles.roleOptionActive]}
                    onPress={() => { setForm((f) => ({ ...f, role: r.name })); setRolePickerOpen(false); }}
                  >
                    <Text style={[styles.roleOptionText, form.role === r.name && styles.roleOptionTextActive]}>
                      {r.name}
                    </Text>
                    {form.role === r.name && <Ionicons name="checkmark" size={16} color={SHOP_ACCENT} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setModalVisible(false)} disabled={submitting}>
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.7 }]} onPress={handleAddStaff} disabled={submitting}>
                <LinearGradient colors={[SHOP_ACCENT, SHOP_GRAD[1]]} style={styles.submitBtnGrad}>
                  {submitting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons name="person-add-outline" size={16} color="white" />
                      <Text style={styles.submitBtnText}>Add Staff</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: thannigoPalette.background },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: thannigoPalette.borderSoft },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 22, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5 },
  roleLabel: { fontSize: 9, fontWeight: '700', color: SHOP_ACCENT, letterSpacing: 1.5, marginTop: 3 },
  notifBtnSub: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: SHOP_ACCENT, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: 'white', fontSize: 13, fontWeight: '800' },

  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: thannigoPalette.borderSoft },
  statBox: { flex: 1, alignItems: 'center', gap: 6 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 10, color: thannigoPalette.neutral, fontWeight: '600' },

  content: { padding: 20, gap: 12, paddingBottom: 40 },
  
  titleRow: { marginBottom: 16 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5 },
  pageSub: { fontSize: 13, color: thannigoPalette.neutral, fontWeight: '500', marginTop: 4 },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: thannigoPalette.neutral },
  emptySub: { fontSize: 13, color: '#94a3b8', textAlign: 'center' },

  staffCard: { backgroundColor: 'white', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  staffCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  staffName: { fontSize: 15, fontWeight: '800', color: thannigoPalette.darkText },
  staffPhone: { fontSize: 12, color: thannigoPalette.neutral, fontWeight: '500', marginTop: 2 },
  staffMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#e0f0ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleBadgeInactive: { backgroundColor: thannigoPalette.borderSoft },
  roleText: { fontSize: 11, fontWeight: '700', color: SHOP_ACCENT },
  roleTextInactive: { color: '#94a3b8' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeActive: { backgroundColor: '#e8f5e9' },
  statusBadgeInactive: { backgroundColor: thannigoPalette.borderSoft },
  statusBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  statusBadgeTextActive: { color: thannigoPalette.success },
  statusBadgeTextInactive: { color: '#94a3b8' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalPill: { width: 40, height: 4, borderRadius: 2, backgroundColor: thannigoPalette.borderSoft, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: thannigoPalette.darkText, marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: thannigoPalette.neutral, marginBottom: 6, letterSpacing: 0.5 },
  input: { backgroundColor: thannigoPalette.background, borderRadius: 14, padding: 14, fontSize: 15, color: thannigoPalette.darkText, borderWidth: 1, borderColor: thannigoPalette.borderSoft, marginBottom: 14 },
  rolePicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: thannigoPalette.background, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: thannigoPalette.borderSoft, marginBottom: 6 },
  rolePickerText: { fontSize: 15, color: thannigoPalette.darkText, fontWeight: '600' },
  roleDropdown: { backgroundColor: 'white', borderRadius: 14, borderWidth: 1, borderColor: thannigoPalette.borderSoft, marginBottom: 14, overflow: 'hidden' },
  roleDropdownEmpty: { padding: 14, color: '#94a3b8', textAlign: 'center', fontSize: 13 },
  roleOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: thannigoPalette.borderSoft },
  roleOptionActive: { backgroundColor: '#f0f7ff' },
  roleOptionText: { fontSize: 14, fontWeight: '600', color: thannigoPalette.darkText },
  roleOptionTextActive: { color: SHOP_ACCENT, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 6 },
  cancelModalBtn: { flex: 0.4, paddingVertical: 15, borderRadius: 16, borderWidth: 1, borderColor: thannigoPalette.borderSoft, alignItems: 'center' },
  cancelModalBtnText: { fontSize: 14, fontWeight: '700', color: thannigoPalette.neutral },
  submitBtn: { flex: 0.6, borderRadius: 16, overflow: 'hidden' },
  submitBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  submitBtnText: { color: 'white', fontSize: 15, fontWeight: '800' },
});
