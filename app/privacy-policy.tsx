import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    content: 'We collect your phone number for authentication, delivery address for order fulfillment, and order history to improve your experience. We do NOT collect payment card details — all UPI payments are processed by Razorpay under their privacy policy.',
  },
  {
    title: '2. How We Use Your Information',
    content: 'Your data is used to:\n• Process and deliver your water can orders\n• Send order status notifications\n• Connect you with nearby verified shops\n• Improve app performance and fix issues\n\nWe do NOT sell your data to third parties.',
  },
  {
    title: '3. Data Storage & Security',
    content: 'Your session credentials are stored in encrypted secure storage on your device. Order and profile data is stored in our Firebase-secured database. All data transmissions use HTTPS/TLS encryption.',
  },
  {
    title: '4. Notifications',
    content: 'We send push notifications only for order-related updates (order confirmed, out for delivery, delivered). You can disable notifications in your device settings at any time.',
  },
  {
    title: '5. Location Data',
    content: 'We access your device location only when you open the app to find nearby shops. We do not track your location in the background. Location data is not stored on our servers.',
  },
  {
    title: '6. Third-Party Services',
    content: 'ThanniGo uses:\n• Firebase (Google) — Authentication & database\n• Razorpay — UPI payment processing\n• OpenStreetMap — Mapping services\n\nEach provider has their own privacy policy.',
  },
  {
    title: '7. Data Deletion',
    content: 'You can request full deletion of your account and data by going to Profile → Delete Account, or by emailing privacy@thannigo.com. We will process all requests within 7 business days.',
  },
  {
    title: '8. Children\'s Privacy',
    content: 'ThanniGo is not intended for children under 13. We do not knowingly collect information from children.',
  },
  {
    title: '9. Contact Us',
    content: 'For privacy-related queries:\nEmail: privacy@thannigo.com\nAddress: ThanniGo Pvt. Ltd., Chennai, Tamil Nadu, India — 600001',
  },
];

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#005d90" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* INTRO */}
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Ionicons name="shield-checkmark" size={28} color="#005d90" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.introTitle}>Your Privacy Matters</Text>
            <Text style={styles.introSub}>Last updated: April 2026</Text>
          </View>
        </View>

        <Text style={styles.introText}>
          ThanniGo is committed to protecting your personal information. This policy explains what we collect, why we collect it, and how we keep it safe.
        </Text>

        {/* SECTIONS */}
        {SECTIONS.map((section, index) => (
          <View key={index} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          By using ThanniGo, you agree to this Privacy Policy. We may update this policy periodically. Continued use after updates means you accept the new terms.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1, borderBottomColor: '#f1f4f9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#181c20' },

  content: { paddingHorizontal: 20, paddingVertical: 20, gap: 12 },

  introCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#e0f0ff', borderRadius: 20, padding: 18,
  },
  introIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
  },
  introTitle: { fontSize: 16, fontWeight: '800', color: '#005d90' },
  introSub: { fontSize: 12, color: '#0077b6', marginTop: 2 },

  introText: {
    fontSize: 14, color: '#404850', lineHeight: 22,
    backgroundColor: 'white', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },

  sectionCard: {
    backgroundColor: 'white', borderRadius: 16, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#005d90', marginBottom: 8 },
  sectionContent: { fontSize: 13, color: '#404850', lineHeight: 22 },

  footer: {
    fontSize: 12, color: '#707881', lineHeight: 18,
    textAlign: 'center', paddingTop: 8, paddingBottom: 20,
  },
});


