import type { Metadata } from 'next';
import TestimonialsClient from './TestimonialsClient';
import { BASE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Testimonials - MegiLance | Success Stories',
  description: 'See what clients and freelancers are saying about MegiLance. Real stories of success and growth.',
  openGraph: {
    title: 'MegiLance Success Stories',
    description: 'Read how businesses and freelancers are thriving on MegiLance.',
    url: `${BASE_URL}/testimonials`,
  },
  alternates: {
    canonical: `${BASE_URL}/testimonials`,
  },
};

export default function Page() {
  return <TestimonialsClient />;
}
