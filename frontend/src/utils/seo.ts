export const CANONICAL_ORIGIN = 'https://www.usedcarnearby.com';
export const DEFAULT_OG_IMAGE = `${CANONICAL_ORIGIN}/assets/wonder-cars.jpg`;

/** Normalizes a route path by stripping query/hash and trailing slashes (except root '/'). */
export function normalizeCanonicalPath(inputPath: string): string {
  const withoutHash = inputPath.split('#')[0] || '/';
  const withoutQuery = withoutHash.split('?')[0] || '/';
  const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, '/');
  if (collapsed.length > 1 && collapsed.endsWith('/')) {
    return collapsed.slice(0, -1);
  }
  return collapsed || '/';
}

/** Builds a strict canonical URL on https://www.usedcarnearby.com without query parameters. */
export function buildCanonicalUrl(pathOrUrl?: string): string {
  if (!pathOrUrl) {
    return `${CANONICAL_ORIGIN}/`;
  }

  let pathname = pathOrUrl.trim();
  if (/^https?:\/\//i.test(pathname)) {
    try {
      pathname = new URL(pathname).pathname;
    } catch {
      pathname = '/';
    }
  }

  const cleanPath = normalizeCanonicalPath(pathname);
  return cleanPath === '/' ? `${CANONICAL_ORIGIN}/` : `${CANONICAL_ORIGIN}${cleanPath}`;
}

export const SITE_BRAND_NAME = 'Used Car Nearby';
export const DEALERSHIP_NAME = 'Wonder Cars';
export const HOMEPAGE_SEO_TITLE = 'Used Car Nearby (UsedCarNearby.com) | Pre-Owned Cars by Wonder Cars';
export const HOMEPAGE_SEO_DESCRIPTION =
  'Explore pre-owned cars at Used Car Nearby (UsedCarNearby.com) by Wonder Cars, Preet Vihar, Delhi. Compare cars, view transparent INR pricing, and book a showroom viewing.';
export const CARS_SEO_TITLE = 'Browse Pre-Owned Cars Inventory';
export const CARS_SEO_DESCRIPTION =
  'Explore pre-owned cars at Used Car Nearby (UsedCarNearby.com) by Wonder Cars, Preet Vihar, Delhi. Compare specifications, view transparent INR pricing, and book a viewing.';

/** Ensures page titles carry the Used Car Nearby website brand consistently without duplicating it. */
export function formatSeoTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return HOMEPAGE_SEO_TITLE;
  if (/used car nearby/i.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed} | ${SITE_BRAND_NAME}`;
}

/** Resolves a public image path to an absolute canonical URL suitable for Open Graph/Twitter cards. */
export function resolveSeoImageUrl(imagePath?: string): string {
  if (!imagePath) return DEFAULT_OG_IMAGE;
  const trimmed = imagePath.trim();
  if (!trimmed || trimmed.startsWith('data:')) {
    return DEFAULT_OG_IMAGE;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${CANONICAL_ORIGIN}${cleanPath}`;
}
