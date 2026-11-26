import fs from 'fs';
import path from 'path';
import {
  CANONICAL_ORIGIN,
  DEFAULT_API_URL as SHARED_DEFAULT_API_URL,
  STATIC_PUBLIC_ROUTES as SHARED_STATIC_PUBLIC_ROUTES,
  buildSitemapXml as sharedBuildSitemapXml,
  escapeXml as sharedEscapeXml,
  fetchBackendJsonWithBudget,
  filterPublicCars as sharedFilterPublicCars,
  normalizeApiBaseUrl,
  normalizeSiteUrl,
  toIsoDate as sharedToIsoDate,
} from '../src/utils/carSeoShared.mjs';

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

export interface StaticRouteEntry {
  path: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: string;
}

export const DEFAULT_SITE_URL = CANONICAL_ORIGIN;
export const DEFAULT_API_URL = SHARED_DEFAULT_API_URL;

// Publicly indexable canonical SPA routes; excludes /admin, redirect routes (/compare, /sell, /gallery), and wildcard catch-alls.
export const STATIC_PUBLIC_ROUTES: StaticRouteEntry[] =
  SHARED_STATIC_PUBLIC_ROUTES as StaticRouteEntry[];

/** Escapes XML special characters so URLs and metadata remain valid XML. */
export const escapeXml = sharedEscapeXml;

/** Formats an optional timestamp into YYYY-MM-DD, falling back to today's UTC date. */
export const toIsoDate = sharedToIsoDate;

export function filterPublicCars(records: unknown[]): SitemapCarRecord[] {
  return sharedFilterPublicCars(records) as SitemapCarRecord[];
}

/** Loads public car listings strictly from the live backend API (returns null if unavailable). */
export async function loadLivePublicCars(
  apiBaseUrl: string,
  budgetMs = 7500
): Promise<SitemapCarRecord[] | null> {
  const normalizedApi = normalizeApiBaseUrl(apiBaseUrl || DEFAULT_API_URL);
  const result = await fetchBackendJsonWithBudget(`${normalizedApi}/api/cars`, {
    budgetMs,
  });
  if (!result.ok || !Array.isArray(result.data)) {
    return null;
  }
  return filterPublicCars(result.data);
}

/** Loads public car listings from the live backend API, falling back to the local backend db.json for local dev. */
export async function loadPublicCars(
  apiBaseUrl: string,
  backendDbPath: string
): Promise<SitemapCarRecord[]> {
  const liveCars = await loadLivePublicCars(apiBaseUrl, 5000);
  if (liveCars !== null) {
    return liveCars;
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
  return sharedBuildSitemapXml(normalizeSiteUrl(siteUrl || DEFAULT_SITE_URL), cars);
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
