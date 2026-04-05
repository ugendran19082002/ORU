import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const TRANSACTIONS = [
  { id: '1', type: 'debit', title: 'Order #TN-9412', date: 'Today, 10:45 AM', amount: '110', method: 'UPI' },
  { id: '2', type: 'debit', title: 'Order #TN-9344', date: 'Yesterday, 04:30 PM', amount: '90', method: 'Wallet' },
  { id: '3', type: 'credit', title: 'Wallet Top-up', date: '02 Apr, 09:15 AM', amount: '500', method: 'Net Banking' },
];

export default function CustomerWalletScreen() {
  const [balance] = useState('420.00');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="help-circle-outline" size={24} color="#005d90" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />}
      >
        
        {/* WALLET CARD */}
        <LinearGradient
          colors={['#005d90', '#003a5c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.walletCard}
        >
          <Ionicons name="wallet" size={120} color="rgba(255,255,255,0.04)" style={styles.walletDecor} />
          <Text style={styles.walletLabel}>AVAILABLE BALANCE</Text>
          <Text style={styles.walletBalance}>₹{balance}</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="add" size={18} color="#005d90" />
              <Text style={styles.actionBtnText}>Add Money</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="arrow-up" size={18} color="white" />
              <Text style={[styles.actionBtnText, { color: 'white' }]}>Send</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* QUICK AMOUNTS */}
        <Text style={styles.sectionTitle}>Quick Top-up</Text>
        <View style={styles.quickAmtRow}>
          {['+ ₹100', '+ ₹200', '+ ₹500'].map((amt) => (
            <TouchableOpacity key={amt} style={styles.quickAmtBtn}>
              <Text style={styles.quickAmtText}>{amt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* TRANSACTIONS */}
        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {TRANSACTIONS.map((trx, index) => (
            <View key={trx.id}>
              <View style={styles.trxRow}>
                <View style={[styles.iconWrap, { backgroundColor: trx.type === 'credit' ? '#e8f5e9' : '#ffebee' }]}>
                  <Ionicons name={trx.type === 'credit' ? 'arrow-down' : 'arrow-up'} size={18} color={trx.type === 'credit' ? '#2e7d32' : '#c62828'} />
                </View>
                <View style={styles.trxInfo}>
                  <Text style={styles.trxTitle}>{trx.title}</Text>
                  <Text style={styles.trxSub}>{trx.date} • {trx.method}</Text>
                </View>
                <Text style={[styles.trxAmount, { color: trx.type === 'credit' ? '#2e7d32' : '#181c20' }]}>
                  {trx.type === 'credit' ? '+' : '-'}₹{trx.amount}
                </Text>
              </View>
              {index < TRANSACTIONS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.92)' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#181c20', letterSpacing: -0.5 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center' },

  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 },

  walletCard: { borderRadius: 24, padding: 24, position: 'relative', overflow: 'hidden', shadowColor: '#005d90', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8, marginBottom: 24 },
  walletDecor: { position: 'absolute', right: -20, bottom: -20 },
  walletLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 4 },
  walletBalance: { fontSize: 42, fontWeight: '900', color: 'white', letterSpacing: -1, marginBottom: 24 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16 },
  actionBtnText: { color: '#005d90', fontWeight: '800', fontSize: 13 },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#181c20', letterSpacing: -0.3, marginBottom: 14 },
  
  quickAmtRow: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  quickAmtBtn: { flex: 1, backgroundColor: 'white', paddingVertical: 14, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e0e2e8', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  quickAmtText: { color: '#005d90', fontWeight: '800', fontSize: 14 },

  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
  viewAllText: { color: '#005d90', fontWeight: '700', fontSize: 13, marginBottom: 2 },

  listContainer: { backgroundColor: 'white', borderRadius: 24, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  trxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  trxInfo: { flex: 1 },
  trxTitle: { fontSize: 15, fontWeight: '800', color: '#181c20', marginBottom: 2 },
  trxSub: { fontSize: 12, color: '#707881', fontWeight: '500' },
  trxAmount: { fontSize: 16, fontWeight: '900' },
  divider: { height: 1, backgroundColor: '#f1f4f9', marginLeft: 58 },
});
