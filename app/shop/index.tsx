import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Logo } from '@/components/ui/Logo';

const ACTIVE_ORDER = {
  id: '9824',
  customer: 'Rahul Sharma',
  phone: '+91 98765 43210',
  qty: 3,
  unit: '20L',
  address: 'Flat 402, Ocean Breeze Apartments, Sunset Boulevard, Coastal Road.',
  isPriority: true,
};

type OrderAction = 'accept' | 'reject' | 'delivered';
type TabState = 'active' | 'completed';

export default function ShopOrdersScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const [actionDone, setActionDone] = useState<OrderAction | null>(null);
  const [activeTab, setActiveTab] = useState<TabState>('active');

  const router = useRouter();

  const handleAction = (action: OrderAction) => {
    setActionDone(action);
    if (action === 'delivered') {
      setTimeout(() => {
        setActionDone(null);
        router.push(`/shop/order/${ACTIVE_ORDER.id}` as any);
      }, 700);
    } else {
      setTimeout(() => setActionDone(null), 2000);
    }
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
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={22} color="#005d90" />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
      >
        <Text style={styles.pageTitle}>Orders</Text>

        {/* CUSTOM TABS */}
        <View style={styles.tabsWrap}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'active' && styles.tabBtnActive]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'completed' && styles.tabBtnActive]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>Completed</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'active' && (
          <>
            <Text style={styles.sectionHeader}>Pending Actions</Text>
            {/* INCOMING ORDER CARD */}
            <View style={styles.orderCard}>
              <View style={styles.orderTop}>
                <View style={styles.orderIconWrap}>
                  <Ionicons name="water" size={22} color="#004e5b" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.priorityLabel}>Priority Order</Text>
                  <Text style={styles.customerName}>{ACTIVE_ORDER.customer}</Text>
                </View>
                <View style={styles.orderIdBadge}>
                  <Text style={styles.orderIdText}>#{ACTIVE_ORDER.id}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <Ionicons name="layers-outline" size={18} color="#005d90" />
                </View>
                <Text style={styles.detailValue}>
                  {ACTIVE_ORDER.qty} Cans <Text style={styles.detailValueSub}>({ACTIVE_ORDER.unit})</Text>
                </Text>
              </View>

              <TouchableOpacity 
                activeOpacity={0.7} 
                style={styles.detailRow}
                onPress={() => router.push({
                  pathname: "/map-preview",
                  params: { lat: "28.4595", lng: "77.0266", title: ACTIVE_ORDER.customer }
                })}
              >
                <View style={styles.detailIconWrap}>
                  <Ionicons name="location-outline" size={18} color="#707881" />
                </View>
                <Text style={styles.addressText}>{ACTIVE_ORDER.address}</Text>
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={styles.actionGrid}>
                <TouchableOpacity activeOpacity={0.9} style={{ flex: 1 }} onPress={() => handleAction('accept')}>
                  <LinearGradient colors={['#005d90', '#0077b6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.acceptBtn}>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={styles.acceptBtnText}>ACCEPT</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAction('reject')}>
                  <Ionicons name="close" size={18} color="#ba1a1a" />
                  <Text style={styles.rejectBtnText}>REJECT</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.deliveredBtn} onPress={() => handleAction('delivered')}>
                <Ionicons name="bicycle" size={18} color="white" />
                <Text style={styles.deliveredBtnText}>MARK AS DELIVERED</Text>
              </TouchableOpacity>

              {/* STATUS MESSAGE */}
              {actionDone && (
                <View style={[styles.statusMsg, actionDone === 'accept' ? styles.statusMsgSuccess : actionDone === 'reject' ? styles.statusMsgError : styles.statusMsgInfo]}>
                  <Text style={styles.statusMsgText}>
                    {actionDone === 'accept' ? 'Order Accepted!' : actionDone === 'reject' ? 'Order Rejected' : 'Marked as Delivered!'}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {activeTab === 'completed' && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color="#bfc7d1" />
            <Text style={styles.emptyTitle}>No completed orders yet</Text>
            <Text style={styles.emptySub}>Orders marked as delivered will appear here.</Text>
          </View>
        )}
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
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f4f9',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 8, right: 8, width: 8, height: 8,
    backgroundColor: '#ba1a1a', borderRadius: 4, borderWidth: 1.5, borderColor: '#f1f4f9',
  },

  pageTitle: { fontSize: 32, fontWeight: '900', color: '#181c20', letterSpacing: -0.5, marginTop: 10, marginBottom: 20 },

  tabsWrap: {
    flexDirection: 'row', backgroundColor: '#ebeef4', borderRadius: 16, padding: 4, marginBottom: 24,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  tabBtnActive: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#707881' },
  tabTextActive: { color: '#005d90', fontWeight: '800' },

  sectionHeader: { fontSize: 13, fontWeight: '800', color: '#707881', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },

  orderCard: {
    backgroundColor: 'white', borderRadius: 24, padding: 20,
    shadowColor: '#003a5c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
  },
  orderTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  orderIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#a7edff', alignItems: 'center', justifyContent: 'center' },
  priorityLabel: { fontSize: 10, fontWeight: '700', color: '#006878', textTransform: 'uppercase', letterSpacing: 1 },
  customerName: { fontSize: 18, fontWeight: '900', color: '#181c20' },
  orderIdBadge: { backgroundColor: '#e0f0ff', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  orderIdText: { color: '#005d90', fontWeight: '800', fontSize: 11 },

  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  detailIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center' },
  detailValue: { fontSize: 16, fontWeight: '900', color: '#181c20' },
  detailValueSub: { fontSize: 13, fontWeight: '500', color: '#707881' },
  addressText: { fontSize: 13, color: '#181c20', lineHeight: 18, flex: 1 },

  actionGrid: { flexDirection: 'row', gap: 10, marginVertical: 12 },
  acceptBtn: { borderRadius: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  acceptBtnText: { color: 'white', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'white', borderRadius: 16, borderWidth: 2, borderColor: '#ffdad6' },
  rejectBtnText: { color: '#ba1a1a', fontWeight: '800', fontSize: 13 },
  deliveredBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#006878', borderRadius: 16, paddingVertical: 14 },
  deliveredBtnText: { color: 'white', fontWeight: '800', fontSize: 13 },

  statusMsg: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginTop: 12 },
  statusMsgSuccess: { backgroundColor: '#006878' },
  statusMsgError: { backgroundColor: '#ba1a1a' },
  statusMsgInfo: { backgroundColor: '#005d90' },
  statusMsgText: { color: 'white', fontWeight: '700', fontSize: 13, marginLeft: 8 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#181c20', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#707881', marginTop: 4, textAlign: 'center' },
});
