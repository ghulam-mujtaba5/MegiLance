import type { Metadata } from 'next';
import InstallClient from './InstallClient';
import { BASE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Install MegiLance App | PWA',
  description: 'Install the MegiLance app on your device for a seamless freelancing experience. Available on iOS, Android, and Desktop.',
  openGraph: {
    title: 'Install MegiLance App',
    description: 'Get the MegiLance app for faster access and real-time notifications.',
    url: `${BASE_URL}/install`,
  },
  alternates: {
    canonical: `${BASE_URL}/install`,
  },
};

export default function Page() {
  return <InstallClient />;
}
