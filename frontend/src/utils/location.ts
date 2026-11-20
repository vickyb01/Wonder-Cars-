import type { BusinessLocationSettings } from '../types/car';

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
  const cityStatePin = [location.city, location.state, location.postalCode]
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .join(', ');

  return [String(location.address || '').trim(), cityStatePin].filter(Boolean).join(', ');
}

export function buildDirectionsUrl(location: BusinessLocationSettings): string | null {
  const coords = parseCoordinates(location);
  if (coords) {
    return `https://www.google.com/maps/dir//Wonder+cars/@${coords.lat},${coords.lng},17z/data=!4m6!3m5!1s0x390cfbb6c71185b3:0x518ca5e40932dc6d!8m2!3d${coords.lat}!4d${coords.lng}`;
  }
  const fullAddr = formatFullAddress(location);
  if (fullAddr) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddr)}`;
  }
  return null;
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
