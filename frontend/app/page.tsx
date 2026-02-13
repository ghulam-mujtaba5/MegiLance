// @AI-HINT: This is the root Next.js home route. It delegates to the main Home component.
import type { Metadata } from 'next';
import Home from './home/Home';
import { BASE_URL, SITE_NAME, buildWebSiteJsonLd, buildHowToJsonLd, jsonLdScriptProps, getKeywordsForPage } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'MegiLance - AI-Powered Freelance Marketplace | Hire Top Developers, Designers & Experts',
  description: 'MegiLance is the #1 AI-powered freelance marketplace. Hire top developers, designers, writers & marketers. Secure blockchain payments, smart AI matching, real-time collaboration. Zero fees for freelancers. Better than Upwork & Fiverr.',
  keywords: getKeywordsForPage(['brand', 'transactional', 'informational', 'longTail'], [
    'hire top freelancers', 'best freelance website 2025', 'freelance marketplace with AI',
    'secure freelance platform', 'zero commission freelancing', 'crypto payments freelancers',
  ]),
  alternates: {
    canonical: BASE_URL,
    languages: { 'en-US': BASE_URL, 'x-default': BASE_URL },
  },
  openGraph: {
    title: 'MegiLance - The Future of Freelancing | AI-Powered Marketplace',
    description: 'Join 50,000+ professionals on MegiLance. AI-powered matching finds your perfect freelancer in minutes. Blockchain payments, escrow protection, and zero fees for freelancers.',
    url: BASE_URL,
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@megilance',
    creator: '@megilance',
    title: 'MegiLance - Hire Top Freelancers with AI Matching',
    description: 'The smartest way to hire freelancers. AI matching, blockchain payments, zero fees. Join MegiLance today.',
  },
};

const howToSteps = [
  { name: 'Create Your Account', text: 'Sign up for free as a client or freelancer in under 2 minutes.' },
  { name: 'Post a Project or Browse Jobs', text: 'Describe your project requirements or browse thousands of freelance jobs.' },
  { name: 'AI Matches You', text: 'Our 7-factor AI algorithm finds the perfect match based on skills, budget, and availability.' },
  { name: 'Collaborate & Pay Securely', text: 'Work together with built-in tools. Pay securely with escrow protection and blockchain payments.' },
];

export default function Page() {
  return (
    <>
      <script {...jsonLdScriptProps(buildWebSiteJsonLd())} />
      <script {...jsonLdScriptProps(buildHowToJsonLd(
        'How to Hire Freelancers on MegiLance',
        'Step-by-step guide to hiring world-class freelancers using AI-powered matching on MegiLance.',
        howToSteps
      ))} />
      <Home />
    </>
  );
}