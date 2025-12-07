import type { Metadata } from 'next';
import SecurityClient from './SecurityClient';
import { BASE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Security - MegiLance | Safe & Secure Freelancing',
  description: 'Learn about our industry-leading security measures, including blockchain payments, identity verification, and data protection.',
  openGraph: {
    title: 'MegiLance Security Center',
    description: 'Your safety is our priority. Secure payments, verified users, and data encryption.',
    url: `${BASE_URL}/security`,
  },
  alternates: {
    canonical: `${BASE_URL}/security`,
  },
};

export default function Page() {
  return <SecurityClient />;
}
