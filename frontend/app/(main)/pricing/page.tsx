// @AI-HINT: Public Pricing page with BreadcrumbList for Google Rich Results.
import type { Metadata } from 'next';
import { buildMeta, buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';
import Pricing from './Pricing';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'Pricing & Plans - Low Fees Freelance Marketplace | Upwork Alternative',
    description: 'MegiLance pricing starts free with 5% fees — upgrade to Premium for just 1%. The best Upwork alternative with the lowest freelance marketplace fees. No hidden charges, no subscriptions.',
    path: '/pricing',
    keywords: [
      'freelance marketplace', 'upwork alternative', 'freelance platform fees',
      'cheap freelance marketplace', 'MegiLance pricing', 'lowest freelancer fees',
      'fiverr freelance alternative', 'best freelance websites pricing',
    ],
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
