// @AI-HINT: Public About page with AboutPage schema + BreadcrumbList for Google Rich Results.
import type { Metadata } from 'next';
import { buildMeta, buildBreadcrumbJsonLd, buildAboutPageJsonLd, jsonLdScriptProps } from '@/lib/seo';
import About from './About';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'About Us',
    description: 'Learn about MegiLance’s mission to elevate global freelancing with AI-powered matching, secure blockchain payments, and zero fees for freelancers.',
    path: '/about',
    keywords: ['about MegiLance', 'freelance platform mission', 'AI freelancing', 'company story'],
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
