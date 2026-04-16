import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { shopApi } from '@/api/shopApi';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

const DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

interface DeliverySlot {
  id?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_orders: number;
}

export default function ShopSlotsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSlot, setNewSlot] = useState<DeliverySlot>({
    day_of_week: 1,
    start_time: '09:00:00',
    end_time: '11:00:00',
    max_orders: 10
  });
  const [pickingDay, setPickingDay] = useState(false);
  const [activeTimePicker, setActiveTimePicker] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const data = await shopApi.getSlots();
      setSlots(data);
    } catch (error) {
      console.error('[Slots] Fetch failed:', error);
      Toast.show({ type: 'error', text1: 'Failed to load delivery slots' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = () => {
    setSlots(prev => [...prev, { ...newSlot }]);
    setShowAddModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleRemoveSlot = (index: number) => {
    Alert.alert('Remove Slot', 'Are you sure you want to remove this delivery window?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => {
            setSlots(prev => prev.filter((_, i) => i !== index));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
    ]);
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
    daySlots: slots.filter(s => s.day_of_week === index)
  }));

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#005d90" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ 
        title: 'Delivery Slots',
        headerShown: true,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#003a5c" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={() => setShowAddModal(true)} style={{ marginRight: 15 }}>
            <Ionicons name="add-circle-outline" size={28} color="#005d90" />
          </TouchableOpacity>
        )
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoCard}>
          <Ionicons name="bicycle-outline" size={20} color="#005d90" />
          <Text style={styles.infoText}>
            Define delivery windows and maximum orders per window. Customers will choose from these slots during checkout.
          </Text>
        </View>

        {groupedSlots.map((group) => (
          <View key={group.day} style={styles.dayGroup}>
            <Text style={styles.dayHeader}>{group.day}</Text>
            {group.daySlots.length === 0 ? (
              <Text style={styles.emptyText}>No delivery slots for this day</Text>
            ) : (
              group.daySlots.map((slot, i) => {
                const globalIndex = slots.findIndex(s => s === slot);
                return (
                  <View key={i} style={styles.slotCard}>
                    <View style={styles.slotInfo}>
                        <Text style={styles.slotTime}>
                            {moment(slot.start_time, 'HH:mm:ss').format('hh:mm A')} - {moment(slot.end_time, 'HH:mm:ss').format('hh:mm A')}
                        </Text>
                        <View style={styles.capacityBadge}>
                            <Text style={styles.capacityText}>{slot.max_orders} Orders Max</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveSlot(globalIndex)}>
                        <Ionicons name="trash-outline" size={20} color="#ba1a1a" />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        ))}

        <TouchableOpacity 
          style={[styles.fullSaveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.fullSaveBtnText}>Save All Changes</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* Add Slot Modal Simulation (Simplified for brevity) */}
      {showAddModal && (
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Add Delivery Slot</Text>
                
                <Text style={styles.label}>Day of Week</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayPicker}>
                    {DAYS.map((d, i) => (
                        <TouchableOpacity 
                            key={d} 
                            style={[styles.dayItem, newSlot.day_of_week === i && styles.dayItemActive]}
                            onPress={() => setNewSlot({...newSlot, day_of_week: i})}
                        >
                            <Text style={[styles.dayItemText, newSlot.day_of_week === i && styles.dayItemTextActive]}>{d.slice(0, 3)}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.row}>
                    <TouchableOpacity style={styles.timeInput} onPress={() => setActiveTimePicker('start')}>
                        <Text style={styles.label}>Start Time</Text>
                        <Text style={styles.timeVal}>{moment(newSlot.start_time, 'HH:mm:ss').format('hh:mm A')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.timeInput} onPress={() => setActiveTimePicker('end')}>
                        <Text style={styles.label}>End Time</Text>
                        <Text style={styles.timeVal}>{moment(newSlot.end_time, 'HH:mm:ss').format('hh:mm A')}</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Max Orders for this window</Text>
                <TextInput 
                    style={styles.input}
                    value={String(newSlot.max_orders)}
                    onChangeText={(v) => setNewSlot({...newSlot, max_orders: parseInt(v) || 0})}
                    keyboardType="numeric"
                />

                <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmBtn} onPress={handleAddSlot}>
                        <Text style={styles.confirmText}>Add Slot</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      )}

      {activeTimePicker && (
        <DateTimePicker
          value={moment(activeTimePicker === 'start' ? newSlot.start_time : newSlot.end_time, 'HH:mm:ss').toDate()}
          mode="time"
          display="default"
          onChange={(event, selectedDate) => {
              if (event.type === 'dismissed' || !selectedDate) {
                  setActiveTimePicker(null);
                  return;
              }
              const timeStr = moment(selectedDate).format('HH:mm:ss');
              if (activeTimePicker === 'start') {
                  setNewSlot({...newSlot, start_time: timeStr});
              } else {
                  setNewSlot({...newSlot, end_time: timeStr});
              }
              setActiveTimePicker(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 60 },
  
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#f1f4f9',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    gap: 12,
  },
  infoText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 18, fontWeight: '500' },

  dayGroup: { marginBottom: 24 },
  dayHeader: { fontSize: 18, fontWeight: '900', color: '#003a5c', marginBottom: 12 },
  emptyText: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic', marginLeft: 4 },

  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  slotInfo: { flex: 1 },
  slotTime: { fontSize: 15, fontWeight: '700', color: '#181c20', marginBottom: 4 },
  capacityBadge: { backgroundColor: '#e0f7fa', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  capacityText: { fontSize: 10, fontWeight: '800', color: '#006878' },

  fullSaveBtn: {
    backgroundColor: '#005d90',
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  fullSaveBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },

  // Modal styles
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#181c20', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, marginTop: 12 },
  dayPicker: { flexDirection: 'row', marginBottom: 16 },
  dayItem: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f1f4f9', marginRight: 8 },
  dayItemActive: { backgroundColor: '#005d90' },
  dayItemText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  dayItemTextActive: { color: 'white' },
  row: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  timeInput: { flex: 1, backgroundColor: '#f1f4f9', padding: 12, borderRadius: 12 },
  timeVal: { fontSize: 15, fontWeight: '700', color: '#181c20' },
  input: { backgroundColor: '#f1f4f9', padding: 12, borderRadius: 12, fontSize: 15, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f4f9' },
  cancelText: { fontWeight: '700', color: '#475569' },
  confirmBtn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#005d90' },
  confirmText: { fontWeight: '700', color: 'white' },
});
