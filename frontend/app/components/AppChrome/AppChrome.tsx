// @AI-HINT: AppChrome conditionally renders global chrome (Header/Footer, toggles, PWA banners) except on auth routes for a focused experience.
'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/app/components/Header/Header';
import Footer from '@/app/components/Footer/Footer';
import ThemeToggleButton from '@/app/components/ThemeToggleButton';
import InstallAppBanner from '@/app/components/PWA/InstallAppBanner/InstallAppBanner';
import UpdateNotification from '@/app/components/PWA/UpdateNotification/UpdateNotification';
import PageTransition from '@/app/components/Transitions/PageTransition';

function isChromeLessRoute(pathname: string | null | undefined) {
  if (!pathname) return false; // default to showing chrome to avoid SSR/CSR layout shift
  const clean = pathname.replace(/\/$/, '').toLowerCase(); // strip trailing slash + normalize case
  const chromeLessRoots = [
    // Auth
    '/login', '/signup', '/forgot-password', '/reset-password',
    // Portal (client/freelancer/admin) app shell screens that have their own Navbar/Sidebar
    '/dashboard', '/messages', '/notifications', '/search', '/help', '/audit-logs',
    '/client', '/freelancer', '/admin'
  ];
  return chromeLessRoots.some((r) => clean === r || clean.startsWith(r + '/'));
}

// Using per-route-group/layout files for marketing pages; detect and skip chrome.
// Marketing pages are handled by PublicLayout for container/spacing only.

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = isChromeLessRoute(pathname);

  // For chrome-less routes (auth/portal shells), render a minimal shell.
  if (hideChrome) {
    return (
      <main id="main-content" role="main" className="min-h-screen">
        <PageTransition variant="fade">
          {children}
        </PageTransition>
      </main>
    );
  }

  // Always render header/footer unless the route is chrome-less (auth/portal shells).

  return (
    <>
      <Header />
      <main id="main-content" role="main" className="flex-grow">
        <PageTransition variant="fade">
          {children}
        </PageTransition>
      </main>
      <Footer />
      <ThemeToggleButton />
      <InstallAppBanner />
      <UpdateNotification />
    </>
  );
}
