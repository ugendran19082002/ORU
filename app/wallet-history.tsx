import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const WALLET_HISTORY = [
  { id: '1', type: 'credit', label: 'Refund — Order #9780', sub: 'Approved by admin', amount: '₹45.00', date: 'Apr 09, 2026', icon: 'arrow-down' },
  { id: '2', type: 'debit', label: 'Order #9831 Payment', sub: 'Blue Spring Aquatics', amount: '₹50.00', date: 'Apr 09, 2026', icon: 'arrow-up' },
  { id: '3', type: 'credit', label: 'Referral Bonus — Priya', sub: 'Friend joined ThanniGo', amount: '₹50.00', date: 'Apr 08, 2026', icon: 'people' },
  { id: '4', type: 'debit', label: 'Order #9820 Payment', sub: 'Aqua Pure Water', amount: '₹90.00', date: 'Apr 07, 2026', icon: 'arrow-up' },
  { id: '5', type: 'credit', label: 'Cashback — Loyalty Gold', sub: '10% applied', amount: '₹9.00', date: 'Apr 07, 2026', icon: 'ribbon' },
  { id: '6', type: 'credit', label: 'Added via UPI', sub: 'PhonePe · XXXXXXX1234', amount: '₹200.00', date: 'Apr 05, 2026', icon: 'card' },
  { id: '7', type: 'debit', label: 'Order #9810 Payment', sub: 'H2O Express', amount: '₹45.00', date: 'Apr 04, 2026', icon: 'arrow-up' },
];

const FILTERS = ['All', 'Credits', 'Debits'];

export default function WalletHistoryScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const balance = 254;
  const totalCredits = WALLET_HISTORY.filter(h => h.type === 'credit').reduce((s) => s + 50, 0);

  const filtered = WALLET_HISTORY.filter((h) => {
    const matchFilter = filter === 'All' || (filter === 'Credits' ? h.type === 'credit' : h.type === 'debit');
    const matchSearch = h.label.toLowerCase().includes(search.toLowerCase()) || h.sub.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet History</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* WALLET CARD */}
        <LinearGradient colors={['#005d90', '#006878']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.walletCard}>
          <Ionicons name="wallet" size={90} color="rgba(255,255,255,0.05)" style={styles.walletDecor} />
          <Text style={styles.walletLabel}>CURRENT BALANCE</Text>
          <Text style={styles.walletBalance}>₹{balance}.00</Text>
          <View style={styles.walletStats}>
            <View style={styles.walletStat}>
              <Ionicons name="arrow-down-outline" size={14} color="#4ade80" />
              <Text style={styles.walletStatLabel}>Total Credits</Text>
            </View>
            <View style={styles.walletStat}>
              <Ionicons name="arrow-up-outline" size={14} color="#f87171" />
              <Text style={styles.walletStatLabel}>Total Debits</Text>
            </View>
          </View>
        </LinearGradient>

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* FILTERS */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* TRANSACTIONS */}
        <Text style={styles.sectionTitle}>{filtered.length} transactions</Text>
        <View style={styles.txList}>
          {filtered.map((tx, i) => (
            <View key={tx.id} style={[styles.txRow, i < filtered.length - 1 && styles.txDivider]}>
              <View style={[styles.txIcon, { backgroundColor: tx.type === 'credit' ? '#e8f5e9' : '#ffebee' }]}>
                <Ionicons name={tx.icon as any} size={16} color={tx.type === 'credit' ? '#2e7d32' : '#c62828'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txLabel}>{tx.label}</Text>
                <Text style={styles.txSub}>{tx.sub}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.type === 'credit' ? '#2e7d32' : '#c62828' }]}>
                {tx.type === 'credit' ? '+' : '-'}{tx.amount}
              </Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  content: { padding: 20, gap: 14, paddingBottom: 80 },
  walletCard: { borderRadius: 24, padding: 24, overflow: 'hidden', shadowColor: '#005d90', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 8 },
  walletDecor: { position: 'absolute', bottom: -16, right: -16 },
  walletLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 6 },
  walletBalance: { fontSize: 42, fontWeight: '900', color: 'white', letterSpacing: -1, marginBottom: 16 },
  walletStats: { flexDirection: 'row', gap: 20 },
  walletStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  walletStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'white', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#e0e2e8' },
  searchInput: { flex: 1, fontSize: 14, color: '#181c20', fontWeight: '500' },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#e0e2e8' },
  filterPillActive: { backgroundColor: '#005d90', borderColor: '#005d90' },
  filterText: { fontSize: 13, fontWeight: '700', color: '#707881' },
  filterTextActive: { color: 'white' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5 },
  txList: { backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  txDivider: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  txIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txLabel: { fontSize: 13, fontWeight: '700', color: '#181c20', marginBottom: 2 },
  txSub: { fontSize: 11, color: '#707881', fontWeight: '500', marginBottom: 2 },
  txDate: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  txAmount: { fontSize: 14, fontWeight: '800' },
});
