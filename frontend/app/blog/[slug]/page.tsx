import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogPostClient from './BlogPostClient';
import { mockPosts } from '../data';
import { buildArticleMeta, BASE_URL } from '@/lib/seo';

type Props = {
  params: { slug: string };
};

export async function generateStaticParams() {
  return mockPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = mockPosts.find((p) => p.slug === params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return buildArticleMeta({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    image: post.imageUrl,
    publishedTime: new Date(post.date).toISOString(),
  });
}

export default function Page({ params }: Props) {
  const post = mockPosts.find((p) => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  // JSON-LD for BlogPosting
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.imageUrl ? `${BASE_URL}${post.imageUrl}` : undefined,
    datePublished: new Date(post.date).toISOString(),
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'MegiLance',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/icon-512.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/blog/${post.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostClient />
    </>
  );
}
