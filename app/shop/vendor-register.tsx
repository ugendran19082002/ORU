import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Logo } from '@/components/ui/Logo';

// 2-step vendor registration
const STEPS = ['Business Info', 'Location & Documents'];

export default function VendorRegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [fssai, setFssai] = useState('');
  const [shopNo, setShopNo] = useState('');
  const [area, setArea] = useState('');
  const [gst, setGst] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleNext = () => {
    if (step === 0) {
      if (!shopName.trim() || !ownerName.trim() || !mobile.trim()) {
        Alert.alert('Required', 'Please fill in Shop Name, Owner Name, and Mobile.');
        return;
      }
      setStep(1);
    } else {
      if (!area.trim() || !fssai.trim()) {
        Alert.alert('Required', 'Please fill in Address and FSSAI number.');
        return;
      }
      if (!agreed) {
        Alert.alert('Agreement', 'Please agree to the terms to continue.');
        return;
      }
      Alert.alert('Application Submitted!', 'Our team will verify your shop within 24–48 hours.', [
        { text: 'OK', onPress: () => router.replace('/shop' as any) },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => step > 0 ? setStep(step - 1) : router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.logoRow}>
          <Logo size="sm" />
          <Text style={styles.logoText}>ThanniGo</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* HERO */}
        <LinearGradient colors={['#005d90', '#006878']} style={styles.heroCard}>
          <Ionicons name="storefront" size={72} color="rgba(255,255,255,0.07)" style={styles.heroDecor} />
          <Text style={styles.heroTitle}>Register Your Shop</Text>
          <Text style={styles.heroSub}>Join ThanniGo as a verified water supplier and grow your business.</Text>

          {/* PROGRESS */}
          <View style={styles.stepRow}>
            {STEPS.map((s, i) => (
              <View key={s} style={styles.stepItem}>
                <View style={[styles.stepCircle, i <= step && styles.stepCircleActive]}>
                  <Text style={[styles.stepNum, i <= step && styles.stepNumActive]}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{s}</Text>
              </View>
            ))}
            <View style={styles.stepConnector} />
          </View>
        </LinearGradient>

        {/* STEP 1 */}
        {step === 0 && (
          <>
            <Text style={styles.sectionTitle}>Business Details</Text>
            {[
              { label: 'Shop / Business Name *', placeholder: 'e.g. Blue Spring Aquatics', value: shopName, set: setShopName },
              { label: 'Owner Full Name *', placeholder: 'As per government ID', value: ownerName, set: setOwnerName },
              { label: 'Mobile Number *', placeholder: '+91 98765 43210', value: mobile, set: setMobile, keyboard: 'phone-pad' as any },
              { label: 'Email Address', placeholder: 'owner@example.com', value: '', set: () => {} },
            ].map((f) => (
              <View key={f.label} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={f.placeholder}
                  value={f.value}
                  onChangeText={f.set}
                  keyboardType={f.keyboard || 'default'}
                />
              </View>
            ))}

            <Text style={styles.sectionTitle}>FSSAI License</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FSSAI Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="14-digit license number"
                value={fssai}
                onChangeText={setFssai}
                keyboardType="numeric"
                maxLength={14}
              />
            </View>
          </>
        )}

        {/* STEP 2 */}
        {step === 1 && (
          <>
            <Text style={styles.sectionTitle}>Shop Location</Text>
            {[
              { label: 'Shop / Building Number', placeholder: 'e.g. Plot 42, 2nd Floor', value: shopNo, set: setShopNo },
              { label: 'Street / Area / Road *', placeholder: 'Search or enter your area', value: area, set: setArea },
            ].map((f) => (
              <View key={f.label} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={f.placeholder}
                  value={f.value}
                  onChangeText={f.set}
                />
              </View>
            ))}

            <Text style={styles.sectionTitle}>Company Registration</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GST Number (Optional)</Text>
              <TextInput
                style={[styles.input, { textTransform: 'uppercase' }]}
                placeholder="15-digit GSTIN"
                value={gst}
                onChangeText={setGst}
                autoCapitalize="characters"
              />
            </View>

            {/* TERMS */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgreed(!agreed)}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
                {agreed && <Ionicons name="checkmark" size={14} color="white" />}
              </View>
              <Text style={styles.termsText}>
                I agree to ThanniGo's <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Partner Policy</Text>.
              </Text>
            </TouchableOpacity>

            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={18} color="#005d90" />
              <Text style={styles.infoText}>
                After submitting, our verification team will review your documents and activate your shop within 24–48 hours.
              </Text>
            </View>
          </>
        )}

        {/* CTA */}
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <LinearGradient
            colors={['#005d90', '#0077b6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextBtnGrad}
          >
            <Text style={styles.nextBtnText}>{step === 0 ? 'Next — Location & Documents' : 'Submit Application'}</Text>
            <Ionicons name={step === 0 ? 'arrow-forward' : 'checkmark-circle'} size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { fontSize: 20, fontWeight: '900', color: '#003a5c' },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  heroCard: { borderRadius: 24, padding: 24, overflow: 'hidden', shadowColor: '#005d90', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 },
  heroDecor: { position: 'absolute', right: -16, bottom: -16 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: 'white', marginBottom: 6 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 18, marginBottom: 20 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 8, position: 'relative' },
  stepItem: { flex: 1, alignItems: 'center', gap: 6 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { backgroundColor: 'white' },
  stepNum: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  stepNumActive: { color: '#005d90' },
  stepLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600', textAlign: 'center' },
  stepLabelActive: { color: 'white' },
  stepConnector: { position: 'absolute', top: 16, left: '25%', right: '25%', height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#181c20', letterSpacing: -0.3 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#707881' },
  input: { backgroundColor: 'white', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontWeight: '600', color: '#181c20', borderWidth: 1, borderColor: '#e0e2e8' },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: '#e0e2e8', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxActive: { backgroundColor: '#005d90', borderColor: '#005d90' },
  termsText: { flex: 1, fontSize: 13, color: '#64748b', lineHeight: 19 },
  termsLink: { color: '#005d90', fontWeight: '700' },
  infoCard: { flexDirection: 'row', gap: 10, backgroundColor: '#e0f0ff', borderRadius: 14, padding: 14, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 12, color: '#005d90', lineHeight: 17, fontWeight: '600' },
  nextBtn: { borderRadius: 18, overflow: 'hidden', marginTop: 4 },
  nextBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  nextBtnText: { color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
});
