// @AI-HINT: Global error page with professional error handling and recovery options
'use client';

import React, { useEffect } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';
import Button from '@/app/components/Button/Button';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';

import common from './GlobalError.common.module.css';
import light from './GlobalError.light.module.css';
import dark from './GlobalError.dark.module.css';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const ErrorContent = ({ error, reset }: GlobalErrorProps) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <main className={cn(common.page, themed.page)}>
      <PageTransition>
        <ScrollReveal>
          <div className={common.container}>
            {/* Error Icon */}
            <div className={cn(common.iconWrapper, themed.iconWrapper)}>
              <AlertTriangle className={common.icon} />
            </div>

            {/* Error Message */}
            <div className={common.messageWrapper}>
              <h1 className={common.title}>Something went wrong</h1>
              <p className={cn(common.description, themed.description)}>
                We apologize for the inconvenience. An unexpected error has occurred.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-red-500 font-mono mt-2">
                  {error.message}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className={common.actions}>
              <Button 
                onClick={reset} 
                variant="primary" 
                fullWidth 
                iconBefore={<RefreshCw size={16} />}
              >
                Try again
              </Button>
              
              <div className={cn(common.links, themed.links)}>
                <a href="/" className={cn(common.link, themed.link)}>
                  <Home size={16} />
                  <span>Go Home</span>
                </a>
                <a href="/contact" className={cn(common.link, themed.link)}>
                  <MessageCircle size={16} />
                  <span>Contact Support</span>
                </a>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </PageTransition>
    </main>
  );
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Global error:', error);
    
    // In production, send to error tracking service (Sentry, etc.)
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
           <ErrorContent error={error} reset={reset} />
        </ThemeProvider>
      </body>
    </html>
  );
}
