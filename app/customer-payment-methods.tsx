import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { apiClient } from '@/api/client';
import { Shadow, roleAccent, Radius } from '@/constants/theme';
import { useAppTheme } from '@/providers/ThemeContext';

const ACCENT = roleAccent.customer;

interface UpiItem {
  id: string;
  vpa: string;
  app: string;
}

interface CardItem {
  id: string;
  mask: string;
  brand: string;
  default: boolean;
}

export default function CustomerPaymentMethodsScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);
  const { safeBack } = useAppNavigation();
  const { colors, isDark } = useAppTheme();
  useAndroidBackHandler(() => { safeBack('/(tabs)/profile'); });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upiList, setUpiList] = useState<UpiItem[]>([]);
  const [cardList, setCardList] = useState<CardItem[]>([]);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      setError(null);
      const res = await apiClient.get('/users/me/payment-methods');
      if (res.data.status === 1) {
        setUpiList(res.data.data.upi ?? []);
        setCardList(res.data.data.cards ?? []);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load payment methods.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <BackButton fallback="/(tabs)/profile" />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Payment Methods</Text>
          <Text style={styles.headerSub}>Manage your saved payment options</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.muted} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchPaymentMethods}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* UPI IDs */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Saved UPI IDs</Text>
          </View>
          <View style={styles.listCard}>
            {upiList.length === 0 ? (
              <View style={styles.emptyRow}>
                <Ionicons name="phone-portrait-outline" size={28} color={colors.muted} />
                <Text style={styles.emptyText}>No UPI IDs saved.</Text>
                <Text style={styles.emptyHint}>UPI IDs are saved automatically when you pay via UPI.</Text>
              </View>
            ) : upiList.map((upi, i) => (
              <View key={upi.id}>
                <View style={styles.row}>
                  <View style={styles.iconBox}>
                    <Ionicons name="logo-google" size={20} color={ACCENT} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{upi.vpa}</Text>
                    <Text style={styles.itemSub}>{upi.app}</Text>
                  </View>
                </View>
                {i < upiList.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>

          {/* CARDS */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Saved Cards</Text>
          </View>
          <View style={styles.listCard}>
            {cardList.length === 0 ? (
              <View style={styles.emptyRow}>
                <Ionicons name="card-outline" size={28} color={colors.muted} />
                <Text style={styles.emptyText}>No cards saved.</Text>
                <Text style={styles.emptyHint}>Cards are saved securely via Razorpay when you pay by card.</Text>
              </View>
            ) : cardList.map((card, i) => (
              <View key={card.id}>
                <View style={styles.row}>
                  <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
                    <Ionicons name="card" size={20} color={colors.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{card.brand} {card.mask}</Text>
                    {card.default && <Text style={styles.defaultBadge}>Default</Text>}
                  </View>
                </View>
                {i < cardList.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.success} />
            <Text style={styles.infoText}>
              Payment methods are stored securely via Razorpay. ThanniGo never stores your card or UPI details directly.
            </Text>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: colors.text },
  headerSub: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorText: { fontSize: 14, color: colors.muted, textAlign: 'center', fontWeight: '500' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: ACCENT, borderRadius: Radius.md },
  retryText: { color: 'white', fontWeight: '700', fontSize: 14 },
  content: { padding: 20, gap: 20, paddingBottom: 60 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: -10, marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  listCard: { backgroundColor: colors.surface, borderRadius: Radius.xl, paddingHorizontal: 16, paddingVertical: 6, ...Shadow.xs },
  emptyRow: { alignItems: 'center', gap: 6, paddingVertical: 24 },
  emptyText: { fontSize: 14, color: colors.muted, fontWeight: '600' },
  emptyHint: { fontSize: 12, color: colors.muted, fontWeight: '500', textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  itemSub: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  defaultBadge: { alignSelf: 'flex-start', backgroundColor: colors.successSoft, color: colors.success, fontSize: 10, fontWeight: '800', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 54 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.successSoft, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.success + '40' },
  infoText: { flex: 1, fontSize: 12, color: colors.success, fontWeight: '500', lineHeight: 18 },
});
