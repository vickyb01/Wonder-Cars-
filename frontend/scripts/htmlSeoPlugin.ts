import fs from 'fs';
import path from 'path';
import {
  ABOUT_SEO_DESCRIPTION,
  ABOUT_SEO_TITLE,
  ADMIN_LOGIN_SEO_DESCRIPTION,
  ADMIN_LOGIN_SEO_TITLE,
  CANONICAL_ORIGIN,
  CARS_SEO_DESCRIPTION,
  CARS_SEO_TITLE,
  CONTACT_SEO_DESCRIPTION,
  CONTACT_SEO_TITLE,
  PRIVACY_SEO_DESCRIPTION,
  PRIVACY_SEO_TITLE,
  SITE_BRAND_NAME,
  TERMS_SEO_DESCRIPTION,
  TERMS_SEO_TITLE,
  buildPageNotFoundSeoData,
  injectHeadSeoHtml,
  normalizeSiteUrl,
} from '../src/utils/carSeoShared.mjs';

interface StaticHtmlSeoRoute {
  fileName: string;
  canonicalPath: string | null;
  title: string;
  description: string;
  robots: string;
  ogType?: string;
  ogImage?: string;
}

const DEFAULT_OG_IMAGE = `${CANONICAL_ORIGIN}/assets/wonder-cars.jpg`;
const PAGE_NOT_FOUND_SEO = buildPageNotFoundSeoData(CANONICAL_ORIGIN);

const STATIC_HTML_ROUTES: StaticHtmlSeoRoute[] = [
  {
    fileName: 'about.html',
    canonicalPath: '/about',
    title: `${ABOUT_SEO_TITLE} | ${SITE_BRAND_NAME}`,
    description: ABOUT_SEO_DESCRIPTION,
    robots: 'index, follow',
    ogType: 'website',
    ogImage: `${CANONICAL_ORIGIN}/assets/about-hero-bg.jpg`,
  },
  {
    fileName: 'cars.html',
    canonicalPath: '/cars',
    title: `${CARS_SEO_TITLE} | ${SITE_BRAND_NAME}`,
    description: CARS_SEO_DESCRIPTION,
    robots: 'index, follow',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
  },
  {
    fileName: 'contact.html',
    canonicalPath: '/contact',
    title: `${CONTACT_SEO_TITLE} | ${SITE_BRAND_NAME}`,
    description: CONTACT_SEO_DESCRIPTION,
    robots: 'index, follow',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
  },
  {
    fileName: 'privacy.html',
    canonicalPath: '/privacy',
    title: `${PRIVACY_SEO_TITLE} | ${SITE_BRAND_NAME}`,
    description: PRIVACY_SEO_DESCRIPTION,
    robots: 'index, follow',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
  },
  {
    fileName: 'terms.html',
    canonicalPath: '/terms',
    title: `${TERMS_SEO_TITLE} | ${SITE_BRAND_NAME}`,
    description: TERMS_SEO_DESCRIPTION,
    robots: 'index, follow',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
  },
  {
    fileName: 'admin.html',
    canonicalPath: null,
    title: ADMIN_LOGIN_SEO_TITLE,
    description: ADMIN_LOGIN_SEO_DESCRIPTION,
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
  },
  {
    fileName: 'spa-fallback.html',
    canonicalPath: null,
    title: PAGE_NOT_FOUND_SEO.title,
    description: PAGE_NOT_FOUND_SEO.description,
    robots: PAGE_NOT_FOUND_SEO.robots,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
  },
];

/**
 * Generates static HTML entry shells inside dist/ for fixed routes and the SPA fallback.
 * Dynamic car pages (/cars/:id) and /sitemap.xml are served at runtime by Vercel functions,
 * so any stale static dist/cars or dist/sitemap.xml artifacts are removed to prevent shadowing.
 */
export function generateStaticRouteHtmlShells(distDir: string, siteUrl: string): void {
  const indexPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexPath)) return;

  const siteBase = normalizeSiteUrl(siteUrl || CANONICAL_ORIGIN);
  const baseHtml = fs.readFileSync(indexPath, 'utf8');

  for (const route of STATIC_HTML_ROUTES) {
    const html = injectHeadSeoHtml(baseHtml, {
      ...route,
      siteUrl: siteBase,
    });
    fs.writeFileSync(path.join(distDir, route.fileName), html, 'utf8');
  }

  // Ensure no static car HTML shells or static sitemap shadow dynamic Vercel serverless routes
  const carsDir = path.join(distDir, 'cars');
  if (fs.existsSync(carsDir)) {
    fs.rmSync(carsDir, { recursive: true, force: true });
  }
  const staticSitemapPath = path.join(distDir, 'sitemap.xml');
  if (fs.existsSync(staticSitemapPath)) {
    fs.rmSync(staticSitemapPath, { force: true });
  }
}
