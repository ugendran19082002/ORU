import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Modal } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { BackButton } from '@/components/ui/BackButton';


import { useFleetStore } from '@/stores/fleetStore';

import { Shadow, thannigoPalette, roleAccent, roleSurface, roleGradients } from '@/constants/theme';

const SHOP_ACCENT = roleAccent.shop_owner;
const SHOP_SURF = roleSurface.shop_owner;
const SHOP_GRAD: [string, string] = [roleGradients.shop_owner.start, roleGradients.shop_owner.end];

export default function ShopDeliveryFleetScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const { agents: deliveryAgents, addAgent: addDeliveryAgent, removeAgent: removeDeliveryAgent, fetchAgents } = useFleetStore();

  useEffect(() => {
    fetchAgents();
  }, []);

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

  const handleRemoveAgent = (id: string, name: string) => {
    require('react-native').Alert.alert(
      'Remove Driver',
      `Are you sure you want to remove ${name} from your delivery fleet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await removeDeliveryAgent(id);
              Toast.show({ type: 'success', text1: 'Removed', text2: `${name} is no longer in fleet` });
            } catch (err) {
              Toast.show({ type: 'error', text1: 'Error', text2: 'Could not remove driver' });
            }
          } 
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <BackButton fallback="/shop/delivery" />
        <Text style={styles.headerTitle}>Delivery Fleet</Text>

        <TouchableOpacity style={styles.addBtn} onPress={() => setAddModalOpen(true)}>
          <Ionicons name="person-add" size={16} color="white" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
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
                <View style={[styles.avatar, agent.status === 'active' ? { backgroundColor: '#e8f5e9' } : { backgroundColor: thannigoPalette.borderSoft }]}>
                  <Text style={[styles.avatarText, agent.status === 'active' ? { color: thannigoPalette.success } : { color: thannigoPalette.neutral }]}>
                    {agent.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.agentName}>{agent.name}</Text>
                  <Text style={styles.agentPhone}>+91 {agent.phone}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleRemoveAgent(agent.id, agent.name)}
                >
                  <Ionicons name="trash-outline" size={18} color="#ba1a1a" />
                </TouchableOpacity>
              </View>

              <View style={styles.cardBottom}>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, agent.status === 'active' ? { backgroundColor: '#4ade80' } : { backgroundColor: '#94a3b8' }]} />
                  <Text style={styles.statusText}>{agent.status === 'active' ? 'Active / Assigned' : 'Offline'}</Text>
                </View>
                <View style={styles.statsBadge}>
                  <Ionicons name="bicycle-outline" size={14} color={SHOP_ACCENT} />
                  <Text style={styles.statsValue}>{agent.assignedOrders} Assigned</Text>
                </View>
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
                <Ionicons name="close" size={20} color={thannigoPalette.neutral} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: thannigoPalette.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 14, backgroundColor: 'white',
    borderBottomWidth: 1, borderBottomColor: thannigoPalette.borderSoft,
  },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: thannigoPalette.borderSoft, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: thannigoPalette.darkText },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: SHOP_ACCENT, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  addBtnText: { color: 'white', fontWeight: '800', fontSize: 13 },
  
  content: { padding: 24, paddingBottom: 100 },
  titleArea: { marginBottom: 24 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 13, color: thannigoPalette.neutral, lineHeight: 18 },

  list: { gap: 16 },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800' },
  agentName: { fontSize: 16, fontWeight: '800', color: thannigoPalette.darkText, marginBottom: 2 },
  agentPhone: { fontSize: 13, color: thannigoPalette.neutral, fontWeight: '500' },
  deleteBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff5f5', alignItems: 'center', justifyContent: 'center' },

  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderTopColor: thannigoPalette.borderSoft },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '700', color: thannigoPalette.darkText },
  statsBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: thannigoPalette.borderSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statsValue: { fontSize: 12, fontWeight: '700', color: SHOP_ACCENT },

  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: 'white', borderRadius: 20 },
  emptyText: { textAlign: 'center', color: thannigoPalette.neutral, marginTop: 16, fontSize: 14, fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: 'white', borderRadius: 28, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: thannigoPalette.darkText },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: thannigoPalette.borderSoft, alignItems: 'center', justifyContent: 'center' },
  
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '800', color: thannigoPalette.neutral, marginBottom: 8, marginLeft: 4 },
  inputField: { backgroundColor: thannigoPalette.borderSoft, borderRadius: 14, paddingHorizontal: 16, height: 50, fontSize: 16, fontWeight: '600', color: thannigoPalette.darkText },

  submitBtn: { backgroundColor: SHOP_ACCENT, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: 'white', fontWeight: '900', fontSize: 15 },
});


