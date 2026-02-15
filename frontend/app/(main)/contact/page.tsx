// @AI-HINT: Public Contact page with ContactPage schema + BreadcrumbList for Google Rich Results.
import type { Metadata } from 'next';
import { buildMeta, buildContactPageJsonLd, buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';
import Contact from './Contact';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'Contact Us - MegiLance Freelance Marketplace Support',
    description: 'Get in touch with MegiLance team for freelance marketplace support, partnerships, or inquiries. We respond within 24 hours. Help with hiring freelancers, payments, and account issues.',
    path: '/contact',
    keywords: [
      'contact MegiLance', 'freelance marketplace support', 'freelancer website help',
      'customer service', 'hire freelancers help', 'payment support',
    ],
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
