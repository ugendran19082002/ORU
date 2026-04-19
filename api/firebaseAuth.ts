// IMPORTANT: We use the Firebase Web SDK for Expo Go compatibility.
// For production without Recaptcha, you can swap back to @react-native-firebase/*
// with an EAS Dev build (npx expo prebuild / npx expo run:android).

import { getAuth, signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';

/**
 * Validates a standard Indian phone number and ensures +91 prefix.
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;
  return phone; // Return as is, might fail Firebase validation
};

/**
 * Initiates the Firebase OTP flow using Web SDK.
 * Requires a recaptchaVerifier passed from the UI layer.
 */
export const requestFirebaseOTP = async (phone: string, recaptchaVerifier: any) => {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    console.log(`[FIREBASE AUTH] Requesting OTP for ${formattedPhone}`);
    
    const auth = getAuth();
    const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
    return confirmation;
  } catch (error) {
    console.error('[FIREBASE AUTH ERROR] Failed to send OTP:', error);
    throw error;
  }
};

/**
 * Verifies the 6-digit OTP code against the confirmation object.
 */
export const verifyFirebaseOTP = async (confirmation: any, code: string) => {
  try {
    console.log(`[FIREBASE AUTH] Verifying OTP...`);
    const userCredential = await confirmation.confirm(code);
    return userCredential.user;
  } catch (error) {
    console.error('[FIREBASE AUTH ERROR] Invalid OTP:', error);
    throw error;
  }
};

/**
 * Signs out the user from Firebase locally.
 */
export const signOutFirebase = async () => {
  try {
    const auth = getAuth();
    await auth.signOut();
  } catch (error) {
    console.error('[FIREBASE AUTH ERROR] Sign out failed:', error);
  }
};

