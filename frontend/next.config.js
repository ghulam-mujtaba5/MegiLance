// @AI-HINT: This file configures Next.js, with PWA support enabled via next-pwa.
const withPWAInit = require('next-pwa');

const withPWA = withPWAInit({
  dest: 'public', // Service worker files will be generated in public/
  register: true, // Automatically register the service worker
  skipWaiting: true, // Install new service worker without waiting
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config options can go here.
};

module.exports = withPWA(nextConfig);

