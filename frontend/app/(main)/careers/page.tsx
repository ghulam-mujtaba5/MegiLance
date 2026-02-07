// @AI-HINT: Next.js route for Careers, delegates to Careers component.
import React from 'react';
import { buildMeta } from '@/lib/seo';
import Careers from './Careers';

export function generateMetadata() {
  return buildMeta({
    title: 'Careers at MegiLance',
    description: 'Join the MegiLance team and help build the future of freelancing. Browse open positions in engineering, design, marketing, and more.',
    path: '/careers',
  });
}

export default function CareersPage() {
  return <Careers />;
}
