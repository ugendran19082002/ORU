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
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { apiClient } from '@/api/client';

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
            <Text style={styles.headerTitle}>Staff Management</Text>
            <Text style={styles.headerSub}>{staff.length} members · {activeCount} active</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => { setForm(EMPTY_FORM); setModalVisible(true); }}
        >
          <Ionicons name="person-add-outline" size={18} color="white" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total', value: staff.length, color: '#005d90', bg: '#e0f0ff', icon: 'people-outline' },
          { label: 'Active', value: activeCount, color: '#2e7d32', bg: '#e8f5e9', icon: 'checkmark-circle-outline' },
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
        {loading && <ActivityIndicator color="#005d90" style={{ marginTop: 40 }} />}

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
                <Ionicons name="person" size={22} color="#005d90" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.staffName}>{member.name}</Text>
                <Text style={styles.staffPhone}>{member.phone}</Text>
              </View>
              {togglingId === member.id ? (
                <ActivityIndicator size="small" color="#005d90" />
              ) : (
                <Switch
                  value={member.status === 'active'}
                  onValueChange={() => handleToggleStatus(member)}
                  trackColor={{ false: '#e0e2e8', true: '#bbf7d0' }}
                  thumbColor={member.status === 'active' ? '#2e7d32' : '#94a3b8'}
                />
              )}
            </View>
            <View style={styles.staffMeta}>
              <View style={[styles.roleBadge, member.status === 'inactive' && styles.roleBadgeInactive]}>
                <Ionicons
                  name="briefcase-outline"
                  size={12}
                  color={member.status === 'active' ? '#005d90' : '#94a3b8'}
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
              <Ionicons name={rolePickerOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#707881" />
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
                    {form.role === r.name && <Ionicons name="checkmark" size={16} color="#005d90" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setModalVisible(false)} disabled={submitting}>
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.7 }]} onPress={handleAddStaff} disabled={submitting}>
                <LinearGradient colors={['#005d90', '#0077b6']} style={styles.submitBtnGrad}>
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
  container: { flex: 1, backgroundColor: '#f7f9ff' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#181c20' },
  headerSub: { fontSize: 11, color: '#707881', fontWeight: '500', marginTop: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#005d90', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12 },
  addBtnText: { color: 'white', fontSize: 13, fontWeight: '800' },

  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  statBox: { flex: 1, alignItems: 'center', gap: 6 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 10, color: '#707881', fontWeight: '600' },

  content: { padding: 20, gap: 12, paddingBottom: 40 },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#64748b' },
  emptySub: { fontSize: 13, color: '#94a3b8', textAlign: 'center' },

  staffCard: { backgroundColor: 'white', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  staffCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  staffName: { fontSize: 15, fontWeight: '800', color: '#181c20' },
  staffPhone: { fontSize: 12, color: '#707881', fontWeight: '500', marginTop: 2 },
  staffMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#e0f0ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleBadgeInactive: { backgroundColor: '#f1f5f9' },
  roleText: { fontSize: 11, fontWeight: '700', color: '#005d90' },
  roleTextInactive: { color: '#94a3b8' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeActive: { backgroundColor: '#e8f5e9' },
  statusBadgeInactive: { backgroundColor: '#f1f5f9' },
  statusBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  statusBadgeTextActive: { color: '#2e7d32' },
  statusBadgeTextInactive: { color: '#94a3b8' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalPill: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e0e2e8', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#181c20', marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#707881', marginBottom: 6, letterSpacing: 0.5 },
  input: { backgroundColor: '#f7f9ff', borderRadius: 14, padding: 14, fontSize: 15, color: '#181c20', borderWidth: 1, borderColor: '#e0e2e8', marginBottom: 14 },
  rolePicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f7f9ff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e0e2e8', marginBottom: 6 },
  rolePickerText: { fontSize: 15, color: '#181c20', fontWeight: '600' },
  roleDropdown: { backgroundColor: 'white', borderRadius: 14, borderWidth: 1, borderColor: '#e0e2e8', marginBottom: 14, overflow: 'hidden' },
  roleDropdownEmpty: { padding: 14, color: '#94a3b8', textAlign: 'center', fontSize: 13 },
  roleOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  roleOptionActive: { backgroundColor: '#f0f7ff' },
  roleOptionText: { fontSize: 14, fontWeight: '600', color: '#181c20' },
  roleOptionTextActive: { color: '#005d90', fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 6 },
  cancelModalBtn: { flex: 0.4, paddingVertical: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e0e2e8', alignItems: 'center' },
  cancelModalBtnText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  submitBtn: { flex: 0.6, borderRadius: 16, overflow: 'hidden' },
  submitBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  submitBtnText: { color: 'white', fontSize: 15, fontWeight: '800' },
});
