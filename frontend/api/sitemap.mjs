import {
  CANONICAL_ORIGIN,
  DEFAULT_API_URL,
  DEFAULT_EXECUTION_BUDGET_MS,
  buildSitemapXml,
  fetchBackendJsonWithBudget,
  filterPublicCars,
  normalizeApiBaseUrl,
  normalizeSiteUrl,
} from '../src/utils/carSeoShared.mjs';

/**
 * Factory for the dynamic /sitemap.xml serverless handler (supports dependency injection for tests).
 */
export function createSitemapHandler(options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const budgetMs = options.budgetMs ?? DEFAULT_EXECUTION_BUDGET_MS;

  return async function sitemapHandler(req, res) {
    const method = String(req?.method || 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      res.statusCode = 405;
      res.setHeader('Allow', 'GET, HEAD');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end('Method Not Allowed');
      return;
    }

    const isHead = method === 'HEAD';
    const siteUrl = normalizeSiteUrl(
      options.siteUrl || process.env.VITE_SITE_URL || process.env.SITE_URL || CANONICAL_ORIGIN
    );
    const apiBaseUrl = normalizeApiBaseUrl(
      options.apiBaseUrl ||
        process.env.API_BASE_URL ||
        process.env.VITE_API_URL ||
        process.env.VITE_API_BASE_URL ||
        DEFAULT_API_URL
    );

    const upstreamUrl = `${apiBaseUrl}/api/cars`;
    const result = await fetchBackendJsonWithBudget(upstreamUrl, {
      fetchImpl,
      budgetMs,
    });

    if (!result.ok || !Array.isArray(result.data)) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Retry-After', '30');
      res.end(isHead ? undefined : 'Sitemap temporarily unavailable while inventory service is unreachable.');
      return;
    }

    const publicCars = filterPublicCars(result.data);
    const xml = buildSitemapXml(siteUrl, publicCars);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=0, must-revalidate');
    res.end(isHead ? undefined : xml);
  };
}

const defaultHandler = createSitemapHandler();
export default defaultHandler;
