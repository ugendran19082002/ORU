import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Linking, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppSession } from '@/hooks/use-app-session';
import { Logo } from '@/components/ui/Logo';
import { BackButton } from '@/components/ui/BackButton';
import { useAppTheme } from '@/providers/ThemeContext';

export default function ShopRejectedScreen() {
  const router = useRouter();
  const { user, signOut } = useAppSession();
  const { colors, isDark } = useAppTheme();

  const handleEdit = () => {
    // Navigate back to the checklist to fix details
    router.replace('/onboarding/shop');
  };

  const handleSupport = () => {
    // Linking to support - WhatsApp or Phone
    Linking.openURL('https://wa.me/91XXXXXXXXXX'); // Placeholder for support
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/auth/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a0a0a' : '#fff5f5' }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ position: 'absolute', left: 0, top: 0 }}>
              <BackButton fallback="/onboarding/shop" variant="transparent" />
            </View>
            <Logo size="lg" />
            <Text style={[styles.brandName, { color: colors.text }]}>ThanniGo</Text>
          </View>

          {/* REJECTION CARD */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: isDark ? '#7f1d1d' : '#fed7d7' }]}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? '#2d0a0a' : '#fff5f5' }]}>
              <Ionicons name="close-circle" size={48} color="#ba1a1a" />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>Your Shop Application Was Not Approved</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              We reviewed your shop details, but unfortunately, it didn't meet our requirements at this time.
            </Text>

            <View style={[styles.reasonBox, { backgroundColor: isDark ? '#2d0a0a' : '#fff5f5', borderColor: isDark ? '#7f1d1d' : '#feb2b2' }]}>
              <View style={styles.reasonHeader}>
                <Ionicons name="alert-circle-outline" size={18} color="#ba1a1a" />
                <Text style={styles.reasonLabel}>Reason for Rejection</Text>
              </View>
              <Text style={styles.reasonText}>
                {user?.adminNotes || 'Please verify your business documents and resubmit for approval.'}
              </Text>
            </View>

            <Text style={[styles.guideText, { color: colors.muted }]}>
              👉 You can update your details and resubmit for approval.
            </Text>

            <View style={styles.actionGroup}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleEdit} activeOpacity={0.8}>
                <LinearGradient
                  colors={['#005d90', '#0077b6']}
                  style={styles.gradientBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="create-outline" size={20} color="white" />
                  <Text style={styles.primaryBtnText}>Edit Details</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.supportBtn, { backgroundColor: colors.surface, borderColor: '#005d90' }]} onPress={handleSupport} activeOpacity={0.7}>
                <Ionicons name="help-circle-outline" size={20} color="#005d90" />
                <Text style={styles.supportBtnText}>Contact Support</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#64748b" />
              <Text style={[styles.logoutText, { color: colors.muted }]}>Switch Account</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scrollContent: { padding: 32, flexGrow: 1, justifyContent: 'center' },

  header: { alignItems: 'center', marginBottom: 32 },
  brandName: { fontSize: 22, fontWeight: '900', marginTop: 10, letterSpacing: -0.5 },

  card: {
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#ba1a1a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 8,
    borderWidth: 1,
  },

  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  title: { fontSize: 24, fontWeight: '900', textAlign: 'center', lineHeight: 32 },
  subtitle: { fontSize: 16, textAlign: 'center', marginTop: 12, lineHeight: 24 },

  reasonBox: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
    marginTop: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  reasonHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  reasonLabel: { fontSize: 13, fontWeight: '800', color: '#ba1a1a', textTransform: 'uppercase', letterSpacing: 0.5 },
  reasonText: { fontSize: 15, color: '#742a27', lineHeight: 22, fontWeight: '600' },

  guideText: { fontSize: 14, textAlign: 'center', marginTop: 24, fontWeight: '700' },

  actionGroup: { width: '100%', marginTop: 24, gap: 12 },
  primaryBtn: { width: '100%' },
  gradientBtn: {
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  primaryBtnText: { color: 'white', fontSize: 17, fontWeight: '800' },

  supportBtn: {
    height: 54,
    borderRadius: 18,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  supportBtnText: { color: '#005d90', fontSize: 15, fontWeight: '800' },

  footer: { marginTop: 32, alignItems: 'center' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
  logoutText: { fontSize: 14, fontWeight: '700' },
});
