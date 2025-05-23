
import type {NextConfig} from 'next';
// import type { PWAConfig } from 'next-pwa'; // Not strictly needed if using require

const withPWA = require('next-pwa')({
  dest: 'public', // Destination directory for the PWA files
  register: true, // Register the service worker
  skipWaiting: true, // Skip waiting for service worker updates
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development mode
  // You might want to add more PWA specific options here later
  // Example: cacheOnFrontEndNav: true, aggressiveFrontEndNavCaching: true, etc.
});

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false, // Changed to false for stricter builds
  },
  eslint: {
    ignoreDuringBuilds: false, // Changed to false for stricter builds
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Other Next.js configurations can be added here
  reactStrictMode: true, // Recommended for development
};

export default withPWA(nextConfig);
