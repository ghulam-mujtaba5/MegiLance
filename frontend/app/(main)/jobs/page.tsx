// @AI-HINT: Public Jobs list page.
import React from 'react';
import PublicJobs from './PublicJobs';
import { BASE_URL } from '@/lib/seo';

export const metadata = {
  title: 'Find Work | MegiLance',
  description: 'Browse and apply for jobs on MegiLance. Find freelance projects in web development, design, writing, and more.',
  openGraph: {
    title: 'Find Freelance Jobs - MegiLance',
    description: 'Browse thousands of freelance jobs. Secure payments, AI matching, and zero fees for freelancers.',
    url: `${BASE_URL}/jobs`,
  },
  alternates: {
    canonical: `${BASE_URL}/jobs`,
  },
};

export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Find Work',
    description: 'Browse and apply for jobs on MegiLance.',
    url: `${BASE_URL}/jobs`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'MegiLance',
      url: BASE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicJobs />
    </>
  );
}
