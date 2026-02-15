// @AI-HINT: Public Jobs list page with CollectionPage + BreadcrumbList for Google Rich Results.
import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import PublicJobs from './PublicJobs';
import { buildMeta, buildCollectionPageJsonLd, buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'Freelance Jobs Online - Find Remote Freelance Work & Projects',
    description: 'Browse and apply for freelance jobs online on MegiLance. Find freelance work online in web development, design, writing, AI/ML, virtual assistant jobs remote, and more. Secure payments with AI matching.',
    path: '/jobs',
    keywords: [
      'freelance jobs online', 'freelance work online', 'find freelance jobs',
      'virtual assistant jobs remote', 'remote freelance projects',
      'freelance web developer jobs', 'freelancer website jobs',
    ],
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
