// @AI-HINT: Features page - server-side redirect to homepage features section
import { redirect } from 'next/navigation';
import { buildMeta } from '@/lib/seo';

export function generateMetadata() {
  return buildMeta({
    title: 'Platform Features',
    description: 'Explore MegiLance features: AI-powered matching, blockchain payments, real-time collaboration, skill assessments, and more.',
    path: '/features',
  });
}

export default function FeaturesPage() {
  redirect('/#features');
}
