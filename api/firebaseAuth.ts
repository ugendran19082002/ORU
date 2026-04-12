// IMPORTANT: Do NOT statically import `@react-native-firebase/auth` globally.
// It will crash Expo Go instantly with Native module RNFBAppModule not found.
// Instead, import dynamically inside functions that are gated by !__DEV__.
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
 * Initiates the Firebase OTP flow.
 * Returns the Confirmation Result object to verify code later.
 */
export const requestFirebaseOTP = async (phone: string) => {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    console.log(`[FIREBASE AUTH] Requesting OTP for ${formattedPhone}`);
    
    // Lazy load the native module so Expo Go doesn't crash on boot
    const auth = require('@react-native-firebase/auth').default;
    
    // In production with real google-services.json, this triggers SMS
    const confirmation = await auth().signInWithPhoneNumber(formattedPhone);
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
    // verify the code
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
    const auth = require('@react-native-firebase/auth').default;
    await auth().signOut();
  } catch (error) {
    console.error('[FIREBASE AUTH ERROR] Sign out failed:', error);
  }
};
