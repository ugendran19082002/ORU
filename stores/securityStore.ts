import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { authApi } from '@/api/authApi';
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
  enablePinRemote: (pin: string) => Promise<void>;
  loginWithPin: (phone: string, pin: string) => Promise<any>;
  loginWithBiometric: (phone: string) => Promise<any>;
  enableBiometricRemote: () => Promise<void>;
  togglePin: (enabled: boolean) => Promise<void>;
  toggleBiometrics: (enabled: boolean) => Promise<void>;
  authenticateBiometrics: () => Promise<boolean>;
  setLocked: (locked: boolean) => void;
  setIsVerified: (verified: boolean) => void;
  getDeviceId: () => string;
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
        const { isVerified } = get();
        
        set({ 
          ...settings, 
          // Smart re-lock: If we are already verified in this session, stay unlocked.
          // Otherwise, if any security is enabled, we start locked.
          isLocked: isVerified ? false : (settings.isPinEnabled || settings.isBiometricsEnabled)
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

      if (user.is_security_verified) {
          updates.isVerified = true;
          updates.isLocked = false;
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

  enablePinRemote: async (pin: string) => {
    try {
      // 1. Send to Backend to Hash and Store
      await authApi.enablePin(pin);

      // 2. Update Local State (Cache the fact that PIN is enabled)
      const settings = { ...get(), isPinEnabled: true };
      await SecureStore.setItemAsync(SECURITY_SETTINGS_KEY, JSON.stringify({
        isPinEnabled: true,
        isBiometricsEnabled: settings.isBiometricsEnabled,
      }));
      set({ isPinEnabled: true });
    } catch (error) {
      console.error('[SecurityStore] enablePinRemote failed:', error);
      throw error;
    }
  },

  loginWithPin: async (phone: string, pin: string) => {
    try {
      const deviceId = get().getDeviceId();
      const response = await authApi.loginPin(phone, pin, deviceId);
      
      if (response.status === 1) {
          set({ isLocked: false, isVerified: true, isPinEnabled: true });
          return response.data;
      }
      throw new Error(response.message || 'PIN Login Failed');
    } catch (error) {
      console.error('[SecurityStore] loginWithPin failed:', error);
      throw error;
    }
  },

  enableBiometricRemote: async () => {
    try {
      const deviceId = get().getDeviceId();
      await authApi.enableBiometric(deviceId);
      
      const settings = { ...get(), isBiometricsEnabled: true };
      await SecureStore.setItemAsync(SECURITY_SETTINGS_KEY, JSON.stringify({
        isPinEnabled: settings.isPinEnabled,
        isBiometricsEnabled: true,
      }));
      set({ isBiometricsEnabled: true });
    } catch (error) {
      console.error('[SecurityStore] enableBiometricRemote failed:', error);
      throw error;
    }
  },

  loginWithBiometric: async (phone: string) => {
    try {
      // 1. Local hardware auth first
      const hardwareAuth = await get().authenticateBiometrics();
      if (!hardwareAuth) throw new Error('Biometric authentication cancelled');

      // 2. Remote device trust check
      const deviceId = get().getDeviceId();
      const response = await authApi.loginBiometric(phone, deviceId);

      if (response.status === 1) {
          set({ isLocked: false, isVerified: true, isBiometricsEnabled: true });
          return response.data;
      }
      throw new Error(response.message || 'Biometric Login Failed');
    } catch (error) {
       console.error('[SecurityStore] loginWithBiometric failed:', error);
       throw error;
    }
  },

  togglePin: async (enabled: boolean) => {
    try {
      if (enabled) {
          console.warn('Use enablePinRemote(pin) to enable PIN');
          return;
      }
      
      const settings = { ...get(), isPinEnabled: false };
      await SecureStore.setItemAsync(SECURITY_SETTINGS_KEY, JSON.stringify({
        isPinEnabled: false,
        isBiometricsEnabled: settings.isBiometricsEnabled,
      }));
      set({ isPinEnabled: false });

      // SYNC TO BACKEND
      await userApi.updateProfile({ security_pin_enabled: false });
    } catch (error) {
      console.error('[SecurityStore] togglePin failed:', error);
    }
  },

  toggleBiometrics: async (enabled: boolean) => {
    try {
      if (enabled) {
          // Mandatory handshake with backend to trust THIS device
          await get().enableBiometricRemote();
      }

      const settings = { ...get(), isBiometricsEnabled: enabled };
      await SecureStore.setItemAsync(SECURITY_SETTINGS_KEY, JSON.stringify({
        isPinEnabled: settings.isPinEnabled,
        isBiometricsEnabled: settings.isBiometricsEnabled,
      }));
      set({ isBiometricsEnabled: enabled });

      // SYNC TO BACKEND (Profile level)
      await userApi.updateProfile({ biometric_enabled: enabled });
    } catch (error) {
      console.error('[SecurityStore] toggleBiometrics failed:', error);
      throw error;
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

  getDeviceId: () => {
    // Produce a stable device ID
    const installationId = Constants.installationId || 'unknown';
    const model = Device.modelName || 'device';
    return `${Platform.OS}-${model}-${installationId}`.toLowerCase();
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
