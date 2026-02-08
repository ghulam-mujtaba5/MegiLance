import type { Metadata } from 'next';
import { buildMeta, buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';
import HowItWorksClient from './HowItWorksClient';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'How It Works',
    description: 'Learn how MegiLance connects clients and freelancers using AI matching and secure blockchain payments. Step-by-step guide for posting projects and hiring talent.',
    path: '/how-it-works',
    keywords: ['how freelancing works', 'hire freelancers step by step', 'freelance platform guide', 'MegiLance process'],
  });
}

export default function Page() {
  return (
    <>
      <script {...jsonLdScriptProps(
        buildBreadcrumbJsonLd([{ name: 'How It Works', path: '/how-it-works' }])
      )} />
      <HowItWorksClient />
    </>
  );
}
