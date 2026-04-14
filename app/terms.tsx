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
    title: '1. Acceptance of Terms',
    content: 'By downloading or using the ThanniGo app, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the app.',
  },
  {
    title: '2. Service Description',
    content: 'ThanniGo is a platform connecting customers with local water can delivery shops. We facilitate orders but are not responsible for the quality of products delivered by independent shops.',
  },
  {
    title: '3. User Accounts',
    content: 'You must provide a valid Indian phone number to register. You are responsible for all activity under your account. Do not share your OTP or account credentials with anyone.',
  },
  {
    title: '4. Ordering & Delivery',
    content: '• Orders are fulfilled by independent local shops\n• Delivery times are estimates and may vary\n• ThanniGo is not liable for delays caused by shops or traffic\n• You must be present at the delivery address to receive your order\n• A delivery OTP (for COD orders) must be shared only with the delivery agent',
  },
  {
    title: '5. Payments & Refunds',
    content: '• Cash on Delivery (COD): Pay directly to the delivery agent upon receipt\n• UPI: Processed securely via Razorpay\n• Refunds for cancelled orders are processed within 5–7 business days\n• We do not issue refunds for orders already out for delivery unless proven incorrect',
  },
  {
    title: '6. Cancellation Policy',
    content: 'You may cancel an order free of charge before the shop starts preparing it. Once an order is out for delivery, cancellation may incur a fee at the shop\'s discretion.',
  },
  {
    title: '7. Prohibited Activities',
    content: 'You may not:\n• Place fraudulent or fake orders\n• Abuse or harass delivery agents or shop staff\n• Attempt to manipulate ratings or reviews\n• Use the app for any illegal purpose\n\nViolations may result in permanent account suspension.',
  },
  {
    title: '8. Limitation of Liability',
    content: 'ThanniGo is not liable for any indirect, incidental, or consequential damages arising from use of the service. Our maximum liability in any case is limited to the value of the disputed order.',
  },
  {
    title: '9. Governing Law',
    content: 'These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Chennai, Tamil Nadu.',
  },
  {
    title: '10. Changes to Terms',
    content: 'We may update these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms. We will notify users of significant changes via app notification.',
  },
  {
    title: '11. Contact',
    content: 'For questions about these terms:\nEmail: legal@thannigo.com\nAddress: ThanniGo Pvt. Ltd., Chennai, Tamil Nadu, India — 600001',
  },
];

export default function TermsConditionsScreen() {
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
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* INTRO */}
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Ionicons name="document-text" size={28} color="#006878" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.introTitle}>Terms of Service</Text>
            <Text style={styles.introSub}>Last updated: April 2026</Text>
          </View>
        </View>

        <Text style={styles.introText}>
          These Terms and Conditions govern your use of ThanniGo — India's fastest water can delivery platform. Please read them carefully before using our service.
        </Text>

        {/* SECTIONS */}
        {SECTIONS.map((section, index) => (
          <View key={index} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          These terms were last updated in April 2026. By continuing to use ThanniGo, you acknowledge that you have read, understood, and agreed to these terms.
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
    backgroundColor: '#e0f7fa', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#181c20' },

  content: { paddingHorizontal: 20, paddingVertical: 20, gap: 12 },

  introCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#e0f7fa', borderRadius: 20, padding: 18,
  },
  introIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
  },
  introTitle: { fontSize: 16, fontWeight: '800', color: '#006878' },
  introSub: { fontSize: 12, color: '#0097a7', marginTop: 2 },

  introText: {
    fontSize: 14, color: '#404850', lineHeight: 22,
    backgroundColor: 'white', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },

  sectionCard: {
    backgroundColor: 'white', borderRadius: 16, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#006878', marginBottom: 8 },
  sectionContent: { fontSize: 13, color: '#404850', lineHeight: 22 },

  footer: {
    fontSize: 12, color: '#707881', lineHeight: 18,
    textAlign: 'center', paddingTop: 8, paddingBottom: 20,
  },
});


