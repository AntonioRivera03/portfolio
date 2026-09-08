import type { NextConfig } from 'next';

const nextConfig: NextConfig =
  process.env.GITHUB_PAGES === 'true'
    ? {
        output: 'export',
        trailingSlash: true,
        images: { unoptimized: true },
        assetPrefix: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, ''),
      }
    : {};

export default nextConfig;
