import type { Metadata } from 'next';
import TermsClient from './TermsClient';
import { BASE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Terms of Service - MegiLance',
  description: 'Read our Terms of Service to understand the rules and regulations for using the MegiLance platform.',
  openGraph: {
    title: 'MegiLance Terms of Service',
    description: 'User agreement and terms of use for MegiLance.',
    url: `${BASE_URL}/terms`,
  },
  alternates: {
    canonical: `${BASE_URL}/terms`,
  },
};

export default function Page() {
  return <TermsClient />;
}
