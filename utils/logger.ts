/**
 * Centralised logger — only prints in __DEV__ mode.
 * Drop-in replacement for console.log/warn/error scattered across the codebase.
 *
 * Usage:
 *   import { log } from '@/utils/logger';
 *   log.info('[Session]', 'User signed in');
 *   log.warn('[Guard]', 'Redirecting to auth');
 *   log.error('[API]', 'Request failed', error);
 */

import { apiClient } from '@/api/client';
import * as Device from 'expo-device';

type LogLevel = 'info' | 'warn' | 'error';

const shouldLog = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

/**
 * Sends a captured error report to the backend for persistence and debugging.
 */
async function reportRemote(message: string, error?: any, context?: any) {
  try {
    // Only report in production or if explicitly enabled
    // For now, let's enable it to verify the logic works
    await apiClient.post('/system/report-error', {
      message,
      stack: error?.stack || String(error),
      deviceInfo: {
        brand: Device.brand,
        modelName: Device.modelName,
        osVersion: Device.osVersion,
        isDevice: Device.isDevice,
      },
      context: {
        ...context,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (err) {
    // Fail silently to avoid infinite loops if the reporting itself fails
    console.warn('[Logger] Remote reporting failed', err);
  }
}

function write(level: LogLevel, ...args: unknown[]): void {
  if (!shouldLog && level !== 'error') return; // Always log/report errors even in production

  switch (level) {
    case 'warn':
      if (shouldLog) console.warn(...args);
      break;
    case 'error':
      console.error(...args);
      // Report to backend
      const message = typeof args[0] === 'string' ? args[0] : 'Unspecified Error';
      const error = args.find(a => a instanceof Error || (a as any)?.stack);
      reportRemote(message, error, { args: args.slice(1) });
      break;
    default:
      if (shouldLog) console.log(...args);
  }
}

export const log = {
  info: (...args: unknown[]) => write('info', ...args),
  warn: (...args: unknown[]) => write('warn', ...args),
  error: (...args: unknown[]) => write('error', ...args),
};
