import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { platformSubscriptionApi, PlatformPlan } from '@/api/platformSubscriptionApi';
import { apiClient } from '@/api/client';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

import { useWindowDimensions } from 'react-native';

const ROLE_COLORS: Record<string, string> = {
  customer: '#ba1a1a', shop_owner: '#cc6600', delivery: '#7c3aed', admin: '#ba1a1a',
};

const NUMERIC_KEYS = new Set(['price_monthly', 'price_yearly', 'auto_discount_pct', 'monthly_coupon_count',
  'monthly_coupon_value', 'loyalty_boost_pct', 'free_delivery_count', 'commission_rate']);

const parseFieldValue = (key: string, value: string): string | number =>
  NUMERIC_KEYS.has(key) ? Number(value) : value;

export default function AdminPlansScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const router = useRouter();
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState<Partial<PlatformPlan> | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await platformSubscriptionApi.listPlans();
      setPlans(res);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load plans' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const handleSave = async () => {
    if (!editPlan?.name || !editPlan?.slug) {
      Toast.show({ type: 'error', text1: 'Name and slug are required' });
      return;
    }
    setSaving(true);
    try {
      if (editPlan.id) {
        await apiClient.put(`/admin/plans/${editPlan.id}`, editPlan);
      } else {
        await apiClient.post('/admin/plans', editPlan);
      }
      Toast.show({ type: 'success', text1: editPlan.id ? 'Plan updated' : 'Plan created' });
      setShowModal(false);
      setEditPlan(null);
      fetchPlans();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Save failed', text2: e?.message });
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setEditPlan({
      name: '', slug: '', role: 'customer', price_monthly: 0,
      free_delivery_count: 0, auto_discount_pct: 0, monthly_coupon_count: 0,
      monthly_coupon_value: 0, loyalty_boost_pct: 0, is_active: true,
    });
    setShowModal(true);
  };

  const openEdit = (plan: PlatformPlan) => {
    setEditPlan({ ...plan });
    setShowModal(true);
  };

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
              <Text style={styles.pageTitle}>Plans</Text>
              <Text style={styles.headerSub}>{plans.length} total configurations</Text>
            </View>
            <TouchableOpacity style={styles.addBtnHeader} onPress={openCreate}>
              <Ionicons name="add" size={24} color="#ba1a1a" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPlans(); }} colors={['#ba1a1a']} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { alignItems: 'center' }]}
      >
        <View style={{ width: '100%', maxWidth: 1200 }}>
        {loading ? (
          <View style={styles.centered}><ActivityIndicator size="large" color="#ba1a1a" /></View>
        ) : plans.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="card-outline" size={56} color="#94a3b8" />
            <Text style={styles.emptyText}>No plans yet. Tap + to create one.</Text>
          </View>
        ) : (
          plans.map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              <View style={styles.planTop}>
                <View style={[styles.planIcon, { backgroundColor: (ROLE_COLORS[plan.role || 'customer'] ?? '#ba1a1a') + '18' }]}>
                  <Ionicons name="card-outline" size={22} color={ROLE_COLORS[plan.role || 'customer'] ?? '#ba1a1a'} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.planNameRow}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: plan.is_active ? '#e8f5e9' : '#ffebee' }]}>
                      <Text style={[styles.statusText, { color: plan.is_active ? '#2e7d32' : '#c62828' }]}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.planSlug}>{plan.slug}</Text>
                </View>
                <TouchableOpacity onPress={() => openEdit(plan)} style={styles.editBtn}>
                  <Ionicons name="pencil-outline" size={18} color="#ba1a1a" />
                </TouchableOpacity>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.price}>₹{plan.price_monthly}<Text style={styles.pricePeriod}>/mo</Text></Text>
                {plan.price_yearly && (
                  <Text style={styles.priceYearly}>₹{plan.price_yearly}/yr</Text>
                )}
              </View>

              <View style={styles.benefitsGrid}>
                {[
                  { icon: 'bicycle-outline', label: 'Free deliveries', value: plan.free_delivery_count === 0 ? 'Unlimited' : String(plan.free_delivery_count) },
                  { icon: 'pricetag-outline', label: 'Auto discount', value: `${plan.auto_discount_pct}%` },
                  { icon: 'ticket-outline', label: 'Coupons/mo', value: String(plan.monthly_coupon_count) },
                  { icon: 'ribbon-outline', label: 'Loyalty boost', value: `${plan.loyalty_boost_pct}%` },
                ].map((b) => (
                  <View key={b.label} style={styles.benefitItem}>
                    <Ionicons name={b.icon as any} size={16} color="#ba1a1a" />
                    <View>
                      <Text style={styles.benefitLabel}>{b.label}</Text>
                      <Text style={styles.benefitValue}>{b.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
        </View>
      </ScrollView>

      {/* EDIT / CREATE MODAL */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editPlan?.id ? 'Edit Plan' : 'New Plan'}</Text>
              <TouchableOpacity onPress={() => { setShowModal(false); setEditPlan(null); }}>
                <Ionicons name="close" size={24} color="#181c20" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: 'name', label: 'Plan Name', placeholder: 'e.g. Plus' },
                { key: 'slug', label: 'Slug', placeholder: 'e.g. plus' },
                { key: 'category', label: 'Category (customer/shop)', placeholder: 'customer' },
                { key: 'role', label: 'Role (customer/shop_owner)', placeholder: 'customer' },
                { key: 'price_monthly', label: 'Monthly Price (₹)', placeholder: '99' },
                // Customer specific
                { key: 'auto_discount_pct', label: 'Auto Discount %', placeholder: '2' },
                { key: 'monthly_coupon_count', label: 'Coupons / Month', placeholder: '3' },
                { key: 'loyalty_boost_pct', label: 'Loyalty Boost %', placeholder: '10' },
                // Shop specific
                { key: 'commission_rate', label: 'Commission Rate %', placeholder: '5' },
              ].map((field) => (
                <View key={field.key} style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={String((editPlan as any)?.[field.key] ?? '')}
                    onChangeText={(v) => setEditPlan((p) => ({ ...p, [field.key]: parseFieldValue(field.key, v) }))}
                    placeholder={field.placeholder}
                    keyboardType={field.key === 'name' || field.key === 'slug' || field.key === 'category' || field.key === 'role' ? 'default' : 'numeric'}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              ))}
              
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Priority Listing</Text>
                <TouchableOpacity 
                   onPress={() => setEditPlan(p => ({ ...p, is_priority_listing: !p?.is_priority_listing }))}
                   style={[styles.toggleBtn, editPlan?.is_priority_listing && styles.toggleBtnActive]}
                >
                   <Text style={[styles.toggleBtnText, editPlan?.is_priority_listing && styles.toggleBtnActiveText]}>
                      {editPlan?.is_priority_listing ? 'Enabled' : 'Disabled'}
                   </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <LinearGradient colors={['#ba1a1a', '#e32424']} style={styles.saveBtnGrad}>
                {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Plan</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },

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
  pageTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#64748b', fontWeight: '600', marginTop: 2 },
  addBtnHeader: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },

  content: { padding: 16, paddingBottom: 100 },
  centered: { paddingTop: 80, alignItems: 'center' },
  emptyText: { marginTop: 14, color: '#64748b', fontWeight: '600', fontSize: 15, textAlign: 'center' },
  planCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  planIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  planName: { fontSize: 17, fontWeight: '900', color: '#181c20' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800' },
  planSlug: { fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' },
  editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 14 },
  price: { fontSize: 28, fontWeight: '900', color: '#ba1a1a' },
  pricePeriod: { fontSize: 14, fontWeight: '600', color: '#707881' },
  priceYearly: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  benefitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '47%' },
  benefitLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
  benefitValue: { fontSize: 14, fontWeight: '800', color: '#181c20' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#181c20' },
  fieldRow: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  fieldInput: {
    borderWidth: 1.5, borderColor: '#e0e2e8', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#181c20',
  },
  saveBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 16 },
  saveBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
  toggleBtn: {
    backgroundColor: '#f1f5f9', paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#e0e2e8', alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: '#ffdad6', borderColor: '#ba1a1a' },
  toggleBtnText: { color: '#64748b', fontWeight: '700', fontSize: 15 },
  toggleBtnActiveText: { color: '#ba1a1a' },
});
