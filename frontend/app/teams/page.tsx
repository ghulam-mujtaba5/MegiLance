import type { Metadata } from 'next';
import TeamsClient from './TeamsClient';
import { buildMeta, buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'For Teams & Enterprises - Scale Your Workforce with Remote Talent',
    description: 'Build and manage distributed teams with MegiLance. Enterprise-grade collaboration tools, unified billing, team member management, bulk hiring, and dedicated account managers. Scale from 5 to 500+ contractors seamlessly.',
    path: '/teams',
    keywords: [
      'hire remote teams', 'enterprise freelancing', 'scale remote workforce',
      'team management freelance', 'bulk hire freelancers', 'distributed teams',
      'enterprise hiring platform', 'managed freelance teams', 'remote team building',
    ],
  });
}

export default function Page() {
  return (
    <>
      <script {...jsonLdScriptProps(
        buildBreadcrumbJsonLd([{ name: 'For Teams', path: '/teams' }])
      )} />
      <TeamsClient />
    </>
  );
}
