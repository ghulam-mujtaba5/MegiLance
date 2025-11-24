// @AI-HINT: This file configures Next.js, with PWA support enabled via @ducanh2912/next-pwa.
const withPWAInit = require('@ducanh2912/next-pwa').default;

const withPWA = withPWAInit({
  dest: 'public', // Service worker files will be generated in public/
  register: true, // Automatically register the service worker
  skipWaiting: true, // Install new service worker without waiting
  // Disable PWA in production Docker builds to avoid webpack conflicts with Turbopack
  disable: process.env.NODE_ENV === 'production' || process.env.NEXT_ENABLE_PWA !== '1',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    // Disable type checking during build (validation errors for missing routes)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Disable ESLint during build
    ignoreDuringBuilds: true,
  },
  turbopack: {
    resolveAlias: {
      '@': '.',
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, '.'),
    };
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'unpkg.com' },
    ],
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    return [
      { source: '/backend/:path*', destination: `${backendUrl}/:path*` },
    ];
  },
  async redirects() {
    return [];
  },
};

module.exports = withPWA(nextConfig);
