import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Switch, RefreshControl
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { adminApi } from '@/api/adminApi';

export default function AdminGrowthScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [levels, setLevels] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'config' | 'tiers'>('config');

  const fetchData = useCallback(async () => {
    try {
      const [sRes, lRes] = await Promise.all([
        adminApi.getGrowthSettings(),
        adminApi.getLoyaltyLevels()
      ]);
      setSettings(sRes.data);
      setLevels(lRes.data);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Fetch Error', text2: 'Failed to load growth engine data' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpdateSettings = async (type: 'loyalty' | 'referral', data: any) => {
    try {
      await adminApi.updateGrowthSettings({ [type]: data });
      Toast.show({ type: 'success', text1: 'Settings Updated' });
      fetchData();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Update Failed' });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#005d90" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Growth Engine</Text>
        <TouchableOpacity onPress={fetchData}>
          <Ionicons name="refresh" size={20} color="#005d90" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
      >
        {/* TABS */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'config' && styles.tabActive]}
            onPress={() => setActiveTab('config')}
          >
            <Text style={[styles.tabText, activeTab === 'config' && styles.tabTextActive]}>Configuration</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tiers' && styles.tabActive]}
            onPress={() => setActiveTab('tiers')}
          >
            <Text style={[styles.tabText, activeTab === 'tiers' && styles.tabTextActive]}>Loyalty Tiers</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'config' && settings && (
          <>
            {/* LOYALTY SECTION */}
            <View style={styles.sectionHeader}>
              <Ionicons name="ribbon-outline" size={20} color="#005d90" />
              <Text style={styles.sectionTitle}>Loyalty Settings (Phase 1)</Text>
            </View>
            <View style={styles.card}>
              <ConfigItem
                label="Earn Rate (Points per ₹1)"
                value={settings.loyalty.earn_points_per_rupee.toString()}
                onChange={(v) => handleUpdateSettings('loyalty', { earn_points_per_rupee: parseFloat(v) })}
                keyboardType="numeric"
                helper="e.g. 0.1 = 1 point per ₹10 spent"
              />
              <ConfigItem
                label="Redeem Ratio (Points per ₹1)"
                value={settings.loyalty.points_to_currency_ratio.toString()}
                onChange={(v) => handleUpdateSettings('loyalty', { points_to_currency_ratio: parseFloat(v) })}
                keyboardType="numeric"
                helper="e.g. 10 = ₹1 discount for every 10 points"
              />
              <ConfigItem
                label="Min Order for Redeem (₹)"
                value={settings.loyalty.min_order_amount_for_redeem.toString()}
                onChange={(v) => handleUpdateSettings('loyalty', { min_order_amount_for_redeem: parseFloat(v) })}
                keyboardType="numeric"
              />
            </View>

            {/* REFERRAL SECTION */}
            <View style={styles.sectionHeader}>
              <Ionicons name="people-outline" size={20} color="#005d90" />
              <Text style={styles.sectionTitle}>Referral Rewards (Admin Funded)</Text>
            </View>
            <View style={styles.card}>
              <ConfigItem
                label="Signup Bonus (PTS)"
                value={settings.referral.signup_bonus_points.toString()}
                onChange={(v) => handleUpdateSettings('referral', { signup_bonus_points: parseInt(v) })}
                keyboardType="numeric"
              />
              <ConfigItem
                label="First Order (Referrer) (PTS)"
                value={settings.referral.first_order_bonus_referrer.toString()}
                onChange={(v) => handleUpdateSettings('referral', { first_order_bonus_referrer: parseInt(v) })}
                keyboardType="numeric"
              />
              <ConfigItem
                label="First Order (Referee) (PTS)"
                value={settings.referral.first_order_bonus_referee.toString()}
                onChange={(v) => handleUpdateSettings('referral', { first_order_bonus_referee: parseInt(v) })}
                keyboardType="numeric"
              />
              <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Enable Daily Caps</Text>
                  <Switch 
                    value={settings.referral.status === 'active'} 
                    onValueChange={(val) => handleUpdateSettings('referral', { status: val ? 'active' : 'inactive' })}
                  />
              </View>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color="#005d90" />
              <Text style={styles.infoText}>
                Note: All loyalty points issued currently are Admin-Funded. Payouts to shops are NOT reduced when customers use these points.
              </Text>
            </View>
          </>
        )}

        {activeTab === 'tiers' && (
          <View style={{ gap: 12 }}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy-outline" size={20} color="#005d90" />
              <Text style={styles.sectionTitle}>Platform Tiers</Text>
            </View>
            {levels.map((level) => (
              <TouchableOpacity key={level.id} style={styles.tierCard} onPress={() => {}}>
                <View style={styles.tierMain}>
                  <Text style={styles.tierName}>{level.name}</Text>
                  <Text style={styles.tierReq}>{level.min_points} points required</Text>
                </View>
                <View style={styles.tierBenefit}>
                   <Text style={styles.tierDiscount}>{level.discount_percentage}% OFF</Text>
                   <Text style={styles.tierSub}>Auto-Coupon</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ConfigItem({ label, value, onChange, keyboardType = 'default', helper }: any) {
  const [localVal, setLocalVal] = useState(value);
  useEffect(() => { setLocalVal(value); }, [value]);

  return (
    <View style={styles.configItem}>
      <Text style={styles.configLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={localVal}
          onChangeText={setLocalVal}
          onBlur={() => localVal !== value && onChange(localVal)}
          keyboardType={keyboardType}
        />
      </View>
      {helper && <Text style={styles.helperText}>{helper}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfdff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#ebeef4',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1a1c1e' },
  scrollContent: { padding: 20 },
  tabRow: {
    flexDirection: 'row', backgroundColor: '#f1f4f9', borderRadius: 14, padding: 4, marginBottom: 25,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  tabText: { fontSize: 14, fontWeight: '700', color: '#707881' },
  tabTextActive: { color: '#005d90' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1a1c1e' },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#ebeef4' },
  configItem: { marginBottom: 16 },
  configLabel: { fontSize: 13, fontWeight: '700', color: '#707881', marginBottom: 8 },
  inputWrap: { backgroundColor: '#f1f4f9', borderRadius: 12, borderWidth: 1, borderColor: '#e1e3e8' },
  input: { paddingHorizontal: 15, paddingVertical: 12, fontSize: 15, fontWeight: '600', color: '#1a1c1e' },
  helperText: { fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: '500' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: '#1a1c1e' },
  infoBox: { flexDirection: 'row', gap: 10, backgroundColor: '#eef6ff', borderRadius: 15, padding: 15, marginBottom: 25 },
  infoText: { flex: 1, fontSize: 12, color: '#005d90', lineHeight: 18, fontWeight: '600' },
  tierCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'white', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#ebeef4',
  },
  tierName: { fontSize: 16, fontWeight: '900', color: '#1a1c1e', marginBottom: 2 },
  tierReq: { fontSize: 12, color: '#707881', fontWeight: '600' },
  tierBenefit: { alignItems: 'flex-end' },
  tierDiscount: { fontSize: 18, fontWeight: '900', color: '#005d90' },
  tierSub: { fontSize: 10, color: '#94a3b8', fontWeight: '700', letterSpacing: 0.5 },
});


