import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, RefreshControl, ActivityIndicator, Alert, Modal, TextInput,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/providers/ThemeContext';
import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { apiClient } from '@/api/client';
import Toast from 'react-native-toast-message';

import { Shadow, roleAccent, roleSurface } from '@/constants/theme';

const ADMIN_ACCENT = roleAccent.admin;
const ADMIN_SURF = roleSurface.admin;

type Feature = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  role: string;
  is_free: boolean;
  pricing_type: 'free' | 'plan_only' | 'pay_per_use';
  default_enabled: boolean;
  globally_enabled: boolean;
  category: string | null;
  is_beta: boolean;
};

const PRICING_COLORS: Record<string, { bg: string; text: string }> = {
  free: { bg: '#e8f5e9', text: colors.success },
  plan_only: { bg: ADMIN_SURF, text: ADMIN_ACCENT },
  pay_per_use: { bg: '#fef3c7', text: '#b45309' },
};

export default function AdminFeaturesScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const router = useRouter();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [toggling, setToggling] = useState<number | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editFeature, setEditFeature] = useState<Partial<Feature> | null>(null);
  const [saving, setSaving] = useState(false);

  // Override State
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [targetType, setTargetType] = useState<'user' | 'shop'>('user');
  const [searchQuery, setSearchQuery] = useState('');
  const [targets, setTargets] = useState<any[]>([]);
  const [targetLoading, setTargetLoading] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideEnabled, setOverrideEnabled] = useState(true);

  const fetchFeatures = useCallback(async () => {
    try {
      const res = await apiClient.get('/admin/features');
      if (res.data?.status === 1) setFeatures(res.data.data ?? []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load features' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchFeatures(); }, [fetchFeatures]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 2) handleSearch();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = async () => {
    setTargetLoading(true);
    try {
      const endpoint = targetType === 'user' ? '/admin/users' : '/admin/vendors';
      const res = await apiClient.get(`${endpoint}?q=${searchQuery}`);
      if (res.data?.status === 1) setTargets(res.data.data ?? []);
    } catch {
      Toast.show({ type: 'error', text1: 'Search failed' });
    } finally {
      setTargetLoading(false);
    }
  };

  const handleSetOverride = async () => {
    if (!selectedTarget || !editFeature?.id) {
      Toast.show({ type: 'error', text1: 'Target and Feature required' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        feature_id: editFeature.id,
        [targetType === 'user' ? 'user_id' : 'shop_id']: selectedTarget.id,
        is_enabled: overrideEnabled,
        reason: overrideReason,
      };
      const res = await apiClient.post('/admin/features/overrides', payload);
      if (res.data?.status === 1) {
        Toast.show({ type: 'success', text1: 'Override granted' });
        setShowOverrideModal(false);
        setSearchQuery('');
        setTargets([]);
        setSelectedTarget(null);
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Override failed', text2: e?.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!editFeature?.key || !editFeature?.name) {
      Toast.show({ type: 'error', text1: 'Key and name required' });
      return;
    }
    setSaving(true);
    try {
      const res = editFeature.id 
        ? await apiClient.put(`/admin/features/${editFeature.id}`, editFeature)
        : await apiClient.post('/admin/features', editFeature);

      if (res.data?.status === 1) {
        Toast.show({ type: 'success', text1: editFeature.id ? 'Feature updated' : 'Feature created' });
        setShowModal(false);
        setEditFeature(null);
        fetchFeatures();
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Save failed', text2: e?.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (feature: Feature, enabled: boolean) => {
    setToggling(feature.id);
    try {
      const res = await apiClient.patch(`/admin/features/${feature.id}/toggle`, { enabled });
      if (res.data?.status === 1) {
        setFeatures((prev) =>
          prev.map((f) => f.id === feature.id ? { ...f, globally_enabled: enabled } : f)
        );
        Toast.show({
          type: 'success',
          text1: enabled ? 'Feature Enabled' : 'Feature Disabled',
          text2: `"${feature.name}" is now ${enabled ? 'globally enabled' : 'disabled for everyone'}`,
        });
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Toggle failed', text2: e?.message });
    } finally {
      setToggling(null);
    }
  };

  const CATEGORIES = ['all', ...Array.from(new Set(features.map((f) => f.category ?? 'general')))];

  const filtered = filter === 'all'
    ? features
    : features.filter((f) => (f.category ?? 'general') === filter);

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={20} color={ADMIN_ACCENT} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.pageTitle}>Feature Flags</Text>
              <Text style={styles.headerSub}>{features.length} operational features</Text>
            </View>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => {
                setEditFeature({
                  name: '', key: '', description: '', role: 'both',
                  pricing_type: 'free', is_free: true, default_enabled: true,
                  globally_enabled: true, category: 'general', is_beta: false
                });
                setShowModal(true);
              }}
            >
              <Ionicons name="add" size={24} color={ADMIN_ACCENT} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <View style={[styles.tabBarWrap, isDesktop && { alignItems: 'center' }]}>
        <View style={{ width: '100%', maxWidth: 1200 }}>
          {/* CATEGORY TABS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.tab, filter === cat && styles.tabActive]}
                onPress={() => setFilter(cat)}
              >
                <Text style={[styles.tabText, filter === cat && styles.tabTextActive]}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFeatures(); }} colors={[ADMIN_ACCENT]} />}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { alignItems: 'center', paddingBottom: 100 }]}
      >
        <View style={{ width: '100%', maxWidth: 1200 }}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={ADMIN_ACCENT} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="toggle-outline" size={56} color="#94a3b8" />
            <Text style={styles.emptyText}>No features found</Text>
          </View>
        ) : filtered.map((feature) => {
          const pColor = PRICING_COLORS[feature.pricing_type] ?? PRICING_COLORS.free;
          return (
            <View key={feature.id} style={styles.featureCard}>
              <View style={styles.featureTop}>
                <View style={styles.featureInfo}>
                  <View style={styles.featureNameRow}>
                    <Text style={styles.featureName}>{feature.name}</Text>
                    {feature.is_beta && (
                      <View style={styles.betaBadge}><Text style={styles.betaText}>BETA</Text></View>
                    )}
                  </View>
                  <Text style={styles.featureKey}>{feature.key}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity 
                    onPress={() => { 
                      setEditFeature({ ...feature }); 
                      setTargetType(feature.role === 'shop_owner' ? 'shop' : 'user');
                      setShowOverrideModal(true); 
                    }}
                    style={styles.actionBtn}
                  >
                    <Ionicons name="shield-checkmark-outline" size={18} color={ADMIN_ACCENT} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setEditFeature({ ...feature }); setShowModal(true); }}>
                    <Ionicons name="settings-outline" size={20} color="#64748b" />
                  </TouchableOpacity>
                  {toggling === feature.id ? (
                    <ActivityIndicator size="small" color={ADMIN_ACCENT} />
                  ) : (
                    <Switch
                      value={feature.globally_enabled}
                      onValueChange={(val) => {
                        Alert.alert(
                          val ? 'Enable Feature?' : 'Disable Feature?',
                          `"${feature.name}" will be ${val ? 'enabled for all eligible users' : 'disabled globally — even paid plan users lose access'}`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: val ? 'Enable' : 'Disable', onPress: () => handleToggle(feature, val) },
                          ]
                        );
                      }}
                      trackColor={{ false: colors.border, true: '#bbf7d0' }}
                      thumbColor={feature.globally_enabled ? '#16a34a' : '#94a3b8'}
                    />
                  )}
                </View>
              </View>

              {feature.description && (
                <Text style={styles.featureDesc}>{feature.description}</Text>
              )}

              <View style={styles.featureTags}>
                <View style={[styles.featureTag, { backgroundColor: pColor.bg }]}>
                  <Text style={[styles.featureTagText, { color: pColor.text }]}>
                    {feature.pricing_type.replace('_', ' ')}
                  </Text>
                </View>
                <View style={[styles.featureTag, { backgroundColor: colors.border }]}>
                  <Text style={styles.featureTagText}>{feature.role}</Text>
                </View>
                {feature.category && (
                  <View style={[styles.featureTag, { backgroundColor: '#f0f7ff' }]}>
                    <Text style={[styles.featureTagText, { color: ADMIN_ACCENT }]}>{feature.category}</Text>
                  </View>
                )}
                <View style={[styles.featureTag, { backgroundColor: feature.globally_enabled ? '#e8f5e9' : '#ffebee' }]}>
                  <Text style={[styles.featureTagText, { color: feature.globally_enabled ? colors.success : '#ba1a1a' }]}>
                    {feature.globally_enabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
        </View>
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editFeature?.id ? 'Edit Feature' : 'New Feature'}</Text>
              <TouchableOpacity onPress={() => { setShowModal(false); setEditFeature(null); }}>
                <Ionicons name="close" size={24} color="#181c20" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: 'name', label: 'Display Name', placeholder: 'e.g. Instant Payout' },
                { key: 'key', label: 'Feature Key (unique)', placeholder: 'e.g. instant_payout' },
                { key: 'description', label: 'Description', placeholder: 'Explain what this does' },
                { key: 'category', label: 'Category', placeholder: 'e.g. payment, delivery' },
                { key: 'role', label: 'Role (customer/shop_owner/both)', placeholder: 'both' },
                { key: 'pricing_type', label: 'Pricing (free/subscription/usage)', placeholder: 'free' },
              ].map((field) => (
                <View key={field.key} style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={(editFeature as any)?.[field.key] || ''}
                    onChangeText={(v) => setEditFeature(p => ({ ...p, [field.key]: v }))}
                    placeholder={field.placeholder}
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                  />
                </View>
              ))}

              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>Free Feature</Text>
                  <Text style={styles.switchSub}>Available to all users regardless of plan</Text>
                </View>
                <Switch
                  value={editFeature?.is_free}
                  onValueChange={(v) => setEditFeature(p => ({ ...p, is_free: v, pricing_type: v ? 'free' : 'plan_only' }))}
                />
              </View>
              
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>Is Beta</Text>
                  <Text style={styles.switchSub}>Mark as early access functionality</Text>
                </View>
                <Switch
                  value={editFeature?.is_beta}
                  onValueChange={(v) => setEditFeature(p => ({ ...p, is_beta: v }))}
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <LinearGradient colors={[ADMIN_ACCENT, ADMIN_ACCENT]} style={styles.saveBtnGrad}>
                {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Feature</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* OVERRIDE MODAL */}
      <Modal visible={showOverrideModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Feature Override</Text>
                <Text style={styles.headerSub}>Grant "{editFeature?.name}" to specific {targetType}s</Text>
              </View>
              <TouchableOpacity onPress={() => { setShowOverrideModal(false); setSelectedTarget(null); }}>
                <Ionicons name="close" size={24} color="#181c20" />
              </TouchableOpacity>
            </View>

            <View style={styles.typeSelector}>
              <TouchableOpacity 
                style={[styles.typeOption, targetType === 'user' && styles.typeOptionActive]}
                onPress={() => { setTargetType('user'); setTargets([]); setSearchQuery(''); }}
              >
                <Text style={[styles.typeOptionText, targetType === 'user' && styles.typeOptionActiveText]}>User</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeOption, targetType === 'shop' && styles.typeOptionActive]}
                onPress={() => { setTargetType('shop'); setTargets([]); setSearchQuery(''); }}
              >
                <Text style={[styles.typeOptionText, targetType === 'shop' && styles.typeOptionActiveText]}>Shop</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search for ${targetType} by name or phone...`}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#94a3b8"
              />
              {targetLoading && <ActivityIndicator size="small" color={ADMIN_ACCENT} />}
            </View>

            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              {targets.map(t => (
                <TouchableOpacity 
                  key={t.id} 
                  style={[styles.targetItem, selectedTarget?.id === t.id && styles.targetItemActive]}
                  onPress={() => setSelectedTarget(t)}
                >
                  <View>
                    <Text style={[styles.targetName, selectedTarget?.id === t.id && styles.targetItemActiveText]}>
                      {t.name}
                    </Text>
                    <Text style={styles.targetSub}>{t.phone} • {t.email || 'No email'}</Text>
                  </View>
                  {selectedTarget?.id === t.id && <Ionicons name="checkmark-circle" size={20} color={ADMIN_ACCENT} />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Reason for override</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. VIP Trial, Support case fix"
                value={overrideReason}
                onChangeText={setOverrideReason}
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Enable Feature</Text>
                <Text style={styles.switchSub}>Turn on (Green) or Force Disable (Red)</Text>
              </View>
              <Switch value={overrideEnabled} onValueChange={setOverrideEnabled} />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, (!selectedTarget || saving) && { opacity: 0.6 }]}
              onPress={handleSetOverride}
              disabled={!selectedTarget || saving}
            >
              <LinearGradient colors={[ADMIN_ACCENT, ADMIN_ACCENT]} style={styles.saveBtnGrad}>
                {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Grant Access</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerSafe: { 
    backgroundColor: colors.surface, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border,
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
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: colors.muted, fontWeight: '500', marginTop: 2 },

  addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  
  tabBarWrap: { paddingVertical: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabs: { paddingHorizontal: 24, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.border },
  tabActive: { backgroundColor: ADMIN_ACCENT },
  tabText: { fontSize: 13, fontWeight: '800', color: colors.muted },
  tabTextActive: { color: 'white' },
  content: { padding: 16, gap: 12 },
  centered: { paddingTop: 80, alignItems: 'center' },
  emptyText: { marginTop: 14, color: colors.muted, fontWeight: '600', fontSize: 15 },
  featureCard: {
    backgroundColor: colors.surface, borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  featureTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  featureInfo: { flex: 1, marginRight: 12 },
  featureNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  featureName: { fontSize: 15, fontWeight: '800', color: colors.text },
  betaBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  betaText: { fontSize: 9, fontWeight: '800', color: '#b45309', letterSpacing: 0.5 },
  featureKey: { fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', fontWeight: '600' },
  featureDesc: { fontSize: 13, color: colors.muted, lineHeight: 18, marginBottom: 10 },
  featureTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  featureTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  featureTagText: { fontSize: 11, fontWeight: '700', color: colors.muted },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.text },
  fieldRow: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  fieldInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text,
  },
  switchRow: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    backgroundColor: colors.background, padding: 12, borderRadius: 12, marginBottom: 10 
  },
  switchLabel: { fontSize: 14, fontWeight: '800', color: colors.text },
  switchSub: { fontSize: 11, color: colors.muted, fontWeight: '500' },
  saveBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 16 },
  saveBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
  actionBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f0f7ff', alignItems: 'center', justifyContent: 'center' },
  typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: colors.border, borderWidth: 1, borderColor: '#e2e8f0' },
  typeOptionActive: { backgroundColor: ADMIN_ACCENT, borderColor: ADMIN_ACCENT },
  typeOptionText: { fontSize: 13, fontWeight: '700', color: colors.muted },
  typeOptionActiveText: { color: 'white' },
  searchBox: { 
    flexDirection: 'row', alignItems: 'center', gap: 10, 
    backgroundColor: colors.background, paddingHorizontal: 16, paddingVertical: 12, 
    borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' 
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  targetItem: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 12, borderRadius: 12, marginBottom: 8, backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.border
  },
  targetItemActive: { borderColor: ADMIN_ACCENT, backgroundColor: ADMIN_SURF },
  targetName: { fontSize: 14, fontWeight: '800', color: colors.text },
  targetItemActiveText: { color: ADMIN_ACCENT },
  targetSub: { fontSize: 11, color: colors.muted, fontWeight: '500' },
});
