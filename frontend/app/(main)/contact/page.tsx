// @AI-HINT: Public Contact page with ContactPage schema + BreadcrumbList for Google Rich Results.
import type { Metadata } from 'next';
import { buildMeta, buildContactPageJsonLd, buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';
import Contact from './Contact';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'Contact Us',
    description: 'Get in touch with the MegiLance team for support, partnerships, or general inquiries. We respond within 24 hours.',
    path: '/contact',
    keywords: ['contact MegiLance', 'freelance support', 'customer service', 'help desk'],
  });
}

export default function ContactPage() {
  return (
    <>
      <script {...jsonLdScriptProps(buildContactPageJsonLd())} />
      <script {...jsonLdScriptProps(buildBreadcrumbJsonLd([{ name: 'Contact', path: '/contact' }]))} />
      <Contact />
    </>
  );
}
