import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, ActivityIndicator, Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '@/components/ui/Logo';
import { BackButton } from '@/components/ui/BackButton';
import { shopApi } from '@/api/shopApi';
import Toast from 'react-native-toast-message';
import { Shadow, thannigoPalette, roleAccent, roleSurface } from '@/constants/theme';

const SHOP_ACCENT = roleAccent.shop_owner;
const SHOP_SURF = roleSurface.shop_owner;
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

const DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

interface DaySchedule {
  day_of_week: number;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
}

export default function ShopScheduleScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [activePicker, setActivePicker] = useState<{ day: number, type: 'open' | 'close' } | null>(null);

  const isSmallScreen = width < 380;
  const horizontalPadding = isSmallScreen ? 16 : 24;

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const data = await shopApi.getSchedule();
      
      const fullSchedule: DaySchedule[] = DAYS.map((_, index) => {
        const existing = data.find(d => d.day_of_week === index);
        return existing || {
          day_of_week: index,
          is_closed: false,
          open_time: '09:00:00',
          close_time: '21:00:00'
        };
      });
      
      setSchedule(fullSchedule);
    } catch (error) {
      console.error('[Schedule] Fetch failed:', error);
      Toast.show({ type: 'error', text1: 'Failed to load schedule' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClosed = (dayIndex: number, val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSchedule(prev => prev.map(d => 
      d.day_of_week === dayIndex ? { ...d, is_closed: val } : d
    ));
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed' || !selectedDate) {
      setActivePicker(null);
      return;
    }
    
    if (!activePicker) return;
    const { day, type } = activePicker;
    const timeStr = moment(selectedDate).format('HH:mm:ss');
    
    setSchedule(prev => prev.map(d => 
      d.day_of_week === day ? { ...d, [type === 'open' ? 'open_time' : 'close_time']: timeStr } : d
    ));
    setActivePicker(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await shopApi.updateSchedule(schedule);
      Toast.show({ type: 'success', text1: 'Schedule Saved', text2: 'Your business hours have been updated.' });
      router.back();
    } catch (error) {
      console.error('[Schedule] Save failed:', error);
      Toast.show({ type: 'error', text1: 'Save Failed' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={SHOP_ACCENT} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
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
          style={styles.headerActionBtn}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator size="small" color={SHOP_ACCENT} /> : <Text style={styles.saveHeaderBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
      >
        <Text style={styles.pageTitle}>Business Hours</Text>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={SHOP_ACCENT} />
          <Text style={[styles.infoText, isSmallScreen && { fontSize: 12 }]}>
            Set your shop's weekly operating hours. This determines your "Open" or "Closed" status for customers.
          </Text>
        </View>

        {schedule.map((day) => (
          <View key={day.day_of_week} style={[styles.dayCard, day.is_closed && styles.dayCardClosed]}>
            <View style={styles.dayHeader}>
              <Text style={[styles.dayLabel, { fontSize: isSmallScreen ? 15 : 17 }]}>{DAYS[day.day_of_week]}</Text>
              <View style={styles.toggleRow}>
                <Text style={styles.closedText}>{day.is_closed ? 'Closed' : 'Open'}</Text>
                <Switch
                  value={!day.is_closed}
                  onValueChange={(val) => handleToggleClosed(day.day_of_week, !val)}
                  trackColor={{ false: thannigoPalette.borderSoft, true: '#a7edff' }}
                  thumbColor={!day.is_closed ? SHOP_ACCENT : thannigoPalette.neutral}
                />
              </View>
            </View>

            {!day.is_closed && (
              <View style={styles.timeRow}>
                <TouchableOpacity 
                  style={styles.timePicker}
                  onPress={() => setActivePicker({ day: day.day_of_week, type: 'open' })}
                >
                  <Text style={styles.timeLabel}>Opens at</Text>
                  <Text style={[styles.timeValue, { fontSize: isSmallScreen ? 16 : 18 }]}>{moment(day.open_time, 'HH:mm:ss').format('hh:mm A')}</Text>
                </TouchableOpacity>

                <View style={styles.timeDivider} />

                <TouchableOpacity 
                  style={styles.timePicker}
                  onPress={() => setActivePicker({ day: day.day_of_week, type: 'close' })}
                >
                  <Text style={styles.timeLabel}>Closes at</Text>
                  <Text style={[styles.timeValue, { fontSize: isSmallScreen ? 16 : 18 }]}>{moment(day.close_time, 'HH:mm:ss').format('hh:mm A')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity 
          style={[styles.fullSaveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.fullSaveBtnText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>

      {activePicker && (
        <DateTimePicker
          value={moment(schedule[activePicker.day][activePicker.type === 'open' ? 'open_time' : 'close_time'], 'HH:mm:ss').toDate()}
          mode="time"
          display="default"
          onChange={onTimeChange}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 22, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5 },
  roleLabel: { fontSize: 9, fontWeight: '700', color: SHOP_ACCENT, letterSpacing: 1.5, marginTop: 3 },
  headerActionBtn: {
    backgroundColor: SHOP_SURF,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  saveHeaderBtnText: { color: SHOP_ACCENT, fontWeight: '800', fontSize: 13 },

  scrollContent: { paddingVertical: 10, paddingBottom: 120 },
  pageTitle: { fontSize: 32, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5, marginBottom: 18 },

  infoCard: {
    flexDirection: 'row',
    backgroundColor: SHOP_SURF,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    gap: 12,
  },
  infoText: { flex: 1, fontSize: 13, color: thannigoPalette.darkText, lineHeight: 18, fontWeight: '500' },

  dayCard: {
    backgroundColor: thannigoPalette.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...Shadow.sm,
  },
  dayCardClosed: {
    opacity: 0.7,
    backgroundColor: thannigoPalette.borderSoft,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayLabel: { fontWeight: '800', color: thannigoPalette.darkText },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  closedText: { fontSize: 12, color: thannigoPalette.neutral, fontWeight: '700' },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: thannigoPalette.borderSoft,
  },
  timePicker: { flex: 1, alignItems: 'center' },
  timeLabel: { fontSize: 11, color: thannigoPalette.neutral, marginBottom: 4, fontWeight: '600' },
  timeValue: { fontWeight: '800', color: SHOP_ACCENT },
  timeDivider: { width: 1, height: 30, backgroundColor: thannigoPalette.borderSoft },

  fullSaveBtn: {
    backgroundColor: SHOP_ACCENT,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    ...Shadow.md,
    shadowColor: SHOP_ACCENT,
  },
  fullSaveBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
});

