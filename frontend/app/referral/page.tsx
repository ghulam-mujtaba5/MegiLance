import type { Metadata } from 'next';
import ReferralClient from './ReferralClient';
import { BASE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Referral Program | MegiLance',
  description: 'Invite friends to MegiLance and earn crypto rewards. Join our referral program today.',
  openGraph: {
    title: 'MegiLance Referral Program',
    description: 'Earn rewards by inviting friends to MegiLance.',
    url: `${BASE_URL}/referral`,
  },
  alternates: {
    canonical: `${BASE_URL}/referral`,
  },
};

export default function Page() {
  return <ReferralClient />;
}
