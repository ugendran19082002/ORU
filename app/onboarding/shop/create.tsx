import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { onboardingApi } from '@/api/onboardingApi';
import { useAppSession } from '@/hooks/use-app-session';
import { BackButton } from '@/components/ui/BackButton';

export default function CreateShopScreen() {
  const router = useRouter();
  const { user, refreshShopStatus } = useAppSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_number: user?.phone?.replace('+91', '') || '',
    shop_type: 'individual' as any,
  });

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Please enter a shop name.');
      return;
    }

    try {
      setLoading(true);
      const res = await onboardingApi.createShop({
        ...formData,
        contact_number: `+91${formData.contact_number}`
      });

      if (res.status === 1) {
        await refreshShopStatus();
        Alert.alert('Success', 'Shop profile created! Now let\'s verify your business.');
        router.replace('/onboarding/shop' as any);
      }
    } catch (error: any) {
      console.error('[Shop Creation] Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Could not create shop. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <BackButton fallback="/auth/role" style={{ marginBottom: 16 }} />
            <Text style={styles.title}>Register Your Shop</Text>
            <Text style={styles.subtitle}>Provide basic details to establish your presence on ThanniGo</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Shop / Business Name</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="business-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Sree Murugan Water Suppliers"
                  value={formData.name}
                  onChangeText={(v) => setFormData(prev => ({ ...prev, name: v }))}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Number</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.prefix}>+91</Text>
                <TextInput
                  style={styles.input}
                  placeholder="9876543210"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={formData.contact_number}
                  onChangeText={(v) => setFormData(prev => ({ ...prev, contact_number: v }))}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Type</Text>
              <View style={styles.typeRow}>
                {['individual', 'agency', 'distributor'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeBtn,
                      formData.shop_type === type && styles.typeBtnActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, shop_type: type as any }))}
                  >
                    <Text style={[
                      styles.typeText,
                      formData.shop_type === type && styles.typeTextActive
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="compass-outline" size={18} color="#006878" />
            <Text style={styles.infoText}>
              You will be asked to pin your shop's precise location and upload documents in the next phase.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleCreate} disabled={loading}>
            <LinearGradient
              colors={['#006878', '#004a55']}
              style={styles.cta}
            >
              {loading ? <ActivityIndicator color="white" /> : (
                <>
                  <Text style={styles.ctaText}>Create Shop Profile</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  safe: { flex: 1 },
  scroll: { padding: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#64748b', marginTop: 8, lineHeight: 22 },

  form: { gap: 24 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: '#334155', marginLeft: 4 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: { marginRight: 12 },
  prefix: { fontSize: 16, fontWeight: '700', color: '#64748b', marginRight: 8 },
  input: { flex: 1, fontSize: 16, color: '#1e293b', fontWeight: '500' },

  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeBtnActive: { backgroundColor: '#006878', borderColor: '#006878' },
  typeText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  typeTextActive: { color: 'white' },

  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#ecfdf5',
    padding: 16,
    borderRadius: 16,
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  infoText: { flex: 1, fontSize: 13, color: '#065f46', lineHeight: 20 },

  footer: { padding: 24, backgroundColor: 'white' },
  cta: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: { color: 'white', fontSize: 16, fontWeight: '800' }
});
