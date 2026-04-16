import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import React, { useState, useEffect } from 'react';
import Toast from 'react-native-toast-message';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppNavigation } from '@/hooks/use-app-navigation';

import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { BackButton } from '@/components/ui/BackButton';
import { useAppSession } from '@/hooks/use-app-session';
import { userApi } from '@/api/userApi';
import { ActivityIndicator } from 'react-native';

export default function EditProfileScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();

  const { user, updateUser } = useAppSession();
  const [isLoading, setIsLoading] = useState(false);

  // Field State
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [altMobile, setAltMobile] = useState('');
  const [email, setEmail] = useState('');
  const [pan, setPan] = useState('');
  const [upiId, setUpiId] = useState('');

  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setMobile(user.phone || '');
      setEmail(user.email || '');
      setUpiId(user.upi_id || '');
      // Add other fields if present in user object
    }
  }, [user]);



  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleVerifyEmail = () => {
    if (!email) return;
    setOtpCode('');
    setShowOtpModal(true);
  };

  const handleConfirmOtp = () => {
    if (otpCode.length < 4) {
      Toast.show({
        type: 'error',
        text1: 'Invalid OTP',
        text2: 'Please enter a valid 4-digit OTP.'
      });
      return;
    }
    setShowOtpModal(false);
    setIsEmailVerified(true);
  };

  const saveProfile = async () => {
    try {
      setIsLoading(true);
      await updateUser({
        name,
        email,
        upi_id: upiId,
      });

      Toast.show({
        type: 'success',
        text1: 'Profile Saved!',
        text2: 'Your account details have been successfully updated.'
      });
      
      const fallback = user?.role === 'admin' ? '/admin/settings' : '/(tabs)/profile';
      safeBack(fallback as any);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message || 'Could not save profile details.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" />
        
        {/* HEADER */}
        <View style={styles.header}>
          <BackButton fallback="/(tabs)/profile" />
          <Text style={styles.headerTitle}>Edit Profile</Text>

          <TouchableOpacity 
            style={[styles.headerSaveBtn, isLoading && { opacity: 0.7 }]} 
            onPress={saveProfile} 
            activeOpacity={0.7}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.headerSaveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* AVATAR UPLOAD */}
            <View style={styles.avatarContainer}>
              <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} activeOpacity={0.8}>
                {profileImage ? (
                   <Image source={{ uri: profileImage }} style={styles.avatarImage} contentFit="cover" />
                ) : (
                   <View style={[styles.avatarImage, { backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="person" size={50} color="#94a3b8" />
                   </View>
                )}
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={16} color="white" />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHint}>Tap to switch photo</Text>
            </View>

            {/* FORM */}
            <View style={styles.formSection}>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter absolute full name"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Primary Mobile Number</Text>
                <View style={[styles.inputWrap, { backgroundColor: '#f8fafc' }]}>
                  <Ionicons name="call-outline" size={20} color="#cbd5e1" style={styles.inputIcon} />
                  <TextInput 
                    style={[styles.input, { color: '#94a3b8' }]}
                    value={mobile}
                    editable={false}
                  />
                  <Ionicons name="lock-closed" size={16} color="#cbd5e1" style={{ marginRight: 16 }} />
                </View>
                <Text style={styles.helperText}>Primary numbers cannot be changed directly.</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[styles.inputWrap, isEmailVerified && { borderColor: '#10b981', backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="mail-outline" size={20} color={isEmailVerified ? "#10b981" : "#94a3b8"} style={styles.inputIcon} />
                  <TextInput 
                    style={[styles.input, { paddingRight: 80 }]}
                    value={email}
                    onChangeText={(t) => {
                       setEmail(t);
                       setIsEmailVerified(false); // reset verification if email changes
                    }}
                    placeholder="Provide your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {!isEmailVerified ? (
                    <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyEmail}>
                      <Text style={styles.verifyText}>Verify</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PAN Number</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="card-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input}
                    value={pan}
                    onChangeText={(t) => setPan(t.toUpperCase())}
                    placeholder="ABCDE1234F"
                    autoCapitalize="characters"
                    maxLength={10}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Alternate Mobile Number (WhatsApp)</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="logo-whatsapp" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input}
                    value={altMobile}
                    onChangeText={setAltMobile}
                    placeholder="+91 ___ ___ ____"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>UPI ID (for Refunds)</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="card-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input}
                    value={upiId}
                    onChangeText={setUpiId}
                    placeholder="e.g. name@upi"
                    autoCapitalize="none"
                  />
                </View>
              </View>

            </View>

            <View style={{ height: 60 }} />

          </ScrollView>
        </KeyboardAvoidingView>

        {/* OTP VERIFICATION MODAL */}
        <Modal visible={showOtpModal} transparent animationType="slide">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalIconWrap}>
                  <Ionicons name="mail-unread" size={36} color="#0284c7" />
                </View>
                <Text style={styles.modalTitle}>Verify Email</Text>
                <Text style={styles.modalSub}>We've sent a 4-digit secure OTP to{'\n'}<Text style={{ fontWeight: '800', color: '#0f172a' }}>{email}</Text></Text>
                
                <TextInput 
                  style={styles.otpInput}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={4}
                  placeholder="0 0 0 0"
                  placeholderTextColor="#cbd5e1"
                  autoFocus
                />

                <TouchableOpacity style={styles.modalVerifyBtn} onPress={handleConfirmOtp} activeOpacity={0.8}>
                  <Text style={styles.modalVerifyBtnText}>Confirm OTP</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowOtpModal(false)}>
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  headerSaveBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#005d90', borderRadius: 12 },
  headerSaveText: { color: 'white', fontWeight: '800', fontSize: 14 },
  
  scrollContent: { paddingHorizontal: 24, paddingTop: 30 },

  avatarContainer: { alignItems: 'center', marginBottom: 36 },
  avatarWrap: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#f1f5f9', position: 'relative', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4 },
  avatarImage: { width: '100%', height: '100%', borderRadius: 55, overflow: 'hidden' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#005d90', width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'white' },
  avatarHint: { marginTop: 12, fontSize: 13, color: '#64748b', fontWeight: '500' },

  formSection: { gap: 20, marginBottom: 40 },
  inputGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: '800', color: '#64748b', marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  helperText: { fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginLeft: 4 },
  
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, overflow: 'hidden' },
  inputIcon: { paddingLeft: 18, paddingRight: 10 },
  input: { flex: 1, paddingVertical: 18, paddingRight: 16, fontSize: 16, color: '#0f172a', fontWeight: '600' },
  
  verifyBtn: { position: 'absolute', right: 8, top: 10, bottom: 10, backgroundColor: '#e0f2fe', paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' },
  verifyText: { color: '#0284c7', fontSize: 13, fontWeight: '800' },
  verifiedBadge: { position: 'absolute', right: 16, justifyContent: 'center' },

  saveBtn: { backgroundColor: '#005d90', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#005d90', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.65)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 20 },
  modalIconWrap: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#f0f9ff', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 26, fontWeight: '900', color: '#0f172a', marginBottom: 8, letterSpacing: -0.5 },
  modalSub: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  otpInput: { width: '80%', backgroundColor: '#f8fafc', borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 20, fontSize: 36, fontWeight: '900', color: '#0f172a', textAlign: 'center', paddingVertical: 16, letterSpacing: 16, marginBottom: 36 },
  modalVerifyBtn: { width: '100%', backgroundColor: '#0284c7', paddingVertical: 20, borderRadius: 18, alignItems: 'center', marginBottom: 12, shadowColor: '#0284c7', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
  modalVerifyBtnText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  modalCancelBtn: { paddingVertical: 14, paddingHorizontal: 30 },
  modalCancelBtnText: { color: '#64748b', fontSize: 15, fontWeight: '800' },

  sectionHeaderTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 4 },

  securityToggleWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 8 },
  fingerprintIconBlock: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  securityToggleTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  securityToggleSub: { fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: '500' },
  
  toggleSwitch: { width: 44, height: 26, borderRadius: 13, backgroundColor: '#cbd5e1', padding: 2, justifyContent: 'center' },
  toggleSwitchActive: { backgroundColor: '#10b981' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  toggleThumbActive: { transform: [{ translateX: 18 }] },
});


