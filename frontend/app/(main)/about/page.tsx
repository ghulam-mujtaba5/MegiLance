// @AI-HINT: Public About page. Establishes trust with mission, team, timeline. Uses PublicLayout via (main)/layout.tsx.
import type { Metadata } from 'next';
import { buildMeta } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'About',
    description: 'Learn about MegiLance’s mission to elevate global freelancing with AI and secure payments.',
    path: '/about',
  });
}

export default function AboutPage() {
  return (
    <section aria-labelledby="about-title">
      <h1 id="about-title">About MegiLance</h1>
      <p>We are building an investor-grade, AI-powered freelancing platform with secure blockchain payments.</p>
    </section>
  );
}
