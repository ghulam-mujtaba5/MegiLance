// @AI-HINT: Public Enterprise page. Investor-grade marketing placeholder; server component.
import React from 'react';
import type { Metadata } from 'next';
import { buildMeta, buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';
import Enterprise from './Enterprise';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'Enterprise Solutions',
    description: 'Scale your workforce with MegiLance Enterprise. Dedicated account managers, custom workflows, SSO integration, and compliance-ready freelancer management.',
    path: '/enterprise',
    keywords: ['enterprise freelancing', 'managed teams', 'corporate freelance', 'enterprise workforce'],
  });
}

export default function EnterprisePage() {
  return (
    <>
      <script {...jsonLdScriptProps(
        buildBreadcrumbJsonLd([{ name: 'Enterprise', path: '/enterprise' }])
      )} />
      <Enterprise />
    </>
  );
}

 