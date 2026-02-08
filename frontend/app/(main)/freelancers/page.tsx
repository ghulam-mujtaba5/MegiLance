// @AI-HINT: Public Freelancers list page with CollectionPage + BreadcrumbList for Google Rich Results.
import React from 'react';
import type { Metadata } from 'next';
import PublicFreelancers from './PublicFreelancers';
import { buildMeta, buildCollectionPageJsonLd, buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'Find & Hire Top Freelancers',
    description: 'Browse and hire verified freelancers on MegiLance. Connect with experts in development, design, marketing, AI/ML, and more. AI-powered matching.',
    path: '/freelancers',
    keywords: ['hire freelancers', 'find developers', 'top freelancers', 'verified talent', 'remote experts'],
  });
}

export default function Page() {
  return (
    <>
      <script {...jsonLdScriptProps(
        buildCollectionPageJsonLd('Find Freelancers', 'Browse and hire verified freelancers on MegiLance.', '/freelancers')
      )} />
      <script {...jsonLdScriptProps(
        buildBreadcrumbJsonLd([{ name: 'Freelancers', path: '/freelancers' }])
      )} />
      <PublicFreelancers />
    </>
  );
}
