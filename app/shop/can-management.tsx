import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';

import { BackButton } from '@/components/ui/BackButton';
import { inventoryApi } from '@/api/inventoryApi';

interface InventoryItem {
  id: number;
  product_id: number;
  full_cans: number;
  empty_cans: number;
  damaged_cans: number;
  Product: {
    id: number;
    name: string;
  };
}

export default function CanManagementScreen() {
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Edit Modal State
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editValues, setEditValues] = useState({ full: 0, empty: 0, damaged: 0 });

  const fetchInventory = useCallback(async () => {
    try {
      const data = await inventoryApi.getInventory();
      setInventory(data);
    } catch (error) {
      console.error('[CanManagement] fetch failed:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load inventory' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  const openEditModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setEditValues({ full: 0, empty: 0, damaged: 0 });
    setModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      setUpdating(true);
      await inventoryApi.updateInventorySummary({
        product_id: selectedItem.product_id,
        change_type: 'correction',
        full_cans_change: editValues.full,
        empty_cans_change: editValues.empty,
        damaged_cans_change: editValues.damaged,
        notes: 'Manual management update'
      });
      Toast.show({ type: 'success', text1: 'Success', text2: 'Inventory updated' });
      setModalVisible(false);
      fetchInventory();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Update Failed', text2: 'Please try again' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#005d90" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <BackButton fallback="/shop/(tabs)/settings" iconColor="#005d90" />
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Can Management</Text>
          <Text style={styles.headerSubtitle}>Asset Tracking & Logs</Text>
        </View>
        <TouchableOpacity style={styles.logBtn} onPress={() => router.push('/shop/inventory-logs' as any)}>
          <Ionicons name="time-outline" size={24} color="#005d90" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: '#e0f2fe' }]}>
            <Text style={styles.summaryLabel}>Total Full</Text>
            <Text style={[styles.summaryValue, { color: '#0369a1' }]}>
              {inventory.reduce((sum, item) => sum + (item.full_cans || 0), 0)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#f0fdf4' }]}>
            <Text style={styles.summaryLabel}>Total Empty</Text>
            <Text style={[styles.summaryValue, { color: '#15803d' }]}>
              {inventory.reduce((sum, item) => sum + (item.empty_cans || 0), 0)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Inventory</Text>
          {inventory.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.inventoryCard}
              onPress={() => openEditModal(item)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.productName}>{item.Product?.name}</Text>
                <Ionicons name="create-outline" size={18} color="#94a3b8" />
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Full</Text>
                  <Text style={[styles.statValue, { color: '#0369a1' }]}>{item.full_cans}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Empty</Text>
                  <Text style={[styles.statValue, { color: '#15803d' }]}>{item.empty_cans}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Damaged</Text>
                  <Text style={[styles.statValue, { color: '#b91c1c' }]}>{item.damaged_cans}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Update Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adjust Inventory</Text>
            <Text style={styles.modalSubtitle}>{selectedItem?.Product?.name}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Cans Change (+/-)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="e.g. +10 or -5"
                onChangeText={(val) => setEditValues({ ...editValues, full: parseInt(val) || 0 })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Empty Cans Change (+/-)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="e.g. +5"
                onChangeText={(val) => setEditValues({ ...editValues, empty: parseInt(val) || 0 })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Damaged Cans Change (+/-)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="e.g. +1"
                onChangeText={(val) => setEditValues({ ...editValues, damaged: parseInt(val) || 0 })}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveBtn, updating && { opacity: 0.7 }]} 
                onPress={handleUpdate}
                disabled={updating}
              >
                {updating ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { 
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, 
    backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' 
  },
  headerTitleContainer: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  headerSubtitle: { fontSize: 12, color: '#64748b' },
  logBtn: { padding: 8 },

  scrollContent: { padding: 20 },
  summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  summaryCard: { flex: 1, padding: 16, borderRadius: 20 },
  summaryLabel: { fontSize: 13, color: '#475569', fontWeight: '600', marginBottom: 4 },
  summaryValue: { fontSize: 24, fontWeight: '800' },

  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 4 },
  inventoryCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  productName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 24, backgroundColor: '#f1f5f9' },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
  input: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 12, fontSize: 16, fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontWeight: '700' },
  saveBtn: { flex: 2, backgroundColor: '#005d90', padding: 16, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: '800' }
});
