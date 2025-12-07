import type { Metadata } from 'next';
import CookiesClient from './CookiesClient';
import { BASE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Cookie Policy | MegiLance',
  description: 'Learn about how MegiLance uses cookies to improve your experience.',
  openGraph: {
    title: 'MegiLance Cookie Policy',
    description: 'Transparency about our use of cookies and tracking technologies.',
    url: `${BASE_URL}/cookies`,
  },
  alternates: {
    canonical: `${BASE_URL}/cookies`,
  },
};

export default function Page() {
  return <CookiesClient />;
}
