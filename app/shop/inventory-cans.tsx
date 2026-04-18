import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, TextInput, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { apiClient } from '@/api/client';

import { Shadow, thannigoPalette, roleAccent, roleSurface, roleGradients, Radius, Spacing, Typography } from '@/constants/theme';

const SHOP_ACCENT = roleAccent.shop_owner;
const SHOP_SURF = roleSurface.shop_owner;
const SHOP_GRAD: [string, string] = [roleGradients.shop_owner.start, roleGradients.shop_owner.end];

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
  { key: 'add_full', label: 'Add Full', icon: 'add-circle-outline' as const, color: thannigoPalette.success, bg: '#e8f5e9' },
  { key: 'mark_empty', label: 'Mark Empty', icon: 'remove-circle-outline' as const, color: '#b45309', bg: '#fef3c7' },
  { key: 'mark_damaged', label: 'Mark Damaged', icon: 'alert-circle-outline' as const, color: thannigoPalette.adminRed, bg: '#ffebee' },
  { key: 'collected_empty', label: 'Collected Empty', icon: 'checkmark-circle-outline' as const, color: SHOP_ACCENT, bg: SHOP_SURF },
];

export default function InventoryCansScreen() {
  const { safeBack } = useAppNavigation();
  const router = useRouter();

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

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BackButton fallback="/shop/settings" />
          <View>
            <Text style={styles.headerTitle}>Can Inventory</Text>
            <Text style={styles.headerSub}>{inventory.length} products tracked</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity style={styles.notifBtnSub} onPress={() => router.push('/notifications' as any)}>
            <Ionicons name="notifications-outline" size={22} color={SHOP_ACCENT} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.notifBtnSub} onPress={() => { setRefreshing(true); fetchAll(); }}>
             <Ionicons name="refresh" size={20} color={SHOP_ACCENT} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={SHOP_ACCENT} />}
      >
        {/* STATS TILES */}
        <View style={styles.statsRow}>
          {[
            { label: 'Full Stock', value: totalFull, color: thannigoPalette.success, bg: '#e8f5e9', icon: 'checkmark-circle-outline' as const },
            { label: 'Empty Cans', value: totalEmpty, color: '#b45309', bg: '#fef3c7', icon: 'sync-outline' as const },
            { label: 'Damaged', value: totalDamaged, color: thannigoPalette.error, bg: '#ffebee', icon: 'alert-circle-outline' as const },
          ].map((s) => (
            <View key={s.label} style={[styles.statBox, { backgroundColor: s.bg }]}>
              <View style={styles.statIconBox}>
                <Ionicons name={s.icon} size={20} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: s.color }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {lowStockItems.length > 0 && (
          <View style={styles.alertBanner}>
            <LinearGradient colors={['#fff8e1', '#fff3e0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.alertGrad}>
              <Ionicons name="warning" size={18} color="#f57c00" />
              <Text style={styles.alertText}>{lowStockItems.length} products are below low-stock threshold</Text>
            </LinearGradient>
          </View>
        )}

        {loading ? (
          <View style={{ marginTop: 60, alignItems: 'center' }}>
            <ActivityIndicator color={SHOP_ACCENT} size="large" />
            <Text style={{ marginTop: 12, color: thannigoPalette.neutral, fontWeight: '600' }}>Fetching real-time inventory...</Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>Tracked Products</Text>
            </View>

            {inventory.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                   <Ionicons name="cube-outline" size={48} color="#cbd5e1" />
                </View>
                <Text style={styles.emptyTitle}>No Inventory Records</Text>
                <Text style={styles.emptySub}>Inventory data will populate once you add water products and track cycles.</Text>
              </View>
            ) : (
              inventory.map((item) => {
                const isLow = item.full_cans <= item.low_stock_alert;
                return (
                  <View key={item.id} style={[styles.itemCard, isLow && styles.itemCardLow]}>
                    <View style={styles.itemTop}>
                      <View style={styles.itemIcon}>
                        <Ionicons name="water" size={24} color={SHOP_ACCENT} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.product_name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                           <Ionicons name="time-outline" size={12} color={thannigoPalette.neutral} />
                           <Text style={styles.itemUpdated}>
                            Synced {new Date(item.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </Text>
                        </View>
                      </View>
                      {isLow && (
                        <View style={styles.lowBadge}>
                          <Text style={styles.lowBadgeText}>LOW STOCK</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.canRow}>
                      <View style={styles.canStat}>
                        <Text style={[styles.canCount, { color: thannigoPalette.success }]}>{item.full_cans}</Text>
                        <Text style={styles.canLabel}>FULL</Text>
                      </View>
                      <View style={styles.canStat}>
                        <Text style={[styles.canCount, { color: '#b45309' }]}>{item.empty_cans}</Text>
                        <Text style={styles.canLabel}>EMPTY</Text>
                      </View>
                      <View style={styles.canStat}>
                        <Text style={[styles.canCount, { color: thannigoPalette.error }]}>{item.damaged_cans}</Text>
                        <Text style={styles.canLabel}>DAMAGED</Text>
                      </View>
                      <TouchableOpacity style={styles.updateBtn} onPress={() => openUpdate(item)}>
                        <LinearGradient colors={SHOP_GRAD} style={styles.updateBtnGrad}>
                           <Ionicons name="sync" size={15} color="white" />
                           <Text style={styles.updateBtnText}>Update</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}

            {/* RECENT LOGS */}
            {logs.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                  <Text style={styles.sectionTitle}>Recent Activity Logs</Text>
                </View>
                <View style={styles.logsCard}>
                  {logs.map((log, idx) => (
                    <View key={log.id} style={[styles.logRow, idx < logs.length - 1 && styles.logDivider]}>
                      <View style={[styles.logIcon, { backgroundColor: log.quantity > 0 ? '#e8f5e9' : '#fff5f5' }]}>
                        <Ionicons 
                          name={log.quantity > 0 ? "add" : "remove"} 
                          size={16} 
                          color={log.quantity > 0 ? thannigoPalette.success : thannigoPalette.error} 
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.logText}>{log.product_name}</Text>
                        <Text style={styles.logAction}>{log.action.replace(/_/g, ' ')}</Text>
                        {log.note && <Text style={styles.logNote}>{log.note}</Text>}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.logQty, { color: log.quantity > 0 ? thannigoPalette.success : thannigoPalette.error }]}>
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
          </>
        )}
      </ScrollView>

      {/* UPDATE MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalPill} />
            
            <View style={styles.modalHeader}>
               <View>
                  <Text style={styles.modalTitle}>Adjust Inventory</Text>
                  <Text style={styles.modalSub}>{selected?.product_name}</Text>
               </View>
               <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeModalBtn}>
                  <Ionicons name="close" size={24} color={thannigoPalette.neutral} />
               </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Action Type</Text>
            <View style={styles.actionGrid}>
              {ACTIONS.map((a) => {
                const isActive = action === a.key;
                return (
                  <TouchableOpacity
                    key={a.key}
                    style={[styles.actionChip, isActive && { borderColor: a.color, backgroundColor: a.bg }]}
                    onPress={() => setAction(a.key)}
                  >
                    <Ionicons name={a.icon} size={16} color={isActive ? a.color : thannigoPalette.neutral} />
                    <Text style={[styles.actionChipText, isActive && { color: a.color }]}>{a.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.inputGroup}>
               <Text style={styles.fieldLabel}>Quantity Units</Text>
               <View style={styles.inputWrapper}>
                  <Ionicons name="layers-outline" size={20} color={SHOP_ACCENT} style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 10"
                    placeholderTextColor="#94a3b8"
                    value={qty}
                    onChangeText={setQty}
                    keyboardType="numeric"
                    maxLength={4}
                  />
               </View>
            </View>

            <View style={styles.inputGroup}>
               <Text style={styles.fieldLabel}>Note (Optional)</Text>
               <View style={[styles.inputWrapper, { height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
                  <TextInput
                    style={[styles.input, { height: 80 }]}
                    placeholder="Provide a reason or reference number..."
                    placeholderTextColor="#94a3b8"
                    value={note}
                    onChangeText={setNote}
                    multiline
                    textAlignVertical="top"
                  />
               </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setModalVisible(false)} disabled={submitting}>
                <Text style={styles.cancelModalBtnText}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.7 }]} onPress={handleUpdate} disabled={submitting}>
                <LinearGradient colors={SHOP_GRAD} style={styles.submitBtnGrad}>
                  {submitting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                      <Text style={styles.submitBtnText}>Post Adjustment</Text>
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

  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 18, 
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderBottomColor: thannigoPalette.borderSoft,
    ...Shadow.xs 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: thannigoPalette.neutral, fontWeight: '600', marginTop: 2 },
  notifBtnSub: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: SHOP_SURF,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  statBox: { flex: 1, padding: 16, borderRadius: Radius.xl, alignItems: 'center', ...Shadow.xs },
  statIconBox: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },

  alertBanner: { paddingHorizontal: 20, marginVertical: 10 },
  alertGrad: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: Radius.lg, borderWidth: 1, borderColor: '#ffe082' },
  alertText: { fontSize: 13, color: '#b45309', fontWeight: '700', flex: 1 },

  content: { paddingBottom: 40 },
  sectionHeader: { paddingHorizontal: 20, paddingVertical: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: thannigoPalette.neutral, letterSpacing: 1.2, textTransform: 'uppercase' },

  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyIconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: SHOP_SURF, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: thannigoPalette.darkText },
  emptySub: { fontSize: 14, color: thannigoPalette.neutral, textAlign: 'center', marginTop: 8, lineHeight: 22, fontWeight: '500' },

  itemCard: { 
    backgroundColor: 'white', 
    borderRadius: Radius.xl, 
    padding: 20, 
    marginHorizontal: 20,
    marginBottom: 16,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: thannigoPalette.borderSoft 
  },
  itemCardLow: { borderLeftWidth: 6, borderLeftColor: thannigoPalette.error },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  itemIcon: { width: 52, height: 52, borderRadius: Radius.lg, backgroundColor: SHOP_SURF, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 18, fontWeight: '900', color: thannigoPalette.darkText },
  itemUpdated: { fontSize: 12, color: thannigoPalette.neutral, fontWeight: '600' },
  lowBadge: { backgroundColor: thannigoPalette.error + '15', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  lowBadgeText: { fontSize: 10, fontWeight: '900', color: thannigoPalette.error, letterSpacing: 0.5 },

  canRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  canStat: { alignItems: 'center', flex: 1 },
  canCount: { fontSize: 24, fontWeight: '900' },
  canLabel: { fontSize: 10, color: thannigoPalette.neutral, fontWeight: '800', marginTop: 4, letterSpacing: 0.5 },
  updateBtn: { flex: 1.2, height: 48, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  updateBtnGrad: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  updateBtnText: { fontSize: 14, fontWeight: '800', color: 'white' },

  logsCard: { 
    backgroundColor: 'white', 
    borderRadius: Radius.xl, 
    marginHorizontal: 20,
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: thannigoPalette.borderSoft 
  },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  logDivider: { borderBottomWidth: 1, borderBottomColor: thannigoPalette.borderSoft },
  logIcon: { width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  logText: { fontSize: 14, fontWeight: '800', color: thannigoPalette.darkText },
  logAction: { fontSize: 11, fontWeight: '700', color: thannigoPalette.neutral, textTransform: 'uppercase', marginTop: 2 },
  logNote: { fontSize: 12, color: thannigoPalette.neutral, marginTop: 4, fontStyle: 'italic' },
  logQty: { fontSize: 18, fontWeight: '900' },
  logDate: { fontSize: 11, color: thannigoPalette.neutral, marginTop: 4, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,40,80,0.5)', justifyContent: 'flex-end' },
  modalSheet: { 
    backgroundColor: 'white', 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    padding: 24, 
    paddingBottom: 40,
    ...Shadow.lg 
  },
  modalPill: { width: 44, height: 5, borderRadius: Radius.full, backgroundColor: thannigoPalette.borderSoft, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5 },
  modalSub: { fontSize: 15, fontWeight: '600', color: thannigoPalette.neutral, marginTop: 4 },
  closeModalBtn: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: thannigoPalette.background, alignItems: 'center', justifyContent: 'center' },

  fieldLabel: { fontSize: 12, fontWeight: '900', color: thannigoPalette.neutral, marginBottom: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  actionChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: Radius.lg, 
    borderWidth: 2, 
    borderColor: thannigoPalette.borderSoft,
    backgroundColor: thannigoPalette.background 
  },
  actionChipText: { fontSize: 14, fontWeight: '800', color: thannigoPalette.neutral },
  
  inputGroup: { marginBottom: 24 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: thannigoPalette.background, 
    borderRadius: Radius.xl, 
    paddingHorizontal: 18, 
    height: 60, 
    borderWidth: 1, 
    borderColor: thannigoPalette.borderSoft 
  },
  input: { flex: 1, fontSize: 17, fontWeight: '700', color: thannigoPalette.darkText },
  
  modalActions: { flexDirection: 'row', gap: 14, marginTop: 10 },
  cancelModalBtn: { flex: 0.4, paddingVertical: 18, borderRadius: Radius.xl, borderWidth: 1, borderColor: thannigoPalette.borderSoft, alignItems: 'center', justifyContent: 'center' },
  cancelModalBtnText: { fontSize: 15, fontWeight: '800', color: thannigoPalette.neutral },
  submitBtn: { flex: 0.6, borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.sm },
  submitBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: '900' },
});
