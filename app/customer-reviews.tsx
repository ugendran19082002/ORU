import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/providers/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { apiClient } from '@/api/client';

interface Review {
  id: string;
  shop: string;
  rating: number;
  date: string;
  comment: string;
  order_id?: string | number;
}

function mapReview(r: any): Review {
  return {
    id:      String(r.id),
    shop:    r.Shop?.name ?? r.shop_name ?? 'Shop',
    rating:  Number(r.rating) || 5,
    date:    r.created_at
      ? new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '',
    comment: r.comment ?? r.review ?? '',
    order_id: r.order_id,
  };
}

export default function CustomerReviewsScreen() {
  const { colors, isDark } = useAppTheme();
  const { safeBack } = useAppNavigation();
  useAndroidBackHandler(() => { safeBack('/(tabs)/profile'); });

  const [reviews, setReviews]     = useState<Review[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await apiClient.get('/ratings', { params: { mine: true } });
      const list: any[] = res.data?.data?.data ?? res.data?.data ?? [];
      setReviews(list.map(mapReview));
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load reviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(true); }, [load]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <BackButton fallback="/(tabs)/profile" />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>My Reviews</Text>
          <Text style={styles.headerSub}>Manage feedback you've given</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#005d90" style={{ marginTop: 80 }} />
      ) : error ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="cloud-offline-outline" size={56} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Failed to Load</Text>
          <Text style={styles.emptySub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />}
        >
          {reviews.length === 0 && (
            <View style={styles.emptyWrap}>
              <Ionicons name="star-outline" size={56} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Reviews Yet</Text>
              <Text style={styles.emptySub}>Rate your completed orders to see reviews here.</Text>
            </View>
          )}
          {reviews.map(review => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.shopRow}>
                <View style={styles.shopIcon}>
                  <Ionicons name="storefront" size={20} color="#005d90" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shopName}>{review.shop}</Text>
                  <Text style={styles.date}>{review.date}</Text>
                </View>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Ionicons key={star} name={star <= review.rating ? 'star' : 'star-outline'} size={14} color="#f59e0b" />
                  ))}
                </View>
              </View>
              {review.comment ? (
                <Text style={styles.comment}>"{review.comment}"</Text>
              ) : null}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  headerSub: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  content: { padding: 20, gap: 16, paddingBottom: 60 },
  emptyWrap: { flex: 1, alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#181c20' },
  emptySub: { fontSize: 13, color: '#707881', textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { backgroundColor: '#005d90', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  retryBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
  reviewCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  shopIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0f7ff', alignItems: 'center', justifyContent: 'center' },
  shopName: { fontSize: 15, fontWeight: '800', color: '#181c20', marginBottom: 2 },
  date: { fontSize: 11, color: '#707881', fontWeight: '500' },
  stars: { flexDirection: 'row', gap: 2 },
  comment: { fontSize: 14, color: '#475569', lineHeight: 20, fontStyle: 'italic', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12 },
});
