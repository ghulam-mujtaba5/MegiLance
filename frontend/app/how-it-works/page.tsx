import type { Metadata } from 'next';
import HowItWorksClient from './HowItWorksClient';

export const metadata: Metadata = {
  title: 'How It Works - MegiLance | AI-Powered Freelancing',
  description: 'Learn how MegiLance connects clients and freelancers using AI matching and secure blockchain payments. Step-by-step guide for hiring and working.',
  openGraph: {
    title: 'How It Works - MegiLance',
    description: 'Simple, secure, and decentralized. See how MegiLance revolutionizes freelancing with AI and Web3.',
    url: 'https://megilance.com/how-it-works',
  },
  alternates: {
    canonical: 'https://megilance.com/how-it-works',
  },
};

export default function Page() {
  return <HowItWorksClient />;
}
