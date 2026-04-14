import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useState, useMemo } from 'react';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';

import { useOrderStore } from '@/stores/orderStore';
import { useShopStore } from '@/stores/shopStore';

const issueOptions = [
  'Late Delivery',
  'Wrong Order',
  'Water Quality',
  'Rude Delivery',
  'Leaking Can',
  'Overcharged',
  'Other',
] as const;

const resolutionOptions = ['Refund', 'Replacement', 'Call Me Back'] as const;

export default function ReportIssueScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const { orders, activeOrderId } = useOrderStore();

  useAndroidBackHandler(() => {
    safeBack('/(tabs)/profile');
  });

  const { shops } = useShopStore();
  const [selectedIssue, setSelectedIssue] = useState<(typeof issueOptions)[number]>('Late Delivery');
  const [resolution, setResolution] = useState<(typeof resolutionOptions)[number]>('Refund');
  const [details, setDetails] = useState('');

  const activeOrder = useMemo(
    () => orders.find((order) => order.id === activeOrderId) ?? orders[0],
    [activeOrderId, orders]
  );
  const shop = shops.find((item) => item.id === activeOrder?.shopId);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <BackButton fallback="/(tabs)/profile" />
          <Text style={styles.title}>Report Issue</Text>
          <View style={styles.iconBtn} />
        </View>


        <View style={styles.orderCard}>
          <Text style={styles.eyebrow}>Selected Order</Text>
          <Text style={styles.orderTitle}>#{activeOrder?.id ?? 'TNG-ISSUE'}</Text>
          <Text style={styles.orderBody}>
            {shop?.name ?? 'Assigned shop'} | {activeOrder?.address ?? 'Delivery address unavailable'}
          </Text>
        </View>

        <Text style={styles.subtitle}>Tell us what went wrong and choose how we should help with refund or replacement.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Issue Type</Text>
          <View style={styles.grid}>
            {issueOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.option, selectedIssue === option && styles.optionActive]}
                onPress={() => setSelectedIssue(option)}
              >
                <Text style={[styles.optionText, selectedIssue === option && styles.optionTextActive]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Resolution</Text>
          <View style={styles.resolutionRow}>
            {resolutionOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.resolutionChip, resolution === option && styles.resolutionChipActive]}
                onPress={() => setResolution(option)}
              >
                <Text style={[styles.resolutionText, resolution === option && styles.resolutionTextActive]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            multiline
            placeholder="Add what happened, delivery timing, can condition, or anything the support team should know."
            placeholderTextColor="#94A3B8"
            style={styles.input}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.helperCard}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#005D90" />
          <Text style={styles.helperText}>High-priority complaints are reviewed first and tied back to the active order workflow.</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            Toast.show({
              type: 'success',
              text1: 'Issue Submitted',
              text2: `${selectedIssue} has been logged for ${resolution.toLowerCase()}.`
            });
            router.replace('/notifications');
          }}
        >
          <Text style={styles.primaryText}>Submit Issue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9FF' },
  content: { padding: 20, gap: 16, paddingBottom: 80 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: '#1A1A2E' },
  subtitle: { color: '#74777C', lineHeight: 20 },
  orderCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 6 },
  eyebrow: { color: '#005D90', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  orderTitle: { color: '#1A1A2E', fontSize: 20, fontWeight: '900' },
  orderBody: { color: '#74777C', lineHeight: 20 },
  section: { gap: 10 },
  sectionTitle: { color: '#1A1A2E', fontSize: 15, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  option: { width: '48%', backgroundColor: '#fff', borderRadius: 18, padding: 16, minHeight: 72, justifyContent: 'center' },
  optionActive: { borderWidth: 2, borderColor: '#0077B6', backgroundColor: '#E8F4FD' },
  optionText: { fontWeight: '700', color: '#1A1A2E' },
  optionTextActive: { color: '#0077B6' },
  resolutionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  resolutionChip: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  resolutionChipActive: { backgroundColor: '#C0392B' },
  resolutionText: { color: '#1A1A2E', fontWeight: '700' },
  resolutionTextActive: { color: '#fff' },
  input: { minHeight: 120, backgroundColor: '#fff', borderRadius: 18, padding: 16, color: '#1A1A2E', fontSize: 14, lineHeight: 20 },
  helperCard: { backgroundColor: '#E8F4FD', borderRadius: 18, padding: 16, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  helperText: { flex: 1, color: '#005D90', lineHeight: 20, fontWeight: '600' },
  primaryBtn: { backgroundColor: '#C0392B', borderRadius: 18, paddingVertical: 16, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});


