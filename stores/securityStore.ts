import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { userApi } from '@/api/userApi';
import type { AppUser } from '@/types/session';

const PIN_KEY = 'thannigo_app_pin';
const SECURITY_SETTINGS_KEY = 'thannigo_security_settings';

type SecuritySettings = {
  isPinEnabled: boolean;
  isBiometricsEnabled: boolean;
  isLocked: boolean;
  isVerified: boolean; // Session-transient unlocked status
};

type SecurityState = SecuritySettings & {
  initialize: () => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  togglePin: (enabled: boolean) => Promise<void>;
  toggleBiometrics: (enabled: boolean) => Promise<void>;
  authenticateBiometrics: () => Promise<boolean>;
  setLocked: (locked: boolean) => void;
  setIsVerified: (verified: boolean) => void;
  hasPin: () => Promise<boolean>;
  reset: () => Promise<void>;
  syncWithUser: (user: AppUser) => Promise<void>;
};

export const useSecurityStore = create<SecurityState>((set, get) => ({
  isPinEnabled: false,
  isBiometricsEnabled: false,
  isLocked: false,
  isVerified: false,

  initialize: async () => {
    try {
      const settingsStr = await SecureStore.getItemAsync(SECURITY_SETTINGS_KEY);
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        const pin = await SecureStore.getItemAsync(PIN_KEY);
        set({ 
          ...settings, 
          isPinEnabled: !!pin && settings.isPinEnabled,
          isLocked: !!pin && settings.isPinEnabled 
        });
      }
    } catch (error) {
      console.error('[SecurityStore] Initialize failed:', error);
    }
  },

  syncWithUser: async (user: AppUser) => {
    try {
      // Sync sever state to local flags
      const updates: Partial<SecuritySettings> = {};
      
      if (user.security_pin_enabled !== undefined) {
          updates.isPinEnabled = user.security_pin_enabled;
      }
      
      if (user.biometric_enabled !== undefined) {
          updates.isBiometricsEnabled = user.biometric_enabled;
      }

      const current = get();
      if (Object.keys(updates).length > 0) {
          set(updates);
          
          // Persist changed settings locally too
          await SecureStore.setItemAsync(SECURITY_SETTINGS_KEY, JSON.stringify({
            isPinEnabled: updates.isPinEnabled ?? current.isPinEnabled,
            isBiometricsEnabled: updates.isBiometricsEnabled ?? current.isBiometricsEnabled,
          }));
      }
    } catch (error) {
      console.error('[SecurityStore] syncWithUser failed:', error);
    }
  },

  setPin: async (pin: string) => {
    try {
      // 1. Send to Backend to Hash and Store
      await userApi.updateProfile({ security_pin: pin, security_pin_enabled: true });

      // 2. Update Local State
      const settings = { ...get(), isPinEnabled: true };
      await SecureStore.setItemAsync(SECURITY_SETTINGS_KEY, JSON.stringify({
        isPinEnabled: settings.isPinEnabled,
        isBiometricsEnabled: settings.isBiometricsEnabled,
      }));
      set({ isPinEnabled: true });
    } catch (error) {
      console.error('[SecurityStore] setPin failed:', error);
      throw error;
    }
  },

  verifyPin: async (pin: string) => {
    try {
      const response = await userApi.verifyPin(pin);
      if (response.verified) {
        set({ isLocked: false, isVerified: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error('[SecurityStore] verifyPin failed:', error);
      return false;
    }
  },

  togglePin: async (enabled: boolean) => {
    try {
      const settings = { ...get(), isPinEnabled: enabled };
      await SecureStore.setItemAsync(SECURITY_SETTINGS_KEY, JSON.stringify({
        isPinEnabled: settings.isPinEnabled,
        isBiometricsEnabled: settings.isBiometricsEnabled,
      }));
      set({ isPinEnabled: enabled });

      // If turning off, sync to backend to clear hash
      if (!enabled) {
          await userApi.updateProfile({ security_pin_enabled: false });
      }
    } catch (error) {
      console.error('[SecurityStore] togglePin failed:', error);
    }
  },

  toggleBiometrics: async (enabled: boolean) => {
    try {
      const settings = { ...get(), isBiometricsEnabled: enabled };
      await SecureStore.setItemAsync(SECURITY_SETTINGS_KEY, JSON.stringify({
        isPinEnabled: settings.isPinEnabled,
        isBiometricsEnabled: settings.isBiometricsEnabled,
      }));
      set({ isBiometricsEnabled: enabled });

      // SYNC TO BACKEND
      await userApi.updateProfile({ biometric_enabled: enabled });
    } catch (error) {
      console.error('[SecurityStore] toggleBiometrics failed:', error);
    }
  },

  authenticateBiometrics: async () => {
    if (Platform.OS === 'web') return false;
    
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) return false;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to unlock ThanniGo',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
      });

      if (result.success) {
        set({ isLocked: false, isVerified: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error('[SecurityStore] Biometrics failed:', error);
      return false;
    }
  },

  setLocked: (locked: boolean) => set({ isLocked: locked }),

  setIsVerified: (verified: boolean) => set({ isVerified: verified }),

  hasPin: async () => {
    // This is mostly checked via generic isPinEnabled now, but keeping for compatibility
    return get().isPinEnabled;
  },

  reset: async () => {
    try {
      await SecureStore.deleteItemAsync(PIN_KEY);
      await SecureStore.deleteItemAsync(SECURITY_SETTINGS_KEY);
      set({ 
        isPinEnabled: false, 
        isBiometricsEnabled: false, 
        isLocked: false,
        isVerified: false
      });
      console.log('🛡️ [SecurityStore] Global Reset completed.');
    } catch (error) {
      console.error('[SecurityStore] Reset failed:', error);
    }
  },
}));
