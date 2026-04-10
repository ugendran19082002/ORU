import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const SLOTS = [
  'Today, 6–8 PM',
  'Tomorrow, 8–10 AM',
  'Tomorrow, 12–2 PM',
  'Tomorrow, 5–7 PM',
  'Day after, 8–10 AM',
];

export default function ScheduleDeliveryScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    if (!selected) {
      Alert.alert('Select Slot', 'Please choose a delivery slot.');
      return;
    }
    Alert.alert('Delivery Scheduled!', `Your delivery is scheduled for: ${selected}`, [
      { text: 'Done', onPress: () => router.replace('/(tabs)/orders' as any) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Delivery</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <LinearGradient colors={['#005d90', '#0077b6']} style={styles.heroCard}>
          <Ionicons name="calendar" size={64} color="rgba(255,255,255,0.08)" style={styles.heroDecor} />
          <Ionicons name="time-outline" size={32} color="white" />
          <Text style={styles.heroTitle}>Pick Your Delivery Slot</Text>
          <Text style={styles.heroSub}>We'll deliver your water can at the chosen time window.</Text>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Available Slots</Text>
        {SLOTS.map((slot) => (
          <TouchableOpacity
            key={slot}
            style={[styles.slotCard, selected === slot && styles.slotCardActive]}
            onPress={() => setSelected(slot)}
          >
            <Ionicons name="time-outline" size={20} color={selected === slot ? '#005d90' : '#707881'} />
            <Text style={[styles.slotText, selected === slot && styles.slotTextActive]}>{slot}</Text>
            <View style={[styles.radio, selected === slot && styles.radioActive]}>
              {selected === slot && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Delivery Notes (Optional)</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="e.g. Call before arriving, gate code is 1234"
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <LinearGradient colors={['#005d90', '#0077b6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmBtnGrad}>
            <Ionicons name="calendar-outline" size={20} color="white" />
            <Text style={styles.confirmBtnText}>Confirm Schedule</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  heroCard: { borderRadius: 24, padding: 24, overflow: 'hidden', alignItems: 'center', gap: 8, shadowColor: '#005d90', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 },
  heroDecor: { position: 'absolute', right: -10, top: -10 },
  heroTitle: { fontSize: 20, fontWeight: '900', color: 'white' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#181c20', letterSpacing: -0.3 },
  slotCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#e0e2e8' },
  slotCardActive: { borderColor: '#005d90', backgroundColor: '#f0f7ff' },
  slotText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#181c20' },
  slotTextActive: { color: '#005d90' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#e0e2e8', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#005d90' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#005d90' },
  noteInput: { backgroundColor: 'white', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e0e2e8', fontSize: 14, color: '#181c20', minHeight: 80, textAlignVertical: 'top' },
  confirmBtn: { borderRadius: 18, overflow: 'hidden', marginTop: 4 },
  confirmBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  confirmBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
});
