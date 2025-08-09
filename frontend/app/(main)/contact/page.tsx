// @AI-HINT: Public Contact page. Lead capture and support routing. Uses PublicLayout via (main)/layout.tsx.
import type { Metadata } from 'next';
import { buildMeta } from '@/lib/seo';
import Contact from './Contact';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'Contact',
    description: 'Get in touch with MegiLance for support, sales, partnerships, and general inquiries.',
    path: '/contact',
  });
}

export default function ContactPage() {
  return <Contact />;
}
