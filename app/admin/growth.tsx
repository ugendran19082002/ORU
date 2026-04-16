import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Switch, RefreshControl, Modal,
  useWindowDimensions
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { adminApi } from '@/api/adminApi';

export default function AdminGrowthScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [levels, setLevels] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'config' | 'tiers'>('config');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLevel, setEditingLevel] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [sRes, lRes] = await Promise.all([
        adminApi.getGrowthSettings(),
        adminApi.getLoyaltyLevels()
      ]);
      setSettings(sRes.data);
      setLevels(lRes.data);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Fetch Error', text2: 'Failed to load growth engine data' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpdateSettings = async (type: 'loyalty' | 'referral', data: any) => {
    try {
      await adminApi.updateGrowthSettings({ [type]: data });
      Toast.show({ type: 'success', text1: 'Settings Updated' });
      fetchData();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Update Failed' });
    }
  };

  const handleUpdateLevel = async () => {
    if (!editingLevel) return;
    setIsSaving(true);
    try {
      await adminApi.updateLoyaltyLevel(editingLevel.id || 'new', editingLevel);
      Toast.show({ type: 'success', text1: editingLevel.id === 'new' ? 'Tier Created' : 'Tier Updated' });
      setModalVisible(false);
      fetchData();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Update Failed' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ba1a1a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={20} color="#ba1a1a" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.pageTitle}>Growth Engine</Text>
              <Text style={styles.headerSub}>Loyalty & Referral Mechanics</Text>
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={fetchData}>
              <Ionicons name="refresh" size={20} color="#ba1a1a" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { alignItems: 'center', paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
      >
        <View style={{ width: '100%', maxWidth: 1200 }}>
          {/* TABS */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'config' && styles.tabActive]}
              onPress={() => setActiveTab('config')}
            >
              <Text style={[styles.tabText, activeTab === 'config' && styles.tabTextActive]}>Configuration</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'tiers' && styles.tabActive]}
              onPress={() => setActiveTab('tiers')}
            >
              <Text style={[styles.tabText, activeTab === 'tiers' && styles.tabTextActive]}>Loyalty Tiers</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'config' && settings && (
            <>
              {/* LOYALTY SECTION */}
              <View style={styles.sectionHeader}>
                <Ionicons name="ribbon-outline" size={20} color="#ba1a1a" />
                <Text style={styles.sectionTitle}>Loyalty Settings (Phase 1)</Text>
              </View>
              <View style={styles.card}>
                <ConfigItem
                  label="Earn Rate (Points per ₹1)"
                  value={settings.loyalty.earn_points_per_rupee.toString()}
                  onChange={(v: string) => handleUpdateSettings('loyalty', { earn_points_per_rupee: parseFloat(v) })}
                  keyboardType="numeric"
                  helper="e.g. 0.1 = 1 point per ₹10 spent"
                />
                <ConfigItem
                  label="Redeem Ratio (Points per ₹1)"
                  value={settings.loyalty.points_to_currency_ratio.toString()}
                  onChange={(v: string) => handleUpdateSettings('loyalty', { points_to_currency_ratio: parseFloat(v) })}
                  keyboardType="numeric"
                  helper="e.g. 10 = ₹1 discount for every 10 points"
                />
                <ConfigItem
                  label="Min Order for Redeem (₹)"
                  value={settings.loyalty.min_order_amount_for_redeem.toString()}
                  onChange={(v: string) => handleUpdateSettings('loyalty', { min_order_amount_for_redeem: parseFloat(v) })}
                  keyboardType="numeric"
                />
                <ConfigItem
                  label="New Shop Bonus Points"
                  value={settings.loyalty.new_shop_bonus_points.toString()}
                  onChange={(v: string) => handleUpdateSettings('loyalty', { new_shop_bonus_points: parseInt(v) })}
                  keyboardType="numeric"
                  helper="Bonus pts for first order ever at a specific shop"
                />
                <ConfigItem
                  label="Repeat Patron Boost (%)"
                  value={settings.loyalty.repeat_order_bonus_percentage.toString()}
                  onChange={(v: string) => handleUpdateSettings('loyalty', { repeat_order_bonus_percentage: parseInt(v) })}
                  keyboardType="numeric"
                  helper="Extra points multiplier after 5+ shop orders"
                />
              </View>

              {/* REFERRAL SECTION */}
              <View style={styles.sectionHeader}>
                <Ionicons name="people-outline" size={20} color="#ba1a1a" />
                <Text style={styles.sectionTitle}>Referral Rewards (Admin Funded)</Text>
              </View>
              <View style={styles.card}>
                <ConfigItem
                  label="Signup Bonus (PTS)"
                  value={settings.referral.signup_bonus_points.toString()}
                  onChange={(v: string) => handleUpdateSettings('referral', { signup_bonus_points: parseInt(v) })}
                  keyboardType="numeric"
                />
                <ConfigItem
                  label="First Order (Referrer) (PTS)"
                  value={settings.referral.first_order_bonus_referrer.toString()}
                  onChange={(v: string) => handleUpdateSettings('referral', { first_order_bonus_referrer: parseInt(v) })}
                  keyboardType="numeric"
                />
                <ConfigItem
                  label="First Order (Referee) (PTS)"
                  value={settings.referral.first_order_bonus_referee.toString()}
                  onChange={(v: string) => handleUpdateSettings('referral', { first_order_bonus_referee: parseInt(v) })}
                  keyboardType="numeric"
                />
                <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Enable Daily Caps</Text>
                    <Switch 
                      value={settings.referral.status === 'active'} 
                      onValueChange={(val) => handleUpdateSettings('referral', { status: val ? 'active' : 'inactive' })}
                    />
                </View>
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={18} color="#ba1a1a" />
                <Text style={styles.infoText}>
                  Note: All loyalty points issued currently are Admin-Funded. Payouts to shops are NOT reduced when customers use these points.
                </Text>
              </View>
            </>
          )}

          {activeTab === 'tiers' && (
            <View style={{ gap: 12 }}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trophy-outline" size={20} color="#ba1a1a" />
                <Text style={styles.sectionTitle}>Platform Tiers</Text>
                <TouchableOpacity 
                  style={styles.addBtn}
                  onPress={() => {
                    setEditingLevel({ 
                      level_number: (levels.length + 1), 
                      name: '', 
                      min_points: 0, 
                      max_points: 0, 
                      discount_percent: 0,
                      status: 'active' 
                    });
                    setModalVisible(true);
                  }}
                >
                  <Ionicons name="add" size={20} color="#ba1a1a" />
                </TouchableOpacity>
              </View>
              {levels.map((level) => (
                <TouchableOpacity 
                  key={level.id} 
                  style={styles.tierCard} 
                  onPress={() => {
                    setEditingLevel(level);
                    setModalVisible(true);
                  }}
                >
                  <View style={styles.tierMain}>
                    <Text style={styles.tierName}>{level.name}</Text>
                    <Text style={styles.tierReq}>{level.min_points} - {level.max_points} pts</Text>
                  </View>
                  <View style={styles.tierBenefit}>
                     <Text style={styles.tierDiscount}>{level.discount_percent}% OFF</Text>
                     <Text style={styles.tierSub}>Auto-Coupon</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingLevel?.id ? 'Edit Tier' : 'New Tier'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1a1c1e" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalForm}>
              <ConfigItem 
                label="Tier Name" 
                value={editingLevel?.name || ''} 
                onChange={(v: string) => setEditingLevel({...editingLevel, name: v})} 
              />
              <ConfigItem 
                label="Min Points" 
                value={editingLevel?.min_points?.toString() || '0'} 
                onChange={(v: string) => setEditingLevel({...editingLevel, min_points: parseInt(v)})} 
                keyboardType="numeric"
              />
              <ConfigItem 
                label="Max Points" 
                value={editingLevel?.max_points?.toString() || '0'} 
                onChange={(v: string) => setEditingLevel({...editingLevel, max_points: parseInt(v)})} 
                keyboardType="numeric"
              />
              <ConfigItem 
                label="Discount (%)" 
                value={editingLevel?.discount_percent?.toString() || '0'} 
                onChange={(v: string) => setEditingLevel({...editingLevel, discount_percent: parseInt(v)})} 
                keyboardType="numeric"
              />
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Active Tier</Text>
                <Switch 
                  value={editingLevel?.status === 'active'} 
                  onValueChange={(val) => setEditingLevel({...editingLevel, status: val ? 'active' : 'inactive'})}
                />
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.saveBtn, isSaving && { opacity: 0.7 }]} 
              onPress={handleUpdateLevel}
              disabled={isSaving}
            >
              {isSaving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ConfigItem({ label, value, onChange, keyboardType = 'default', helper }: any) {
  const [localVal, setLocalVal] = useState(value);
  useEffect(() => { setLocalVal(value); }, [value]);

  return (
    <View style={styles.configItem}>
      <Text style={styles.configLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={localVal}
          onChangeText={setLocalVal}
          onBlur={() => localVal !== value && onChange(localVal)}
          keyboardType={keyboardType}
        />
      </View>
      {helper && <Text style={styles.helperText}>{helper}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerSafe: { 
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9',
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
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 28, fontWeight: '900', color: '#1a1c1e', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#64748b', fontWeight: '600', marginTop: 2 },
  refreshBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },

  scrollContent: { padding: 20 },
  tabRow: {
    flexDirection: 'row', backgroundColor: '#f1f4f9', borderRadius: 14, padding: 4, marginBottom: 25,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  tabText: { fontSize: 14, fontWeight: '700', color: '#707881' },
  tabTextActive: { color: '#ba1a1a' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1a1c1e' },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#ebeef4' },
  configItem: { marginBottom: 16 },
  configLabel: { fontSize: 13, fontWeight: '700', color: '#707881', marginBottom: 8 },
  inputWrap: { backgroundColor: '#f1f4f9', borderRadius: 12, borderWidth: 1, borderColor: '#e1e3e8' },
  input: { paddingHorizontal: 15, paddingVertical: 12, fontSize: 15, fontWeight: '600', color: '#1a1c1e' },
  helperText: { fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: '500' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: '#1a1c1e' },
  infoBox: { flexDirection: 'row', gap: 10, backgroundColor: '#ffdad6', borderRadius: 15, padding: 15, marginBottom: 25 },
  infoText: { flex: 1, fontSize: 12, color: '#ba1a1a', lineHeight: 18, fontWeight: '600' },
  tierCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'white', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#ebeef4',
    marginBottom: 10,
  },
  tierMain: { flex: 1 },
  tierName: { fontSize: 16, fontWeight: '900', color: '#1a1c1e', marginBottom: 2 },
  tierReq: { fontSize: 12, color: '#707881', fontWeight: '600' },
  tierBenefit: { alignItems: 'flex-end' },
  tierDiscount: { fontSize: 18, fontWeight: '900', color: '#ba1a1a' },
  tierSub: { fontSize: 10, color: '#94a3b8', fontWeight: '700', letterSpacing: 0.5 },
  addBtn: { marginLeft: 'auto', backgroundColor: '#f1f5f9', width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1a1c1e' },
  modalForm: { marginBottom: 20 },
  saveBtn: { backgroundColor: '#ba1a1a', paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
});


