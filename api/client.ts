import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local development baseURL. Accessing via Expo Public environment variables.
console.log('🔍 [System] process.env.EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
});

// MEMORY STORE: Synchronous token access to prevent race conditions during role changes
let authToken: string | null = null;

/**
 * Synchronously update the token used for all API requests.
 * This should be called immediately after login or role selection.
 */
export const setClientToken = (token: string | null) => {
  authToken = token;
  console.log('🔑 [API Client] Auth Token updated in memory');
};

console.log('🌐 [API Client] Initialized with baseURL:', apiClient.defaults.baseURL);

// Automatically inject session data if available
apiClient.interceptors.request.use(
  async (config) => {
    (config as any).metadata = { startTime: new Date() };
    console.log(`\n🚀 [API Request] ${config.method?.toUpperCase()} ${config.url}`);
    
    // Set token from memory (sync and reliable)
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
      console.log(`🔑 [API Client] Using Token (last 10 chars): ...${authToken.slice(-10)}`);
    } else {
      console.log(`🔑 [API Client] No Auth Token in memory`);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    const startTime = (response.config as any).metadata?.startTime;
    const duration = startTime ? new Date().getTime() - startTime.getTime() : 'unknown';
    
    console.log(`\n✅ [API Response] ${response.status} ${response.config.url} (${duration}ms)`);
    console.log(`📃 Headers:`, JSON.stringify(response.headers, null, 2));
    console.log(`📥 Data:`, JSON.stringify(response.data, null, 2));
    return response;
  },
  (error) => {
    const startTime = (error.config as any)?.metadata?.startTime;
    const duration = startTime ? new Date().getTime() - startTime.getTime() : 'unknown';

    const isExpected404 = error.response?.status === 404;
    const logMethod = isExpected404 ? console.warn : console.error;

    logMethod(`\n${isExpected404 ? '⚠️' : '❌'} [API ${isExpected404 ? 'Info' : 'Error'}] ${error.response?.status || 'Network'} ${error.config?.url} (${duration}ms)`);
    if (error.response) {
      if (!isExpected404) {
        logMethod(`📃 Headers:`, JSON.stringify(error.response.headers, null, 2));
        logMethod(`📥 Data:`, JSON.stringify(error.response.data, null, 2));
      }
    } else {
      console.error(`‼️ Message:`, error.message);
    }

    if (error.response?.status === 401) {
      console.error('[API] Unauthorized entry detected. Purging session storage.');
      
      // 1. Reactive Store Cleanup
      try {
        if (Platform.OS === 'web') {
          AsyncStorage.removeItem('thannigo_session');
        } else {
          SecureStore.deleteItemAsync('thannigo_session');
        }
      } catch (storageErr) {
        console.error('[API] Failed to purge session storage:', storageErr);
      }

      // 2. Global Event Signal (Native DeviceEventEmitter)
      DeviceEventEmitter.emit('thannigo:unauthorized', {
        code: error.response?.data?.code || 'UNAUTHORIZED',
        message: error.response?.data?.message || 'Unauthorized access'
      });
    }
    return Promise.reject(error);
  }
);
