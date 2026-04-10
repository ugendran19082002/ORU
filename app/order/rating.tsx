import React, { useState } from 'react';
import { View, Text, ScrollView,
  RefreshControl, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StitchScreenNote } from '@/components/stitch/StitchScreenNote';

export default function OrderRatingScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const submitFeedback = () => {
    // In a real app, this would submit the feedback to the backend.
    router.replace('/(tabs)' as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#181c20" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Delivered</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />} contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 40 }}>
        <StitchScreenNote screen="rate_review_customer" />
        
        <View style={styles.successIconWrap}>
          <Ionicons name="checkmark-circle" size={80} color="#2e7d32" />
        </View>
        <Text style={styles.successTitle}>Delivery Successful!</Text>
        <Text style={styles.successSub}>Order #TN-9412 from AquaPrime has been delivered to your location.</Text>

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
          style={styles.submitBtn}
        >
          <Text style={styles.submitBtnText}>Submit & Return Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.95)' },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#ebeef4', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#181c20' },

  successIconWrap: { alignItems: 'center', marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '900', color: '#181c20', textAlign: 'center', marginBottom: 8 },
  successSub: { fontSize: 14, color: '#707881', textAlign: 'center', paddingHorizontal: 20, lineHeight: 20, marginBottom: 40 },

  ratingCard: { backgroundColor: 'white', borderRadius: 24, padding: 24, marginBottom: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  ratingLabel: { fontSize: 16, fontWeight: '800', color: '#181c20', marginBottom: 16 },
  starsRow: { flexDirection: 'row', gap: 12 },

  feedbackWrap: { marginTop: 10 },
  feedbackLabel: { fontSize: 14, fontWeight: '800', color: '#181c20', marginBottom: 10, marginLeft: 4 },
  feedbackInput: { backgroundColor: 'white', borderRadius: 20, padding: 20, height: 120, fontSize: 15, color: '#181c20', borderWidth: 1, borderColor: '#f1f4f9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },

  bottomBar: { backgroundColor: 'white', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.07, shadowRadius: 20, elevation: 12, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  submitBtn: { backgroundColor: '#005d90', borderRadius: 20, paddingVertical: 18, alignItems: 'center' },
  submitBtnText: { color: 'white', fontSize: 17, fontWeight: '900' },
});
