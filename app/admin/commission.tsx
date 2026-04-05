import React, { useState } from 'react';
import { View, Text, ScrollView,
  RefreshControl, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdminCommissionScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const [fee, setFee] = useState('2.00');
  
  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Commission & Revenue</Text>

        {/* ADMIN WALLET CARD */}
        <LinearGradient
          colors={['#003a5c', '#00253b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.walletCard}
        >
          <Ionicons name="shield-checkmark" size={120} color="rgba(255,255,255,0.03)" style={styles.walletDecor} />
          <View style={styles.walletTop}>
            <View>
              <Text style={styles.walletLabel}>TOTAL REVENUE (ADMIN WALLET)</Text>
              <Text style={styles.walletBalance}>₹24,840.00</Text>
            </View>
            <View style={styles.walletIconWrap}>
              <Ionicons name="bar-chart" size={24} color="#005d90" />
            </View>
          </View>
          <View style={styles.dividerLight} />
          <View style={styles.walletStatsRow}>
            <View>
              <Text style={styles.statMiniLabel}>This Month</Text>
              <Text style={styles.statMiniVal}>+₹4,120.00</Text>
            </View>
            <View>
             <Text style={styles.statMiniLabel}>Pending Cash Settlements</Text>
             <Text style={styles.statMiniVal}>₹842.00</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.row}>
          {/* SETTINGS CARD */}
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.cardHeader}>Global Commission Fee</Text>
            <Text style={styles.cardSub}>Deducted atomically on every order.</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.rupeeSign}>₹</Text>
              <TextInput
                style={styles.priceInput}
                value={fee}
                onChangeText={setFee}
                keyboardType="decimal-pad"
              />
              <Text style={styles.perOrderText}>/ order</Text>
            </View>
            <TouchableOpacity style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Update Fee</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Manual Settlements</Text>
        <Text style={styles.sectionSubtitle}>Shops who owe you commission from Cash orders.</Text>
        
        <View style={styles.listContainer}>
          
          <View style={styles.settleRow}>
            <View style={styles.shopMeta}>
              <View style={styles.iconWrap}><Ionicons name="storefront" size={20} color="#005d90" /></View>
              <View>
                <Text style={styles.shopName}>Oceania Fresh</Text>
                <Text style={styles.shopDebtText}>Owes you <Text style={{fontWeight: '800', color: '#ba1a1a'}}>₹124.00</Text></Text>
              </View>
            </View>
            <TouchableOpacity style={styles.collectBtn}>
              <Text style={styles.collectBtnText}>Record Payment</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.settleRow}>
            <View style={styles.shopMeta}>
              <View style={styles.iconWrap}><Ionicons name="storefront" size={20} color="#005d90" /></View>
              <View>
                <Text style={styles.shopName}>AquaPrime</Text>
                <Text style={styles.shopDebtText}>Owes you <Text style={{fontWeight: '800', color: '#ba1a1a'}}>₹42.00</Text></Text>
              </View>
            </View>
            <TouchableOpacity style={styles.collectBtn}>
              <Text style={styles.collectBtnText}>Record Payment</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  pageTitle: { fontSize: 32, fontWeight: '900', color: '#181c20', letterSpacing: -0.5, marginBottom: 24 },
  
  walletCard: { padding: 24, borderRadius: 24, overflow: 'hidden', position: 'relative', shadowColor: '#003a5c', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 8, marginBottom: 20 },
  walletDecor: { position: 'absolute', bottom: -10, right: -10 },
  walletTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  walletLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 4 },
  walletBalance: { fontSize: 36, fontWeight: '900', color: 'white', letterSpacing: -1 },
  walletIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  dividerLight: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
  walletStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statMiniLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: 2 },
  statMiniVal: { fontSize: 16, color: 'white', fontWeight: '800' },

  row: { flexDirection: 'row', gap: 16, marginBottom: 28 },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardHeader: { fontSize: 16, fontWeight: '800', color: '#181c20', marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#707881', marginBottom: 16 },
  
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f4f9', borderRadius: 12, paddingHorizontal: 16, height: 50, marginBottom: 12 },
  rupeeSign: { fontSize: 18, fontWeight: '800', color: '#181c20', marginRight: 8 },
  priceInput: { flex: 1, fontSize: 18, fontWeight: '800', color: '#181c20' },
  perOrderText: { fontSize: 13, color: '#707881', fontWeight: '600' },
  saveBtn: { backgroundColor: '#003a5c', borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 13 },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#181c20', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: '#707881', marginBottom: 16 },

  listContainer: { backgroundColor: 'white', borderRadius: 20, padding: 16, borderLeftWidth: 3, borderLeftColor: '#ba1a1a', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  settleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  shopMeta: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center' },
  shopName: { fontSize: 15, fontWeight: '800', color: '#181c20', marginBottom: 2 },
  shopDebtText: { fontSize: 12, color: '#707881' },
  collectBtn: { backgroundColor: '#e0f0ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  collectBtnText: { color: '#005d90', fontWeight: '700', fontSize: 11 },

  divider: { height: 1, backgroundColor: '#f1f4f9', marginVertical: 4 },
});
