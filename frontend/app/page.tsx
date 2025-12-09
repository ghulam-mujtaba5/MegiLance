// @AI-HINT: This is the root Next.js home route. It delegates to the main Home component.
import type { Metadata } from 'next';
import Home from './home/Home';
import { BASE_URL, SITE_NAME } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'MegiLance - AI-Powered Freelance Marketplace | Hire Top Talent',
  description: 'Connect with world-class freelancers and clients on MegiLance. AI-powered matching, secure blockchain payments, and real-time collaboration tools.',
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: 'MegiLance - The Future of Freelancing',
    description: 'Join the AI-powered revolution in freelancing. Zero fees for freelancers, instant crypto payments, and smart matching.',
    url: BASE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: `${BASE_URL}/og-home.jpg`, // Ensure this image exists or use a default
        width: 1200,
        height: 630,
        alt: 'MegiLance Platform Preview',
      },
    ],
    type: 'website',
  },
};

export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/jobs?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Home />
    </>
  );
}