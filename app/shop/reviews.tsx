import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { apiClient } from '@/api/client';

interface Review {
  id: number;
  reviewer_name: string;
  shop_rating: number;
  delivery_rating: number;
  water_quality_rating: number;
  review_text: string | null;
  shop_response: string | null;
  shop_responded_at: string | null;
  created_at: string;
  order_id: number;
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={s <= Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color={s <= Math.round(rating) ? '#f59e0b' : '#c8d0da'}
        />
      ))}
    </View>
  );
}

export default function ShopReviewsScreen() {
  const { safeBack } = useAppNavigation();

  useAndroidBackHandler(() => {
    safeBack('/shop/settings');
  });

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Reply modal state
  const [replyModal, setReplyModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await apiClient.get('/shop-owner/reviews');
      if (res.data?.status === 1) {
        setReviews(res.data.data?.data ?? res.data.data ?? []);
      }
    } catch {
      // Fallback: try customer-facing reviews endpoint filtered by shop
      try {
        const res2 = await apiClient.get('/ratings', { params: { shop: true, limit: 50 } });
        if (res2.data?.status === 1) setReviews(res2.data.data?.data ?? res2.data.data ?? []);
      } catch {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load reviews.' });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const openReply = (review: Review) => {
    setSelectedReview(review);
    setReplyText(review.shop_response ?? '');
    setReplyModal(true);
  };

  const submitReply = async () => {
    if (!replyText.trim()) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Response cannot be empty.' });
      return;
    }
    if (!selectedReview) return;

    setSubmitting(true);
    try {
      const res = await apiClient.post(`/ratings/${selectedReview.id}/respond`, {
        response: replyText.trim(),
      });
      if (res.data?.status === 1) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === selectedReview.id
              ? { ...r, shop_response: replyText.trim(), shop_responded_at: new Date().toISOString() }
              : r
          )
        );
        Toast.show({ type: 'success', text1: 'Response Sent', text2: 'Your response has been published.' });
        setReplyModal(false);
      } else {
        throw new Error(res.data?.message ?? 'Failed to submit response');
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e?.response?.data?.message ?? e?.message ?? 'Could not submit response.' });
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.shop_rating, 0) / reviews.length
    : 0;
  const pendingCount = reviews.filter((r) => !r.shop_response).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BackButton fallback="/shop/settings" />
          <View>
            <Text style={styles.headerTitle}>Customer Reviews</Text>
            <Text style={styles.headerSub}>{reviews.length} reviews · {pendingCount} need reply</Text>
          </View>
        </View>
      </View>

      {/* SUMMARY BAR */}
      <LinearGradient colors={['#005d90', '#0077b6']} style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryVal}>{avgRating.toFixed(1)}</Text>
          <StarRow rating={avgRating} size={12} />
          <Text style={styles.summaryLabel}>Avg Rating</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryVal}>{reviews.length}</Text>
          <Text style={styles.summaryLabel}>Total Reviews</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryVal, pendingCount > 0 && { color: '#fde68a' }]}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>Pending Reply</Text>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReviews(); }} />}
      >
        {loading && <ActivityIndicator color="#005d90" style={{ marginTop: 40 }} />}

        {!loading && reviews.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="star-outline" size={48} color="#c8d0da" />
            <Text style={styles.emptyTitle}>No Reviews Yet</Text>
            <Text style={styles.emptySub}>Customer reviews will appear here after deliveries.</Text>
          </View>
        )}

        {!loading && reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewTop}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={18} color="#005d90" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewerName}>{review.reviewer_name ?? 'Customer'}</Text>
                <Text style={styles.reviewDate}>
                  Order #{review.order_id} · {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              {!review.shop_response && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>REPLY</Text>
                </View>
              )}
            </View>

            {/* RATINGS ROW */}
            <View style={styles.ratingsRow}>
              <View style={styles.ratingItem}>
                <Text style={styles.ratingLabel}>Shop</Text>
                <StarRow rating={review.shop_rating} />
              </View>
              {review.delivery_rating > 0 && (
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingLabel}>Delivery</Text>
                  <StarRow rating={review.delivery_rating} />
                </View>
              )}
              {review.water_quality_rating > 0 && (
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingLabel}>Quality</Text>
                  <StarRow rating={review.water_quality_rating} />
                </View>
              )}
            </View>

            {review.review_text ? (
              <Text style={styles.reviewText}>{review.review_text}</Text>
            ) : null}

            {/* SHOP RESPONSE */}
            {review.shop_response ? (
              <View style={styles.responseBox}>
                <View style={styles.responseHeader}>
                  <Ionicons name="chatbubble-ellipses" size={14} color="#005d90" />
                  <Text style={styles.responseLabel}>Your Response</Text>
                  <TouchableOpacity onPress={() => openReply(review)}>
                    <Text style={styles.editResponseText}>Edit</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.responseText}>{review.shop_response}</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.replyBtn} onPress={() => openReply(review)}>
                <Ionicons name="chatbubble-outline" size={15} color="#005d90" />
                <Text style={styles.replyBtnText}>Write a Response</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {/* REPLY MODAL */}
      <Modal visible={replyModal} animationType="slide" transparent onRequestClose={() => setReplyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalPill} />
            <Text style={styles.modalTitle}>
              {selectedReview?.shop_response ? 'Edit Response' : 'Write a Response'}
            </Text>
            <Text style={styles.modalSub}>
              Responding to {selectedReview?.reviewer_name ?? 'customer'}'s review
            </Text>

            <TextInput
              style={styles.replyInput}
              placeholder="Thank the customer, address concerns, or share context…"
              placeholderTextColor="#a0aab4"
              value={replyText}
              onChangeText={setReplyText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.charCount}>{replyText.length}/500</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setReplyModal(false)} disabled={submitting}>
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.7 }]} onPress={submitReply} disabled={submitting}>
                <LinearGradient colors={['#005d90', '#0077b6']} style={styles.submitBtnGrad}>
                  {submitting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons name="send" size={15} color="white" />
                      <Text style={styles.submitBtnText}>Publish</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#181c20' },
  headerSub: { fontSize: 11, color: '#707881', fontWeight: '500', marginTop: 1 },

  summaryBar: { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 20 },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  summaryVal: { fontSize: 22, fontWeight: '900', color: 'white' },
  summaryLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  content: { padding: 20, gap: 12, paddingBottom: 40 },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#64748b' },
  emptySub: { fontSize: 13, color: '#94a3b8', textAlign: 'center' },

  reviewCard: { backgroundColor: 'white', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  reviewerName: { fontSize: 14, fontWeight: '800', color: '#181c20' },
  reviewDate: { fontSize: 11, color: '#707881', marginTop: 1 },
  pendingBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pendingBadgeText: { fontSize: 9, fontWeight: '800', color: '#b45309', letterSpacing: 0.5 },

  ratingsRow: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  ratingItem: { alignItems: 'flex-start', gap: 3 },
  ratingLabel: { fontSize: 10, color: '#707881', fontWeight: '700', letterSpacing: 0.3 },

  reviewText: { fontSize: 13, color: '#404850', lineHeight: 19, marginBottom: 12, fontStyle: 'italic' },

  responseBox: { backgroundColor: '#f0f7ff', borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: '#005d90' },
  responseHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  responseLabel: { flex: 1, fontSize: 11, fontWeight: '700', color: '#005d90', letterSpacing: 0.3 },
  editResponseText: { fontSize: 11, color: '#005d90', fontWeight: '700', textDecorationLine: 'underline' },
  responseText: { fontSize: 12, color: '#334155', lineHeight: 17 },

  replyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbf7', backgroundColor: '#f0f7ff' },
  replyBtnText: { fontSize: 13, fontWeight: '700', color: '#005d90' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalPill: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e0e2e8', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#181c20', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#707881', marginBottom: 16 },
  replyInput: { backgroundColor: '#f7f9ff', borderRadius: 14, padding: 14, fontSize: 14, color: '#181c20', borderWidth: 1, borderColor: '#e0e2e8', minHeight: 110, marginBottom: 4 },
  charCount: { fontSize: 11, color: '#94a3b8', textAlign: 'right', marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelModalBtn: { flex: 0.4, paddingVertical: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e0e2e8', alignItems: 'center' },
  cancelModalBtnText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  submitBtn: { flex: 0.6, borderRadius: 16, overflow: 'hidden' },
  submitBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  submitBtnText: { color: 'white', fontSize: 15, fontWeight: '800' },
});
