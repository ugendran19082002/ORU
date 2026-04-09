import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Logo } from '@/components/ui/Logo';

export default function ShopSettingsScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const router = useRouter();
  const [shopOpen, setShopOpen] = useState(true);
  const [personAvailable, setPersonAvailable] = useState(true);
  const [stockAvailable, setStockAvailable] = useState(true);
  const [price, setPrice] = useState('45');
  const [category, setCategory] = useState('20L Water Can');
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [appPin, setAppPin] = useState('');
  const [shopId, setShopId] = useState<string>('');

  // Load saved preferences
  React.useEffect(() => {
    const loadSettings = async () => {
      const savedPin = await AsyncStorage.getItem('shop_app_pin');
      const savedBiometrics = await AsyncStorage.getItem('shop_fingerprint_enabled');
      const savedId = await AsyncStorage.getItem('shop_unique_id');
      if (savedPin) setAppPin(savedPin);
      if (savedBiometrics === 'true') setBiometricsEnabled(true);
      if (savedId) setShopId(savedId);
    };
    loadSettings();
  }, []);

  const handleToggleBiometrics = async () => {
    if (!biometricsEnabled) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware) {
        Alert.alert('Error', 'Your device does not support biometrics.');
        return;
      }
      if (!isEnrolled) {
        Alert.alert('Error', 'No biometrics found. Please set them up in your phone settings.');
        return;
      }

      setBiometricsEnabled(true);
      await AsyncStorage.setItem('shop_fingerprint_enabled', 'true');
    } else {
      setBiometricsEnabled(false);
      await AsyncStorage.setItem('shop_fingerprint_enabled', 'false');
    }
  };

  const handleUpdatePin = async (val: string) => {
    setAppPin(val);
    if (val.length === 4) {
      await AsyncStorage.setItem('shop_app_pin', val);
    }
  };

  const handleSignOut = () => {
    router.replace('/auth' as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <View style={styles.brandRow}>
            <Logo size="md" />
            <Text style={styles.brandName}>ThanniGo</Text>
          </View>
          <Text style={styles.roleLabel}>SHOP PANEL</Text>
        </View>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}>
        <Text style={styles.pageTitle}>Settings</Text>

        <Text style={styles.sectionHeader}>Operational Status</Text>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={styles.settingTitle}>Shop Open</Text>
              <Text style={styles.settingSub}>Turn off to close shop entirely.</Text>
            </View>
            <Switch value={shopOpen} onValueChange={setShopOpen} trackColor={{ false: '#e0e2e8', true: '#a7edff' }} thumbColor={shopOpen ? '#006878' : '#707881'} />
          </View>
          <View style={styles.dividerInner} />
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={styles.settingTitle}>Delivery Person</Text>
              <Text style={styles.settingSub}>Are delivery personnel currently active?</Text>
            </View>
            <Switch value={personAvailable} onValueChange={setPersonAvailable} trackColor={{ false: '#e0e2e8', true: '#a7edff' }} thumbColor={personAvailable ? '#006878' : '#707881'} />
          </View>
        </View>

        <Text style={styles.sectionHeader}>Inventory Setup</Text>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={styles.settingTitle}>Manage Products</Text>
              <Text style={styles.settingSub}>Set pricing and stock availability for global categories.</Text>
            </View>
            <TouchableOpacity style={styles.manageBtn} onPress={() => router.push('/shop/inventory' as any)}>
              <Text style={styles.manageBtnText}>Manage</Text>
              <Ionicons name="arrow-forward" size={14} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ACCOUNT SECURITY */}
        <Text style={styles.sectionHeader}>Account Security</Text>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.settingTitle}>App Lock PIN</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="keypad" size={20} color="#707881" style={{ marginRight: 10 }} />
              <TextInput 
                style={styles.priceInput}
                value={appPin}
                onChangeText={handleUpdatePin}
                placeholder="Set 4-digit PIN"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
              />
            </View>
            <Text style={styles.settingSub}>Use this PIN to access shop panel securely.</Text>
          </View>
          <View style={styles.dividerInner} />
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={styles.settingTitle}>Biometric Login</Text>
              <Text style={styles.settingSub}>Use Fingerprint / Face ID to unlock.</Text>
            </View>
            <Switch 
              value={biometricsEnabled} 
              onValueChange={handleToggleBiometrics} 
              trackColor={{ false: '#e2e8f0', true: '#a7edff' }} 
              thumbColor={biometricsEnabled ? '#006878' : '#707881'} 
            />
          </View>
        </View>

        {/* SHOP PROFILE */}
        <Text style={styles.sectionHeader}>Shop Profile</Text>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.profileIconWrap}>
              <Ionicons name="storefront" size={24} color="#006878" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.shopName}>Ocean Breeze Water Supply</Text>
              <Text style={styles.shopAddress}>42 Coastal Road, Koramangala, Bangalore</Text>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/shop/profile' as any)}>
              <Ionicons name="pencil" size={16} color="#005d90" />
            </TouchableOpacity>
          </View>
        </View>

        {/* SYSTEM ACTIONS */}
        <Text style={styles.sectionHeader}>System</Text>
        <View style={styles.card}>
          <View style={styles.menuItem}>
            <Ionicons name="finger-print-outline" size={20} color="#707881" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.menuText}>Shop ID (TGID)</Text>
              <Text style={{ fontSize: 11, color: '#006878', fontWeight: '800', letterSpacing: 0.5 }}>{shopId || '---'}</Text>
            </View>
            <View style={styles.verifiedMiniBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#10b981" />
              <Text style={styles.verifiedMiniText}>VERIFIED</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="document-text-outline" size={20} color="#707881" />
            <Text style={[styles.menuText, { marginLeft: 12 }]}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={16} color="#bfc7d1" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-buoy-outline" size={20} color="#707881" />
            <Text style={[styles.menuText, { marginLeft: 12 }]}>Support & Help</Text>
            <Ionicons name="chevron-forward" size={16} color="#bfc7d1" />
          </TouchableOpacity>
        </View>

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#ba1a1a" />
          <Text style={styles.logoutText}>Sign Out from Shop</Text>
        </TouchableOpacity>

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

  card: {
    backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  dividerInner: { height: 1, backgroundColor: '#f1f4f9', marginVertical: 14 },
  textInputFull: { backgroundColor: '#f1f4f9', borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 16, fontWeight: '700', color: '#181c20', marginBottom: 6 },
  
  inputGroup: { gap: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f4f9', borderRadius: 12, paddingHorizontal: 16, height: 56, marginBottom: 12 },
  
  settingTitle: { fontSize: 16, fontWeight: '800', color: '#181c20', marginBottom: 4 },
  settingSub: { fontSize: 12, color: '#707881', lineHeight: 18, marginBottom: 16 },

  inputWrapRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f4f9',
    borderRadius: 12, paddingHorizontal: 16, height: 56, marginBottom: 12,
  },
  rupeeSign: { fontSize: 22, fontWeight: '800', color: '#181c20', marginRight: 8 },
  priceInput: { flex: 1, fontSize: 16, fontWeight: '800', color: '#181c20' },
  
  saveBtn: {
    backgroundColor: '#006878', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
  
  manageBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#006878', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  manageBtnText: { color: 'white', fontSize: 13, fontWeight: '800' },

  sectionHeader: { fontSize: 14, fontWeight: '800', color: '#707881', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 10, marginLeft: 4 },

  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#e0f7fa', alignItems: 'center', justifyContent: 'center' },
  shopName: { fontSize: 16, fontWeight: '800', color: '#181c20', marginBottom: 2 },
  shopAddress: { fontSize: 12, color: '#707881', lineHeight: 16 },
  editBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#ebeef4', alignItems: 'center', justifyContent: 'center' },

  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  menuText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#181c20' },
  divider: { height: 1, backgroundColor: '#f1f4f9', marginVertical: 14, marginLeft: 32 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'white', borderWidth: 2, borderColor: '#ffdad6',
    borderRadius: 16, paddingVertical: 14, marginTop: 16,
  },
  logoutText: { color: '#ba1a1a', fontWeight: '800', fontSize: 15 },
  verifiedMiniBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#d1fae5' },
  verifiedMiniText: { fontSize: 9, fontWeight: '900', color: '#059669', letterSpacing: 0.5 },
});
