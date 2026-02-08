// @AI-HINT: This is the root Next.js home route. It delegates to the main Home component.
import type { Metadata } from 'next';
import Home from './home/Home';
import { BASE_URL, SITE_NAME, buildWebSiteJsonLd, buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'MegiLance - AI-Powered Freelance Marketplace | Hire Top Talent',
  description: 'Connect with world-class freelancers and clients on MegiLance. AI-powered matching, secure blockchain payments, and real-time collaboration tools. Zero fees for freelancers.',
  keywords: [
    'freelance marketplace', 'hire freelancers', 'find freelance work', 'remote jobs',
    'AI matching', 'blockchain payments', 'web developers', 'graphic designers',
    'MegiLance', 'freelance platform', 'hire developers online', 'best freelance website',
  ],
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: 'MegiLance - The Future of Freelancing',
    description: 'Join the AI-powered revolution in freelancing. Zero fees for freelancers, instant crypto payments, and smart matching.',
    url: BASE_URL,
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_US',
  },
};

export default function Page() {
  return (
    <>
      <script {...jsonLdScriptProps(buildWebSiteJsonLd())} />
      <Home />
    </>
  );
}