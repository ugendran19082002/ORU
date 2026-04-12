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

console.log('🌐 [API Client] Initialized with baseURL:', apiClient.defaults.baseURL);

// Automatically inject session data if available
apiClient.interceptors.request.use(
  async (config) => {
    (config as any).metadata = { startTime: new Date() };
    console.log(`\n🚀 [API Request] ${config.method?.toUpperCase()} ${config.url}`);
    console.log(`📃 Headers:`, JSON.stringify(config.headers, null, 2));
    if (config.data) console.log(`📦 Body:`, JSON.stringify(config.data, null, 2));
    
    try {
      const sessionData = Platform.OS === 'web'
        ? await AsyncStorage.getItem('thannigo_session')
        : await SecureStore.getItemAsync('thannigo_session');
      
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (parsed.access_token) {
          config.headers.Authorization = `Bearer ${parsed.access_token}`;
        }
      }
    } catch (e) {
      console.warn('[API] Could not retrieve session for headers', e);
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

    console.error(`\n❌ [API Error] ${error.response?.status || 'Network'} ${error.config?.url} (${duration}ms)`);
    if (error.response) {
      console.error(`📃 Headers:`, JSON.stringify(error.response.headers, null, 2));
      console.error(`📥 Data:`, JSON.stringify(error.response.data, null, 2));
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
