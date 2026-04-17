import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import { adminApi, AdminShop } from '@/api/adminApi';
import Toast from 'react-native-toast-message';
import { useAppSession } from '@/providers/AppSessionProvider';
import { Shadow, thannigoPalette, roleAccent } from '@/constants/theme';

const ADMIN_ACCENT = roleAccent.admin;

type FilterStatus = 'all' | 'pending_review' | 'active' | 'rejected' | 'ready_for_activation' | 'partially_rejected';

export default function AdminShopsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const router = useRouter();
  const { user, status } = useAppSession();

  const [refreshing, setRefreshing] = useState(false);
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [loading, setLoading] = useState(true);

  if (status === 'loading') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={ADMIN_ACCENT} />
      </View>
    );
  }

  if (status === 'authenticated' && (!user || user?.role !== 'admin')) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
        <Ionicons name="lock-closed" size={64} color={ADMIN_ACCENT} />
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#1e293b', marginTop: 16 }}>Restricted Access</Text>
        <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8 }}>
          You do not have administrative permissions to view the partner list.
        </Text>
      </View>
    );
  }
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchShops = useCallback(async () => {
    try {
      setLoading(true);
      // If we are filtering by one of the onboarding statuses, we fetch 'all' or multiple and filter locally
      // Or we can just pass the filter if the backend supports it.
      const filter = statusFilter === 'all' ? undefined : statusFilter;
      const res = await adminApi.listShops(filter);
      if (res.status === 1) {
        setShops(res.data);
      }
    } catch (error: any) {
      console.error('[Admin Shops] Load Error:', error);
      Toast.show({ type: 'error', text1: 'Sync Error', text2: 'Failed to fetch partner list.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchShops();
  }, [fetchShops]);

  const filteredShops = (shops || []).filter(shop =>
    (shop?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (shop?.owner?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getShopUI = (shop: AdminShop) => {
    if (shop.status === 'active') {
      return { label: 'ACTIVE', bg: '#ecfdf5', text: '#059669', icon: 'checkmark-circle' as const };
    }
    if (shop.onboarding_status === 'ready_for_activation') {
      return { label: 'READY', bg: '#ecfdf5', text: '#059669', icon: 'checkmark-circle' as const };
    }
    if (shop.onboarding_status === 'partially_rejected') {
      return { label: 'FIX REQ', bg: '#fff7ed', text: '#d97706', icon: 'alert-circle' as const };
    }
    if (shop.status === 'pending_review') {
      return { label: 'PENDING', bg: '#fff7ed', text: '#d97706', icon: 'time' as const };
    }
    if (shop.status === 'rejected') {
      return { label: 'REJECTED', bg: '#fef2f2', text: '#dc2626', icon: 'close-circle' as const };
    }
    return { label: shop.status.toUpperCase(), bg: '#f1f5f9', text: '#64748b', icon: 'help-circle' as const };
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.headerContent}>
          <Text style={styles.pageTitle}>Vendors</Text>
          <Text style={styles.headerSub}>{shops.length} total partners registered</Text>
        </View>
      </SafeAreaView>

          <View style={[styles.filterBar, isDesktop && { alignItems: 'center' }]}>
        <View style={{ width: '100%', maxWidth: 1200, paddingHorizontal: isDesktop ? 24 : 0, gap: 16 }}>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color="#94a3b8" />
            <TextInput
              placeholder="Search by shop or owner name..."
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
            {(['all', 'pending_review', 'active', 'rejected', 'ready_for_activation', 'partially_rejected'] as FilterStatus[]).map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setStatusFilter(s)}
                style={[styles.tab, statusFilter === s && styles.tabActive]}
              >
                <Text style={[styles.tabText, statusFilter === s && styles.tabTextActive]}>
                  {s.replace(/_/g, ' ').toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ADMIN_ACCENT]} tintColor={ADMIN_ACCENT} />}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120, alignItems: 'center' }
        ]}
      >
        <View style={{ width: '100%', maxWidth: 1200 }}>
          {loading ? (
            <ActivityIndicator size="large" color={ADMIN_ACCENT} style={{ marginTop: 60 }} />
          ) : filteredShops.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="storefront-outline" size={64} color="#e2e8f0" />
              <Text style={styles.emptyText}>No shops found matching your criteria.</Text>
            </View>
          ) : (
            <View style={[styles.grid, { flexDirection: 'row', flexWrap: 'wrap', gap: 16 }]}>
              {filteredShops.map((shop) => {
                const theme = getShopUI(shop);
                return (
                  <TouchableOpacity
                    key={shop.id}
                    onPress={() => router.push(`/admin/vendors/${shop.id}` as Href)}
                    style={[
                      styles.shopCard,
                      { width: isDesktop ? '48%' : '100%', marginBottom: 0 }
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardTop}>
                      <View style={styles.shopIcon}>
                        <Ionicons name="business" size={24} color={ADMIN_ACCENT} />
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: theme.bg }]}>
                        <Ionicons name={theme.icon} size={12} color={theme.text} />
                        <Text style={[styles.statusText, { color: theme.text }]}>{theme.label}</Text>
                      </View>
                    </View>

                    <Text style={styles.shopName} numberOfLines={1}>{shop?.name || 'Unnamed Shop'}</Text>
                    <Text style={styles.ownerName}>{shop?.owner?.name || 'Unknown Owner'}</Text>

                    <View style={styles.cardFooter}>
                      <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={14} color="#94a3b8" />
                        <Text style={styles.metaText}>{shop?.shop_type || 'Retailer'}</Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
                        <Text style={styles.metaText}>{shop?.created_at ? new Date(shop.created_at).toLocaleDateString() : '—'}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" style={{ marginLeft: 'auto' }} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: thannigoPalette.background },
  headerSafe: {
    backgroundColor: thannigoPalette.surface,
    borderBottomWidth: 1,
    borderBottomColor: thannigoPalette.borderSoft,
    alignItems: 'center',
  },
  headerContent: {
    width: '100%',
    maxWidth: 1200,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  pageTitle: { fontSize: 28, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: thannigoPalette.neutral, fontWeight: '600', marginTop: 2 },

  filterBar: { paddingVertical: 16, backgroundColor: thannigoPalette.surface, borderBottomWidth: 1, borderBottomColor: thannigoPalette.borderSoft },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: thannigoPalette.background, borderRadius: 16, paddingHorizontal: 16, height: 48 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600', color: thannigoPalette.darkText },

  tabScroll: { marginTop: 4 },
  tabContent: { gap: 8, paddingRight: 24 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: thannigoPalette.background },
  tabActive: { backgroundColor: ADMIN_ACCENT },
  tabText: { fontSize: 11, fontWeight: '800', color: thannigoPalette.neutral },
  tabTextActive: { color: 'white' },

  scrollContent: { padding: 24, paddingBottom: 100 },
  grid: { gap: 16 },
  shopCard: { backgroundColor: thannigoPalette.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: thannigoPalette.borderSoft, ...Shadow.xs },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  shopIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: thannigoPalette.background, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  shopName: { fontSize: 18, fontWeight: '900', color: thannigoPalette.darkText, marginBottom: 4 },
  ownerName: { fontSize: 13, fontWeight: '600', color: thannigoPalette.neutral, marginBottom: 16 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: thannigoPalette.borderSoft },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, fontWeight: '600', color: thannigoPalette.neutral },
  divider: { width: 4, height: 4, borderRadius: 2, backgroundColor: thannigoPalette.borderSoft },

  emptyWrap: { alignItems: 'center', marginTop: 100, gap: 16 },
  emptyText: { fontSize: 15, color: thannigoPalette.neutral, fontWeight: '600' },
});
