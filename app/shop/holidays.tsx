import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, TextInput,
  useWindowDimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '@/components/ui/Logo';
import { BackButton } from '@/components/ui/BackButton';
import { shopApi } from '@/api/shopApi';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

import { Shadow, thannigoPalette, roleAccent, roleSurface, roleGradients } from '@/constants/theme';

const SHOP_ACCENT = roleAccent.shop_owner;
const SHOP_SURF = roleSurface.shop_owner;
const SHOP_GRAD: [string, string] = [roleGradients.shop_owner.start, roleGradients.shop_owner.end];

interface ShopHoliday {
  id: number;
  holiday_date: string;
  reason: string;
}

export default function ShopHolidaysScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState<ShopHoliday[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDate, setNewDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const isSmallScreen = width < 380;

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const data = await shopApi.getHolidays();
      setHolidays(data);
    } catch (error) {
      console.error('[Holidays] Fetch failed:', error);
      Toast.show({ type: 'error', text1: 'Failed to load holidays' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!reason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for the holiday (e.g. Festival, Personal)');
      return;
    }

    try {
      setIsAdding(true);
      const dateStr = moment(newDate).format('YYYY-MM-DD');
      await shopApi.addHoliday({ holiday_date: dateStr, reason });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: 'Holiday Added' });
      
      setReason('');
      setNewDate(new Date());
      setShowAddModal(false);
      fetchHolidays();
    } catch (error: any) {
      if (error.status === 409) {
        Alert.alert('Duplicate Date', 'A holiday is already set for this date.');
      } else {
        Toast.show({ type: 'error', text1: 'Failed to add holiday' });
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteHoliday = (id: number, date: string) => {
    Alert.alert(
      'Remove Holiday',
      `Are you sure you want to remove the holiday on ${moment(date).format('DD MMM YYYY')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await shopApi.deleteHoliday(id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Toast.show({ type: 'success', text1: 'Holiday removed' });
              fetchHolidays();
            } catch (error) {
              Toast.show({ type: 'error', text1: 'Failed to remove holiday' });
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={SHOP_ACCENT} />
      </View>
    );
  }

  const upcomingHolidays = holidays.filter(h => moment(h.holiday_date).isSameOrAfter(moment(), 'day'));
  const pastHolidays = holidays.filter(h => moment(h.holiday_date).isBefore(moment(), 'day'));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

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
          <Ionicons name="notifications-outline" size={22} color={SHOP_ACCENT} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Holiday Master</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="calendar-outline" size={20} color={SHOP_ACCENT} />
          <Text style={styles.infoText}>
            Scheduled holidays will automatically close your shop for new orders on those dates.
          </Text>
        </View>

        <Text style={styles.sectionHeader}>Upcoming Holidays</Text>
        {upcomingHolidays.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No upcoming holidays scheduled</Text>
          </View>
        ) : (
          upcomingHolidays.map((h) => (
            <View key={h.id} style={styles.holidayCard}>
              <View style={styles.dateBox}>
                <Text style={styles.dateDay}>{moment(h.holiday_date).format('DD')}</Text>
                <Text style={styles.dateMonth}>{moment(h.holiday_date).format('MMM')}</Text>
              </View>
              <View style={styles.holidayInfo}>
                <Text style={styles.holidayReason}>{h.reason}</Text>
                <Text style={styles.holidayYear}>{moment(h.holiday_date).format('YYYY · dddd')}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteHoliday(h.id, h.holiday_date)}
                style={styles.deleteBtn}
              >
                <Ionicons name="trash-outline" size={18} color="#ba1a1a" />
              </TouchableOpacity>
            </View>
          ))
        )}

        {pastHolidays.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Past Holidays</Text>
            {pastHolidays.map((h) => (
              <View key={h.id} style={[styles.holidayCard, { opacity: 0.6 }]}>
                <View style={[styles.dateBox, { backgroundColor: thannigoPalette.borderSoft }]}>
                  <Text style={[styles.dateDay, { color: '#94a3b8' }]}>{moment(h.holiday_date).format('DD')}</Text>
                  <Text style={[styles.dateMonth, { color: '#94a3b8' }]}>{moment(h.holiday_date).format('MMM')}</Text>
                </View>
                <View style={styles.holidayInfo}>
                  <Text style={[styles.holidayReason, { color: '#94a3b8' }]}>{h.reason}</Text>
                  <Text style={styles.holidayYear}>{moment(h.holiday_date).format('YYYY')}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {showAddModal && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Holiday</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={thannigoPalette.neutral} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Select Date</Text>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color={SHOP_ACCENT} style={{ marginRight: 10 }} />
              <Text style={styles.dateInputText}>{moment(newDate).format('DD MMMM YYYY')}</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Reason for Holiday</Text>
            <TextInput
              style={styles.input}
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. Pongal Festival"
              placeholderTextColor="#94a3b8"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, isAdding && { opacity: 0.7 }]}
                onPress={handleAddHoliday}
                disabled={isAdding}
              >
                {isAdding ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.confirmText}>Add Holiday</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={newDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setNewDate(date);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: thannigoPalette.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: 'white',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 22, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5 },
  roleLabel: { fontSize: 9, fontWeight: '700', color: SHOP_ACCENT, letterSpacing: 1.5, marginTop: 3 },
  notifBtnSub: { width: 40, height: 40, borderRadius: 12, backgroundColor: SHOP_SURF, alignItems: 'center', justifyContent: 'center' },

  scrollContent: { paddingHorizontal: 24, paddingVertical: 10, paddingBottom: 120 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: SHOP_ACCENT, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14,
  },
  addBtnText: { color: 'white', fontWeight: '800', fontSize: 13 },

  infoCard: {
    flexDirection: 'row', backgroundColor: '#e0f7fa', padding: 16, borderRadius: 20,
    marginBottom: 24, alignItems: 'center', gap: 12,
  },
  infoText: { flex: 1, fontSize: 13, color: SHOP_ACCENT, lineHeight: 18, fontWeight: '600' },

  sectionHeader: { fontSize: 12, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, marginLeft: 4 },

  holidayCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
    padding: 14, borderRadius: 20, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  dateBox: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: thannigoPalette.borderSoft,
    alignItems: 'center', justifyContent: 'center', gap: 1,
  },
  dateDay: { fontSize: 18, fontWeight: '900', color: thannigoPalette.darkText },
  dateMonth: { fontSize: 10, fontWeight: '800', color: SHOP_ACCENT, textTransform: 'uppercase' },
  holidayInfo: { flex: 1, marginLeft: 16 },
  holidayReason: { fontSize: 15, fontWeight: '800', color: thannigoPalette.darkText, marginBottom: 2 },
  holidayYear: { fontSize: 12, color: thannigoPalette.neutral, fontWeight: '500' },
  deleteBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#fff0f0', alignItems: 'center', justifyContent: 'center' },

  emptyState: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },

  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: 'white', borderRadius: 28, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: thannigoPalette.darkText },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: thannigoPalette.borderSoft, alignItems: 'center', justifyContent: 'center' },

  label: { fontSize: 12, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  dateInput: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: thannigoPalette.background,
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 16, padding: 14,
  },
  dateInputText: { fontSize: 15, fontWeight: '700', color: thannigoPalette.darkText },
  input: {
    backgroundColor: thannigoPalette.background, borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 16, padding: 14, fontSize: 15, fontWeight: '700', color: thannigoPalette.darkText,
  },

  modalActions: { flexDirection: 'row', gap: 12, marginTop: 32 },
  cancelBtn: { flex: 1, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: thannigoPalette.borderSoft },
  cancelText: { fontWeight: '800', color: thannigoPalette.neutral, fontSize: 15 },
  confirmBtn: { flex: 1, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: SHOP_ACCENT },
  confirmText: { fontWeight: '800', color: 'white', fontSize: 15 },
});
