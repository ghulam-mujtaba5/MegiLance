import type { Metadata } from 'next';
import TeamsClient from './TeamsClient';
import { BASE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'For Teams - MegiLance | Scale Your Workforce',
  description: 'Build and manage remote teams with ease. Enterprise-grade tools for collaboration and payments.',
  openGraph: {
    title: 'MegiLance for Teams',
    description: 'Scale your business with on-demand remote teams.',
    url: `${BASE_URL}/teams`,
  },
  alternates: {
    canonical: `${BASE_URL}/teams`,
  },
};

export default function Page() {
  return <TeamsClient />;
}
