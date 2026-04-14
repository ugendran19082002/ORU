import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';

const REVIEWS = [
  { id: '1', shop: 'Blue Spring Aquatics', rating: 5, date: 'Apr 5, 2026', comment: 'Always on time and water tastes great.' },
  { id: '2', shop: 'Aqua Pure Water', rating: 4, date: 'Mar 12, 2026', comment: 'Good service but 10 minutes late once.' },
  { id: '3', shop: 'H2O Express', rating: 5, date: 'Feb 20, 2026', comment: 'Perfect, sealed cans.' },
];

export default function CustomerReviewsScreen() {
  const { safeBack } = useAppNavigation();
  useAndroidBackHandler(() => { safeBack('/(tabs)/profile'); });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <BackButton fallback="/(tabs)/profile" />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>My Reviews</Text>
          <Text style={styles.headerSub}>Manage feedback you've given</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {REVIEWS.map((review) => (
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
            <Text style={styles.comment}>"{review.comment}"</Text>
            <View style={styles.actions}>
               <TouchableOpacity style={styles.editBtn}>
                 <Ionicons name="pencil" size={14} color="#005d90" />
                 <Text style={styles.btnText}>Edit</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.deleteBtn}>
                 <Ionicons name="trash" size={14} color="#ba1a1a" />
                 <Text style={[styles.btnText, { color: '#ba1a1a' }]}>Delete</Text>
               </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  headerSub: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  content: { padding: 20, gap: 16, paddingBottom: 60 },
  
  reviewCard: { backgroundColor: 'white', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  shopIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0f7ff', alignItems: 'center', justifyContent: 'center' },
  shopName: { fontSize: 15, fontWeight: '800', color: '#181c20', marginBottom: 2 },
  date: { fontSize: 11, color: '#707881', fontWeight: '500' },
  stars: { flexDirection: 'row', gap: 2 },
  comment: { fontSize: 14, color: '#475569', lineHeight: 20, fontStyle: 'italic', marginBottom: 16, backgroundColor: '#f8fafc', padding: 12, borderRadius: 12 },
  
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f0f7ff' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#ffdad6' },
  btnText: { fontSize: 12, fontWeight: '700', color: '#005d90' },
});


