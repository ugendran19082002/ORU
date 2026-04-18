import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import React, { useState, useMemo } from 'react';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { useOrderStore } from '@/stores/orderStore';
import { useShopStore } from '@/stores/shopStore';
import { complaintApi } from '@/api/complaintApi';
import { useAppTheme } from '@/providers/ThemeContext';

const ISSUE_TYPE_MAP: Record<string, string> = {
  'Late Delivery': 'late_delivery',
  'Wrong Order': 'wrong_item',
  'Water Quality': 'bad_quality',
  'Rude Delivery': 'other',
  'Leaking Can': 'damage',
  'Overcharged': 'other',
  'Other': 'other',
};

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
  const { colors, isDark } = useAppTheme();
  const { safeBack } = useAppNavigation();
  const { orders, activeOrderId } = useOrderStore();

  useAndroidBackHandler(() => { safeBack('/(tabs)/profile'); });

  const { shops } = useShopStore();
  const [selectedIssue, setSelectedIssue] = useState<(typeof issueOptions)[number]>('Late Delivery');
  const [resolution, setResolution] = useState<(typeof resolutionOptions)[number]>('Refund');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const activeOrder = useMemo(
    () => orders.find((order) => order.id === activeOrderId) ?? orders[0],
    [activeOrderId, orders]
  );
  const shop = shops.find((item) => item.id === activeOrder?.shopId);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <BackButton fallback="/(tabs)/profile" />
          <Text style={[styles.title, { color: colors.text }]}>Report Issue</Text>
          <View style={[styles.iconBtn, { backgroundColor: colors.surface }]} />
        </View>

        <View style={[styles.orderCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.eyebrow}>Selected Order</Text>
          <Text style={[styles.orderTitle, { color: colors.text }]}>#{activeOrder?.id ?? 'TNG-ISSUE'}</Text>
          <Text style={[styles.orderBody, { color: colors.muted }]}>
            {shop?.name ?? 'Assigned shop'} | {activeOrder?.address ?? 'Delivery address unavailable'}
          </Text>
        </View>

        <Text style={[styles.subtitle, { color: colors.muted }]}>Tell us what went wrong and choose how we should help with refund or replacement.</Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Issue Type</Text>
          <View style={styles.grid}>
            {issueOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.option, { backgroundColor: colors.surface }, selectedIssue === option && styles.optionActive]}
                onPress={() => setSelectedIssue(option)}
              >
                <Text style={[styles.optionText, { color: colors.text }, selectedIssue === option && styles.optionTextActive]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferred Resolution</Text>
          <View style={styles.resolutionRow}>
            {resolutionOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.resolutionChip, { backgroundColor: colors.surface }, resolution === option && styles.resolutionChipActive]}
                onPress={() => setResolution(option)}
              >
                <Text style={[styles.resolutionText, { color: colors.text }, resolution === option && styles.resolutionTextActive]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            multiline
            placeholder="Add what happened, delivery timing, can condition, or anything the support team should know."
            placeholderTextColor={colors.placeholder}
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
            textAlignVertical="top"
          />
        </View>

        <View style={[styles.helperCard, { backgroundColor: isDark ? 'rgba(0,93,144,0.15)' : '#E8F4FD' }]}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#005D90" />
          <Text style={styles.helperText}>High-priority complaints are reviewed first and tied back to the active order workflow.</Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}
          disabled={submitting}
          onPress={async () => {
            if (!activeOrder) {
              Toast.show({ type: 'error', text1: 'No active order found' });
              return;
            }
            setSubmitting(true);
            try {
              await complaintApi.fileSosComplaint({
                order_id: Number(activeOrder.id),
                issue_type: ISSUE_TYPE_MAP[selectedIssue] ?? 'other',
                description: details || selectedIssue,
                is_sos: selectedIssue === 'Late Delivery',
              });
              Toast.show({
                type: 'success',
                text1: 'Issue Submitted',
                text2: `${selectedIssue} has been logged. Our team will review it.`,
              });
              router.replace('/notifications');
            } catch (e: any) {
              Toast.show({ type: 'error', text1: 'Submission Failed', text2: e?.message ?? 'Please try again.' });
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.primaryText}>Submit Issue</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 80 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { lineHeight: 20 },
  orderCard: { borderRadius: 20, padding: 18, gap: 6 },
  eyebrow: { color: '#005D90', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  orderTitle: { fontSize: 20, fontWeight: '900' },
  orderBody: { lineHeight: 20 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  option: { width: '48%', borderRadius: 18, padding: 16, minHeight: 72, justifyContent: 'center' },
  optionActive: { borderWidth: 2, borderColor: '#0077B6', backgroundColor: '#E8F4FD' },
  optionText: { fontWeight: '700' },
  optionTextActive: { color: '#0077B6' },
  resolutionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  resolutionChip: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  resolutionChipActive: { backgroundColor: '#C0392B' },
  resolutionText: { fontWeight: '700' },
  resolutionTextActive: { color: '#fff' },
  input: { minHeight: 120, borderRadius: 18, padding: 16, fontSize: 14, lineHeight: 20 },
  helperCard: { borderRadius: 18, padding: 16, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  helperText: { flex: 1, color: '#005D90', lineHeight: 20, fontWeight: '600' },
  primaryBtn: { backgroundColor: '#C0392B', borderRadius: 18, paddingVertical: 16, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

