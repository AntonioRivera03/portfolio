export const isStaticSite = process.env.NEXT_PUBLIC_STATIC_SITE === 'true';

/** Prefix public assets for a GitHub Pages project site. */
export function publicAsset(path: `/${string}`) {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${path}`;
}
