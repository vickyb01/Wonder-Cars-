import fs from 'fs';
import path from 'path';
import type { SitemapCarRecord } from './sitemapGenerator.ts';
import { DEFAULT_SITE_URL, escapeXml } from './sitemapGenerator.ts';

interface StaticHtmlSeoRoute {
  fileName: string;
  canonicalPath: string | null;
  title: string;
  description: string;
  robots: string;
  ogType?: string;
  ogImage?: string;
}

const DEFAULT_OG_IMAGE = `${DEFAULT_SITE_URL}/assets/wonder-cars.jpg`;

const STATIC_HTML_ROUTES: StaticHtmlSeoRoute[] = [
  {
    fileName: 'about.html',
    canonicalPath: '/about',
    title: 'About Us | Wonder Cars',
    description:
      "Wonder Cars is Delhi-NCR's premier destination for certified pre-owned luxury and performance cars. Founded by Naman Jain on trust, forensic quality audits, and clear title transparency.",
    robots: 'index, follow',
    ogType: 'website',
    ogImage: `${DEFAULT_SITE_URL}/assets/about-hero-bg.jpg`,
  },
  {
    fileName: 'cars.html',
    canonicalPath: '/cars',
    title: 'Browse Certified Pre-Owned Inventory | Wonder Cars',
    description:
      'Explore verified luxury and performance pre-owned cars with transparent INR pricing at Wonder Cars, Preet Vihar, Delhi.',
    robots: 'index, follow',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
  },
  {
    fileName: 'contact.html',
    canonicalPath: '/contact',
    title: 'Contact Us | Wonder Cars',
    description:
      'Contact Wonder Cars for vehicle enquiries, inspection reports, or test drive appointments, and view our Preet Vihar, Delhi showroom location on Google Maps.',
    robots: 'index, follow',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
  },
  {
    fileName: 'privacy.html',
    canonicalPath: '/privacy',
    title: 'Privacy Policy | Wonder Cars',
    description: 'Privacy Policy for Wonder Cars.',
    robots: 'index, follow',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
  },
  {
    fileName: 'terms.html',
    canonicalPath: '/terms',
    title: 'Terms & Conditions | Wonder Cars',
    description: 'Terms and Conditions governing vehicle listings and transactions at Wonder Cars.',
    robots: 'index, follow',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
  },
  {
    fileName: 'admin.html',
    canonicalPath: null,
    title: 'Admin Login — Wonder Cars',
    description: 'Secure authentication gateway for Wonder Cars showroom administration.',
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
  },
  {
    fileName: 'spa-fallback.html',
    canonicalPath: null,
    title: 'Wonder Cars — Curated Pre-Owned Luxury & Performance Cars',
    description:
      'Discover quality pre-owned luxury and performance cars at the right price. Certified 210-point inspected vehicles at Wonder Cars, Preet Vihar, Delhi.',
    robots: 'index, follow',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
  },
];

function formatInrSimple(price?: number): string {
  if (!price || !Number.isFinite(price)) return '';
  return `₹${new Intl.NumberFormat('en-IN').format(price)}`;
}

function formatKmSimple(km?: number): string {
  if (km === undefined || km === null || !Number.isFinite(km)) return '';
  return `${new Intl.NumberFormat('en-IN').format(km)} km`;
}

function resolveCarOgImage(siteBase: string, images?: string[]): string {
  const first = images?.[0]?.trim();
  if (!first || first.startsWith('data:')) {
    return `${siteBase}/assets/wonder-cars.jpg`;
  }
  if (/^https?:\/\//i.test(first)) {
    return first;
  }
  return `${siteBase}${first.startsWith('/') ? first : `/${first}`}`;
}

function injectHeadSeo(
  templateHtml: string,
  siteBase: string,
  opts: Omit<StaticHtmlSeoRoute, 'fileName'>
): string {
  const canonicalUrl = opts.canonicalPath
    ? `${siteBase}${opts.canonicalPath === '/' ? '/' : opts.canonicalPath}`
    : null;
  const ogImage = opts.ogImage || `${siteBase}/assets/wonder-cars.jpg`;
  const ogType = opts.ogType || 'website';

  // Strip any pre-existing managed SEO tags so there are never duplicate canonicals or meta tags
  let html = templateHtml
    .replace(/<title>[\s\S]*?<\/title>\s*/gi, '')
    .replace(/<meta\s+name=["'](?:description|robots)["'][^>]*>\s*/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+property=["']og:(?:site_name|title|description|url|type|image)["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+name=["']twitter:(?:card|title|description|image)["'][^>]*>\s*/gi, '');

  const seoLines = [
    `    <title>${escapeXml(opts.title)}</title>`,
    `    <meta name="description" content="${escapeXml(opts.description)}" />`,
    `    <meta name="robots" content="${escapeXml(opts.robots)}" />`,
    ...(canonicalUrl ? [`    <link rel="canonical" href="${escapeXml(canonicalUrl)}" />`] : []),
    `    <meta property="og:site_name" content="Wonder Cars" />`,
    `    <meta property="og:title" content="${escapeXml(opts.title)}" />`,
    `    <meta property="og:description" content="${escapeXml(opts.description)}" />`,
    ...(canonicalUrl ? [`    <meta property="og:url" content="${escapeXml(canonicalUrl)}" />`] : []),
    `    <meta property="og:type" content="${escapeXml(ogType)}" />`,
    `    <meta property="og:image" content="${escapeXml(ogImage)}" />`,
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:title" content="${escapeXml(opts.title)}" />`,
    `    <meta name="twitter:description" content="${escapeXml(opts.description)}" />`,
    `    <meta name="twitter:image" content="${escapeXml(ogImage)}" />`,
  ].join('\n');

  return html.replace(/<meta\s+name=["']viewport["'][^>]*>/i, (match) => `${match}\n${seoLines}`);
}

/** Generates per-route static HTML entry shells inside dist/ so crawlers & curl see accurate canonicals and metadata in initial HTML. */
export function generateStaticRouteHtmlShells(
  distDir: string,
  siteUrl: string,
  cars: SitemapCarRecord[]
): void {
  const indexPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexPath)) return;

  const siteBase = siteUrl.trim().replace(/\/+$/, '') || DEFAULT_SITE_URL;
  const baseHtml = fs.readFileSync(indexPath, 'utf8');

  for (const route of STATIC_HTML_ROUTES) {
    const html = injectHeadSeo(baseHtml, siteBase, route);
    fs.writeFileSync(path.join(distDir, route.fileName), html, 'utf8');
  }

  const carsDir = path.join(distDir, 'cars');
  if (cars.length > 0 && !fs.existsSync(carsDir)) {
    fs.mkdirSync(carsDir, { recursive: true });
  }

  for (const car of cars) {
    const carName = [car.year, car.brand, car.model, car.variant].filter(Boolean).join(' ').trim() || car.id;
    const title = `${carName} | Wonder Cars`;
    const descParts = [
      carName,
      formatKmSimple(car.kilometres),
      car.fuelType,
      car.transmission,
      formatInrSimple(car.priceInr),
    ].filter(Boolean);
    const description =
      descParts.length > 1
        ? `${descParts.join(' · ')} at Wonder Cars, Preet Vihar, Delhi.`
        : `${carName} — Certified pre-owned vehicle at Wonder Cars, Preet Vihar, Delhi.`;
    const canonicalPath = `/cars/${encodeURIComponent(car.id)}`;
    const ogImage = resolveCarOgImage(siteBase, car.images);

    const carHtml = injectHeadSeo(baseHtml, siteBase, {
      canonicalPath,
      title,
      description,
      robots: 'index, follow',
      ogType: 'website',
      ogImage,
    });

    fs.writeFileSync(path.join(carsDir, `${car.id}.html`), carHtml, 'utf8');

    // If a slug route is accessed directly, serve the same HTML with canonical pointing to /cars/<car.id>
    if (car.slug && car.slug !== car.id && /^[a-z0-9-]+$/i.test(car.slug)) {
      fs.writeFileSync(path.join(carsDir, `${car.slug}.html`), carHtml, 'utf8');
    }
  }
}
