import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@beauty-diary/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  // Proxy API + Socket.IO through Next so Set-Cookie lands on this origin
  // — that lets RSC pages read the auth cookie and the WS handshake carry
  // it without cross-site cookie gymnastics.
  async rewrites() {
    const apiOrigin = process.env.API_PROXY_TARGET ?? process.env.API_INTERNAL_URL;
    if (!apiOrigin) return [];
    return [
      { source: '/api/:path*', destination: `${apiOrigin}/api/:path*` },
      // socket.io-client polls `/socket.io` (no trailing slash) AND
      // `/socket.io/<sid>`; both need to match.
      { source: '/socket.io', destination: `${apiOrigin}/socket.io` },
      { source: '/socket.io/:path*', destination: `${apiOrigin}/socket.io/:path*` },
    ];
  },
};

export default withNextIntl(nextConfig);
