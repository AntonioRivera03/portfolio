import type { NextConfig } from 'next';

const nextConfig: NextConfig =
  process.env.GITHUB_PAGES === 'true'
    ? {
        output: 'export',
        // Vinext's prerenderer requests bare route paths. With trailingSlash
        // enabled it receives a 308 instead of HTML for non-root routes.
        // build-pages.mjs adds directory indexes for GitHub Pages afterward.
        trailingSlash: false,
        images: { unoptimized: true },
        assetPrefix: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, ''),
      }
    : {};

export default nextConfig;
