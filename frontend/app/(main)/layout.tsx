// @AI-HINT: This is the public site layout wrapper. It uses PublicLayout to provide the shared Header/Footer and skip links for marketing pages.

import React from 'react';
import type { Metadata } from 'next';
import PublicLayout from '../layouts/PublicLayout/PublicLayout';

export const metadata: Metadata = {
  title: {
    template: '%s | MegiLance',
    default: 'MegiLance – AI-Powered Freelancing Platform',
  },
  description: 'Connect with top freelancers and clients on MegiLance. AI-powered matching, secure payments, and real-time collaboration tools.',
  openGraph: {
    type: 'website',
    siteName: 'MegiLance',
    locale: 'en_US',
  },
};

export default function MainLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <PublicLayout>
      {children}
    </PublicLayout>
  );
}
