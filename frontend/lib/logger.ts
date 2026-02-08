// @AI-HINT: Production-safe logger utility. No-ops in production, outputs in development.
// Use this instead of console.log/warn/error for intentional development logging.
// Note: console.* calls are also stripped from production builds via next.config.js compiler settings.

const IS_DEV = process.env.NODE_ENV === 'development';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/**
 * Production-safe logger.
 * - In development: outputs to console with prefixed labels.
 * - In production: all calls are no-ops (zero overhead).
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('User loaded', userData);
 *   logger.error('Failed to fetch', error);
 */
const noop = () => {};

export const logger: Logger = IS_DEV
  ? {
      debug: (...args: unknown[]) => console.debug('[DEBUG]', ...args),
      info: (...args: unknown[]) => console.info('[INFO]', ...args),
      log: (...args: unknown[]) => console.log('[LOG]', ...args),
      warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
      error: (...args: unknown[]) => console.error('[ERROR]', ...args),
    }
  : {
      debug: noop,
      info: noop,
      log: noop,
      warn: noop,
      error: noop,
    };

export default logger;
