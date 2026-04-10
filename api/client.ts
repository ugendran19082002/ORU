import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// This is the fallback configuration. Replace baseURL when integrating real endpoints.
export const apiClient = axios.create({
  baseURL: 'https://api.thannigo.dev/v1',
  timeout: 10000,
});

// Automatically inject session data if available
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const sessionData = Platform.OS === 'web'
        ? await AsyncStorage.getItem('thannigo_session')
        : await SecureStore.getItemAsync('thannigo_session');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (parsed.user?.id) {
          // In a real app this would be a JWT token
          config.headers.Authorization = `Bearer mock-token-${parsed.user.id}`;
        }
      }
    } catch (e) {
      // Ignore secure store read errors silently
      console.warn('[API] Could not retrieve session for headers', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Centralized error handling
    if (error.response?.status === 401) {
      console.error('[API] Unauthorized entry detected.');
      // E.g., trigger global logout sequence
    }
    return Promise.reject(error);
  }
);
