import type { NextConfig } from 'next';
// @ts-expect-error - next-pwa does not have TypeScript declarations
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  importScripts: ['/push-sw.js'],
})(nextConfig);
