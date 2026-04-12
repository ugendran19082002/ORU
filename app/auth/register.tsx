import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppSession } from '@/hooks/use-app-session';

export default function RegisterScreen() {
  const router = useRouter();
  const { user, preferredRole, setPreferredRole, signIn } = useAppSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleComplete = async () => {
    if (!name.trim()) return;
    
    // Set user data with the name
    const role = preferredRole ?? 'customer';
    await signIn({ phone: user?.phone ?? '9999999999', role, name: name.trim() });
    
    if (role === 'shop') router.replace('/shop');
    else if (role === 'admin') router.replace('/admin');
    else router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.safe}>
          
          <View style={styles.header}>
            <Text style={styles.brandName}>ThanniGo</Text>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.title}>Complete your profile</Text>
            <Text style={styles.subtitle}>Enter your details to get started.</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#707881" style={styles.inputIcon} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Rahul Sharma"
                placeholderTextColor="#bfc7d1"
                style={styles.input}
                autoFocus
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email (Optional)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#707881" style={styles.inputIcon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="rahul@example.com"
                placeholderTextColor="#bfc7d1"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

        </SafeAreaView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.ctaWrap, !name.trim() && { opacity: 0.5 }]}
            onPress={handleComplete}
            disabled={!name.trim()}
          >
            <LinearGradient colors={['#005d90', '#0077b6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaBtn}>
              <Text style={styles.ctaText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  safe: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  header: { marginBottom: 32 },
  brandName: { fontSize: 22, fontWeight: '900', color: '#003a5c' },
  titleBlock: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '900', color: '#181c20', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#707881', lineHeight: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#181c20', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, borderWidth: 1.5, borderColor: '#e0e2e8', paddingHorizontal: 16, height: 56 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: '#181c20' },
  bottomBar: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 16, backgroundColor: '#f7f9ff' },
  ctaWrap: {},
  ctaBtn: { borderRadius: 20, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaText: { color: 'white', fontSize: 17, fontWeight: '900' },
});
