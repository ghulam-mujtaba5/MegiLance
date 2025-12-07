import type { Metadata } from 'next';
import ClientsClient from './ClientsClient';
import { BASE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'For Clients - MegiLance | Hire Top Freelancers',
  description: 'Find and hire expert freelancers for your projects. AI matching, secure payments, and zero friction.',
  openGraph: {
    title: 'Hire Top Talent on MegiLance',
    description: 'Post a job and get matched with the best freelancers in minutes.',
    url: `${BASE_URL}/clients`,
  },
  alternates: {
    canonical: `${BASE_URL}/clients`,
  },
};

export default function Page() {
  return <ClientsClient />;
}
