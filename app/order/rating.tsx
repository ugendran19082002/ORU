import React, { useState } from 'react';
import { View, Text, ScrollView,
  RefreshControl, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '@/providers/ThemeContext';
import type { ColorSchemeColors } from '@/providers/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import { apiClient } from '@/api/client';
import { useOrderStore } from '@/stores/orderStore';

import { Shadow, roleAccent, roleSurface, roleGradients } from '@/constants/theme';

const CUSTOMER_ACCENT = roleAccent.customer;
const CUSTOMER_SURF = roleSurface.customer;
const CUSTOMER_GRAD: [string, string] = [roleGradients.customer.start, roleGradients.customer.end];

export default function OrderRatingScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { orders, activeOrderId } = useOrderStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetOrderId = orderId || activeOrderId || '';
  const order = orders.find((o) => o.id === targetOrderId) ?? orders[0];

  useAndroidBackHandler(() => { safeBack('/(tabs)'); });

  const submitFeedback = async () => {
    if (rating === 0) {
      Toast.show({ type: 'error', text1: 'Rating Required', text2: 'Please select at least 1 star.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post('/engagement/ratings', {
        order_id: order?.id ?? targetOrderId,
        rating,
        comment: feedback.trim() || undefined,
      });
      Toast.show({ type: 'success', text1: 'Thanks for your feedback!' });
      // Per spec: rating < 3 → route to complaint flow
      if (rating < 3) {
        router.replace('/report-issue' as any);
      } else {
        router.replace('/(tabs)' as any);
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Submit Failed', text2: err?.message ?? 'Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* HEADER */}
      <View style={styles.header}>
        <BackButton fallback="/(tabs)" />
        <Text style={styles.headerTitle}>Order Delivered</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[CUSTOMER_ACCENT]} tintColor={CUSTOMER_ACCENT} />} contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 40 }}>
        
        <View style={styles.successIconWrap}>
          <Ionicons name="checkmark-circle" size={80} color="#10b981" />
        </View>
        
        <Text style={styles.successTitle}>Delivery Successful!</Text>
        <Text style={styles.successSub}>
          Order {order ? `#${order.id.slice(-4).toUpperCase()}` : ''} has been delivered.
        </Text>

        <View style={styles.ratingCard}>
          <Text style={styles.ratingLabel}>Rate your experience</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={42}
                  color={star <= rating ? "#f59e0b" : "#e0e2e8"}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && rating < 3 && (
            <Text style={{ fontSize: 12, color: '#ef4444', marginTop: 8, fontWeight: '600' }}>
              Low rating detected — you'll be prompted to file a complaint.
            </Text>
          )}
        </View>

        <View style={styles.feedbackWrap}>
          <Text style={styles.feedbackLabel}>Leave Feedback (Optional)</Text>
          <TextInput
            style={styles.feedbackInput}
            placeholder="Tell us about the water quality and delivery service..."
            placeholderTextColor="#bfc7d1"
            multiline
            numberOfLines={4}
            value={feedback}
            onChangeText={setFeedback}
            textAlignVertical="top"
          />
        </View>

      </ScrollView>

      {/* BOTTOM CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={submitFeedback}
          disabled={isSubmitting}
          style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
        >
          {isSubmitting
            ? <ActivityIndicator color="white" />
            : <Text style={styles.submitBtnText}>Submit & Return Home</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorSchemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.95)' },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#ebeef4', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: colors.text },

  successIconWrap: { alignItems: 'center', marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '900', color: colors.text, textAlign: 'center', marginBottom: 8 },
  successSub: { fontSize: 14, color: colors.muted, textAlign: 'center', paddingHorizontal: 20, lineHeight: 20, marginBottom: 40 },

  ratingCard: { backgroundColor: colors.surface, borderRadius: 24, padding: 24, marginBottom: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  ratingLabel: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 16 },
  starsRow: { flexDirection: 'row', gap: 12 },

  feedbackWrap: { marginTop: 10 },
  feedbackLabel: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 10, marginLeft: 4 },
  feedbackInput: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, height: 120, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },

  bottomBar: { backgroundColor: colors.surface, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.07, shadowRadius: 20, elevation: 12, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  submitBtn: { backgroundColor: CUSTOMER_ACCENT, borderRadius: 20, paddingVertical: 18, alignItems: 'center' },
  submitBtnText: { color: 'white', fontSize: 17, fontWeight: '900' },
});


