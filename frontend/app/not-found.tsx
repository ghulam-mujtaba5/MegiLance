// @AI-HINT: Custom 404 page for MegiLance.
'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import common from './NotFound.common.module.css';
import light from './NotFound.light.module.css';
import dark from './NotFound.dark.module.css';

const NotFoundPage: React.FC = () => {
  const { theme } = useTheme();
  const themed = theme === 'dark' ? dark : light;

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <div className={common.content}>
          <h1 className={common.title}>404</h1>
          <h2 className={common.subtitle}>Page Not Found</h2>
          <p className={common.description}>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className={common.actions}>
            <Link href="/" className={common.primaryButton}>
              Go Home
            </Link>
            <Link href="/contact" className={common.secondaryButton}>
              Contact Support
            </Link>
          </div>
          <div className={common.suggestions}>
            <h3 className={common.suggestionsTitle}>Popular Pages</h3>
            <div className={common.suggestionsGrid}>
              <Link href="/jobs" className={common.suggestionLink}>
                Find Jobs
              </Link>
              <Link href="/freelancers" className={common.suggestionLink}>
                Find Freelancers
              </Link>
              <Link href="/pricing" className={common.suggestionLink}>
                Pricing
              </Link>
              <Link href="/help" className={common.suggestionLink}>
                Help Center
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default NotFoundPage; 