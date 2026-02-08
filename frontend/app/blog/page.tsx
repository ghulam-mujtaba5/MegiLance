import type { Metadata } from 'next';
import BlogClient from './BlogClient';
import { buildMeta, buildCollectionPageJsonLd, buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'Blog - Insights on Freelancing & Remote Work',
    description: 'Read the latest articles on freelancing tips, remote work trends, AI technology, and blockchain payments from the MegiLance team.',
    path: '/blog',
    keywords: ['freelancing blog', 'remote work tips', 'AI freelancing', 'web3 payments', 'freelancer guides'],
  });
}

export default function Page() {
  return (
    <>
      <script {...jsonLdScriptProps(
        buildCollectionPageJsonLd('MegiLance Blog', 'Insights on freelancing, remote work, AI technology, and the future of work.', '/blog')
      )} />
      <script {...jsonLdScriptProps(
        buildBreadcrumbJsonLd([{ name: 'Blog', path: '/blog' }])
      )} />
      <BlogClient />
    </>
  );
}

