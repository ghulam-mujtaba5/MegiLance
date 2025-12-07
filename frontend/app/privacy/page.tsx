import type { Metadata } from 'next';
import PrivacyClient from './PrivacyClient';
import { BASE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Privacy Policy - MegiLance',
  description: 'Read our Privacy Policy to understand how we collect, use, and protect your personal information.',
  openGraph: {
    title: 'MegiLance Privacy Policy',
    description: 'Your privacy matters. Learn how we protect your data.',
    url: `${BASE_URL}/privacy`,
  },
  alternates: {
    canonical: `${BASE_URL}/privacy`,
  },
};

export default function Page() {
  return <PrivacyClient />;
}
