// @AI-HINT: Centralized error reporting utility for MegiLance frontend.
// In development: logs to console. In production: sends to monitoring service.
// Replace Sentry DSN when ready with: https://sentry.io or use Vercel Analytics.

type ErrorSeverity = 'info' | 'warning' | 'error' | 'fatal';

interface ErrorReport {
  message: string;
  error?: Error;
  severity?: ErrorSeverity;
  context?: Record<string, unknown>;
  tags?: Record<string, string>;
}

/**
 * Report an error to the monitoring service.
 * In development, logs to console. In production, sends to error tracking.
 */
export function reportError({
  message,
  error,
  severity = 'error',
  context = {},
  tags = {},
}: ErrorReport): void {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    const logMethod = severity === 'fatal' || severity === 'error' 
      ? console.error 
      : severity === 'warning' 
        ? console.warn 
        : console.log;
    logMethod(`[${severity.toUpperCase()}] ${message}`, error || '', context);
    return;
  }

  // Production: Send to error tracking service
  // Uncomment when Sentry is configured:
  // import * as Sentry from '@sentry/nextjs';
  // Sentry.captureException(error || new Error(message), {
  //   level: severity,
  //   tags,
  //   extra: context,
  // });

  // Fallback: Use Vercel Analytics or log to backend
  try {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: message,
        fatal: severity === 'fatal',
      });
    }
  } catch {
    // Silent fail - don't break the app for error reporting
  }
}

/**
 * Report a caught error with user-facing context
 */
export function reportCaughtError(error: unknown, context: string): void {
  const err = error instanceof Error ? error : new Error(String(error));
  reportError({
    message: `${context}: ${err.message}`,
    error: err,
    context: { source: context },
  });
}

/**
 * Report an API error with request details
 */
export function reportApiError(
  endpoint: string,
  status: number,
  message: string,
  error?: unknown
): void {
  reportError({
    message: `API Error [${status}] ${endpoint}: ${message}`,
    error: error instanceof Error ? error : undefined,
    severity: status >= 500 ? 'error' : 'warning',
    context: { endpoint, status, responseMessage: message },
    tags: { type: 'api_error' },
  });
}

export default reportError;
