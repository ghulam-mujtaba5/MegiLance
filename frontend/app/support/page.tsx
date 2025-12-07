import type { Metadata } from 'next';
import SupportClient from './SupportClient';
import { BASE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Support Center - MegiLance | Help & Documentation',
  description: 'Find answers to your questions, browse guides, and contact our support team.',
  openGraph: {
    title: 'MegiLance Help Center',
    description: 'Get help with your account, payments, and projects.',
    url: `${BASE_URL}/support`,
  },
  alternates: {
    canonical: `${BASE_URL}/support`,
  },
};

export default function Page() {
  return <SupportClient />;
}
