/* @AI-HINT: Centralized SEO helpers for public pages. Use in generateMetadata() for consistency.
 * Includes structured data builders for Google Rich Results: BreadcrumbList, FAQPage,
 * Organization, WebSite (with Sitelinks SearchBox), SoftwareApplication, etc.
 */
import type { Metadata } from 'next';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MetaInput = {
  title: string;
  description: string;
  path?: string; // e.g. "/pricing"
  image?: string; // absolute or site-relative OG image
  robots?: string;
  noindex?: boolean;
  keywords?: string[];
};

export type BreadcrumbItem = {
  name: string;
  path: string; // relative path, e.g. "/pricing"
};

export type FAQItem = {
  question: string;
  answer: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

export const SITE_NAME = 'MegiLance';
export const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://megilance.com';
export const SITE_DESCRIPTION = 'AI-powered freelancing platform connecting top talent with global opportunities. Secure blockchain payments, smart matching, and seamless collaboration.';
export const SITE_LOGO = `${BASE_URL}/icon-512.png`;
export const SOCIAL_LINKS = [
  'https://www.linkedin.com/company/megilance',
  'https://twitter.com/megilance',
  'https://github.com/megilance',
];

// ─── URL Helpers ──────────────────────────────────────────────────────────────

function toAbsoluteUrl(path?: string) {
  if (!path) return BASE_URL;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export const canonical = (path?: string) => toAbsoluteUrl(path);

// ─── Metadata Builders ───────────────────────────────────────────────────────

export function buildMeta(input: MetaInput): Metadata {
  const url = toAbsoluteUrl(input.path);
  const title = input.title?.includes(SITE_NAME)
    ? input.title
    : `${input.title} | ${SITE_NAME}`;

  const robots = input.noindex ? 'noindex, nofollow' : (input.robots || 'index, follow');

  // Only set explicit OG images when a custom image is provided.
  // Otherwise, the file-convention opengraph-image.tsx auto-generates them.
  const ogImage = input.image ? toAbsoluteUrl(input.image) : undefined;

  return {
    title,
    description: input.description,
    ...(input.keywords ? { keywords: input.keywords } : {}),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description: input.description,
      url,
      siteName: SITE_NAME,
      locale: 'en_US',
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: title as string }] } : {}),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@megilance',
      creator: '@megilance',
      title,
      description: input.description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    robots,
  } satisfies Metadata;
}

export function buildArticleMeta(input: MetaInput & { publishedTime?: string; modifiedTime?: string; author?: string }) {
  const meta = buildMeta(input);
  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      type: 'article',
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
      ...(input.author ? { authors: [input.author] } : {}),
    },
  } as Metadata;
}

// ─── JSON-LD Structured Data Builders ─────────────────────────────────────────
// These generate schema.org structured data for Google Rich Results.
// Usage: <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />

/** BreadcrumbList – Shows breadcrumb trail in Google results */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      ...items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: item.name,
        item: toAbsoluteUrl(item.path),
      })),
    ],
  };
}

/** FAQPage – Shows expandable FAQ answers directly in Google SERP */
export function buildFAQJsonLd(faqs: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/** WebSite – Enables Google Sitelinks SearchBox */
export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: [
      {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${BASE_URL}/jobs?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    ],
    inLanguage: 'en-US',
  };
}

/** Organization – Brand info, logo, contact in Knowledge Panel */
export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: SITE_LOGO,
      width: 512,
      height: 512,
    },
    description: SITE_DESCRIPTION,
    foundingDate: '2024',
    sameAs: SOCIAL_LINKS,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@megilance.com',
        availableLanguage: ['English'],
      },
    ],
  };
}

/** SoftwareApplication – App rich result for marketplace */
export function buildSoftwareAppJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: SITE_DESCRIPTION,
    url: BASE_URL,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      bestRating: '5',
      worstRating: '1',
      ratingCount: '2500',
    },
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: BASE_URL,
    },
  };
}

/** CollectionPage – For listing pages (jobs, freelancers, gigs) */
export function buildCollectionPageJsonLd(name: string, description: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: toAbsoluteUrl(path),
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: BASE_URL,
    },
  };
}

/** AboutPage – For the about page */
export function buildAboutPageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `About ${SITE_NAME}`,
    description: `Learn about ${SITE_NAME}'s mission to elevate global freelancing with AI and secure payments.`,
    url: toAbsoluteUrl('/about'),
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: BASE_URL,
    },
  };
}

/** ContactPage – For the contact page */
export function buildContactPageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact ${SITE_NAME}`,
    description: 'Get in touch with the MegiLance team for support, partnerships, or general inquiries.',
    url: toAbsoluteUrl('/contact'),
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: BASE_URL,
    },
  };
}

/** Service – For individual service/skill hire pages */
export function buildServiceJsonLd(serviceName: string, description: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: serviceName,
    description,
    url: toAbsoluteUrl(path),
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: BASE_URL,
    },
    areaServed: {
      '@type': 'Place',
      name: 'Worldwide',
    },
    serviceType: 'Freelance Marketplace',
  };
}

/** ItemList – For search results or ranked listings */
export function buildItemListJsonLd(
  items: Array<{ name: string; url: string; position: number }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      url: item.url,
    })),
  };
}

/** Generates SiteNavigationElement for Google sitelinks */
export function buildSiteNavigationJsonLd() {
  const navItems = [
    { name: 'Find Work', url: '/jobs' },
    { name: 'Hire Talent', url: '/hire' },
    { name: 'How It Works', url: '/how-it-works' },
    { name: 'Pricing', url: '/pricing' },
    { name: 'About', url: '/about' },
    { name: 'Blog', url: '/blog' },
    { name: 'Contact', url: '/contact' },
    { name: 'FAQ', url: '/faq' },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'SiteNavigationElement',
    name: 'Main Navigation',
    hasPart: navItems.map((item) => ({
      '@type': 'WebPage',
      name: item.name,
      url: toAbsoluteUrl(item.url),
    })),
  };
}

/** Render one or more JSON-LD schemas as a combined script string */
export function jsonLdScriptProps(...schemas: Record<string, unknown>[]) {
  if (schemas.length === 1) {
    return {
      type: 'application/ld+json' as const,
      dangerouslySetInnerHTML: { __html: JSON.stringify(schemas[0]) },
    };
  }
  return {
    type: 'application/ld+json' as const,
    dangerouslySetInnerHTML: { __html: JSON.stringify(schemas) },
  };
}
