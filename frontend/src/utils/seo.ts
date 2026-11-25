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

/** Ensures page titles carry a single Wonder Cars brand suffix. */
export function formatSeoTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return 'Wonder Cars';
  if (/\bwonder cars\b/i.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed} | Wonder Cars`;
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
