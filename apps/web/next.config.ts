import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow @beauty-diary/shared (workspace package, raw TS) to be transpiled.
  transpilePackages: ['@beauty-diary/shared'],
  images: {
    remotePatterns: [
      // Unsplash for placeholder cover images while the editor's R2 uploader
      // isn't wired through every screen.
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // R2 / LocalStack public URLs for real uploads.
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
};

export default withNextIntl(nextConfig);
