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
  title: 'Freelance Services & Gigs - Hire Freelance Website Designers & Developers',
  description:
    'Browse freelance services on MegiLance. Hire freelance website designers, web developers, graphic designers, content writers, and more. Best freelance marketplace with verified professionals and secure payments.',
  path: '/gigs',
  keywords: [
    'freelance services',
    'freelance website designer',
    'freelance web developer',
    'hire freelancers',
    'gigs',
    'graphic design',
    'content writing',
    'freelance marketplace',
    'best freelance websites',
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
