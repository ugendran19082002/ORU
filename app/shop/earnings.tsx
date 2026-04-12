import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StitchScreenNote } from '@/components/stitch/StitchScreenNote';
import { Logo } from '@/components/ui/Logo';
import { useOrderStore } from '@/stores/orderStore';
import { useRouter } from 'expo-router';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { BackButton } from '@/components/ui/BackButton';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';


export default function ShopEarningsScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();

  useAndroidBackHandler(() => {
    safeBack('/shop/settings');
  });

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);
  const { orders } = useOrderStore();
  const deliveredRevenue = orders.filter((order) => order.status === 'delivered').reduce((sum, order) => sum + order.total, 0);
  const activeRevenue = orders.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + order.total, 0);

  // P0 Sprint 3 - End of Day Reconciliation
  const [isReconciled, setIsReconciled] = React.useState(false);

  const handleReconcile = () => {
    setIsReconciled(true);
    setTimeout(() => {
      Toast.show({
        type: 'success',
        text1: 'End of Day Complete',
        text2: 'Accounts have been fully reconciled and settled.'
      });
    }, 300);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
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
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
      >
        <Text style={styles.pageTitle}>Earnings</Text>


        {/* SHOP SALES CARD */}
        <LinearGradient
          colors={['#006878', '#004e5b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.salesCard}
        >
          <Ionicons name="stats-chart" size={100} color="rgba(255,255,255,0.05)" style={styles.salesDecor} />
          
          <View style={styles.salesTop}>
            <View>
              <Text style={styles.salesLabel}>SHOP SALES BALANCE</Text>
              <Text style={styles.salesBalance}>Rs. {activeRevenue}.00</Text>
            </View>
            <View style={styles.salesIconWrap}>
              <Ionicons name="trending-up-outline" size={24} color="#006878" />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Business Logic: Pending Admin Commission from Cash Orders */}
          <View style={styles.reconciliationRow}>
            <View style={styles.pendingBlock}>
              <View style={styles.pendingRow}>
                <Ionicons name={isReconciled ? "checkmark-circle" : "alert-circle"} size={14} color={isReconciled ? "#a7f3d0" : "#ffdad6"} />
                <Text style={[styles.pendingLabel, isReconciled && { color: '#a7f3d0' }]}>
                  {isReconciled ? 'All Admin Dues Cleared' : 'Pending Admin Commission (Cash Orders)'}
                </Text>
              </View>
              <Text style={[styles.pendingAmount, isReconciled && { color: '#a7f3d0' }]}>
                {isReconciled ? 'Rs. 0.00' : '-Rs. 42.00'}
              </Text>
              <Text style={styles.pendingSub}>
                {isReconciled ? 'Reconciliation successful.' : 'Settle dues to avoid account suspension.'}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.settleBtn, isReconciled && { opacity: 0.5 }]} 
              onPress={handleReconcile}
              disabled={isReconciled}
            >
              <Text style={styles.settleBtnText}>{isReconciled ? 'Settled' : 'Pay Admin'}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <TouchableOpacity style={styles.withdrawBtn} onPress={() => {}}>
          <Ionicons name="cash-outline" size={20} color="#006878" />
          <Text style={styles.withdrawText}>Withdraw to Bank Account</Text>
        </TouchableOpacity>

        {/* METRICS GRID */}
        <Text style={styles.sectionHeader}>Today&apos;s Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <View style={[styles.statIconWrap, { backgroundColor: '#e0f0ff' }]}>
              <Ionicons name="receipt-outline" size={20} color="#005d90" />
            </View>
            <Text style={styles.statVal}>{orders.length}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statBox}>
            <View style={[styles.statIconWrap, { backgroundColor: '#e0f7fa' }]}>
              <Ionicons name="trending-up-outline" size={20} color="#006878" />
            </View>
            <Text style={styles.statVal}>Rs. {deliveredRevenue}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          <View style={styles.statBox}>
            <View style={[styles.statIconWrap, { backgroundColor: '#f1f4f9' }]}>
              <Ionicons name="water-outline" size={20} color="#707881" />
            </View>
            <Text style={styles.statVal}>62</Text>
            <Text style={styles.statLabel}>Cans Delivered</Text>
          </View>
        </View>

        {/* RECENT TRANSACTIONS */}
        <Text style={styles.sectionHeader}>Recent Transactions</Text>
        <View style={styles.trxList}>
          {/* UPI Order Math: ₹50 order -> ₹48 shop balance, ₹2 Admin auto split */}
          <View style={styles.trxItem}>
            <View style={[styles.trxIconWrap, { backgroundColor: '#e8f5e9' }]}>
              <Ionicons name="arrow-down-outline" size={16} color="#2e7d32" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.trxTitle}>Order #9823 (UPI)</Text>
              <Text style={styles.trxTime}>Online auto-split</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.trxAmtPos}>+₹48.00</Text>
              <Text style={styles.trxSub}>₹50 - ₹2 fee</Text>
            </View>
          </View>

          {/* Cash Order Math: Shop takes ₹50 cash, logs -₹2 debt */}
          <View style={styles.trxItem}>
            <View style={[styles.trxIconWrap, { backgroundColor: '#ffebee' }]}>
              <Ionicons name="arrow-up-outline" size={16} color="#c62828" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.trxTitle}>Order #9822 (Cash)</Text>
              <Text style={styles.trxTime}>Commission fee recorded</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.trxAmtNeg}>-₹2.00</Text>
              <Text style={styles.trxSub}>Shop kept ₹50 cash</Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.92)',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 22, fontWeight: '900', color: '#003a5c', letterSpacing: -0.5 },
  roleLabel: { fontSize: 9, fontWeight: '700', color: '#006878', letterSpacing: 1.5, marginTop: 3 },
  pageTitle: { fontSize: 32, fontWeight: '900', color: '#181c20', letterSpacing: -0.5, marginTop: 10, marginBottom: 20 },

  salesCard: {
    padding: 24, borderRadius: 24, overflow: 'hidden', position: 'relative',
    shadowColor: '#006878', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 8,
    marginBottom: 16,
  },
  salesDecor: { position: 'absolute', bottom: -20, right: -20 },
  salesTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  salesLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 4 },
  salesBalance: { fontSize: 36, fontWeight: '900', color: 'white', letterSpacing: -1 },
  salesIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 20 },
  
  reconciliationRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  pendingBlock: { flex: 1, paddingRight: 12 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  pendingLabel: { fontSize: 11, fontWeight: '700', color: '#ffdad6', flex: 1 },
  pendingAmount: { fontSize: 20, fontWeight: '900', color: '#ffdad6' },
  pendingSub: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  settleBtn: { backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  settleBtnText: { color: '#006878', fontWeight: '800', fontSize: 12 },

  withdrawBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'white', borderRadius: 16, paddingVertical: 16,
    borderWidth: 2, borderColor: '#e0f7fa', marginBottom: 28,
  },
  withdrawText: { color: '#006878', fontWeight: '800', fontSize: 15 },

  sectionHeader: { fontSize: 15, fontWeight: '800', color: '#181c20', letterSpacing: -0.3, marginBottom: 14 },
  
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  statBox: { flex: 1, backgroundColor: 'white', borderRadius: 18, padding: 16,shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, alignItems: 'center' },
  statIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statVal: { fontSize: 20, fontWeight: '900', color: '#181c20', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#707881', fontWeight: '500', textAlign: 'center' },

  trxList: { backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  trxItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f4f9' },
  trxIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  trxTitle: { fontSize: 14, fontWeight: '700', color: '#181c20', marginBottom: 2 },
  trxTime: { fontSize: 11, color: '#707881', fontWeight: '500' },
  trxAmtPos: { fontSize: 15, fontWeight: '800', color: '#2e7d32' },
  trxAmtNeg: { fontSize: 15, fontWeight: '800', color: '#c62828' },
  trxSub: { fontSize: 11, color: '#707881', fontWeight: '500', marginTop: 1 },
});
