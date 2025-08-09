// @AI-HINT: Public FAQ page. Collapsible questions with schema markup in future iteration. Uses PublicLayout via (main)/layout.tsx.
import type { Metadata } from 'next';
import { buildMeta } from '@/lib/seo';
import FAQ from './FAQ';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'FAQ',
    description: 'Answers to common questions about MegiLance, pricing, security, and getting started.',
    path: '/faq',
  });
}

export default function FAQPage() {
  return <FAQ />;
}
