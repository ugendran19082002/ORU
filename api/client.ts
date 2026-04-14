import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local development baseURL. Accessing via Expo Public environment variables.
console.log('🔍 [System] process.env.EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
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

export const getClientToken = () => authToken;

/**
 * Resolves a relative backend path (e.g. /uploads/...) to a full absolute URL
 * based on the current apiClient baseURL.
 */
export const resolveApiUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  
  // Get base server URL by removing '/api' from the baseURL
  const base = apiClient.defaults.baseURL?.replace(/\/api$/, '') || '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${base}${cleanPath}`;
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

    const is404 = error.response?.status === 404;
    const is401 = error.response?.status === 401;

    // Only log real errors, ignore 404 as requested
    if (!is404) {
      console.error(`\n❌ [API Error] ${error.response?.status || 'Network'} ${error.config?.url} (${duration}ms)`);
      if (error.response) {
         // Silencing headers/data logs for general cleaner feedback
      } else {
        console.error(`‼️ Message:`, error.message);
      }
    }

    if (is401) {
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
