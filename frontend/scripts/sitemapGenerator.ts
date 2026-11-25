import fs from 'fs';
import path from 'path';

export interface SitemapCarRecord {
  id: string;
  slug?: string;
  brand?: string;
  model?: string;
  variant?: string;
  year?: number;
  kilometres?: number;
  fuelType?: string;
  transmission?: string;
  priceInr?: number;
  images?: string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface StaticRouteEntry {
  path: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: string;
}

export const DEFAULT_SITE_URL = 'https://www.usedcarnearby.com';
export const DEFAULT_API_URL = 'https://wonder-cars-1.onrender.com';

// Publicly indexable canonical SPA routes; excludes /admin, redirect routes (/compare, /sell, /gallery), and wildcard catch-alls.
export const STATIC_PUBLIC_ROUTES: StaticRouteEntry[] = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/cars', changefreq: 'daily', priority: '0.9' },
  { path: '/about', changefreq: 'weekly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.7' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
];

/** Escapes XML special characters so URLs and metadata remain valid XML. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Formats an optional timestamp into YYYY-MM-DD, falling back to today's UTC date. */
export function toIsoDate(value?: string): string {
  if (value) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString().slice(0, 10);
    }
  }
  return new Date().toISOString().slice(0, 10);
}

function normalizeBaseUrl(rawUrl: string): string {
  const cleaned = rawUrl.trim().replace(/\/+$/, '');
  if (/^https?:\/\/usedcarnearby\.com$/i.test(cleaned)) {
    return DEFAULT_SITE_URL;
  }
  return cleaned;
}

function filterPublicCars(records: unknown[]): SitemapCarRecord[] {
  const seenIds = new Set<string>();
  const cars: SitemapCarRecord[] = [];

  for (const item of records) {
    if (!item || typeof item !== 'object') continue;
    const car = item as SitemapCarRecord;
    const id = typeof car.id === 'string' ? car.id.trim() : '';
    if (!id || seenIds.has(id)) continue;
    if (car.status === 'Draft') continue;

    seenIds.add(id);
    cars.push({
      id,
      slug: typeof car.slug === 'string' ? car.slug.trim() : undefined,
      brand: typeof car.brand === 'string' ? car.brand.trim() : undefined,
      model: typeof car.model === 'string' ? car.model.trim() : undefined,
      variant: typeof car.variant === 'string' ? car.variant.trim() : undefined,
      year: typeof car.year === 'number' ? car.year : undefined,
      kilometres: typeof car.kilometres === 'number' ? car.kilometres : undefined,
      fuelType: typeof car.fuelType === 'string' ? car.fuelType.trim() : undefined,
      transmission: typeof car.transmission === 'string' ? car.transmission.trim() : undefined,
      priceInr: typeof car.priceInr === 'number' ? car.priceInr : undefined,
      images: Array.isArray(car.images) ? car.images.filter((x): x is string => typeof x === 'string') : undefined,
      status: car.status,
      createdAt: car.createdAt,
      updatedAt: car.updatedAt,
    });
  }

  return cars;
}

/** Loads public car listings from the live backend API, falling back to the local backend db.json when unreachable. */
export async function loadPublicCars(apiBaseUrl: string, backendDbPath: string): Promise<SitemapCarRecord[]> {
  const normalizedApi = normalizeBaseUrl(apiBaseUrl || DEFAULT_API_URL);

  if (normalizedApi) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(`${normalizedApi}/api/cars`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (response.ok) {
        const data: unknown = await response.json();
        if (Array.isArray(data)) {
          return filterPublicCars(data);
        }
      }
    } catch {
      // Offline/sandboxed build or unreachable backend; fall back to local db.json below.
    } finally {
      clearTimeout(timeout);
    }
  }

  if (fs.existsSync(backendDbPath)) {
    try {
      const raw = fs.readFileSync(backendDbPath, 'utf8');
      const parsed = JSON.parse(raw) as { cars?: unknown[] };
      if (Array.isArray(parsed.cars)) {
        return filterPublicCars(parsed.cars);
      }
    } catch {
      // Ignore malformed fallback data and return static routes only.
    }
  }

  return [];
}

/** Builds a Sitemaps 0.9 compliant XML document from static public routes and public car listings. */
export function buildSitemapXml(siteUrl: string, cars: SitemapCarRecord[]): string {
  const baseUrl = normalizeBaseUrl(siteUrl || DEFAULT_SITE_URL);
  const buildDate = toIsoDate();
  const seenLocs = new Set<string>();
  const urlNodes: string[] = [];

  const appendUrl = (loc: string, lastmod: string, changefreq: string, priority: string): void => {
    if (seenLocs.has(loc)) return;
    seenLocs.add(loc);
    urlNodes.push(
      [
        '  <url>',
        `    <loc>${escapeXml(loc)}</loc>`,
        `    <lastmod>${escapeXml(lastmod)}</lastmod>`,
        `    <changefreq>${escapeXml(changefreq)}</changefreq>`,
        `    <priority>${escapeXml(priority)}</priority>`,
        '  </url>',
      ].join('\n')
    );
  };

  for (const route of STATIC_PUBLIC_ROUTES) {
    const fullUrl = route.path === '/' ? `${baseUrl}/` : `${baseUrl}${route.path}`;
    appendUrl(fullUrl, buildDate, route.changefreq, route.priority);
  }

  for (const car of cars) {
    const carPath = `/cars/${encodeURIComponent(car.id)}`;
    const lastmod = toIsoDate(car.updatedAt || car.createdAt);
    const priority = car.status === 'Sold' ? '0.5' : '0.8';
    appendUrl(`${baseUrl}${carPath}`, lastmod, 'weekly', priority);
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urlNodes,
    '</urlset>',
    '',
  ].join('\n');
}

/** Generates the complete XML sitemap string for the Wonder Cars application. */
export async function generateSitemapXml(options?: {
  siteUrl?: string;
  apiBaseUrl?: string;
  backendDbPath?: string;
}): Promise<string> {
  const siteUrl = options?.siteUrl || DEFAULT_SITE_URL;
  const apiBaseUrl = options?.apiBaseUrl || DEFAULT_API_URL;
  const backendDbPath =
    options?.backendDbPath || path.resolve(process.cwd(), '../backend/data/db.json');

  const cars = await loadPublicCars(apiBaseUrl, backendDbPath);
  return buildSitemapXml(siteUrl, cars);
}
