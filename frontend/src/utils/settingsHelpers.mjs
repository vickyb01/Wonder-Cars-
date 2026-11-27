import {
  OFFICIAL_SOCIAL_PROFILES,
  SHOWROOM_FULL_ADDRESS,
  SHOWROOM_GOOGLE_MAPS_DIRECTIONS_URL,
  SHOWROOM_GOOGLE_MAPS_EMBED_URL,
  SHOWROOM_GOOGLE_MAPS_URL,
} from './carSeoShared.mjs';

const TRACKING_QUERY_KEYS = new Set([
  'fqnt',
  'si',
  'mibextid',
  'rdid',
  'share_url',
  'fbclid',
  'igshid',
  'igsh',
  'ref',
  'feature',
  'gclid',
  'mc_cid',
  'mc_eid',
]);

export const PLACEHOLDER_GA4_IDS = new Set(['G-WONDERCARS2026']);
const GA4_ID_REGEX = /^G-[A-Z0-9]{6,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const VERIFIED_SHOWROOM_DEFAULTS = {
  businessName: 'Wonder Cars',
  address: SHOWROOM_FULL_ADDRESS,
  city: 'Delhi',
  state: 'Delhi',
  postalCode: '110092',
  latitude: '28.6396915',
  longitude: '77.2936307',
  googleMapsPlaceId: '0x390cfbb6c71185b3:0x518ca5e40932dc6d',
  googleMapsUrl: SHOWROOM_GOOGLE_MAPS_URL,
  googleMapsEmbedUrl: SHOWROOM_GOOGLE_MAPS_EMBED_URL,
  googleMapsDirectionsUrl: SHOWROOM_GOOGLE_MAPS_DIRECTIONS_URL,
};

export { OFFICIAL_SOCIAL_PROFILES };

/**
 * Checks whether a URL contains tracking parameters or a trailing hash.
 */
export function hasSocialTrackingParams(rawUrl) {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    if (parsed.hash) return true;
    for (const key of parsed.searchParams.keys()) {
      const lower = key.toLowerCase();
      if (TRACKING_QUERY_KEYS.has(lower) || lower.startsWith('utm_')) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Strips known tracking query parameters and trailing hashes while preserving clean profile paths.
 */
export function stripSocialTrackingParams(rawUrl) {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return '';
  const parsed = new URL(trimmed);
  for (const key of Array.from(parsed.searchParams.keys())) {
    const lower = key.toLowerCase();
    if (TRACKING_QUERY_KEYS.has(lower) || lower.startsWith('utm_')) {
      parsed.searchParams.delete(key);
    }
  }
  parsed.hash = '';
  return parsed.toString();
}

/**
 * Validates an HTTP(S) URL (or root-relative asset path when allowRelative is true).
 */
export function validateHttpUrl(rawUrl, fieldLabel, options = {}) {
  const { allowEmpty = true, allowRelative = false } = options;
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) {
    return allowEmpty ? null : `${fieldLabel} is required.`;
  }
  if (allowRelative && trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return null;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return `${fieldLabel} must start with https:// or http://.`;
    }
    return null;
  } catch {
    return `Please enter a valid URL for ${fieldLabel}.`;
  }
}

/**
 * Validates an email address when non-empty.
 */
export function validateEmailAddress(rawEmail, fieldLabel = 'Email') {
  const trimmed = String(rawEmail || '').trim();
  if (!trimmed) return null;
  return EMAIL_REGEX.test(trimmed) ? null : `Please enter a valid email address for ${fieldLabel}.`;
}

/**
 * Validates Latitude and Longitude pairs.
 */
export function validateCoordinatesPair(rawLat, rawLng) {
  const latStr = String(rawLat || '').trim();
  const lngStr = String(rawLng || '').trim();
  const errors = {};

  if ((latStr && !lngStr) || (!latStr && lngStr)) {
    errors.latitude = errors.latitude || 'Provide both Latitude and Longitude, or leave both blank.';
    errors.longitude = errors.longitude || 'Provide both Latitude and Longitude, or leave both blank.';
    return errors;
  }

  if (latStr) {
    const lat = Number(latStr);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      errors.latitude = 'Latitude must be between -90 and 90.';
    }
  }
  if (lngStr) {
    const lng = Number(lngStr);
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      errors.longitude = 'Longitude must be between -180 and 180.';
    }
  }
  return errors;
}

/**
 * Returns true if the supplied string is a real non-placeholder GA4 Measurement ID.
 */
export function isValidGa4MeasurementId(rawId) {
  const normalized = String(rawId || '').trim().toUpperCase();
  if (!normalized || PLACEHOLDER_GA4_IDS.has(normalized)) return false;
  return GA4_ID_REGEX.test(normalized);
}

/**
 * Validates user input for a GA4 Measurement ID field. Empty value is allowed to disable runtime fallback.
 */
export function validateGa4IdInput(rawId) {
  const normalized = String(rawId || '').trim().toUpperCase();
  if (!normalized) return null;
  if (PLACEHOLDER_GA4_IDS.has(normalized)) {
    return `${normalized} is a placeholder ID, not a valid GA4 Measurement ID. Enter a real G-XXXXXXXXXX ID or leave blank.`;
  }
  if (!GA4_ID_REGEX.test(normalized)) {
    return 'GA4 Measurement ID must match format G-XXXXXXXXXX.';
  }
  return null;
}

/**
 * Builds an embeddable Google Maps iframe URL from verified coordinates and showroom name.
 */
export function buildEmbedUrlFromCoords(lat, lng, businessName = 'Wonder Cars', zoom = 17) {
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    return SHOWROOM_GOOGLE_MAPS_EMBED_URL;
  }
  return `https://maps.google.com/maps?q=loc:${latNum},${lngNum}+(${encodeURIComponent(businessName)})&t=m&z=${zoom || 17}&ie=UTF8&iwloc=&output=embed`;
}

/**
 * Resolves the Directions URL, prioritizing a saved valid custom googleMapsDirectionsUrl
 * before falling back to generated coordinates/Place ID or address URLs.
 */
export function resolveMapsDirectionsUrl(location = {}) {
  const customDirections = String(location.googleMapsDirectionsUrl || '').trim();
  if (
    customDirections &&
    /^https?:\/\//i.test(customDirections) &&
    !/^https?:\/\/maps\.google\.com\/\?q=/i.test(customDirections)
  ) {
    return customDirections;
  }

  const latStr = String(location.latitude || '').trim();
  const lngStr = String(location.longitude || '').trim();
  const lat = Number(latStr);
  const lng = Number(lngStr);
  if (latStr && lngStr && Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
    const label = encodeURIComponent(String(location.businessName || '').trim() || 'Wonder cars').replace(/%20/g, '+');
    const placeId = String(location.googleMapsPlaceId || '').trim() || '0x390cfbb6c71185b3:0x518ca5e40932dc6d';
    return `https://www.google.com/maps/dir//${label}/@${lat},${lng},17z/data=!4m6!3m5!1s${placeId}!8m2!3d${lat}!4d${lng}`;
  }

  const parts = [location.address, location.city, location.state, location.postalCode]
    .map((s) => String(s || '').trim())
    .filter((val, idx, arr) => Boolean(val) && arr.indexOf(val) === idx);
  const fullAddr = parts.join(', ');
  if (fullAddr) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddr)}`;
  }

  return null;
}

/**
 * Resolves the Google Maps Embed iframe URL, prioritizing a saved valid custom googleMapsEmbedUrl
 * (excluding known placeholder coordinates) before generating from coordinates or default.
 */
export function resolveMapsEmbedUrl(location = {}, zoom = 17) {
  const customEmbed = String(location.googleMapsEmbedUrl || '').trim();
  if (
    customEmbed &&
    /^https?:\/\//i.test(customEmbed) &&
    !customEmbed.includes('0x390cfb5c00000001') &&
    !customEmbed.includes('0x89abcdef12345678') &&
    !(customEmbed.includes('28.643387') && customEmbed.includes('77.291771'))
  ) {
    return customEmbed;
  }

  const latStr = String(location.latitude || '').trim();
  const lngStr = String(location.longitude || '').trim();
  if (latStr && lngStr) {
    const lat = Number(latStr);
    const lng = Number(lngStr);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return buildEmbedUrlFromCoords(lat, lng, String(location.businessName || '').trim() || 'Wonder Cars', zoom);
    }
  }

  return SHOWROOM_GOOGLE_MAPS_EMBED_URL;
}
