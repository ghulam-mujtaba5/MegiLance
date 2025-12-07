import type { Metadata } from 'next';
import BlogClient from './BlogClient';
import { BASE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Blog - MegiLance | Insights on Freelancing & Web3',
  description: 'Read the latest articles on freelancing tips, remote work trends, AI technology, and blockchain payments from the MegiLance team.',
  openGraph: {
    title: 'MegiLance Blog - Future of Work Insights',
    description: 'Stay updated with the latest news and guides for freelancers and clients.',
    url: `${BASE_URL}/blog`,
  },
  alternates: {
    canonical: `${BASE_URL}/blog`,
  },
};

export default function Page() {
  return <BlogClient />;
}

