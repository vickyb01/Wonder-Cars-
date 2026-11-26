import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  CANONICAL_ORIGIN,
  buildPageNotFoundSeoData,
  injectHeadSeoHtml,
  normalizeSiteUrl,
} from '../src/utils/carSeoShared.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FALLBACK_HTML_TEMPLATE = `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Page Not Found | Used Car Nearby</title>
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

/**
 * Factory for the unknown-route HTTP 404 handler (supports dependency injection for tests).
 */
export function createNotFoundHandler(options = {}) {
  return async function notFoundHandler(req, res) {
    const method = String(req?.method || 'GET').toUpperCase();
    const isHead = method === 'HEAD';
    const siteUrl = normalizeSiteUrl(
      options.siteUrl || process.env.VITE_SITE_URL || process.env.SITE_URL || CANONICAL_ORIGIN
    );

    const templateHtml = resolveHtmlTemplate(options.templateHtml);
    const html = injectHeadSeoHtml(templateHtml, {
      ...buildPageNotFoundSeoData(siteUrl),
      siteUrl,
    });

    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.end(isHead ? undefined : html);
  };
}

const defaultHandler = createNotFoundHandler();
export default defaultHandler;
