import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  CANONICAL_ORIGIN,
  DEFAULT_API_URL,
  DEFAULT_EXECUTION_BUDGET_MS,
  buildCarSeoData,
  buildNotFoundSeoData,
  escapeHtml,
  fetchBackendJsonWithBudget,
  injectHeadSeoHtml,
  isPublicCarStatus,
  normalizeApiBaseUrl,
  normalizeSiteUrl,
} from '../src/utils/carSeoShared.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FALLBACK_HTML_TEMPLATE = `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Used Car Nearby</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

let cachedDiskTemplate = null;

function resolveHtmlTemplate(customTemplate) {
  if (typeof customTemplate === 'string' && customTemplate.trim()) {
    return customTemplate;
  }
  if (cachedDiskTemplate) {
    return cachedDiskTemplate;
  }

  const candidatePaths = [
    path.resolve(process.cwd(), 'dist/spa-fallback.html'),
    path.resolve(__dirname, '../dist/spa-fallback.html'),
    path.resolve(process.cwd(), 'dist/index.html'),
    path.resolve(__dirname, '../dist/index.html'),
    path.resolve(process.cwd(), 'index.html'),
    path.resolve(__dirname, '../index.html'),
  ];

  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate)) {
        const html = fs.readFileSync(candidate, 'utf8');
        if (html && html.includes('<html')) {
          cachedDiskTemplate = html;
          return html;
        }
      }
    } catch {
      // Try next template path
    }
  }

  return FALLBACK_HTML_TEMPLATE;
}

function extractCarId(req) {
  const queryId = req?.query?.id;
  if (typeof queryId === 'string' && queryId.trim()) {
    return queryId.trim();
  }
  if (Array.isArray(queryId) && typeof queryId[0] === 'string' && queryId[0].trim()) {
    return queryId[0].trim();
  }

  const rawUrl = String(req?.url || '');
  try {
    const parsed = new URL(rawUrl, CANONICAL_ORIGIN);
    const paramId = parsed.searchParams.get('id');
    if (paramId && paramId.trim()) {
      return paramId.trim();
    }
    const match = parsed.pathname.match(/^\/cars\/([^/]+)\/?$/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]).trim();
    }
  } catch {
    // Ignore invalid URL
  }

  return '';
}

function renderServiceUnavailableHtml(siteUrl) {
  const safeSiteUrl = escapeHtml(normalizeSiteUrl(siteUrl));
  return `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vehicle Temporarily Unavailable | Used Car Nearby</title>
    <meta name="robots" content="noindex, nofollow" />
  </head>
  <body style="font-family: system-ui, -apple-system, sans-serif; background:#09090b; color:#fafafa; margin:0; padding:48px 20px; text-align:center;">
    <main style="max-width:520px; margin:0 auto;">
      <h1 style="font-size:24px; margin-bottom:12px;">Vehicle Details Temporarily Unavailable</h1>
      <p style="color:#a1a1aa; font-size:15px; line-height:1.6; margin-bottom:24px;">
        Our inventory service is waking up or temporarily unreachable. Please retry in a few seconds.
      </p>
      <a href="${safeSiteUrl}/cars" style="display:inline-block; padding:10px 18px; border-radius:8px; background:#2563eb; color:#ffffff; text-decoration:none; font-weight:600;">
        Browse Inventory
      </a>
    </main>
  </body>
</html>`;
}

function sendHtml(res, statusCode, html, headers = {}, isHead = false) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
  res.end(isHead ? undefined : html);
}

/**
 * Factory for the dynamic /cars/:id serverless handler (supports dependency injection for tests).
 */
export function createCarPageHandler(options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const budgetMs = options.budgetMs ?? DEFAULT_EXECUTION_BUDGET_MS;

  return async function carPageHandler(req, res) {
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

    const templateHtml = resolveHtmlTemplate(options.templateHtml);
    const carId = extractCarId(req);

    if (!carId) {
      const html = injectHeadSeoHtml(templateHtml, {
        ...buildNotFoundSeoData(siteUrl),
        siteUrl,
      });
      sendHtml(
        res,
        404,
        html,
        {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'X-Robots-Tag': 'noindex, nofollow',
        },
        isHead
      );
      return;
    }

    const upstreamUrl = `${apiBaseUrl}/api/cars/${encodeURIComponent(carId)}`;
    const result = await fetchBackendJsonWithBudget(upstreamUrl, {
      fetchImpl,
      budgetMs,
    });

    if (result.unavailable) {
      sendHtml(
        res,
        503,
        renderServiceUnavailableHtml(siteUrl),
        {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          Pragma: 'no-cache',
          'Retry-After': '30',
          'X-Robots-Tag': 'noindex, nofollow',
        },
        isHead
      );
      return;
    }

    const car = result.ok && result.data && typeof result.data === 'object' ? result.data.car : null;

    if (!result.ok || !car || typeof car !== 'object' || !car.id || !isPublicCarStatus(car.status)) {
      const html = injectHeadSeoHtml(templateHtml, {
        ...buildNotFoundSeoData(siteUrl),
        siteUrl,
      });
      sendHtml(
        res,
        404,
        html,
        {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'X-Robots-Tag': 'noindex, nofollow',
        },
        isHead
      );
      return;
    }

    const seoData = buildCarSeoData(car, siteUrl);
    const html = injectHeadSeoHtml(templateHtml, {
      ...seoData,
      siteUrl,
    });

    sendHtml(
      res,
      200,
      html,
      {
        'Cache-Control': 'public, max-age=0, s-maxage=0, must-revalidate',
      },
      isHead
    );
  };
}

const defaultHandler = createCarPageHandler();
export default defaultHandler;
