/* @AI-HINT: Centralized SEO helpers for public pages. Use in generateMetadata() for consistency. */
import type { Metadata } from 'next';

export type MetaInput = {
  title: string;
  description: string;
  path?: string; // e.g. "/pricing"
  image?: string; // absolute or site-relative OG image
  robots?: string;
  noindex?: boolean;
};

export const SITE_NAME = 'MegiLance';
export const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://megilance.com';

function toAbsoluteUrl(path?: string) {
  if (!path) return BASE_URL;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export const canonical = (path?: string) => toAbsoluteUrl(path);

export function buildMeta(input: MetaInput): Metadata {
  const url = toAbsoluteUrl(input.path);
  const title = input.title?.includes(SITE_NAME)
    ? input.title
    : `${input.title} | ${SITE_NAME}`;

  const robots = input.noindex ? 'noindex, nofollow' : (input.robots || 'index, follow');

  const ogImage = input.image ? toAbsoluteUrl(input.image) : `${BASE_URL}/og/default.png`;

  return {
    title,
    description: input.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description: input.description,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogImage }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: input.description,
      images: [ogImage],
    },
    robots,
  } satisfies Metadata;
}

export function buildArticleMeta(input: MetaInput & { publishedTime?: string; modifiedTime?: string; }) {
  const meta = buildMeta(input);
  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      type: 'article',
    },
  } as Metadata;
}
