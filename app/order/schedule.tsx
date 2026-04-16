import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { orderApi } from '@/api/orderApi';
import moment from 'moment';

interface Slot {
  id: number;
  start_time: string;
  end_time: string;
  is_full: boolean;
  label: string;
}

export default function ScheduleDeliveryScreen() {
  const router = useRouter();
  const { shopId, from = 'checkout' } = useLocalSearchParams<{ shopId: string; from: string }>();
  
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'available' | 'full' | 'closed' | 'out_of_range' | null>(null);
  const [note, setNote] = useState('');

  // Generate next 7 days for the date selector
  const dates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => moment().add(i, 'days'));
  }, []);

  const fetchSlots = async (date: string) => {
    if (!shopId) return;
    setLoading(true);
    try {
      const data = await orderApi.getAvailableSlots(Number(shopId), date);
      setSlots(data.slots || []);
      setStatus(data.status);
      setSelectedSlotId(null);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to fetch slots'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate]);

  const handleConfirm = () => {
    if (!selectedSlotId) {
      Toast.show({
        type: 'error',
        text1: 'Select Slot',
        text2: 'Please choose a delivery slot.'
      });
      return;
    }

    const selectedSlot = slots.find(s => s.id === selectedSlotId);
    
    // In a real app, we'd pass this back to state management (Zustand/Redux) 
    // or through route params back to checkout
    Toast.show({
      type: 'success',
      text1: 'Slot Selected!',
      text2: `Time: ${selectedSlot?.label}`
    });

    // Strategy: Go back with params or update global store
    // For now, let's navigate back to checkout with the choice
    router.push({
      pathname: '/order/checkout' as any,
      params: { 
        slotId: selectedSlotId, 
        date: selectedDate,
        slotLabel: selectedSlot?.label,
        note: note
      }
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <BackButton fallback="/(tabs)/orders" />
        <Text style={styles.headerTitle}>Schedule Delivery</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <LinearGradient colors={['#005d90', '#0077b6']} style={styles.heroCard}>
          <Ionicons name="calendar" size={64} color="rgba(255,255,255,0.08)" style={styles.heroDecor} />
          <Ionicons name="time-outline" size={32} color="white" />
          <Text style={styles.heroTitle}>Pick Your Delivery Slot</Text>
          <Text style={styles.heroSub}>We'll deliver your water can at the chosen time window.</Text>
        </LinearGradient>

        {/* Date Selector */}
        <Text style={styles.sectionTitle}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateList}>
          {dates.map((d) => {
            const dateStr = d.format('YYYY-MM-DD');
            const isActive = selectedDate === dateStr;
            return (
              <TouchableOpacity
                key={dateStr}
                style={[styles.dateCard, isActive && styles.dateCardActive]}
                onPress={() => setSelectedDate(dateStr)}
              >
                <Text style={[styles.dateDay, isActive && styles.dateTextActive]}>{d.format('ddd')}</Text>
                <Text style={[styles.dateNum, isActive && styles.dateTextActive]}>{d.format('DD')}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>Available Slots</Text>
        
        {loading ? (
          <View style={styles.center}>
             <ActivityIndicator size="large" color="#005d90" />
             <Text style={styles.loadingText}>Fetching slots...</Text>
          </View>
        ) : status === 'closed' ? (
           <View style={styles.emptyState}>
              <Ionicons name="cafe-outline" size={48} color="#94a3b8" />
              <Text style={styles.emptyTitle}>Shop is Closed</Text>
              <Text style={styles.emptySub}>The retailer is not taking orders on this date.</Text>
           </View>
        ) : slots.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Slots Found</Text>
            <Text style={styles.emptySub}>Try picking another date or check back later.</Text>
          </View>
        ) : (
          slots.map((slot) => (
            <TouchableOpacity
              key={slot.id}
              style={[styles.slotCard, selectedSlotId === slot.id && styles.slotCardActive]}
              onPress={() => setSelectedSlotId(slot.id)}
            >
              <Ionicons name="time-outline" size={20} color={selectedSlotId === slot.id ? '#005d90' : '#707881'} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.slotText, selectedSlotId === slot.id && styles.slotTextActive]}>
                  {slot.label}
                </Text>
                {slot.is_full && <Text style={styles.fullBadge}>FULL</Text>}
              </View>
              <View style={[styles.radio, selectedSlotId === slot.id && styles.radioActive]}>
                {selectedSlotId === slot.id && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))
        )}

        <Text style={styles.sectionTitle}>Delivery Notes (Optional)</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="e.g. Call before arriving, gate code is 1234"
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity 
          style={[styles.confirmBtn, (!selectedSlotId || loading) && styles.btnDisabled]} 
          onPress={handleConfirm}
          disabled={!selectedSlotId || loading}
        >
          <LinearGradient colors={['#005d90', '#0077b6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmBtnGrad}>
            <Ionicons name="calendar-outline" size={20} color="white" />
            <Text style={styles.confirmBtnText}>Confirm {selectedSlotId ? 'Schedule' : 'Selection'}</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  heroCard: { borderRadius: 24, padding: 24, overflow: 'hidden', alignItems: 'center', gap: 8, shadowColor: '#005d90', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 },
  heroDecor: { position: 'absolute', right: -10, top: -10 },
  heroTitle: { fontSize: 20, fontWeight: '900', color: 'white' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#181c20', letterSpacing: -0.3, marginTop: 10 },
  
  dateList: { gap: 10, paddingRight: 20 },
  dateCard: { width: 64, height: 80, backgroundColor: 'white', borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: '#e0e2e8' },
  dateCardActive: { backgroundColor: '#005d90', borderColor: '#005d90' },
  dateDay: { fontSize: 12, fontWeight: '700', color: '#707881', textTransform: 'uppercase' },
  dateNum: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  dateTextActive: { color: 'white' },

  slotCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#e0e2e8' },
  slotCardActive: { borderColor: '#005d90', backgroundColor: '#f0f7ff' },
  slotText: { fontSize: 14, fontWeight: '700', color: '#181c20' },
  slotTextActive: { color: '#005d90' },
  fullBadge: { alignSelf: 'flex-start', backgroundColor: '#fee2e2', color: '#ef4444', fontSize: 10, fontWeight: '900', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  
  center: { padding: 40, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 14, color: '#707881', fontWeight: '600' },
  
  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: 24, gap: 8, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#e0e2e8' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  emptySub: { fontSize: 13, color: '#707881', textAlign: 'center' },

  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#e0e2e8', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#005d90' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#005d90' },
  
  noteInput: { backgroundColor: 'white', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e0e2e8', fontSize: 14, color: '#181c20', minHeight: 80, textAlignVertical: 'top' },
  confirmBtn: { borderRadius: 18, overflow: 'hidden', marginTop: 4 },
  confirmBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  confirmBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
  btnDisabled: { opacity: 0.6 },
});


