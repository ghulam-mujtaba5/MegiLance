// @AI-HINT: Page entry point for Gigs marketplace
import { Suspense } from 'react';
import Gigs from './Gigs';

export default function GigsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Gigs />
    </Suspense>
  );
}

export const metadata = {
  title: 'Explore Services | MegiLance',
  description: 'Browse freelance services from talented professionals. Find the perfect gig for your project.',
  keywords: 'freelance services, gigs, hire freelancers, web development, design, writing, marketing',
};
