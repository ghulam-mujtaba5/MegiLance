// @AI-HINT: Page entry point for Explore/Demo showcase
import Explore from './Explore';
import { buildMeta } from '@/lib/seo';

export function generateMetadata() {
  return buildMeta({
    title: 'Explore MegiLance',
    description: 'Discover all MegiLance features — AI matching, blockchain payments, gig marketplace, team collaboration, and 50+ tools for freelancers and clients.',
    path: '/explore',
  });
}

export default function ExplorePage() {
  return <Explore />;
}
