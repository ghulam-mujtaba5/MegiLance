// @AI-HINT: Public Jobs list page with CollectionPage + BreadcrumbList for Google Rich Results.
import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import PublicJobs from './PublicJobs';
import { buildMeta, buildCollectionPageJsonLd, buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'Find Freelance Jobs',
    description: 'Browse and apply for freelance jobs on MegiLance. Find projects in web development, design, writing, AI/ML, and more. Secure payments, AI matching, zero fees.',
    path: '/jobs',
    keywords: ['freelance jobs', 'find work online', 'remote freelance projects', 'hire developers', 'web development jobs'],
  });
}

export default function Page() {
  return (
    <>
      <script {...jsonLdScriptProps(
        buildCollectionPageJsonLd('Find Freelance Jobs', 'Browse thousands of freelance projects. AI-powered matching and secure payments.', '/jobs')
      )} />
      <script {...jsonLdScriptProps(
        buildBreadcrumbJsonLd([{ name: 'Jobs', path: '/jobs' }])
      )} />
      <Suspense fallback={<div>Loading jobs...</div>}>
        <PublicJobs />
      </Suspense>
    </>
  );
}
