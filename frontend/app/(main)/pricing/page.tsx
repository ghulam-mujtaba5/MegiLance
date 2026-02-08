// @AI-HINT: Public Pricing page with BreadcrumbList for Google Rich Results.
import type { Metadata } from 'next';
import { buildMeta, buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';
import Pricing from './Pricing';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'Pricing & Plans',
    description: 'Simple, transparent pricing. Start free with 5% fees, or upgrade to Premium for just 1%. No hidden charges, no subscriptions required.',
    path: '/pricing',
    keywords: ['MegiLance pricing', 'freelance platform fees', 'cheap freelance marketplace', 'freelancer rates'],
  });
}

export default function PricingPage() {
  return (
    <>
      <script {...jsonLdScriptProps(buildBreadcrumbJsonLd([{ name: 'Pricing', path: '/pricing' }]))} />
      <Pricing />
    </>
  );
}
