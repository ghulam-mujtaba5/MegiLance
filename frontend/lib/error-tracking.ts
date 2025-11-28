// @AI-HINT: Error tracking and monitoring with Sentry integration
'use client';

import { useEffect } from 'react';

// ============================================================================
// Error Types
// ============================================================================

export interface ErrorContext {
  userId?: string;
  email?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  release?: string;
  environment?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  breadcrumbs?: Breadcrumb[];
}

export interface Breadcrumb {
  type: 'navigation' | 'http' | 'ui' | 'console' | 'error' | 'info';
  category: string;
  message: string;
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface ErrorEvent {
  error: Error;
  context: ErrorContext;
  handled: boolean;
  mechanism?: string;
}

// ============================================================================
// Error Provider Interface
// ============================================================================

interface ErrorTrackingProvider {
  initialize(config: ErrorTrackingConfig): void;
  captureError(error: Error, context?: Partial<ErrorContext>): string | undefined;
  captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void;
  setUser(user: { id: string; email?: string; username?: string }): void;
  clearUser(): void;
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void;
  setTag(key: string, value: string): void;
  setExtra(key: string, value: unknown): void;
}

interface ErrorTrackingConfig {
  dsn?: string;
  environment?: string;
  release?: string;
  sampleRate?: number;
  tracesSampleRate?: number;
  debug?: boolean;
}

// ============================================================================
// Console Error Provider (Built-in)
// ============================================================================

class ConsoleErrorProvider implements ErrorTrackingProvider {
  private config: ErrorTrackingConfig = {};
  private user: { id: string; email?: string; username?: string } | null = null;
  private tags: Record<string, string> = {};
  private extras: Record<string, unknown> = {};
  private breadcrumbs: Breadcrumb[] = [];

  initialize(config: ErrorTrackingConfig): void {
    this.config = config;
    console.log('[ErrorTracking] Initialized with console provider', {
      environment: config.environment,
      release: config.release,
    });
  }

  captureError(error: Error, context?: Partial<ErrorContext>): string | undefined {
    const eventId = this.generateEventId();
    
    const errorData = {
      eventId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context: {
        ...context,
        user: this.user,
        tags: this.tags,
        extra: this.extras,
        breadcrumbs: this.breadcrumbs.slice(-10),
        environment: this.config.environment,
        release: this.config.release,
        timestamp: new Date().toISOString(),
      },
    };

    console.error('[ErrorTracking] Error captured:', errorData);
    
    // Send to backend for logging
    this.sendToBackend('error', errorData);
    
    return eventId;
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    const eventId = this.generateEventId();
    
    const messageData = {
      eventId,
      message,
      level,
      context: {
        user: this.user,
        tags: this.tags,
        extra: this.extras,
        environment: this.config.environment,
        release: this.config.release,
        timestamp: new Date().toISOString(),
      },
    };

    console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'info'](
      '[ErrorTracking] Message captured:',
      messageData
    );

    this.sendToBackend('message', messageData);
  }

  setUser(user: { id: string; email?: string; username?: string }): void {
    this.user = user;
    console.log('[ErrorTracking] User set:', user.id);
  }

  clearUser(): void {
    this.user = null;
    console.log('[ErrorTracking] User cleared');
  }

  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: new Date().toISOString(),
    });
    
    // Keep only last 50 breadcrumbs
    if (this.breadcrumbs.length > 50) {
      this.breadcrumbs = this.breadcrumbs.slice(-50);
    }
  }

  setTag(key: string, value: string): void {
    this.tags[key] = value;
  }

  setExtra(key: string, value: unknown): void {
    this.extras[key] = value;
  }

  private generateEventId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private async sendToBackend(type: 'error' | 'message', data: unknown): Promise<void> {
    try {
      await fetch('/backend/api/v1/monitoring/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data }),
      });
    } catch {
      // Silently fail - don't cause more errors
    }
  }
}

// ============================================================================
// Sentry Provider (Production)
// ============================================================================

class SentryProvider implements ErrorTrackingProvider {
  private sentry: typeof import('@sentry/nextjs') | null = null;

  async initializeAsync(config: ErrorTrackingConfig): Promise<void> {
    if (!config.dsn) {
      console.warn('[ErrorTracking] Sentry DSN not provided');
      return;
    }

    try {
      this.sentry = await import('@sentry/nextjs');
      
      this.sentry.init({
        dsn: config.dsn,
        environment: config.environment || 'development',
        release: config.release,
        sampleRate: config.sampleRate ?? 1.0,
        tracesSampleRate: config.tracesSampleRate ?? 0.1,
        debug: config.debug ?? false,
        integrations: [
          this.sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      });

      console.log('[ErrorTracking] Sentry initialized');
    } catch (error) {
      console.warn('[ErrorTracking] Failed to initialize Sentry:', error);
    }
  }

  initialize(config: ErrorTrackingConfig): void {
    this.initializeAsync(config);
  }

  captureError(error: Error, context?: Partial<ErrorContext>): string | undefined {
    if (!this.sentry) return undefined;
    
    return this.sentry.captureException(error, {
      tags: context?.tags,
      extra: context?.extra,
    });
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.sentry) return;
    this.sentry.captureMessage(message, level);
  }

  setUser(user: { id: string; email?: string; username?: string }): void {
    if (!this.sentry) return;
    this.sentry.setUser(user);
  }

  clearUser(): void {
    if (!this.sentry) return;
    this.sentry.setUser(null);
  }

  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    if (!this.sentry) return;
    this.sentry.addBreadcrumb({
      type: breadcrumb.type,
      category: breadcrumb.category,
      message: breadcrumb.message,
      level: breadcrumb.level,
      data: breadcrumb.data,
    });
  }

  setTag(key: string, value: string): void {
    if (!this.sentry) return;
    this.sentry.setTag(key, value);
  }

  setExtra(key: string, value: unknown): void {
    if (!this.sentry) return;
    this.sentry.setExtra(key, value);
  }
}

// ============================================================================
// Error Tracking Manager
// ============================================================================

class ErrorTrackingManager {
  private provider: ErrorTrackingProvider;
  private initialized = false;

  constructor() {
    this.provider = new ConsoleErrorProvider();
  }

  initialize(config: ErrorTrackingConfig = {}): void {
    if (this.initialized) return;

    const isDev = process.env.NODE_ENV === 'development';
    
    if (!isDev && config.dsn) {
      this.provider = new SentryProvider();
    } else {
      this.provider = new ConsoleErrorProvider();
    }

    this.provider.initialize({
      environment: process.env.NODE_ENV,
      release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      ...config,
    });

    // Set up global error handlers
    this.setupGlobalHandlers();
    
    this.initialized = true;
  }

  private setupGlobalHandlers(): void {
    if (typeof window === 'undefined') return;

    // Unhandled errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        tags: { type: 'unhandled' },
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));
      
      this.captureError(error, {
        tags: { type: 'unhandled_promise' },
      });
    });

    // Navigation breadcrumbs
    if ('navigation' in window.performance) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.addBreadcrumb({
              type: 'navigation',
              category: 'navigation',
              message: `Navigated to ${window.location.pathname}`,
              level: 'info',
              data: { url: window.location.href },
            });
          }
        }
      });
      
      try {
        observer.observe({ type: 'navigation', buffered: true });
      } catch {
        // Navigation observer not supported
      }
    }

    // Console breadcrumbs
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.addBreadcrumb({
        type: 'console',
        category: 'console',
        message: args.map(arg => String(arg)).join(' '),
        level: 'error',
      });
      originalConsoleError.apply(console, args);
    };

    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      this.addBreadcrumb({
        type: 'console',
        category: 'console',
        message: args.map(arg => String(arg)).join(' '),
        level: 'warning',
      });
      originalConsoleWarn.apply(console, args);
    };
  }

  captureError(error: Error, context?: Partial<ErrorContext>): string | undefined {
    return this.provider.captureError(error, context);
  }

  captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void {
    this.provider.captureMessage(message, level);
  }

  setUser(user: { id: string; email?: string; username?: string }): void {
    this.provider.setUser(user);
  }

  clearUser(): void {
    this.provider.clearUser();
  }

  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    this.provider.addBreadcrumb(breadcrumb);
  }

  setTag(key: string, value: string): void {
    this.provider.setTag(key, value);
  }

  setExtra(key: string, value: unknown): void {
    this.provider.setExtra(key, value);
  }

  // Create error boundary wrapper
  withErrorBoundary<T>(fn: () => T, context?: Partial<ErrorContext>): T | undefined {
    try {
      return fn();
    } catch (error) {
      if (error instanceof Error) {
        this.captureError(error, context);
      }
      return undefined;
    }
  }

  // Async error wrapper
  async withErrorBoundaryAsync<T>(
    fn: () => Promise<T>,
    context?: Partial<ErrorContext>
  ): Promise<T | undefined> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof Error) {
        this.captureError(error, context);
      }
      return undefined;
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const errorTracking = new ErrorTrackingManager();

// ============================================================================
// React Hook for Error Tracking
// ============================================================================

export function useErrorTracking() {
  useEffect(() => {
    errorTracking.initialize({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    });
  }, []);

  return {
    captureError: errorTracking.captureError.bind(errorTracking),
    captureMessage: errorTracking.captureMessage.bind(errorTracking),
    setUser: errorTracking.setUser.bind(errorTracking),
    clearUser: errorTracking.clearUser.bind(errorTracking),
    addBreadcrumb: errorTracking.addBreadcrumb.bind(errorTracking),
    setTag: errorTracking.setTag.bind(errorTracking),
    setExtra: errorTracking.setExtra.bind(errorTracking),
  };
}

// ============================================================================
// API Error Handler
// ============================================================================

export function handleAPIError(error: unknown, endpoint: string): void {
  errorTracking.addBreadcrumb({
    type: 'http',
    category: 'api',
    message: `API Error: ${endpoint}`,
    level: 'error',
    data: { endpoint },
  });

  if (error instanceof Error) {
    errorTracking.captureError(error, {
      tags: { endpoint, type: 'api_error' },
    });
  }
}

// ============================================================================
// React Error Boundary Hook
// ============================================================================

export function useErrorBoundary() {
  const handleError = (error: Error, errorInfo?: { componentStack?: string }) => {
    errorTracking.captureError(error, {
      tags: { type: 'react_error' },
      extra: { componentStack: errorInfo?.componentStack },
    });
  };

  return { handleError };
}

export default errorTracking;
