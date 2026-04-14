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

// REFRESH LOGIC STATE
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    const startTime = (response.config as any).metadata?.startTime;
    const duration = startTime ? new Date().getTime() - startTime.getTime() : 'unknown';
    
    console.log(`\n✅ [API Response] ${response.status} ${response.config.url} (${duration}ms)`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const startTime = (originalRequest as any)?.metadata?.startTime;
    const duration = startTime ? new Date().getTime() - startTime.getTime() : 'unknown';

    const is401 = error.response?.status === 401;
    const isRefreshRequest = originalRequest.url?.includes('/auth/refresh');

    // Handle 401 Unauthorized errors (excluding the refresh request itself to avoid loops)
    if (is401 && !isRefreshRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, wait for it to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      console.log('🔄 [API Client] Access Token expired. Attempting Silent Refresh...');

      // 1. Get the current refresh token from storage
      let refreshToken = null;
      try {
        const sessionRaw = Platform.OS === 'web' 
          ? await AsyncStorage.getItem('thannigo_session')
          : await SecureStore.getItemAsync('thannigo_session');
        
        if (sessionRaw) {
          const session = JSON.parse(sessionRaw);
          refreshToken = session.refresh_token;
        }
      } catch (err) {
        console.error('⚠️ [API Client] Failed to read refresh token from storage:', err);
      }

      if (!refreshToken) {
        console.error('❌ [API Client] No refresh token found. Purging session.');
        isRefreshing = false;
        processQueue(new Error('No refresh token'), null);
        performDeepPurge();
        return Promise.reject(error);
      }

      // 2. Call the refresh endpoint
      try {
        const deviceId = (await import('../stores/securityStore')).useSecurityStore.getState().getDeviceId();
        const res = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {
          refresh_token: refreshToken
        }, {
            headers: { 'x-device-id': deviceId }
        });

        if (res.status === 200 && res.data.data.access_token) {
          const newAccessToken = res.data.data.access_token;
          console.log('✅ [API Client] Token successfully refreshed.');
          
          // Update memory & storage
          setClientToken(newAccessToken);
          await updatePersistentToken(newAccessToken);
          
          isRefreshing = false;
          processQueue(null, newAccessToken);

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        console.error('❌ [API Client] Silent Refresh failed. Purging session:', refreshErr);
        isRefreshing = false;
        processQueue(refreshErr, null);
        performDeepPurge();
        return Promise.reject(error);
      }
    }

    // Regular error logging (non-401 or failed refresh)
    if (error.response?.status !== 404) {
      console.error(`\n❌ [API Error] ${error.response?.status || 'Network'} ${originalRequest?.url} (${duration}ms)`);
      if (error.response?.data) {
        console.error('📥 Error Data:', JSON.stringify(error.response.data, null, 2));
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Update ONLY the access token in the persisted session storage
 */
async function updatePersistentToken(token: string) {
  try {
    const key = 'thannigo_session';
    const raw = Platform.OS === 'web' 
      ? await AsyncStorage.getItem(key)
      : await SecureStore.getItemAsync(key);
    
    if (raw) {
      const session = JSON.parse(raw);
      session.access_token = token;
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, JSON.stringify(session));
      } else {
        await SecureStore.setItemAsync(key, JSON.stringify(session));
      }
    }
  } catch (err) {
    console.error('[API Client] Persistence update failed:', err);
  }
}

/**
 * Global signal to log out the user and clear all data
 */
function performDeepPurge() {
  console.warn('[API] Deep Purge initiated.');
  // Signal AppSessionProvider to handle UI logout
  DeviceEventEmitter.emit('thannigo:unauthorized', {
    code: 'SESSION_EXPIRED',
    message: 'Your session has expired. Please log in again.'
  });
}
