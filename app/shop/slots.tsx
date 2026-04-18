import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, TextInput,
  useWindowDimensions, KeyboardAvoidingView, Platform,Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/providers/ThemeContext';
import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '@/components/ui/Logo';
import { BackButton } from '@/components/ui/BackButton';
import { shopApi } from '@/api/shopApi';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

import { Shadow, roleAccent, roleSurface, roleGradients } from '@/constants/theme';

const SHOP_ACCENT = roleAccent.shop_owner;
const SHOP_SURF = roleSurface.shop_owner;
const SHOP_GRAD: [string, string] = [roleGradients.shop_owner.start, roleGradients.shop_owner.end];

const DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

interface DeliverySlot {
  id?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_orders: number;
  is_active: boolean;
}

export default function ShopSlotsScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  
  const [currentSlot, setCurrentSlot] = useState<DeliverySlot>({
    day_of_week: 1,
    start_time: '09:00:00',
    end_time: '11:00:00',
    max_orders: 10,
    is_active: true,
  });
  const [activeTimePicker, setActiveTimePicker] = useState<'start' | 'end' | null>(null);

  const isSmallScreen = width < 380;
  const isShortScreen = height < 700;
  const horizontalPadding = isSmallScreen ? 16 : 24;

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const data = await shopApi.getSlots();
      setSlots(data.map((s: any) => ({
        ...s,
        is_active: s.is_active ?? true
      })));
    } catch (error) {
      console.error('[Slots] Fetch failed:', error);
      Toast.show({ type: 'error', text1: 'Failed to load delivery slots' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditIndex(null);
    setCurrentSlot({
      day_of_week: 1,
      start_time: '09:00:00',
      end_time: '11:00:00',
      max_orders: 10,
      is_active: true
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (index: number) => {
    setIsEditing(true);
    setEditIndex(index);
    setCurrentSlot({ ...slots[index] });
    setShowAddModal(true);
  };

  const handleToggleSlot = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSlots(prev => prev.map((s, i) => 
      i === index ? { ...s, is_active: !s.is_active } : s
    ));
  };

  const handleSaveSlot = () => {
    if (isEditing && editIndex !== null) {
        setSlots(prev => prev.map((s, i) => i === editIndex ? { ...currentSlot } : s));
    } else {
        setSlots(prev => [...prev, { ...currentSlot }]);
    }
    setShowAddModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await shopApi.updateSlots(slots);
      Toast.show({ type: 'success', text1: 'Slots Synced', text2: 'Your delivery windows have been updated.' });
      router.back();
    } catch (error) {
      console.error('[Slots] Save failed:', error);
      Toast.show({ type: 'error', text1: 'Sync Failed' });
    } finally {
      setSaving(false);
    }
  };

  const groupedSlots = DAYS.map((day, index) => ({
    day,
    index,
    daySlots: slots.map((s, i) => ({ ...s, originalIndex: i })).filter(s => s.day_of_week === index)
  }));

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={SHOP_ACCENT} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Screen options={{ headerShown: false }} />

      {/* CUSTOM HEADER */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <BackButton fallback="/shop/settings" />
          <View>
            <View style={styles.brandRow}>
              <Logo size="md" />
              <Text style={styles.brandName}>ThanniGo</Text>
            </View>
            <Text style={styles.roleLabel}>SHOP PANEL</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.notifBtnSub} 
          onPress={() => router.push('/notifications' as any)}
        >
          <Ionicons name="notifications-outline" size={20} color={SHOP_ACCENT} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
      >
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Delivery Slots</Text>
          <View style={styles.actionGroup}>
            <TouchableOpacity style={styles.addBtnSmall} onPress={handleOpenAdd}>
              <Ionicons name="add" size={16} color="white" />
              <Text style={styles.addBtnText}>New</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.saveBtnSmall, saving && { opacity: 0.7 }]} 
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.saveBtnTextSmall}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="bicycle-outline" size={20} color={SHOP_ACCENT} />
          <Text style={[styles.infoText, isSmallScreen && { fontSize: 12 }]}>
            Define delivery windows. Slots can be toggled on/off to pause delivery specific times.
          </Text>
        </View>

        {groupedSlots.map((group) => (
          <View key={group.day} style={styles.dayGroup}>
            <Text style={styles.sectionHeader}>{group.day.toUpperCase()}</Text>
            {group.daySlots.length === 0 ? (
              <Text style={styles.emptyText}>No delivery slots defined</Text>
            ) : (
              group.daySlots.map((slot, i) => (
                <View key={i} style={[styles.slotCard, !slot.is_active && styles.slotCardDisabled]}>
                  <View style={styles.slotInfo}>
                    <Text style={[styles.slotTime, { fontSize: isSmallScreen ? 14 : 15 }, !slot.is_active && { color: '#94a3b8' }]}>
                      {moment(slot.start_time, 'HH:mm:ss').format('hh:mm A')} - {moment(slot.end_time, 'HH:mm:ss').format('hh:mm A')}
                    </Text>
                    <View style={[styles.capacityBadge, !slot.is_active && { backgroundColor: colors.border }]}>
                      <Ionicons name="cube-outline" size={10} color={slot.is_active ? SHOP_ACCENT : "#94a3b8"} style={{ marginRight: 4 }} />
                      <Text style={[styles.capacityText, !slot.is_active && { color: '#94a3b8' }]}>{slot.max_orders} Max Orders</Text>
                    </View>
                  </View>
                  
                  <View style={styles.slotActions}>
                    <TouchableOpacity onPress={() => handleOpenEdit(slot.originalIndex)} style={styles.iconActionBtn}>
                      <Ionicons name="pencil-outline" size={18} color={SHOP_ACCENT} />
                    </TouchableOpacity>
                    <Switch
                      value={slot.is_active}
                      onValueChange={() => handleToggleSlot(slot.originalIndex)}
                      trackColor={{ false: colors.border, true: '#a7edff' }}
                      thumbColor={slot.is_active ? SHOP_ACCENT : colors.muted}
                      style={{ transform: [{ scale: 0.8 }] }}
                    />
                  </View>
                </View>
              ))
            )}
          </View>
        ))}
      </ScrollView>

      {showAddModal && (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { padding: isSmallScreen ? 20 : 24, borderRadius: 24 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Slot' : 'Add Delivery Slot'}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>Select Day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayPicker}>
              {DAYS.map((d, i) => (
                <TouchableOpacity 
                  key={d} 
                  style={[styles.dayItem, currentSlot.day_of_week === i && styles.dayItemActive]}
                  onPress={() => setCurrentSlot({...currentSlot, day_of_week: i})}
                >
                  <Text style={[styles.dayItemText, currentSlot.day_of_week === i && styles.dayItemTextActive]}>{d.slice(0, 3)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={[styles.row, isSmallScreen && { gap: 12 }]}>
              <TouchableOpacity style={styles.timeInputBox} onPress={() => setActiveTimePicker('start')}>
                <Text style={styles.label}>Start Window</Text>
                <Text style={[styles.timeVal, { fontSize: isSmallScreen ? 14 : 15 }]}>{moment(currentSlot.start_time, 'HH:mm:ss').format('hh:mm A')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.timeInputBox} onPress={() => setActiveTimePicker('end')}>
                <Text style={styles.label}>End Window</Text>
                <Text style={[styles.timeVal, { fontSize: isSmallScreen ? 14 : 15 }]}>{moment(currentSlot.end_time, 'HH:mm:ss').format('hh:mm A')}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Max Order Capacity</Text>
            <TextInput 
              style={styles.input}
              value={String(currentSlot.max_orders)}
              onChangeText={(v) => setCurrentSlot({...currentSlot, max_orders: parseInt(v) || 0})}
              keyboardType="numeric"
              placeholder="e.g. 10"
              placeholderTextColor="#94a3b8"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveSlot}>
                <Text style={styles.confirmText}>{isEditing ? 'Update Slot' : 'Add to List'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {activeTimePicker && (
        <DateTimePicker
          value={moment(activeTimePicker === 'start' ? currentSlot.start_time : currentSlot.end_time, 'HH:mm:ss').toDate()}
          mode="time"
          display="default"
          onChange={(event, selectedDate) => {
            if (event.type === 'dismissed' || !selectedDate) {
              setActiveTimePicker(null);
              return;
            }
            const timeStr = moment(selectedDate).format('HH:mm:ss');
            if (activeTimePicker === 'start') {
              setCurrentSlot({...currentSlot, start_time: timeStr});
            } else {
              setCurrentSlot({...currentSlot, end_time: timeStr});
            }
            setActiveTimePicker(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 14, 
    backgroundColor: 'rgba(255,255,255,0.92)' 
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  roleLabel: { fontSize: 9, fontWeight: '700', color: SHOP_ACCENT, letterSpacing: 1.5, marginTop: 3 },
  notifBtnSub: { width: 40, height: 40, borderRadius: 12, backgroundColor: SHOP_SURF, alignItems: 'center', justifyContent: 'center' },
  
  scrollContent: { paddingVertical: 10, paddingBottom: 120 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, gap: 12 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: -0.5, flex: 1 },
  actionGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addBtnSmall: { 
    flexDirection: 'row', alignItems: 'center', gap: 4, 
    backgroundColor: SHOP_ACCENT, 
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 
  },
  saveBtnSmall: { 
    flexDirection: 'row', alignItems: 'center', gap: 4, 
    backgroundColor: '#10b981', 
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 
  },
  saveBtnTextSmall: { color: 'white', fontSize: 13, fontWeight: '800' },
  addBtnText: { color: 'white', fontSize: 13, fontWeight: '800' },

  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
    gap: 12,
  },
  infoText: { flex: 1, fontSize: 13, color: colors.muted, lineHeight: 18, fontWeight: '500' },

  dayGroup: { marginBottom: 20 },
  sectionHeader: { fontSize: 12, fontWeight: '800', color: '#94a3b8', marginBottom: 12, letterSpacing: 0.5 },
  emptyText: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic', marginLeft: 4, marginBottom: 10 },

  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  slotCardDisabled: {
    opacity: 0.6,
    backgroundColor: colors.background
  },
  slotInfo: { flex: 1 },
  slotTime: { fontWeight: '700', color: colors.text, marginBottom: 6 },
  capacityBadge: { 
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#e0f7fa', 
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, 
    alignSelf: 'flex-start' 
  },
  capacityText: { fontSize: 11, fontWeight: '800', color: SHOP_ACCENT },
  slotActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconActionBtn: { padding: 6, backgroundColor: colors.border, borderRadius: 8 },

  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: colors.surface },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.text },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  
  label: { fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, marginTop: 12 },
  dayPicker: { flexDirection: 'row', marginBottom: 8 },
  dayItem: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.border, marginRight: 10 },
  dayItemActive: { backgroundColor: SHOP_ACCENT },
  dayItemText: { fontSize: 13, fontWeight: '700', color: colors.muted },
  dayItemTextActive: { color: 'white' },
  
  row: { flexDirection: 'row', gap: 16 },
  timeInputBox: { flex: 1, backgroundColor: colors.border, padding: 14, borderRadius: 14 },
  timeVal: { fontWeight: '700', color: colors.text },
  input: { backgroundColor: colors.border, padding: 14, borderRadius: 14, fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 8 },
  
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 30 },
  cancelBtn: { flex: 1, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.border },
  cancelText: { fontWeight: '800', color: colors.muted },
  confirmBtn: { flex: 1, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: SHOP_ACCENT },
  confirmText: { fontWeight: '800', color: 'white' },
});

