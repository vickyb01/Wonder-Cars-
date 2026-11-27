export const CANONICAL_ORIGIN = 'https://www.usedcarnearby.com';
export const DEFAULT_API_URL = 'https://wonder-cars-1.onrender.com';
export const DEFAULT_OG_IMAGE = `${CANONICAL_ORIGIN}/assets/wonder-cars.jpg`;
export const SITE_BRAND_NAME = 'Used Car Nearby';
export const SITE_ALTERNATE_NAMES = ['UsedCarNearby', 'usedcarnearby.com'];
export const ORGANIZATION_ID = `${CANONICAL_ORIGIN}/#organization`;
export const WEBSITE_ID = `${CANONICAL_ORIGIN}/#website`;
export const DEALERSHIP_NAME = 'Wonder Cars';
export const DEALERSHIP_ID = `${CANONICAL_ORIGIN}/#wondercars`;
export const SHOWROOM_LOGO_PATH = '/assets/wonder-cars-logo.png';
export const SHOWROOM_IMAGE_PATH = '/assets/wonder-cars.jpg';
export const SHOWROOM_TELEPHONE = '+91 83840 68347';
export const SHOWROOM_EMAIL = 'amanjain.nj784@gmail.com';
export const SHOWROOM_GOOGLE_MAPS_URL =
  'https://www.google.com/maps/place/Wonder+cars/@28.6396962,77.2910558,17z/data=!3m1!4b1!4m6!3m5!1s0x390cfbb6c71185b3:0x518ca5e40932dc6d!8m2!3d28.6396915!4d77.2936307!16s%2Fg%2F11z4164dfg';
export const SHOWROOM_GOOGLE_MAPS_DIRECTIONS_URL =
  'https://www.google.com/maps/dir//Wonder+cars/@28.6396915,77.2936307,17z/data=!4m6!3m5!1s0x390cfbb6c71185b3:0x518ca5e40932dc6d!8m2!3d28.6396915!4d77.2936307';
export const SHOWROOM_GOOGLE_MAPS_EMBED_URL =
  'https://maps.google.com/maps?q=loc:28.6396915,77.2936307+(Wonder+cars)&t=m&z=17&ie=UTF8&iwloc=&output=embed';
export const SHOWROOM_FULL_ADDRESS =
  'Shop No.-3, Rajkamal Sadan, Preet Vihar, Commercial Complex, Delhi, India - 110092';
export const SHOWROOM_ADDRESS = Object.freeze({
  streetAddress: 'Shop No.-3, Rajkamal Sadan, Preet Vihar, Commercial Complex',
  addressLocality: 'Delhi',
  addressRegion: 'Delhi',
  postalCode: '110092',
  addressCountry: 'IN',
});
export const SHOWROOM_GEO = Object.freeze({
  latitude: 28.6396915,
  longitude: 77.2936307,
});
export const HOMEPAGE_SEO_TITLE =
  'Used Car Nearby (UsedCarNearby.com) | Pre-Owned Cars by Wonder Cars';
export const HOMEPAGE_SEO_DESCRIPTION =
  'Discover 210-point inspected pre-owned cars at Used Car Nearby (UsedCarNearby.com), the online showcase of Wonder Cars in Preet Vihar, Delhi.';
export const CARS_SEO_TITLE = 'Browse Pre-Owned Cars Inventory';
export const CARS_SEO_DESCRIPTION =
  'Browse available pre-owned luxury and performance cars on Used Car Nearby. Compare transparent INR prices, specs, EMI, and book a Wonder Cars viewing.';
export const ABOUT_SEO_TITLE = 'About Us';
export const ABOUT_SEO_DESCRIPTION =
  'Learn about Used Car Nearby and Wonder Cars in Preet Vihar, Delhi — 210-point inspected pre-owned cars, verified history, and transparent pricing.';
export const CONTACT_SEO_TITLE = 'Contact Us';
export const CONTACT_SEO_DESCRIPTION =
  'Contact Used Car Nearby and visit Wonder Cars at Preet Vihar, Delhi for test drives, vehicle enquiries, and inspection reports.';
export const PRIVACY_SEO_TITLE = 'Privacy Policy';
export const PRIVACY_SEO_DESCRIPTION =
  'Read the Privacy Policy for Used Car Nearby (UsedCarNearby.com) explaining how enquiry and booking details shared with Wonder Cars are handled.';
export const TERMS_SEO_TITLE = 'Terms & Conditions';
export const TERMS_SEO_DESCRIPTION =
  'Review the Terms and Conditions for vehicle listings, showroom bookings, and purchases on Used Car Nearby with Wonder Cars.';
export const ADMIN_LOGIN_SEO_TITLE = 'Admin Login | Used Car Nearby';
export const ADMIN_LOGIN_SEO_DESCRIPTION =
  'Secure showroom administration login for Used Car Nearby and Wonder Cars.';
export const ADMIN_DASHBOARD_SEO_TITLE = 'Admin Dashboard | Used Car Nearby';
export const ADMIN_DASHBOARD_SEO_DESCRIPTION =
  'Showroom administration and inventory management dashboard for Used Car Nearby and Wonder Cars.';
export const OFFICIAL_SOCIAL_PROFILES = Object.freeze({
  instagram: 'https://www.instagram.com/usedcarsnearby/',
  facebook: 'https://www.facebook.com/amanjain.nj784/',
  youtube: 'https://www.youtube.com/c/usedcarsnearby',
});
export const OFFICIAL_SAME_AS = Object.freeze([
  OFFICIAL_SOCIAL_PROFILES.instagram,
  OFFICIAL_SOCIAL_PROFILES.facebook,
  OFFICIAL_SOCIAL_PROFILES.youtube,
]);
export const DEFAULT_EXECUTION_BUDGET_MS = 7500;

export const STATIC_PUBLIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/cars', changefreq: 'daily', priority: '0.9' },
  { path: '/about', changefreq: 'weekly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.7' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
];

const NON_MEANINGFUL_VALUES = new Set([
  'not provided',
  'not disclosed',
  'not available',
  'not inspected',
  'verification pending',
  'none',
]);

/**
 * Normalizes the public site origin, mapping the apex domain to www.usedcarnearby.com.
 * @param {string} [rawUrl]
 * @returns {string}
 */
export function normalizeSiteUrl(rawUrl) {
  const cleaned = String(rawUrl || '').trim().replace(/\/+$/, '');
  if (/^https?:\/\/usedcarnearby\.com$/i.test(cleaned)) {
    return CANONICAL_ORIGIN;
  }
  return cleaned || CANONICAL_ORIGIN;
}

/**
 * Normalizes the backend API base URL.
 * @param {string} [rawUrl]
 * @returns {string}
 */
export function normalizeApiBaseUrl(rawUrl) {
  const cleaned = String(rawUrl || '').trim().replace(/\/+$/, '');
  return cleaned || DEFAULT_API_URL;
}

/**
 * Normalizes known official social URLs by removing tracking parameters and resolving
 * legacy/conflicting URL variants to the confirmed canonical social profile URLs.
 * @param {'instagram' | 'facebook' | 'youtube'} platform
 * @param {string} [rawUrl]
 * @returns {string}
 */
export function normalizeOfficialSocialUrl(platform, rawUrl) {
  const fallback = OFFICIAL_SOCIAL_PROFILES[platform];
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return fallback;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase().replace(/^www\.|^m\./, '');
    const pathname = parsed.pathname.replace(/\/+$/, '').toLowerCase();

    if (platform === 'instagram' && host === 'instagram.com' && pathname === '/usedcarsnearby') {
      return OFFICIAL_SOCIAL_PROFILES.instagram;
    }

    if (
      platform === 'facebook' &&
      host === 'facebook.com' &&
      (pathname === '/amanjain.nj784' ||
        pathname === '/usedcarsnearby' ||
        pathname === '/share/1amqrrq1si')
    ) {
      return OFFICIAL_SOCIAL_PROFILES.facebook;
    }

    if (
      platform === 'youtube' &&
      (host === 'youtube.com' || host === 'youtu.be') &&
      (pathname === '/@usedcarsnearby' || pathname === '/c/usedcarsnearby')
    ) {
      return OFFICIAL_SOCIAL_PROFILES.youtube;
    }
  } catch {
    return fallback;
  }

  return trimmed;
}

/**
 * Escapes XML/HTML attribute and text special characters.
 * @param {string} value
 * @returns {string}
 */
export function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const escapeHtml = escapeXml;

/**
 * Formats an optional timestamp into YYYY-MM-DD, falling back to today's UTC date.
 * @param {string} [value]
 * @returns {string}
 */
export function toIsoDate(value) {
  if (value) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString().slice(0, 10);
    }
  }
  return new Date().toISOString().slice(0, 10);
}

/**
 * Checks whether a car field value carries meaningful display/schema information.
 * @param {unknown} val
 * @returns {boolean}
 */
export function isMeaningfulValue(val) {
  if (val === undefined || val === null) return false;
  const s = String(val).trim();
  if (!s) return false;
  return !NON_MEANINGFUL_VALUES.has(s.toLowerCase());
}

/**
 * Returns true only for publicly indexable listing statuses (Available, Reserved, Sold).
 * Draft and unknown/non-public statuses return false.
 * @param {unknown} status
 * @returns {boolean}
 */
export function isPublicCarStatus(status) {
  const normalized =
    typeof status === 'string' && status.trim() ? status.trim().toLowerCase() : 'available';
  return normalized === 'available' || normalized === 'reserved' || normalized === 'sold';
}

/**
 * Filters raw backend car records to unique, valid, published listings.
 * @param {unknown[]} records
 * @returns {Array<Record<string, any>>}
 */
export function filterPublicCars(records) {
  if (!Array.isArray(records)) return [];
  const seenIds = new Set();
  const cars = [];

  for (const item of records) {
    if (!item || typeof item !== 'object') continue;
    const car = /** @type {Record<string, any>} */ (item);
    const id = typeof car.id === 'string' ? car.id.trim() : '';
    if (!id || seenIds.has(id)) continue;
    if (!isPublicCarStatus(car.status)) continue;

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
      images: Array.isArray(car.images)
        ? car.images.filter((x) => typeof x === 'string')
        : undefined,
      status: car.status,
      createdAt: car.createdAt,
      updatedAt: car.updatedAt,
    });
  }

  return cars;
}

/**
 * Builds a Sitemaps 0.9 compliant XML document from static public routes and published car listings.
 * @param {string} siteUrl
 * @param {Array<Record<string, any>>} cars
 * @returns {string}
 */
export function buildSitemapXml(siteUrl, cars) {
  const baseUrl = normalizeSiteUrl(siteUrl);
  const buildDate = toIsoDate();
  const seenLocs = new Set();
  const urlNodes = [];

  /**
   * @param {string} loc
   * @param {string} lastmod
   * @param {string} changefreq
   * @param {string} priority
   */
  const appendUrl = (loc, lastmod, changefreq, priority) => {
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
    if (!car || !car.id || !isPublicCarStatus(car.status)) continue;
    const carPath = `/cars/${encodeURIComponent(String(car.id).trim())}`;
    const lastmod = toIsoDate(car.updatedAt || car.createdAt);
    const priority = String(car.status).trim() === 'Sold' ? '0.5' : '0.8';
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

/**
 * Formats an INR price cleanly without decimal places.
 * @param {number} [price]
 * @returns {string}
 */
export function formatInrSimple(price) {
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return '';
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(price)}`;
}

/**
 * Formats odometer reading in km.
 * @param {number} [km]
 * @returns {string}
 */
export function formatKmSimple(km) {
  if (km === undefined || km === null || typeof km !== 'number' || !Number.isFinite(km) || km < 0) {
    return '';
  }
  return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(km)} km`;
}

/**
 * Builds the concise display name for a vehicle.
 * @param {Record<string, any>} car
 * @returns {string}
 */
export function buildCarName(car) {
  const parts = [car?.year, car?.brand, car?.model, car?.variant]
    .map((part) => (part === undefined || part === null ? '' : String(part).trim()))
    .filter(Boolean);
  return parts.join(' ') || String(car?.id || 'Pre-Owned Vehicle');
}

/**
 * Builds the page title for a car listing with brand suffix.
 * @param {Record<string, any>} car
 * @returns {string}
 */
export function buildCarSeoTitle(car) {
  const carName = buildCarName(car);
  if (/used car nearby/i.test(carName)) return carName;
  return `${carName} | ${SITE_BRAND_NAME}`;
}

/**
 * Builds a unique meta description for a car listing.
 * @param {Record<string, any>} car
 * @returns {string}
 */
export function buildCarDescription(car) {
  const carName = buildCarName(car);
  const descParts = [
    carName,
    formatKmSimple(car?.kilometres),
    isMeaningfulValue(car?.fuelType) ? String(car.fuelType).trim() : '',
    isMeaningfulValue(car?.transmission) ? String(car.transmission).trim() : '',
    formatInrSimple(car?.priceInr),
  ].filter(Boolean);

  return descParts.length > 1
    ? `${descParts.join(' · ')} at Wonder Cars on Used Car Nearby, Preet Vihar, Delhi.`
    : `${carName} — Certified pre-owned vehicle at Wonder Cars on Used Car Nearby, Preet Vihar, Delhi.`;
}

/**
 * Resolves a single media URL against the public site base, skipping data: URIs.
 * @param {string} rawUrl
 * @param {string} [siteBase]
 * @returns {string}
 */
export function resolveAbsoluteMediaUrl(rawUrl, siteBase = CANONICAL_ORIGIN) {
  const base = normalizeSiteUrl(siteBase);
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed || trimmed.startsWith('data:')) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${base}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

/**
 * Resolves all valid absolute image URLs for a vehicle, falling back to the dealership OG image.
 * @param {Record<string, any>} car
 * @param {string} [siteBase]
 * @returns {string[]}
 */
export function resolveCarImages(car, siteBase = CANONICAL_ORIGIN) {
  const base = normalizeSiteUrl(siteBase);
  const candidates = [];
  if (Array.isArray(car?.images)) {
    candidates.push(...car.images);
  }
  if (Array.isArray(car?.gallery)) {
    for (const item of car.gallery) {
      if (item && typeof item.url === 'string') {
        candidates.push(item.url);
      }
    }
  }

  const seen = new Set();
  const resolved = [];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const abs = resolveAbsoluteMediaUrl(candidate, base);
    if (abs && !seen.has(abs)) {
      seen.add(abs);
      resolved.push(abs);
    }
  }

  return resolved.length > 0 ? resolved : [`${base}/assets/wonder-cars.jpg`];
}

/**
 * Resolves the primary Open Graph / Twitter image URL for a vehicle.
 * @param {Record<string, any>} car
 * @param {string} [siteBase]
 * @returns {string}
 */
export function resolveCarOgImage(car, siteBase = CANONICAL_ORIGIN) {
  return resolveCarImages(car, siteBase)[0];
}

/**
 * Returns the canonical path (/cars/:id) for a car listing.
 * @param {Record<string, any>} car
 * @returns {string}
 */
export function buildCarCanonicalPath(car) {
  return `/cars/${encodeURIComponent(String(car?.id || '').trim())}`;
}

/**
 * Returns the full canonical URL for a car listing.
 * @param {Record<string, any>} car
 * @param {string} [siteBase]
 * @returns {string}
 */
export function buildCarCanonicalUrl(car, siteBase = CANONICAL_ORIGIN) {
  const base = normalizeSiteUrl(siteBase);
  return `${base}${buildCarCanonicalPath(car)}`;
}

/**
 * Maps vehicle listing status to Schema.org ItemAvailability URI.
 * @param {unknown} status
 * @returns {string}
 */
function resolveSchemaAvailability(status) {
  const s = String(status || '').trim().toLowerCase();
  if (s === 'sold') return 'https://schema.org/SoldOut';
  if (s === 'reserved') return 'https://schema.org/LimitedAvailability';
  return 'https://schema.org/InStock';
}

/**
 * Extracts integer owner count from usageHistory or ownership label when available.
 * @param {Record<string, any>} car
 * @returns {number | undefined}
 */
function resolvePreviousOwnersCount(car) {
  const fromUsage = car?.usageHistory?.previousOwnersCount;
  if (typeof fromUsage === 'number' && Number.isInteger(fromUsage) && fromUsage > 0) {
    return fromUsage;
  }
  const ownershipText = String(car?.ownership || '').trim();
  const match = ownershipText.match(/^(\d+)/);
  if (match) {
    const parsed = Number.parseInt(match[1], 10);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

/**
 * Builds an accurate Schema.org Car JSON-LD payload for a published vehicle.
 * @param {Record<string, any>} car
 * @param {string} [siteBase]
 * @returns {Record<string, any>}
 */
export function buildCarJsonLd(car, siteBase = CANONICAL_ORIGIN) {
  const base = normalizeSiteUrl(siteBase);
  const canonicalUrl = buildCarCanonicalUrl(car, base);
  const carName = buildCarName(car);
  const images = resolveCarImages(car, base);
  const description = isMeaningfulValue(car?.description)
    ? String(car.description).trim()
    : buildCarDescription(car);

  /** @type {Record<string, any>} */
  const offer = {
    '@type': 'Offer',
    url: canonicalUrl,
    priceCurrency: 'INR',
    availability: resolveSchemaAvailability(car?.status),
    itemCondition: 'https://schema.org/UsedCondition',
    seller: {
      '@id': `${base}/#wondercars`,
    },
  };

  if (typeof car?.priceInr === 'number' && Number.isFinite(car.priceInr) && car.priceInr > 0) {
    offer.price = Math.round(car.priceInr);
  }

  /** @type {Record<string, any>} */
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    '@id': `${canonicalUrl}#car`,
    name: carName,
    url: canonicalUrl,
    description,
    image: images,
    itemCondition: 'https://schema.org/UsedCondition',
    sku: isMeaningfulValue(car?.listingCode) ? String(car.listingCode).trim() : String(car?.id || ''),
    offers: offer,
  };

  if (isMeaningfulValue(car?.brand)) {
    schema.brand = {
      '@type': 'Brand',
      name: String(car.brand).trim(),
    };
  }
  if (isMeaningfulValue(car?.model)) {
    schema.model = String(car.model).trim();
  }
  if (isMeaningfulValue(car?.variant)) {
    schema.vehicleConfiguration = String(car.variant).trim();
  }
  if (typeof car?.year === 'number' && Number.isFinite(car.year) && car.year > 1900) {
    schema.vehicleModelDate = String(car.year);
  }
  if (isMeaningfulValue(car?.bodyType)) {
    schema.bodyType = String(car.bodyType).trim();
  }
  if (isMeaningfulValue(car?.color)) {
    schema.color = String(car.color).trim();
  }
  if (isMeaningfulValue(car?.interiorColor)) {
    schema.vehicleInteriorColor = String(car.interiorColor).trim();
  }
  if (isMeaningfulValue(car?.fuelType)) {
    schema.fuelType = String(car.fuelType).trim();
  }
  if (isMeaningfulValue(car?.transmission)) {
    schema.vehicleTransmission = String(car.transmission).trim();
  }
  if (isMeaningfulValue(car?.drivetrain)) {
    schema.driveWheelConfiguration = String(car.drivetrain).trim();
  }
  if (typeof car?.seatingCapacity === 'number' && Number.isFinite(car.seatingCapacity) && car.seatingCapacity > 0) {
    schema.seatingCapacity = car.seatingCapacity;
  }
  if (typeof car?.doors === 'number' && Number.isFinite(car.doors) && car.doors > 0) {
    schema.numberOfDoors = car.doors;
  }
  if (typeof car?.kilometres === 'number' && Number.isFinite(car.kilometres) && car.kilometres >= 0) {
    schema.mileageFromOdometer = {
      '@type': 'QuantitativeValue',
      value: Math.round(car.kilometres),
      unitCode: 'KMT',
    };
  }
  const previousOwners = resolvePreviousOwnersCount(car);
  if (previousOwners !== undefined) {
    schema.numberOfPreviousOwners = previousOwners;
  }

  return schema;
}

/**
 * Builds complete SEO metadata and JSON-LD for a published car listing.
 * @param {Record<string, any>} car
 * @param {string} [siteBase]
 */
export function buildCarSeoData(car, siteBase = CANONICAL_ORIGIN) {
  const base = normalizeSiteUrl(siteBase);
  const canonicalPath = buildCarCanonicalPath(car);
  const canonicalUrl = `${base}${canonicalPath}`;
  return {
    title: buildCarSeoTitle(car),
    description: buildCarDescription(car),
    canonicalPath,
    canonicalUrl,
    robots: 'index, follow',
    ogType: 'website',
    ogImage: resolveCarOgImage(car, base),
    jsonLd: buildCarJsonLd(car, base),
  };
}

/**
 * Builds SEO metadata for a missing, deleted, or draft vehicle (404 + noindex).
 * @param {string} [siteBase]
 */
export function buildNotFoundSeoData(siteBase = CANONICAL_ORIGIN) {
  const base = normalizeSiteUrl(siteBase);
  return {
    title: `Vehicle Not Found | ${SITE_BRAND_NAME}`,
    description: 'This vehicle listing is unavailable or has been removed from Used Car Nearby.',
    canonicalPath: null,
    canonicalUrl: null,
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogImage: `${base}/assets/wonder-cars.jpg`,
    jsonLd: null,
  };
}

/**
 * Builds SEO metadata for unknown / 404 routes (noindex, no canonical, no Car JSON-LD).
 * @param {string} [siteBase]
 */
export function buildPageNotFoundSeoData(siteBase = CANONICAL_ORIGIN) {
  const base = normalizeSiteUrl(siteBase);
  return {
    title: `Page Not Found | ${SITE_BRAND_NAME}`,
    description:
      'The page you requested could not be found on Used Car Nearby. Browse certified pre-owned cars or return to the homepage.',
    canonicalPath: null,
    canonicalUrl: null,
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogImage: `${base}/assets/wonder-cars.jpg`,
    jsonLd: null,
  };
}

/**
 * Serializes JSON-LD safely for inline HTML <script> tags.
 * @param {unknown} data
 * @returns {string}
 */
export function serializeJsonLdSafe(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * Builds the Schema.org Organization entity for the primary Used Car Nearby brand.
 * @param {string} [siteBase]
 * @returns {Record<string, any>}
 */
export function buildOrganizationJsonLd(siteBase = CANONICAL_ORIGIN) {
  const base = normalizeSiteUrl(siteBase);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${base}/#organization`,
    name: SITE_BRAND_NAME,
    alternateName: [...SITE_ALTERNATE_NAMES],
    url: `${base}/`,
    logo: `${base}${SHOWROOM_LOGO_PATH}`,
    image: `${base}${SHOWROOM_IMAGE_PATH}`,
    telephone: SHOWROOM_TELEPHONE,
    email: SHOWROOM_EMAIL,
    address: {
      '@type': 'PostalAddress',
      ...SHOWROOM_ADDRESS,
    },
    subOrganization: {
      '@id': `${base}/#wondercars`,
    },
    sameAs: [...OFFICIAL_SAME_AS],
  };
}

/**
 * Builds the Schema.org WebSite entity for Used Car Nearby.
 * @param {string} [siteBase]
 * @returns {Record<string, any>}
 */
export function buildWebSiteJsonLd(siteBase = CANONICAL_ORIGIN) {
  const base = normalizeSiteUrl(siteBase);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${base}/#website`,
    name: SITE_BRAND_NAME,
    alternateName: [...SITE_ALTERNATE_NAMES],
    url: `${base}/`,
    publisher: {
      '@id': `${base}/#organization`,
    },
    about: {
      '@id': `${base}/#wondercars`,
    },
  };
}

/**
 * Builds the Schema.org AutoDealer entity for the Wonder Cars physical showroom.
 * @param {string} [siteBase]
 * @returns {Record<string, any>}
 */
export function buildAutoDealerJsonLd(siteBase = CANONICAL_ORIGIN) {
  const base = normalizeSiteUrl(siteBase);
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    '@id': `${base}/#wondercars`,
    name: DEALERSHIP_NAME,
    url: `${base}/`,
    logo: `${base}${SHOWROOM_LOGO_PATH}`,
    image: `${base}${SHOWROOM_IMAGE_PATH}`,
    telephone: SHOWROOM_TELEPHONE,
    email: SHOWROOM_EMAIL,
    address: {
      '@type': 'PostalAddress',
      ...SHOWROOM_ADDRESS,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SHOWROOM_GEO.latitude,
      longitude: SHOWROOM_GEO.longitude,
    },
    hasMap: SHOWROOM_GOOGLE_MAPS_URL,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '10:00',
        closes: '20:00',
      },
    ],
    parentOrganization: {
      '@id': `${base}/#organization`,
    },
  };
}

/**
 * Replaces managed SEO head tags and injects indexable structured data into an HTML shell.
 * Noindex pages (404, admin) receive no Organization, WebSite, AutoDealer, or Car JSON-LD.
 * @param {string} templateHtml
 * @param {{
 *   canonicalPath?: string | null,
 *   canonicalUrl?: string | null,
 *   title: string,
 *   description: string,
 *   robots: string,
 *   ogType?: string,
 *   ogImage?: string,
 *   jsonLd?: Record<string, any> | null,
 *   siteUrl?: string,
 * }} opts
 * @returns {string}
 */
export function injectHeadSeoHtml(templateHtml, opts) {
  const siteBase = normalizeSiteUrl(opts.siteUrl || CANONICAL_ORIGIN);
  const canonicalUrl =
    opts.canonicalUrl !== undefined
      ? opts.canonicalUrl
      : opts.canonicalPath
      ? `${siteBase}${opts.canonicalPath === '/' ? '/' : opts.canonicalPath}`
      : null;
  const ogImage = opts.ogImage || `${siteBase}/assets/wonder-cars.jpg`;
  const ogType = opts.ogType || 'website';
  const isIndexable = !/\bnoindex\b/i.test(String(opts.robots || ''));

  const stripped = String(templateHtml || '')
    .replace(/<title>[\s\S]*?<\/title>\s*/gi, '')
    .replace(/<meta\s+name=["'](?:description|robots)["'][^>]*>\s*/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+property=["']og:(?:site_name|title|description|url|type|image)["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+name=["']twitter:(?:card|title|description|image)["'][^>]*>\s*/gi, '')
    .replace(
      /<script[^>]*id=["'](?:organization-schema|website-schema|autodealer-schema|car-schema)["'][^>]*>[\s\S]*?<\/script>\s*/gi,
      ''
    );

  const schemaScripts = isIndexable
    ? [
        `    <script type="application/ld+json" id="organization-schema">${serializeJsonLdSafe(
          buildOrganizationJsonLd(siteBase)
        )}</script>`,
        `    <script type="application/ld+json" id="website-schema">${serializeJsonLdSafe(
          buildWebSiteJsonLd(siteBase)
        )}</script>`,
        `    <script type="application/ld+json" id="autodealer-schema">${serializeJsonLdSafe(
          buildAutoDealerJsonLd(siteBase)
        )}</script>`,
        ...(opts.jsonLd
          ? [`    <script type="application/ld+json" id="car-schema">${serializeJsonLdSafe(opts.jsonLd)}</script>`]
          : []),
      ]
    : [];

  const seoLines = [
    `    <title>${escapeXml(opts.title)}</title>`,
    `    <meta name="description" content="${escapeXml(opts.description)}" />`,
    `    <meta name="robots" content="${escapeXml(opts.robots)}" />`,
    ...(canonicalUrl ? [`    <link rel="canonical" href="${escapeXml(canonicalUrl)}" />`] : []),
    `    <meta property="og:site_name" content="${escapeXml(SITE_BRAND_NAME)}" />`,
    `    <meta property="og:title" content="${escapeXml(opts.title)}" />`,
    `    <meta property="og:description" content="${escapeXml(opts.description)}" />`,
    ...(canonicalUrl ? [`    <meta property="og:url" content="${escapeXml(canonicalUrl)}" />`] : []),
    `    <meta property="og:type" content="${escapeXml(ogType)}" />`,
    `    <meta property="og:image" content="${escapeXml(ogImage)}" />`,
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:title" content="${escapeXml(opts.title)}" />`,
    `    <meta name="twitter:description" content="${escapeXml(opts.description)}" />`,
    `    <meta name="twitter:image" content="${escapeXml(ogImage)}" />`,
    ...schemaScripts,
  ].join('\n');

  if (/<meta\s+name=["']viewport["'][^>]*>/i.test(stripped)) {
    return stripped.replace(/<meta\s+name=["']viewport["'][^>]*>/i, (match) => `${match}\n${seoLines}`);
  }
  if (/<\/head>/i.test(stripped)) {
    return stripped.replace(/<\/head>/i, `${seoLines}\n  </head>`);
  }
  return `${seoLines}\n${stripped}`;
}

/**
 * Fetches JSON from the backend API with bounded retries inside a strict execution budget.
 * Never retries definitive 4xx responses (such as 404). Returns unavailable: true when the
 * backend cannot be reached or returns 5xx/invalid responses within the budget.
 * @param {string} url
 * @param {{
 *   fetchImpl?: typeof fetch,
 *   budgetMs?: number,
 *   headers?: Record<string, string>,
 *   maxAttempts?: number,
 *   firstAttemptTimeoutMs?: number,
 * }} [options]
 */
export async function fetchBackendJsonWithBudget(url, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const budgetMs =
    typeof options.budgetMs === 'number' && options.budgetMs > 0
      ? options.budgetMs
      : DEFAULT_EXECUTION_BUDGET_MS;
  const maxAttempts =
    typeof options.maxAttempts === 'number' && options.maxAttempts >= 1
      ? options.maxAttempts
      : 3;
  const firstAttemptTimeoutMs =
    typeof options.firstAttemptTimeoutMs === 'number' && options.firstAttemptTimeoutMs > 0
      ? options.firstAttemptTimeoutMs
      : Math.min(4000, budgetMs);

  const deadline = Date.now() + budgetMs;
  let lastError = 'Backend request failed';

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining <= 150) {
      lastError = 'Execution budget exhausted';
      break;
    }

    const attemptTimeout =
      attempt === 0 ? Math.min(firstAttemptTimeoutMs, remaining) : remaining;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), attemptTimeout);

    try {
      const response = await fetchImpl(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(options.headers || {}),
        },
        cache: 'no-store',
        signal: controller.signal,
      });

      if (response.ok) {
        const data = await response.json();
        return {
          ok: true,
          status: response.status,
          notFound: false,
          unavailable: false,
          data,
        };
      }

      if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
        return {
          ok: false,
          status: response.status,
          notFound: response.status === 404,
          unavailable: false,
          data: null,
          error: `Upstream returned ${response.status}`,
        };
      }

      lastError = `Upstream returned ${response.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Network error';
    } finally {
      clearTimeout(timer);
    }

    const remainingAfterAttempt = deadline - Date.now();
    if (attempt < maxAttempts - 1 && remainingAfterAttempt > 500) {
      const baseDelay = attempt === 0 ? 250 : 400;
      const delay = Math.min(baseDelay, remainingAfterAttempt - 400);
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } else {
      break;
    }
  }

  return {
    ok: false,
    status: 503,
    notFound: false,
    unavailable: true,
    data: null,
    error: lastError,
  };
}
