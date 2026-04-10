import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';



const SHOPS = [
  { id: '1', name: 'Blue Spring Aquatics', price: 45, eta: '8 min', rating: 4.8, distance: '0.8 km', available: true, reason: '' },
  { id: '2', name: 'Aqua Pure Water', price: 42, eta: '12 min', rating: 4.5, distance: '1.4 km', available: true, reason: '' },
  { id: '3', name: 'H2O Express', price: 48, eta: '18 min', rating: 4.7, distance: '2.1 km', available: true, reason: '' },
  { id: '4', name: 'Crystal Clear Waters', price: 50, eta: 'Closed', rating: 4.9, distance: '2.8 km', available: false, reason: 'Reopens at 9 AM' },
];

export default function ShopAlternativesScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();

  useAndroidBackHandler(() => {
    safeBack('/(tabs)');
  });


  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <BackButton fallback="/(tabs)" />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Available Shops</Text>
          <Text style={styles.headerSub}>Your preferred shop is unavailable</Text>
        </View>
      </View>


      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ALERT CARD */}
        <View style={styles.alertCard}>
          <Ionicons name="storefront-outline" size={22} color="#b45309" />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>WaterWell Pvt. Ltd. is currently unavailable</Text>
            <Text style={styles.alertSub}>Here are nearby shops that can deliver right now.</Text>
          </View>
        </View>

        {SHOPS.map((shop) => (
          <View key={shop.id} style={[styles.shopCard, !shop.available && styles.shopCardUnavail]}>
            <View style={styles.shopTop}>
              <View style={styles.shopIcon}>
                <Ionicons name="storefront" size={22} color={shop.available ? '#005d90' : '#94a3b8'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.shopName, !shop.available && styles.shopNameGray]}>{shop.name}</Text>
                <View style={styles.shopMeta}>
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text style={styles.shopRating}>{shop.rating}</Text>
                  <Text style={styles.shopDot}>·</Text>
                  <Text style={styles.shopDist}>{shop.distance}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.shopPrice, !shop.available && { color: '#94a3b8' }]}>₹{shop.price}</Text>
                <Text style={styles.shopEta}>{shop.eta}</Text>
              </View>
            </View>

            {shop.available ? (
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() => Alert.alert('Shop Selected', `Ordering from ${shop.name}`)}
              >
                <LinearGradient colors={['#005d90', '#0077b6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.selectBtnGrad}>
                  <Text style={styles.selectBtnText}>Order from this shop</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.unavailRow}>
                <Ionicons name="time-outline" size={14} color="#94a3b8" />
                <Text style={styles.unavailText}>{shop.reason}</Text>
              </View>
            )}
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  headerSub: { fontSize: 12, color: '#b45309', fontWeight: '600', marginTop: 1 },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  alertCard: { flexDirection: 'row', gap: 12, backgroundColor: '#fef3c7', borderRadius: 16, padding: 16, alignItems: 'flex-start', borderWidth: 1, borderColor: '#fde68a' },
  alertTitle: { fontSize: 14, fontWeight: '800', color: '#b45309', marginBottom: 4 },
  alertSub: { fontSize: 12, color: '#92400e', lineHeight: 16 },
  shopCard: { backgroundColor: 'white', borderRadius: 20, padding: 18, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  shopCardUnavail: { opacity: 0.7 },
  shopTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shopIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#f0f7ff', alignItems: 'center', justifyContent: 'center' },
  shopName: { fontSize: 16, fontWeight: '800', color: '#181c20', marginBottom: 4 },
  shopNameGray: { color: '#94a3b8' },
  shopMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shopRating: { fontSize: 12, fontWeight: '700', color: '#181c20' },
  shopDot: { fontSize: 12, color: '#94a3b8' },
  shopDist: { fontSize: 12, color: '#707881', fontWeight: '500' },
  shopPrice: { fontSize: 18, fontWeight: '900', color: '#005d90' },
  shopEta: { fontSize: 11, color: '#707881', fontWeight: '600', marginTop: 2 },
  selectBtn: { borderRadius: 14, overflow: 'hidden' },
  selectBtnGrad: { paddingVertical: 13, alignItems: 'center' },
  selectBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
  unavailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', borderRadius: 10, padding: 10 },
  unavailText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
});
