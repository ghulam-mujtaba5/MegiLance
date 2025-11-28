// @AI-HINT: Global error page with professional error handling and recovery options
'use client';

import React, { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';
import Button from '@/app/components/Button/Button';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Log error to monitoring service
    console.error('Global error:', error);
    
    // In production, send to error tracking service (Sentry, etc.)
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
    }
  }, [error]);

  const isDark = resolvedTheme === 'dark';

  return (
    <html lang="en">
      <body className={cn(
        'min-h-screen flex items-center justify-center p-4',
        isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      )}>
        <div className="max-w-md w-full text-center space-y-6">
          {/* Error Icon */}
          <div className={cn(
            'mx-auto w-20 h-20 rounded-full flex items-center justify-center',
            isDark ? 'bg-red-900/30' : 'bg-red-100'
          )}>
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className={cn(
              'text-sm',
              isDark ? 'text-gray-400' : 'text-gray-600'
            )}>
              We apologize for the inconvenience. Our team has been notified and is working on a fix.
            </p>
          </div>

          {/* Error Details (Development only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className={cn(
              'p-4 rounded-lg text-left text-xs font-mono overflow-auto max-h-32',
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            )}>
              <p className="text-red-500 font-semibold">{error.name}</p>
              <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>{error.message}</p>
              {error.digest && (
                <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="primary"
              onClick={reset}
              className="flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.location.href = '/'}
              className="flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </div>

          {/* Support Link */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <a
              href="/contact"
              className={cn(
                'inline-flex items-center gap-2 text-sm hover:underline',
                isDark ? 'text-blue-400' : 'text-blue-600'
              )}
            >
              <MessageCircle className="w-4 h-4" />
              Contact Support
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
