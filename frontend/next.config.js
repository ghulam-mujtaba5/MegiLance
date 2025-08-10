// @AI-HINT: This file configures Next.js, with PWA support enabled via @ducanh2912/next-pwa.
const withPWAInit = require('@ducanh2912/next-pwa').default;

const withPWA = withPWAInit({
  dest: 'public', // Service worker files will be generated in public/
  register: true, // Automatically register the service worker
  skipWaiting: true, // Install new service worker without waiting
  // Controlled via env. Enable by setting NEXT_ENABLE_PWA=1
  disable: process.env.NEXT_ENABLE_PWA !== '1',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config options can go here.
};

module.exports = withPWA(nextConfig);

