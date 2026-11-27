import type { BusinessLocationSettings } from '../types/car';
import {
  SHOWROOM_FULL_ADDRESS,
  SHOWROOM_GOOGLE_MAPS_DIRECTIONS_URL,
  SHOWROOM_GOOGLE_MAPS_EMBED_URL,
  SHOWROOM_GOOGLE_MAPS_URL,
} from './carSeoShared.mjs';
import { resolveMapsDirectionsUrl, resolveMapsEmbedUrl } from './settingsHelpers.mjs';

export {
  SHOWROOM_FULL_ADDRESS,
  SHOWROOM_GOOGLE_MAPS_DIRECTIONS_URL,
  SHOWROOM_GOOGLE_MAPS_EMBED_URL,
  SHOWROOM_GOOGLE_MAPS_URL,
};

export const EMPTY_LOCATION_SETTINGS: BusinessLocationSettings = {
  businessName: '',
  phone: '',
  email: '',
  whatsapp: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  latitude: '',
  longitude: '',
  googleMapsUrl: '',
  openingHours: '',
  nearbyLandmarks: '',
  instagramUrl: '',
  facebookUrl: '',
  youtubeUrl: '',
};

export function parseCoordinates(
  location: Pick<BusinessLocationSettings, 'latitude' | 'longitude'>
): { lat: number; lng: number } | null {
  const latStr = String(location.latitude || '').trim();
  const lngStr = String(location.longitude || '').trim();
  if (!latStr || !lngStr) return null;

  const lat = Number(latStr);
  const lng = Number(lngStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
}

export function formatFullAddress(
  location: Pick<BusinessLocationSettings, 'address' | 'city' | 'state' | 'postalCode'>
): string {
  const street = String(location.address || '').trim();
  if (/110092/.test(street) && /preet vihar/i.test(street)) {
    return SHOWROOM_FULL_ADDRESS;
  }
  const cityStatePin = [location.city, location.state, location.postalCode]
    .map((s) => String(s || '').trim())
    .filter((val, idx, arr) => Boolean(val) && arr.indexOf(val) === idx)
    .join(', ');

  return [street, cityStatePin].filter(Boolean).join(', ');
}

/**
 * Standardizes Preet Vihar showroom address variants to the verified public address format.
 */
export function normalizeShowroomAddress(rawAddress?: string): string {
  const trimmed = String(rawAddress || '').trim();
  if (!trimmed) return SHOWROOM_FULL_ADDRESS;
  if (/rajkamal sadan/i.test(trimmed) || /preet vihar/i.test(trimmed)) {
    return SHOWROOM_FULL_ADDRESS;
  }
  return trimmed;
}

/**
 * Replaces known placeholder Google Maps embed URLs with the verified Wonder Cars embed URL.
 */
export function normalizeShowroomMapsEmbedUrl(rawUrl?: string): string {
  const trimmed = String(rawUrl || '').trim();
  if (
    !trimmed ||
    trimmed.includes('0x390cfb5c00000001') ||
    trimmed.includes('0x89abcdef12345678') ||
    (trimmed.includes('28.643387') && trimmed.includes('77.291771'))
  ) {
    return SHOWROOM_GOOGLE_MAPS_EMBED_URL;
  }
  return trimmed;
}

/**
 * Replaces generic Google Maps directions links with the verified Wonder Cars Place ID directions URL.
 */
export function normalizeShowroomDirectionsUrl(rawUrl?: string): string {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed || /^https?:\/\/maps\.google\.com\/\?q=/i.test(trimmed)) {
    return SHOWROOM_GOOGLE_MAPS_DIRECTIONS_URL;
  }
  return trimmed;
}

/**
 * Replaces generic Google Maps place links with the verified Wonder Cars Place URL.
 */
export function normalizeShowroomPlaceUrl(rawUrl?: string): string {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed || /^https?:\/\/maps\.google\.com\/\?q=/i.test(trimmed)) {
    return SHOWROOM_GOOGLE_MAPS_URL;
  }
  return trimmed;
}

export function buildDirectionsUrl(
  location: Partial<BusinessLocationSettings>
): string | null {
  return resolveMapsDirectionsUrl(location);
}

export function buildMapsEmbedUrl(
  location: Partial<BusinessLocationSettings>,
  zoom = 17
): string {
  return resolveMapsEmbedUrl(location, zoom);
}

export function buildOpenMapsUrl(location: BusinessLocationSettings): string | null {
  const customUrl = String(location.googleMapsUrl || '').trim();
  if (customUrl && /^https?:\/\//i.test(customUrl)) {
    return customUrl;
  }
  const coords = parseCoordinates(location);
  if (coords) {
    return `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
  }
  const fullAddr = formatFullAddress(location);
  if (fullAddr) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddr)}`;
  }
  return null;
}
