// @AI-HINT: Skills directory page listing all available skills for hiring
// Parent page for /hire/[skill]/[industry] programmatic SEO pages

import type { Metadata } from 'next';
import { BASE_URL } from '@/lib/seo';
import HireClient from './HireClient';

export const metadata: Metadata = {
  title: 'Hire Freelancers by Skill | MegiLance',
  description: 'Browse top freelancers by skill. Find React developers, Python developers, UI/UX designers, and more. Verified profiles, secure payments.',
  openGraph: {
    title: 'Hire Freelancers by Skill | MegiLance',
    description: 'Find the perfect freelancer for your project.',
    url: `${BASE_URL}/hire`,
  },
  alternates: {
    canonical: `${BASE_URL}/hire`,
  },
};

export default function HireDirectoryPage() {
  return <HireClient />;
}
