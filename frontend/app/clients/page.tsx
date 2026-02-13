import type { Metadata } from 'next';
import ClientsClient from './ClientsClient';
import { buildMeta, buildBreadcrumbJsonLd, buildFAQJsonLd, jsonLdScriptProps } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'For Clients - Hire Expert Freelancers in Minutes with AI Matching',
    description: 'Post your project and get matched with top-rated freelancers in minutes. MegiLance\'s AI analyzes 7 factors to find your perfect match. Escrow payment protection, milestone tracking, and real-time collaboration. Start hiring today.',
    path: '/clients',
    keywords: [
      'hire freelancers', 'post a project', 'find freelancers', 'hire developers',
      'outsource project', 'hire remote team', 'AI freelancer matching',
      'secure escrow payments', 'hire designers online', 'best place to hire freelancers',
    ],
  });
}

const clientFaqs = [
  { question: 'How quickly can I hire a freelancer?', answer: 'Most clients find and hire qualified freelancers within 24-48 hours using our AI matching system.' },
  { question: 'How does payment protection work?', answer: 'All payments are held in secure escrow until you approve the completed work. You only pay when satisfied.' },
  { question: 'What if I\'m not happy with the work?', answer: 'Our dispute resolution team mediates fair outcomes. If work doesn\'t meet agreed standards, you can request revisions or refunds.' },
];

export default function Page() {
  return (
    <>
      <script {...jsonLdScriptProps(buildFAQJsonLd(clientFaqs))} />
      <script {...jsonLdScriptProps(
        buildBreadcrumbJsonLd([{ name: 'For Clients', path: '/clients' }])
      )} />
      <ClientsClient />
    </>
  );
}
