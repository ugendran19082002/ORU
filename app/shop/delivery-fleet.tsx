import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Modal, Switch, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/providers/ThemeContext';
import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { BackButton } from '@/components/ui/BackButton';


import { useFleetStore } from '@/stores/fleetStore';

import { Shadow, roleAccent, roleSurface, roleGradients } from '@/constants/theme';

const SHOP_ACCENT = roleAccent.shop_owner;
const SHOP_SURF = roleSurface.shop_owner;
const SHOP_GRAD: [string, string] = [roleGradients.shop_owner.start, roleGradients.shop_owner.end];

export default function DeliveryFleetScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const { agents: deliveryAgents, addAgent: addDeliveryAgent, setAgentStatus, fetchAgents } = useFleetStore();

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useAndroidBackHandler(() => {
    safeBack('/shop/delivery');
  });


  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fName, setFName] = useState('');
  const [fPhone, setFPhone] = useState('');

  const handleAddAgent = async () => {
    if (fName.length < 3 || fPhone.length < 10) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Input',
        text2: 'Please enter a valid name and phone number.'
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDeliveryAgent({ name: fName, phone: fPhone });
      setFName('');
      setFPhone('');
      setAddModalOpen(false);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Driver onboarded to fleet' });
    } catch (err: any) {
      Toast.show({ 
        type: 'error', 
        text1: 'Onboarding Failed', 
        text2: err.response?.data?.message || 'Could not add driver' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'offline' : 'active';
    try {
      await setAgentStatus(id, newStatus as any);
      Toast.show({ 
        type: 'success', 
        text1: newStatus === 'active' ? 'Driver Enabled' : 'Driver Disabled', 
        text2: `Fleet permissions updated.` 
      });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Update Failed', text2: 'Could not change driver status.' });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <BackButton fallback="/shop/delivery" />
          <Text style={styles.headerTitle}>Delivery Fleet</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity 
            style={styles.notifBtnSub} 
            onPress={() => router.push('/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => setAddModalOpen(true)}>
            <Ionicons name="person-add" size={16} color="white" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleArea}>
          <Text style={styles.pageTitle}>Manage Drivers</Text>
          <Text style={styles.subtitle}>Onboard and manage personnel permitted to deliver orders for your shop.</Text>
        </View>

        <View style={styles.list}>
          {deliveryAgents.map((agent: import('@/types/domain').DeliveryAgent) => (
            <View key={agent.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.avatar, agent.status === 'active' ? { backgroundColor: '#e8f5e9' } : { backgroundColor: colors.border }]}>
                  <Text style={[styles.avatarText, agent.status === 'active' ? { color: colors.success } : { color: colors.muted }]}>
                    {agent.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.agentName}>{agent.name}</Text>
                  <Text style={styles.agentPhone}>+91 {agent.phone}</Text>
                </View>
                <View style={styles.toggleContainer}>
                  <Text style={[styles.toggleLabel, { color: agent.status === 'active' ? colors.success : colors.muted }]}>
                    {agent.status === 'active' ? 'ENABLED' : 'DISABLED'}
                  </Text>
                  <Switch
                    value={agent.status === 'active'}
                    onValueChange={() => handleToggleStatus(agent.id, agent.status)}
                    trackColor={{ false: colors.border, true: SHOP_ACCENT + '80' }}
                    thumbColor={agent.status === 'active' ? SHOP_ACCENT : '#f4f3f4'}
                    ios_backgroundColor={colors.border}
                  />
                </View>
              </View>

              <View style={styles.cardBottom}>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, agent.status === 'active' ? { backgroundColor: '#4ade80' } : { backgroundColor: colors.muted }]} />
                  <Text style={[styles.statusText, agent.status !== 'active' && { color: colors.muted }]}>
                    {agent.status === 'active' ? 'Active / Online' : 'Account Disabled'}
                  </Text>
                </View>
                {agent.status === 'active' && (
                  <View style={styles.statsBadge}>
                    <Ionicons name="bicycle-outline" size={14} color={SHOP_ACCENT} />
                    <Text style={styles.statsValue}>{agent.assignedOrders} Assigned</Text>
                  </View>
                )}
              </View>
            </View>
          ))}

          {deliveryAgents.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="bicycle-outline" size={48} color="#e0e2e8" />
              <Text style={styles.emptyText}>You haven't onboarded any delivery personnel yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ADD DRIVER MODAL */}
      <Modal visible={isAddModalOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Delivery Driver</Text>
              <TouchableOpacity onPress={() => setAddModalOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput style={styles.inputField} value={fName} onChangeText={setFName} placeholder="e.g. Rahul Sharma" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <TextInput style={styles.inputField} value={fPhone} onChangeText={setFPhone} keyboardType="number-pad" placeholder="9876543210" maxLength={10} />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleAddAgent}>
              <Text style={styles.submitBtnText}>Onboard Driver</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 14, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: SHOP_ACCENT, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  addBtnText: { color: 'white', fontWeight: '800', fontSize: 13 },
  notifBtnSub: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  
  content: { padding: 24, paddingBottom: 100 },
  titleArea: { marginBottom: 24 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 13, color: colors.muted, lineHeight: 18 },

  list: { gap: 16 },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800' },
  agentName: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 2 },
  agentPhone: { fontSize: 13, color: colors.muted, fontWeight: '500' },
  toggleContainer: { alignItems: 'flex-end', gap: 4 },
  toggleLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '700', color: colors.text },
  statsBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statsValue: { fontSize: 12, fontWeight: '700', color: SHOP_ACCENT },

  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: colors.surface, borderRadius: 20 },
  emptyText: { textAlign: 'center', color: colors.muted, marginTop: 16, fontSize: 14, fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: colors.surface, borderRadius: 28, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.text },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '800', color: colors.muted, marginBottom: 8, marginLeft: 4 },
  inputField: { backgroundColor: colors.border, borderRadius: 14, paddingHorizontal: 16, height: 50, fontSize: 16, fontWeight: '600', color: colors.text },

  submitBtn: { backgroundColor: SHOP_ACCENT, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: 'white', fontWeight: '900', fontSize: 15 },
});


