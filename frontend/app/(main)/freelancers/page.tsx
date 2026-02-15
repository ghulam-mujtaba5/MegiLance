// @AI-HINT: Public Freelancers list page with CollectionPage + BreadcrumbList for Google Rich Results.
import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import PublicFreelancers from './PublicFreelancers';
import { buildMeta, buildCollectionPageJsonLd, buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'Hire Freelancers - Find & Hire Top Freelance Web Developers & Designers',
    description: 'Hire freelancers on MegiLance — find top freelance web developers, freelance website designers, graphic designers, and verified experts. AI-powered matching, escrow protection. Best Upwork alternative for hiring.',
    path: '/freelancers',
    keywords: [
      'hire freelancers', 'freelance web developer', 'freelance website designer',
      'hire graphic designer', 'developers for hire', 'programmer for hire',
      'top freelancers', 'verified freelancers', 'upwork alternative',
    ],
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
      <Suspense fallback={<div>Loading freelancers...</div>}>
        <PublicFreelancers />
      </Suspense>
    </>
  );
}
