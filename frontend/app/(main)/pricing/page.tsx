// @AI-HINT: Public Pricing page. Presents plan tiers and feature matrix. Uses PublicLayout via (main)/layout.tsx.
import type { Metadata } from 'next';
import { buildMeta } from '@/lib/seo';
import Pricing from './Pricing';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'Pricing',
    description: 'Simple pricing with clear value. Choose a plan that fits your team and scale up anytime.',
    path: '/pricing',
  });
}

export default function PricingPage() {
  return <Pricing />;
}
