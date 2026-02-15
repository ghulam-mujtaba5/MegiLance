// @AI-HINT: Public About page with AboutPage schema + BreadcrumbList for Google Rich Results.
import type { Metadata } from 'next';
import { buildMeta, buildBreadcrumbJsonLd, buildAboutPageJsonLd, jsonLdScriptProps } from '@/lib/seo';
import About from './About';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'About MegiLance - Best Freelancer Website & Upwork Alternative',
    description: 'MegiLance is the best freelancer website built as a modern Upwork alternative. AI-powered matching, secure escrow payments, and the lowest fees in the freelance marketplace. Our mission: empower freelancers worldwide.',
    path: '/about',
    keywords: [
      'about MegiLance', 'freelancer website', 'best freelance websites',
      'upwork alternative', 'freelance marketplace', 'AI freelancing platform',
    ],
  });
}

export default function AboutPage() {
  return (
    <>
      <script {...jsonLdScriptProps(buildAboutPageJsonLd())} />
      <script {...jsonLdScriptProps(buildBreadcrumbJsonLd([{ name: 'About', path: '/about' }]))} />
      <About />
    </>
  );
}
