import type { Metadata } from 'next';
import TalentClient from './TalentClient';
import { BASE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Top Talent Directory | MegiLance',
  description: 'Explore our directory of top-rated freelancers. Find experts in development, design, and more.',
  openGraph: {
    title: 'MegiLance Talent Directory',
    description: 'Browse profiles of top freelancers on MegiLance.',
    url: `${BASE_URL}/talent`,
  },
  alternates: {
    canonical: `${BASE_URL}/talent`,
  },
};

export default function Page() {
  return <TalentClient />;
}
