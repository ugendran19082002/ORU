import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, TextInput, ActivityIndicator, RefreshControl,
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

interface InventoryItem {
  id: number;
  product_id: number;
  product_name: string;
  full_cans: number;
  empty_cans: number;
  damaged_cans: number;
  low_stock_alert: number;
  updated_at: string;
}

interface InventoryLog {
  id: number;
  product_name: string;
  action: string;
  quantity: number;
  note: string | null;
  created_at: string;
}

const ACTIONS = [
  { key: 'add_full', label: 'Add Full Cans', icon: 'add-circle-outline', color: '#2e7d32' },
  { key: 'mark_empty', label: 'Mark Empty', icon: 'remove-circle-outline', color: '#b45309' },
  { key: 'mark_damaged', label: 'Mark Damaged', icon: 'alert-circle-outline', color: '#c62828' },
  { key: 'collected_empty', label: 'Collected Empty', icon: 'checkmark-circle-outline', color: '#005d90' },
];

export default function CanManagementScreen() {
  const { safeBack } = useAppNavigation();

  useAndroidBackHandler(() => {
    safeBack('/shop/settings');
  });

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Update modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [action, setAction] = useState('add_full');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [invRes, logRes] = await Promise.all([
        apiClient.get('/inventory'),
        apiClient.get('/inventory/logs').catch(() => null),
      ]);
      if (invRes.data?.status === 1) setInventory(invRes.data.data ?? []);
      if (logRes?.data?.status === 1) setLogs((logRes.data.data?.data ?? logRes.data.data ?? []).slice(0, 20));
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load inventory data.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openUpdate = (item: InventoryItem) => {
    setSelected(item);
    setAction('add_full');
    setQty('');
    setNote('');
    setModalVisible(true);
  };

  const handleUpdate = async () => {
    const quantity = parseInt(qty, 10);
    if (!qty || isNaN(quantity) || quantity <= 0) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Enter a valid quantity.' });
      return;
    }
    if (!selected) return;

    setSubmitting(true);
    try {
      const res = await apiClient.post('/inventory/update', {
        product_id: selected.product_id,
        action,
        quantity,
        note: note.trim() || undefined,
      });
      if (res.data?.status === 1) {
        Toast.show({ type: 'success', text1: 'Inventory Updated', text2: `${selected.product_name} updated successfully.` });
        setModalVisible(false);
        fetchAll();
      } else {
        throw new Error(res.data?.message ?? 'Update failed');
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e?.response?.data?.message ?? e?.message ?? 'Could not update inventory.' });
    } finally {
      setSubmitting(false);
    }
  };

  const totalFull = inventory.reduce((s, i) => s + i.full_cans, 0);
  const totalEmpty = inventory.reduce((s, i) => s + i.empty_cans, 0);
  const totalDamaged = inventory.reduce((s, i) => s + i.damaged_cans, 0);
  const lowStockItems = inventory.filter((i) => i.full_cans <= i.low_stock_alert);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BackButton fallback="/shop/settings" />
          <View>
            <Text style={styles.headerTitle}>Can Management</Text>
            <Text style={styles.headerSub}>{inventory.length} products tracked</Text>
          </View>
        </View>
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        {[
          { label: 'Full Cans', value: totalFull, color: '#2e7d32', bg: '#e8f5e9', icon: 'checkmark-circle-outline' },
          { label: 'Empty', value: totalEmpty, color: '#b45309', bg: '#fef3c7', icon: 'remove-circle-outline' },
          { label: 'Damaged', value: totalDamaged, color: '#c62828', bg: '#ffebee', icon: 'alert-circle-outline' },
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

      {lowStockItems.length > 0 && (
        <View style={styles.alertBanner}>
          <Ionicons name="warning-outline" size={16} color="#b45309" />
          <Text style={styles.alertText}>{lowStockItems.length} product(s) below low-stock threshold</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} />}
      >
        {loading && <ActivityIndicator color="#005d90" style={{ marginTop: 40 }} />}

        {!loading && inventory.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color="#c8d0da" />
            <Text style={styles.emptyTitle}>No Inventory Data</Text>
            <Text style={styles.emptySub}>Inventory records will appear once products are tracked.</Text>
          </View>
        )}

        {!loading && inventory.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Products</Text>
            {inventory.map((item) => {
              const isLow = item.full_cans <= item.low_stock_alert;
              return (
                <View key={item.id} style={[styles.itemCard, isLow && styles.itemCardLow]}>
                  <View style={styles.itemTop}>
                    <View style={styles.itemIcon}>
                      <Ionicons name="water" size={20} color="#005d90" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{item.product_name}</Text>
                      <Text style={styles.itemUpdated}>
                        Updated {new Date(item.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                    {isLow && (
                      <View style={styles.lowBadge}>
                        <Text style={styles.lowBadgeText}>LOW</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.canRow}>
                    <View style={styles.canStat}>
                      <Text style={[styles.canCount, { color: '#2e7d32' }]}>{item.full_cans}</Text>
                      <Text style={styles.canLabel}>Full</Text>
                    </View>
                    <View style={styles.canStat}>
                      <Text style={[styles.canCount, { color: '#b45309' }]}>{item.empty_cans}</Text>
                      <Text style={styles.canLabel}>Empty</Text>
                    </View>
                    <View style={styles.canStat}>
                      <Text style={[styles.canCount, { color: '#c62828' }]}>{item.damaged_cans}</Text>
                      <Text style={styles.canLabel}>Damaged</Text>
                    </View>
                    <TouchableOpacity style={styles.updateBtn} onPress={() => openUpdate(item)}>
                      <Ionicons name="create-outline" size={15} color="#005d90" />
                      <Text style={styles.updateBtnText}>Update</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* RECENT LOGS */}
        {logs.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Recent Activity</Text>
            <View style={styles.logsCard}>
              {logs.map((log, idx) => (
                <View key={log.id} style={[styles.logRow, idx < logs.length - 1 && styles.logDivider]}>
                  <View style={styles.logIcon}>
                    <Ionicons name="swap-horizontal-outline" size={14} color="#005d90" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logText}>{log.product_name} — {log.action.replace(/_/g, ' ')}</Text>
                    {log.note && <Text style={styles.logNote}>{log.note}</Text>}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.logQty, { color: log.quantity > 0 ? '#2e7d32' : '#c62828' }]}>
                      {log.quantity > 0 ? '+' : ''}{log.quantity}
                    </Text>
                    <Text style={styles.logDate}>
                      {new Date(log.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* UPDATE MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalPill} />
            <Text style={styles.modalTitle}>Update Inventory</Text>
            <Text style={styles.modalSub}>{selected?.product_name}</Text>

            <Text style={styles.fieldLabel}>Action</Text>
            <View style={styles.actionGrid}>
              {ACTIONS.map((a) => (
                <TouchableOpacity
                  key={a.key}
                  style={[styles.actionChip, action === a.key && { borderColor: a.color, backgroundColor: a.color + '15' }]}
                  onPress={() => setAction(a.key)}
                >
                  <Ionicons name={a.icon as any} size={14} color={action === a.key ? a.color : '#707881'} />
                  <Text style={[styles.actionChipText, action === a.key && { color: a.color }]}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 10"
              placeholderTextColor="#a0aab4"
              value={qty}
              onChangeText={setQty}
              keyboardType="numeric"
              maxLength={4}
            />

            <Text style={styles.fieldLabel}>Note (optional)</Text>
            <TextInput
              style={[styles.input, { height: 72 }]}
              placeholder="e.g. Received from supplier"
              placeholderTextColor="#a0aab4"
              value={note}
              onChangeText={setNote}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setModalVisible(false)} disabled={submitting}>
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.7 }]} onPress={handleUpdate} disabled={submitting}>
                <LinearGradient colors={['#005d90', '#0077b6']} style={styles.submitBtnGrad}>
                  {submitting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={15} color="white" />
                      <Text style={styles.submitBtnText}>Save</Text>
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

  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  statBox: { flex: 1, alignItems: 'center', gap: 6 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 10, color: '#707881', fontWeight: '600' },

  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef3c7', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#fde68a' },
  alertText: { fontSize: 12, color: '#b45309', fontWeight: '700' },

  content: { padding: 20, gap: 12, paddingBottom: 40 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#64748b', letterSpacing: 0.5 },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#64748b' },
  emptySub: { fontSize: 13, color: '#94a3b8', textAlign: 'center' },

  itemCard: { backgroundColor: 'white', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  itemCardLow: { borderWidth: 1.5, borderColor: '#fde68a' },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  itemIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 15, fontWeight: '800', color: '#181c20' },
  itemUpdated: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  lowBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  lowBadgeText: { fontSize: 9, fontWeight: '800', color: '#b45309', letterSpacing: 0.5 },

  canRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  canStat: { alignItems: 'center', flex: 1 },
  canCount: { fontSize: 22, fontWeight: '900' },
  canLabel: { fontSize: 10, color: '#707881', fontWeight: '600' },
  updateBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#e0f0ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  updateBtnText: { fontSize: 12, fontWeight: '700', color: '#005d90' },

  logsCard: { backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  logDivider: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  logIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  logText: { fontSize: 12, fontWeight: '700', color: '#181c20' },
  logNote: { fontSize: 11, color: '#707881', marginTop: 1 },
  logQty: { fontSize: 14, fontWeight: '800' },
  logDate: { fontSize: 10, color: '#94a3b8', marginTop: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalPill: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e0e2e8', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#181c20', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#707881', marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#707881', marginBottom: 8, letterSpacing: 0.5 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  actionChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5, borderColor: '#e0e2e8' },
  actionChipText: { fontSize: 12, fontWeight: '700', color: '#707881' },
  input: { backgroundColor: '#f7f9ff', borderRadius: 14, padding: 14, fontSize: 15, color: '#181c20', borderWidth: 1, borderColor: '#e0e2e8', marginBottom: 14 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelModalBtn: { flex: 0.4, paddingVertical: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e0e2e8', alignItems: 'center' },
  cancelModalBtnText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  submitBtn: { flex: 0.6, borderRadius: 16, overflow: 'hidden' },
  submitBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  submitBtnText: { color: 'white', fontSize: 15, fontWeight: '800' },
});
