// @AI-HINT: Robots.txt configuration for SEO and crawler control.
// Optimized for Google Search Console with specific bot rules.
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://megilance.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/backend/',
          '/portal/',
          '/client/dashboard/',
          '/freelancer/dashboard/',
          '/settings/',
          '/messages/',
          '/_next/',
          '/private/',
          '/onboarding/',
          '/test/',
          '/test-login/',
          '/auth-dashboard/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/jobs/',
          '/hire/',
          '/blog/',
          '/freelancers/',
          '/gigs/',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/portal/',
          '/_next/',
          '/settings/',
          '/messages/',
        ],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: [
          '/icons/',
          '/images/',
          '/_next/image',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/portal/', '/_next/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
