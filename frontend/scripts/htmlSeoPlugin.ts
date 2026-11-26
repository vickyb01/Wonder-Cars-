import fs from 'fs';
import path from 'path';
import {
  CANONICAL_ORIGIN,
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

const STATIC_HTML_ROUTES: StaticHtmlSeoRoute[] = [
  {
    fileName: 'about.html',
    canonicalPath: '/about',
    title: 'About Us | Used Car Nearby',
    description:
      "Wonder Cars is Delhi-NCR's premier destination for certified pre-owned luxury and performance cars, showcased online on Used Car Nearby (UsedCarNearby.com).",
    robots: 'index, follow',
    ogType: 'website',
    ogImage: `${CANONICAL_ORIGIN}/assets/about-hero-bg.jpg`,
  },
  {
    fileName: 'cars.html',
    canonicalPath: '/cars',
    title: 'Browse Pre-Owned Cars Inventory | Used Car Nearby',
    description:
      'Explore pre-owned cars at Used Car Nearby (UsedCarNearby.com) by Wonder Cars, Preet Vihar, Delhi. Compare specifications, view transparent INR pricing, and book a viewing.',
    robots: 'index, follow',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
  },
  {
    fileName: 'contact.html',
    canonicalPath: '/contact',
    title: 'Contact Us | Used Car Nearby',
    description:
      'Contact Wonder Cars via Used Car Nearby for vehicle enquiries, inspection reports, or test drive appointments in Preet Vihar, Delhi.',
    robots: 'index, follow',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
  },
  {
    fileName: 'privacy.html',
    canonicalPath: '/privacy',
    title: 'Privacy Policy | Used Car Nearby',
    description: 'Privacy Policy for Used Car Nearby (Wonder Cars).',
    robots: 'index, follow',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
  },
  {
    fileName: 'terms.html',
    canonicalPath: '/terms',
    title: 'Terms & Conditions | Used Car Nearby',
    description: 'Terms and Conditions governing vehicle listings and transactions at Wonder Cars on Used Car Nearby.',
    robots: 'index, follow',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
  },
  {
    fileName: 'admin.html',
    canonicalPath: null,
    title: 'Admin Login — Used Car Nearby',
    description: 'Secure authentication gateway for Wonder Cars showroom administration on Used Car Nearby.',
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
  },
  {
    fileName: 'spa-fallback.html',
    canonicalPath: null,
    title: 'Used Car Nearby (UsedCarNearby.com) | Pre-Owned Cars by Wonder Cars',
    description:
      'Explore pre-owned cars at Used Car Nearby (UsedCarNearby.com) by Wonder Cars, Preet Vihar, Delhi. Compare cars, view transparent INR pricing, and book a showroom viewing.',
    robots: 'index, follow',
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
