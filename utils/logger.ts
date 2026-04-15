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

type LogLevel = 'info' | 'warn' | 'error';

const shouldLog = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

function write(level: LogLevel, ...args: unknown[]): void {
  if (!shouldLog) return;
  switch (level) {
    case 'warn':
      console.warn(...args);
      break;
    case 'error':
      console.error(...args);
      break;
    default:
      console.log(...args);
  }
}

export const log = {
  info: (...args: unknown[]) => write('info', ...args),
  warn: (...args: unknown[]) => write('warn', ...args),
  error: (...args: unknown[]) => write('error', ...args),
};
