// @AI-HINT: Page entry point for Gigs marketplace with SEO metadata & JSON-LD
import { Suspense } from 'react';
import Gigs from './Gigs';
import {
  buildMeta,
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  jsonLdScriptProps,
} from '@/lib/seo';

export const metadata = buildMeta({
  title: 'Explore Freelance Services & Gigs',
  description:
    'Browse thousands of freelance services from verified professionals. Web development, design, writing, marketing, AI & more. Find the perfect gig for your project.',
  path: '/gigs',
  keywords: [
    'freelance services',
    'gigs',
    'hire freelancers',
    'web development',
    'graphic design',
    'content writing',
    'digital marketing',
    'app development',
    'SEO services',
    'MegiLance',
  ],
});

const breadcrumb = buildBreadcrumbJsonLd([{ name: 'Services', path: '/gigs' }]);
const collection = buildCollectionPageJsonLd(
  'Freelance Services Marketplace',
  'Browse and hire freelance services across web development, design, writing, marketing, AI and more.',
  '/gigs',
);

export default function GigsPage() {
  return (
    <>
      <script {...jsonLdScriptProps(breadcrumb, collection)} />
      <Suspense fallback={<div>Loading...</div>}>
        <Gigs />
      </Suspense>
    </>
  );
}
