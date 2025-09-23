// @AI-HINT: Custom 404 page for MegiLance.

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import common from './NotFound.common.module.css';

// Server-side component - no client hooks
export default function NotFoundPage() {
  return (
    <main className={common.page}>
      <div className={common.container}>
        <div className={common.content}>
          <h1 className={common.title}>404</h1>
          <h2 className={common.subtitle}>Page Not Found</h2>
          <p className={common.description}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
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
}
