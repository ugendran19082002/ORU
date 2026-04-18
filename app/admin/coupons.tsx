import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, RefreshControl, Switch
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/providers/ThemeContext';
import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { adminApi } from '@/api/adminApi';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Shadow, roleAccent, roleSurface } from '@/constants/theme';

const ADMIN_ACCENT = roleAccent.admin;
const ADMIN_SURF = roleSurface.admin;

export default function AdminCouponsScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  // Form State
  const [newCode, setNewCode] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newMinOrder, setNewMinOrder] = useState('0');
  const [newType, setNewType] = useState('percentage');
  const [expiryDate, setExpiryDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await adminApi.listPlatformCoupons();
      setCoupons(res.data);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Fetch Error', text2: 'Failed to load platform coupons' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!newCode || !newValue) {
      Toast.show({ type: 'error', text1: 'Required', text2: 'Code and Value are mandatory' });
      return;
    }
    try {
      await adminApi.createPlatformCoupon({
        code: newCode.toUpperCase(),
        type: newType,
        discount_value: parseFloat(newValue),
        min_order_value: parseFloat(newMinOrder),
        valid_from: new Date().toISOString(),
        valid_until: expiryDate.toISOString(),
      });
      Toast.show({ type: 'success', text1: 'Coupon Created' });
      setShowCreate(false);
      setNewCode(''); setNewValue('');
      fetchData();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Creation Failed' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminApi.deletePlatformCoupon(id);
      Toast.show({ type: 'success', text1: 'Coupon Deleted' });
      fetchData();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Delete Failed' });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ADMIN_ACCENT} />
      </View>
    );
  }

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
              <Text style={styles.pageTitle}>Platform Coupons</Text>
              <Text style={styles.headerSub}>Manage global discount codes</Text>
            </View>
            <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
               <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { alignItems: 'center', paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
      >
        <View style={{ width: '100%', maxWidth: 1200 }}>
        <View style={styles.infoBox}>
           <Ionicons name="megaphone-outline" size={20} color={ADMIN_ACCENT} />
           <Text style={styles.infoText}>
             Platform coupons are valid across ALL shops. The discount is funded by ThanniGo and will NOT impact merchant payouts.
           </Text>
        </View>

        {showCreate && (
          <View style={styles.createCard}>
             <Text style={styles.createTitle}>Issue Global Discount</Text>
             
             <Text style={styles.label}>CODE</Text>
             <TextInput 
                style={styles.input} 
                placeholder="PROMO20" 
                value={newCode} 
                onChangeText={setNewCode} 
                autoCapitalize="characters"
             />

             <View style={styles.row}>
                <View style={{ flex: 1 }}>
                   <Text style={styles.label}>DISCOUNT VALUE</Text>
                   <TextInput 
                      style={styles.input} 
                      placeholder="20" 
                      value={newValue} 
                      onChangeText={setNewValue} 
                      keyboardType="numeric"
                   />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                   <Text style={styles.label}>TYPE</Text>
                   <View style={styles.row}>
                      <TouchableOpacity 
                        style={[styles.typeBtn, newType === 'percentage' && styles.typeBtnActive]} 
                        onPress={() => setNewType('percentage')}
                      >
                        <Text style={[styles.typeBtnText, newType === 'percentage' && styles.typeBtnTextActive]}>%</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.typeBtn, newType === 'fixed' && styles.typeBtnActive, { marginLeft: 8 }]} 
                        onPress={() => setNewType('fixed')}
                      >
                        <Text style={[styles.typeBtnText, newType === 'fixed' && styles.typeBtnTextActive]}>₹</Text>
                      </TouchableOpacity>
                   </View>
                </View>
             </View>

             <Text style={styles.label}>EXPIRY DATE</Text>
             <TouchableOpacity style={styles.datePicker} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateText}>{expiryDate.toLocaleDateString()}</Text>
                <Ionicons name="calendar-outline" size={18} color={ADMIN_ACCENT} />
             </TouchableOpacity>

             {showDatePicker && (
               <DateTimePicker
                 value={expiryDate}
                 mode="date"
                 minimumDate={new Date()}
                 onChange={(e, d) => { setShowDatePicker(false); if (d) setExpiryDate(d); }}
               />
             )}

             <View style={[styles.row, { marginTop: 12 }]}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
                    <Text style={styles.saveBtnText}>Issue Promo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
             </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Active Promotions</Text>
        {coupons.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="ticket-outline" size={48} color="#ebeef4" />
            <Text style={styles.emptyText}>No active platform coupons</Text>
          </View>
        )}

        {coupons.map((coupon) => (
          <View key={coupon.id} style={styles.couponCard}>
             <View style={styles.couponTop}>
                <View style={styles.codeWrap}>
                   <Text style={styles.code}>{coupon.code}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                   <Text style={styles.value}>{coupon.discount_value}{coupon.type === 'percentage' ? '%' : '₹'} OFF</Text>
                   <Text style={styles.expiry}>Valid until {new Date(coupon.valid_until).toLocaleDateString()}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(coupon.id)}>
                   <Ionicons name="trash-outline" size={20} color="#ffdad6" />
                </TouchableOpacity>
             </View>
             <View style={styles.progressRow}>
                <View style={styles.track}>
                   <View style={[styles.fill, { width: `${Math.min((coupon.used_count / coupon.max_uses) * 100, 100)}%` }]} />
                </View>
                <Text style={styles.counter}>{coupon.used_count}/{coupon.max_uses}</Text>
             </View>
          </View>
        ))}
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  headerSub: { fontSize: 13, color: colors.muted, fontWeight: '600', marginTop: 2 },

  createBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: ADMIN_ACCENT, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 20 },
  infoBox: { flexDirection: 'row', gap: 10, backgroundColor: ADMIN_SURF, borderRadius: 15, padding: 15, marginBottom: 25, borderWidth: 1, borderColor: ADMIN_SURF },
  infoText: { flex: 1, fontSize: 12, color: ADMIN_ACCENT, lineHeight: 18, fontWeight: '600' },
  createCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  createTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', color: colors.muted, marginBottom: 6 },
  input: { backgroundColor: colors.border, borderRadius: 12, padding: 12, fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  typeBtn: { flex: 1, height: 44, borderRadius: 10, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  typeBtnActive: { backgroundColor: ADMIN_ACCENT },
  typeBtnText: { fontWeight: '700', color: colors.muted },
  typeBtnTextActive: { color: 'white' },
  datePicker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.border, borderRadius: 12, padding: 12, marginBottom: 12 },
  dateText: { fontSize: 15, fontWeight: '600', color: colors.text },
  saveBtn: { flex: 2, height: 50, borderRadius: 15, backgroundColor: ADMIN_ACCENT, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 15 },
  cancelBtn: { flex: 1, height: 50, borderRadius: 15, marginLeft: 12, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { color: colors.muted, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 12 },
  couponCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  couponTop: { flexDirection: 'row', alignItems: 'center' },
  codeWrap: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.border, borderRadius: 6 },
  code: { fontSize: 14, fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  value: { fontSize: 15, fontWeight: '800', color: ADMIN_ACCENT },
  expiry: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  track: { flex: 1, height: 4, backgroundColor: colors.border, borderRadius: 2 },
  fill: { height: '100%', backgroundColor: ADMIN_ACCENT, borderRadius: 2 },
  counter: { fontSize: 11, color: colors.muted, fontWeight: '700' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { marginTop: 12, color: '#94a3b8', fontWeight: '600' },
});


