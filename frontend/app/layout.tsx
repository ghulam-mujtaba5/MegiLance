import type { Metadata, Viewport } from 'next';
import './globals.css';
import '../styles/themes/light.css';
import '../styles/themes/dark.css';
import '../styles/tokens.css';
import '../styles/animations.css';
import '../styles/effects.css';
import './styles/theme.css';

import ClientRoot from './ClientRoot';

// Structured data for SEO (JSON-LD)
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'MegiLance',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'AI-powered freelancing platform connecting top talent with global opportunities. Secure blockchain payments, smart matching, and seamless collaboration.',
  url: 'https://megilance.com',
  author: {
    '@type': 'Organization',
    name: 'MegiLance',
    url: 'https://megilance.com',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '2500',
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://megilance.com'),
  title: {
    default: 'MegiLance - AI-Powered Freelance Platform | Find Top Talent',
    template: '%s | MegiLance',
  },
  description: 'Connect with world-class freelancers and clients on MegiLance. AI-powered matching, secure blockchain payments, real-time collaboration. Start your journey today!',
  keywords: [
    'freelance platform',
    'hire freelancers',
    'find clients',
    'remote work',
    'AI matching',
    'blockchain payments',
    'web development',
    'graphic design',
    'content writing',
    'digital marketing',
    'software development',
    'freelance jobs',
  ],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  authors: [{ name: 'MegiLance Team', url: 'https://megilance.com' }],
  creator: 'MegiLance',
  publisher: 'MegiLance',
  applicationName: 'MegiLance',
  category: 'Business',
  classification: 'Freelance Marketplace',
  
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://megilance.com',
    siteName: 'MegiLance',
    title: 'MegiLance - AI-Powered Freelance Platform',
    description: 'Connect with world-class freelancers and clients. AI-powered matching, secure blockchain payments, real-time collaboration.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MegiLance - Next-Generation Freelance Platform',
      },
    ],
  },
  
  twitter: {
    card: 'summary_large_image',
    site: '@megilance',
    creator: '@megilance',
    title: 'MegiLance - AI-Powered Freelance Platform',
    description: 'Connect with world-class freelancers and clients. AI-powered matching, secure blockchain payments.',
    images: ['/twitter-image.png'],
  },
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
  },
  
  alternates: {
    canonical: 'https://megilance.com',
    languages: {
      'en-US': 'https://megilance.com',
    },
  },
  
  other: {
    'msapplication-TileColor': '#4573df',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'format-detection': 'telephone=no',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0f19' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to important third-party origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for API */}
        <link rel="dns-prefetch" href="//api.stripe.com" />
        
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        
        {/* Theme initialization - prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('megilance-theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.classList.add(theme);
                  document.documentElement.style.colorScheme = theme;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-[var(--background)] text-[var(--text-primary)] antialiased">
        <ClientRoot>
          {children}
        </ClientRoot>
      </body>
    </html>
  );
}

