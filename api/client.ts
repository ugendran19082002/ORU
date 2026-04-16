import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from '@/utils/logger';

// Session storage key — versioned to support future schema migrations
export const SESSION_STORAGE_KEY = 'thannigo_session_v1';

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
});

log.info('🌐 [API Client] Initialized with baseURL:', apiClient.defaults.baseURL);

// MEMORY STORE: Synchronous token access to prevent race conditions during role changes
let authToken: string | null = null;

/**
 * Synchronously update the token used for all API requests.
 * Call immediately after login or role selection.
 */
export const setClientToken = (token: string | null) => {
  authToken = token;
  log.info('🔑 [API Client] Auth token updated');
};

export const getClientToken = () => authToken;

/**
 * Resolves a relative backend path (e.g. /uploads/...) to a full absolute URL
 * based on the current apiClient baseURL.
 */
export const resolveApiUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;

  const base = apiClient.defaults.baseURL?.replace(/\/api$/, '') ?? '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

// ─── Request interceptor ───────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  async (config) => {
    (config as unknown as Record<string, unknown>).metadata = { startTime: new Date() };
    log.info(`🚀 [API] ${config.method?.toUpperCase()} ${config.url}`);

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    } else {
      log.info('🔑 [API] No auth token in memory');
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Refresh-queue state ───────────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// ─── Response interceptor ──────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => {
    const meta = (response.config as unknown as Record<string, unknown>).metadata as { startTime: Date } | undefined;
    const duration = meta ? new Date().getTime() - meta.startTime.getTime() : 'unknown';
    log.info(`✅ [API] ${response.status} ${response.config.url} (${duration}ms)`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config as unknown as Record<string, unknown> & { url?: string; _retry?: boolean; headers: Record<string, string> };
    const meta = originalRequest?.metadata as { startTime: Date } | undefined;
    const duration = meta ? new Date().getTime() - meta.startTime.getTime() : 'unknown';

    const is401 = error.response?.status === 401;
    const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh');

    if (is401 && !isRefreshRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
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

      log.info('🔄 [API] Access token expired — attempting silent refresh...');

      // Read refresh token from storage
      let refreshToken: string | null = null;
      try {
        const sessionRaw =
          Platform.OS === 'web'
            ? await AsyncStorage.getItem(SESSION_STORAGE_KEY)
            : await SecureStore.getItemAsync(SESSION_STORAGE_KEY);

        if (sessionRaw) {
          const session = JSON.parse(sessionRaw) as { refresh_token?: string };
          refreshToken = session.refresh_token ?? null;
        }
      } catch (err) {
        log.error('⚠️ [API] Failed to read refresh token from storage:', err);
      }

      if (!refreshToken) {
        log.error('❌ [API] No refresh token found — purging session.');
        isRefreshing = false;
        processQueue(new Error('No refresh token'), null);
        performDeepPurge();
        return Promise.reject(error);
      }

      try {
        const { useSecurityStore } = await import('../stores/securityStore');
        const deviceId = useSecurityStore.getState().getDeviceId();
        const res = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          { refresh_token: refreshToken },
          { headers: { 'x-device-id': deviceId } },
        );

        if (res.status === 200 && (res.data as { data: { access_token?: string } }).data.access_token) {
          const newAccessToken = (res.data as { data: { access_token: string } }).data.access_token;
          log.info('✅ [API] Token refreshed successfully.');

          setClientToken(newAccessToken);
          await updatePersistentToken(newAccessToken);

          isRefreshing = false;
          processQueue(null, newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        log.error('❌ [API] Silent refresh failed — purging session:', refreshErr);
        isRefreshing = false;
        processQueue(refreshErr, null);
        performDeepPurge();
        return Promise.reject(error);
      }
    }

    // Log non-401 errors (including 404 which was silently swallowed before)
    const errorBody = error.response?.data;
    const errorMessage = typeof errorBody === 'object' ? JSON.stringify(errorBody) : (errorBody || error.message);

    log.error(
      `❌ [API] ${error.response?.status ?? 'Network'} ${originalRequest?.url} (${duration}ms)`,
      errorMessage,
    );

    // Global UI Alerts for specific errors
    if (error.response?.status === 500) {
      DeviceEventEmitter.emit('thannigo:show_toast', {
        type: 'error',
        text1: 'Server Error',
        text2: 'Something went wrong on our end. We have logged the issue.',
      });
    }

    return Promise.reject(error);
  },
);

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function updatePersistentToken(token: string): Promise<void> {
  try {
    const raw =
      Platform.OS === 'web'
        ? await AsyncStorage.getItem(SESSION_STORAGE_KEY)
        : await SecureStore.getItemAsync(SESSION_STORAGE_KEY);

    if (raw) {
      const session = JSON.parse(raw) as Record<string, unknown>;
      session.access_token = token;

      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      } else {
        await SecureStore.setItemAsync(SESSION_STORAGE_KEY, JSON.stringify(session));
      }
    }
  } catch (err) {
    log.error('[API] Persistence update failed:', err);
  }
}

function performDeepPurge(): void {
  log.warn('[API] Deep purge initiated — emitting unauthorized signal.');
  DeviceEventEmitter.emit('thannigo:unauthorized', {
    code: 'SESSION_EXPIRED',
    message: 'Your session has expired. Please log in again.',
  });
}
