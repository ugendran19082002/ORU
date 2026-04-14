import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

const PIN_KEY = 'thannigo_app_pin';
const SECURITY_SETTINGS_KEY = 'thannigo_security_settings';

type SecuritySettings = {
  isPinEnabled: boolean;
  isBiometricsEnabled: boolean;
  isLocked: boolean;
};

type SecurityState = SecuritySettings & {
  initialize: () => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  togglePin: (enabled: boolean) => Promise<void>;
  toggleBiometrics: (enabled: boolean) => Promise<void>;
  authenticateBiometrics: () => Promise<boolean>;
  setLocked: (locked: boolean) => void;
  hasPin: () => Promise<boolean>;
};

export const useSecurityStore = create<SecurityState>((set, get) => ({
  isPinEnabled: false,
  isBiometricsEnabled: false,
  isLocked: false,

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

  setPin: async (pin: string) => {
    try {
      await SecureStore.setItemAsync(PIN_KEY, pin);
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
      const storedPin = await SecureStore.getItemAsync(PIN_KEY);
      const isValid = storedPin === pin;
      if (isValid) {
        set({ isLocked: false });
      }
      return isValid;
    } catch (error) {
      console.error('[SecurityStore] verifyPin failed:', error);
      return false;
    }
  },

  togglePin: async (enabled: boolean) => {
    try {
      if (!enabled) {
        await SecureStore.deleteItemAsync(PIN_KEY);
      }
      const settings = { ...get(), isPinEnabled: enabled };
      await SecureStore.setItemAsync(SECURITY_SETTINGS_KEY, JSON.stringify({
        isPinEnabled: settings.isPinEnabled,
        isBiometricsEnabled: settings.isBiometricsEnabled,
      }));
      set({ isPinEnabled: enabled });
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
        set({ isLocked: false });
        return true;
      }
      return false;
    } catch (error) {
      console.error('[SecurityStore] Biometrics failed:', error);
      return false;
    }
  },

  setLocked: (locked: boolean) => set({ isLocked: locked }),

  hasPin: async () => {
    const pin = await SecureStore.getItemAsync(PIN_KEY);
    return !!pin;
  },
}));
