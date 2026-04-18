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
import { Shadow, thannigoPalette, roleAccent, Radius } from '@/constants/theme';
import { useAppTheme } from '@/providers/ThemeContext';

const PRIMARY = thannigoPalette.primary;

export default function EditProfileScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const { colors, isDark } = useAppTheme();

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <BackButton fallback="/(tabs)/profile" />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>

          <TouchableOpacity
            style={[styles.headerSaveBtn, { backgroundColor: PRIMARY }, isLoading && { opacity: 0.7 }]}
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
                 <View style={[styles.avatarImage, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="person" size={50} color={colors.muted} />
                   </View>
                )}
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={16} color="white" />
                </View>
              </TouchableOpacity>
              <Text style={[styles.avatarHint, { color: colors.muted }]}>Tap to switch photo</Text>
            </View>

            {/* FORM */}
            <View style={styles.formSection}>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.muted }]}>Full Name</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Ionicons name="person-outline" size={20} color={colors.muted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter absolute full name"
                    placeholderTextColor={colors.placeholder}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.muted }]}>Primary Mobile Number</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="call-outline" size={20} color={colors.muted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.muted }]}
                  value={mobile}
                  editable={false}
                />
                <Ionicons name="lock-closed" size={16} color={colors.muted} style={{ marginRight: 16 }} />
                </View>
                <Text style={[styles.helperText, { color: colors.muted }]}>Primary numbers cannot be changed directly.</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.muted }]}>Email Address</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }, isEmailVerified && { borderColor: thannigoPalette.success, backgroundColor: thannigoPalette.successSoft }]}>
                <Ionicons name="mail-outline" size={20} color={isEmailVerified ? thannigoPalette.success : colors.muted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingRight: 80, color: colors.text }]}
                    value={email}
                    onChangeText={(t) => {
                       setEmail(t);
                       setIsEmailVerified(false); // reset verification if email changes
                    }}
                    placeholder="Provide your email"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {!isEmailVerified ? (
                    <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyEmail}>
                      <Text style={styles.verifyText}>Verify</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={18} color={thannigoPalette.success} />
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.muted }]}>PAN Number</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Ionicons name="card-outline" size={20} color={colors.muted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={pan}
                    onChangeText={(t) => setPan(t.toUpperCase())}
                    placeholder="ABCDE1234F"
                    placeholderTextColor={colors.placeholder}
                    autoCapitalize="characters"
                    maxLength={10}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.muted }]}>Alternate Mobile Number (WhatsApp)</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Ionicons name="logo-whatsapp" size={20} color={colors.muted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={altMobile}
                    onChangeText={setAltMobile}
                    placeholder="+91 ___ ___ ____"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.muted }]}>UPI ID (for Refunds)</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Ionicons name="card-outline" size={20} color={colors.muted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={upiId}
                    onChangeText={setUpiId}
                    placeholder="e.g. name@upi"
                    placeholderTextColor={colors.placeholder}
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
              <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                <View style={styles.modalIconWrap}>
          <Ionicons name="mail-unread" size={36} color={PRIMARY} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Verify Email</Text>
              <Text style={[styles.modalSub, { color: colors.muted }]}>We've sent a 4-digit secure OTP to{' '}<Text style={{ fontWeight: '800', color: colors.text }}>{email}</Text></Text>

                <TextInput
                  style={[styles.otpInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={4}
                  placeholder="0 0 0 0"
                placeholderTextColor={colors.muted}
                  autoFocus
                />

                <TouchableOpacity style={styles.modalVerifyBtn} onPress={handleConfirmOtp} activeOpacity={0.8}>
                  <Text style={styles.modalVerifyBtnText}>Confirm OTP</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowOtpModal(false)}>
                  <Text style={[styles.modalCancelBtnText, { color: colors.muted }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  headerSaveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.md },
  headerSaveText: { color: 'white', fontWeight: '800', fontSize: 14 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 30 },

  avatarContainer: { alignItems: 'center', marginBottom: 36 },
  avatarWrap: { width: 110, height: 110, borderRadius: 55, position: 'relative', ...Shadow.md },
  avatarImage: { width: '100%', height: '100%', borderRadius: 55, overflow: 'hidden' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: PRIMARY, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'white' },
  avatarHint: { marginTop: 12, fontSize: 13, fontWeight: '500' },

  formSection: { gap: 20, marginBottom: 40 },
  inputGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: '800', marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  helperText: { fontSize: 11, fontStyle: 'italic', marginLeft: 4 },

  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: Radius.lg, overflow: 'hidden' },
  inputIcon: { paddingLeft: 18, paddingRight: 10 },
  input: { flex: 1, paddingVertical: 18, paddingRight: 16, fontSize: 16, fontWeight: '600' },

  verifyBtn: { position: 'absolute', right: 8, top: 10, bottom: 10, backgroundColor: thannigoPalette.infoSoft, paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' },
  verifyText: { color: PRIMARY, fontSize: 13, fontWeight: '800' },
  verifiedBadge: { position: 'absolute', right: 16, justifyContent: 'center' },

  saveBtn: { backgroundColor: PRIMARY, paddingVertical: 18, borderRadius: Radius.lg, alignItems: 'center', ...Shadow.md, shadowColor: PRIMARY },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.65)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: 32, alignItems: 'center', ...Shadow.lg },
  modalIconWrap: { width: 76, height: 76, borderRadius: 38, backgroundColor: thannigoPalette.infoSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 26, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 },
  modalSub: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  otpInput: { width: '80%', borderWidth: 2, borderRadius: 20, fontSize: 36, fontWeight: '900', textAlign: 'center', paddingVertical: 16, letterSpacing: 16, marginBottom: 36 },
  modalVerifyBtn: { width: '100%', backgroundColor: PRIMARY, paddingVertical: 20, borderRadius: Radius.lg, alignItems: 'center', marginBottom: 12, ...Shadow.md, shadowColor: PRIMARY },
  modalVerifyBtnText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  modalCancelBtn: { paddingVertical: 14, paddingHorizontal: 30 },
  modalCancelBtnText: { fontSize: 15, fontWeight: '800' },

  sectionHeaderTitle: { fontSize: 18, fontWeight: '900', marginBottom: 4 },
  securityToggleWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: Radius.lg, borderWidth: 1, marginTop: 8 },
  fingerprintIconBlock: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  securityToggleTitle: { fontSize: 15, fontWeight: '800' },
  securityToggleSub: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  toggleSwitch: { width: 44, height: 26, borderRadius: 13, padding: 2, justifyContent: 'center' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'white', ...Shadow.xs },
  toggleThumbActive: { transform: [{ translateX: 18 }] },
});


