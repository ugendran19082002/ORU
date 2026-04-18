import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
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

import { systemApi } from '@/api/systemApi';
import { useAppTheme } from '@/providers/ThemeContext';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [sections, setSections] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadPolicy();
  }, []);

  const loadPolicy = async () => {
    try {
      const res = await systemApi.getSetting('privacy_policy');
      if (res.data && res.data.setting_value) {
        setSections(JSON.parse(res.data.setting_value));
      }
    } catch (err) {
      console.error('Failed to load privacy policy:', err);
      // Fallback to static if API fails
      setSections([
        { title: 'Contact Support', content: 'Unable to load dynamic policy. Please contact support@thannigo.com' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(0,93,144,0.2)' : '#e0f0ff' }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#005d90" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* INTRO */}
        <View style={[styles.introCard, { backgroundColor: isDark ? 'rgba(0,93,144,0.2)' : '#e0f0ff' }]}>
          <View style={[styles.introIcon, { backgroundColor: colors.surface }]}>
            <Ionicons name="shield-checkmark" size={28} color="#005d90" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.introTitle}>Your Privacy Matters</Text>
            <Text style={styles.introSub}>Last updated: April 2026</Text>
          </View>
        </View>

        <Text style={[styles.introText, { backgroundColor: colors.surface, color: colors.text }]}>
          ThanniGo is committed to protecting your personal information. This policy explains what we collect, why we collect it, and how we keep it safe.
        </Text>

        {/* LOADING STATE */}
        {loading && (
          <View style={{ padding: 40 }}>
            <ActivityIndicator size="small" color="#005d90" />
            <Text style={{ textAlign: 'center', marginTop: 12, color: colors.muted, fontSize: 13 }}>Loading latest policy...</Text>
          </View>
        )}

        {/* SECTIONS */}
        {!loading && sections.map((section, index) => (
          <View key={index} style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={[styles.sectionContent, { color: colors.text }]}>{section.content.replace(/\\n/g, '\n')}</Text>
          </View>
        ))}

        <Text style={[styles.footer, { color: colors.muted }]}>
          By using ThanniGo, you agree to this Privacy Policy. We may update this policy periodically. Continued use after updates means you accept the new terms.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },

  content: { paddingHorizontal: 20, paddingVertical: 20, gap: 12 },

  introCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 20, padding: 18,
  },
  introIcon: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  introTitle: { fontSize: 16, fontWeight: '800', color: '#005d90' },
  introSub: { fontSize: 12, color: '#0077b6', marginTop: 2 },

  introText: {
    fontSize: 14, lineHeight: 22,
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },

  sectionCard: {
    borderRadius: 16, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#005d90', marginBottom: 8 },
  sectionContent: { fontSize: 13, lineHeight: 22 },

  footer: {
    fontSize: 12, lineHeight: 18,
    textAlign: 'center', paddingTop: 8, paddingBottom: 20,
  },
});

