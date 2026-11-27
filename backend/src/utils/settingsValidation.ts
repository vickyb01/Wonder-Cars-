import type {
  AboutSettings,
  BusinessLocationSettings,
  HomepageSettings,
  WebsiteSettings,
} from '../models/types.ts';

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors: Record<string, string> };

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

/**
 * Strips known tracking query parameters and trailing hashes from social or external URLs.
 */
export function stripTrackingParams(rawUrl: string): string {
  const trimmed = rawUrl.trim();
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

function validateUrlField(
  rawValue: unknown,
  field: string,
  options: { allowEmpty?: boolean; allowRelative?: boolean; stripTracking?: boolean } = {}
): { value?: string; error?: string } {
  const { allowEmpty = true, allowRelative = false, stripTracking = false } = options;

  if (rawValue === undefined) return {};
  if (typeof rawValue !== 'string') {
    return { error: `${field} must be a string URL.` };
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    if (allowEmpty) return { value: '' };
    return { error: `${field} cannot be empty.` };
  }

  if (allowRelative && trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return { value: trimmed };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { error: `Please enter a valid http(s) URL for ${field}.` };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { error: `${field} must start with https:// or http://.` };
  }

  return {
    value: stripTracking ? stripTrackingParams(parsed.toString()) : trimmed,
  };
}

function validateEmailField(rawValue: unknown, field: string): { value?: string; error?: string } {
  if (rawValue === undefined) return {};
  if (typeof rawValue !== 'string') {
    return { error: `${field} must be an email string.` };
  }
  const trimmed = rawValue.trim();
  if (!trimmed) return { value: '' };
  if (!EMAIL_REGEX.test(trimmed)) {
    return { error: `Please enter a valid email address for ${field}.` };
  }
  return { value: trimmed };
}

/**
 * Validates GA4 Measurement IDs while rejecting known placeholder IDs like G-WONDERCARS2026.
 */
export function validateGa4MeasurementId(rawValue: unknown): { value?: string; error?: string } {
  if (rawValue === undefined) return {};
  if (typeof rawValue !== 'string') {
    return { error: 'Google Analytics ID must be a string.' };
  }
  const normalized = rawValue.trim().toUpperCase();
  if (!normalized) return { value: '' };

  if (PLACEHOLDER_GA4_IDS.has(normalized)) {
    return {
      error: `${normalized} is a placeholder ID, not a real GA4 Measurement ID. Enter a valid G-XXXXXXXXXX ID or leave blank.`,
    };
  }

  if (!GA4_ID_REGEX.test(normalized)) {
    return {
      error: 'Google Analytics ID must match GA4 format (for example G-XXXXXXXXXX).',
    };
  }

  return { value: normalized };
}

function validateLatLngPair(
  rawLat: unknown,
  rawLng: unknown,
  existingLat: string,
  existingLng: string
): { latitude?: string; longitude?: string; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const hasLat = rawLat !== undefined;
  const hasLng = rawLng !== undefined;

  const latStr = hasLat ? String(rawLat ?? '').trim() : existingLat.trim();
  const lngStr = hasLng ? String(rawLng ?? '').trim() : existingLng.trim();

  if (latStr) {
    const lat = Number(latStr);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      errors.latitude = 'Latitude must be a valid number between -90 and 90.';
    }
  }

  if (lngStr) {
    const lng = Number(lngStr);
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      errors.longitude = 'Longitude must be a valid number between -180 and 180.';
    }
  }

  if ((latStr !== '' && lngStr === '') || (latStr === '' && lngStr !== '')) {
    const msg = 'Please provide both Latitude and Longitude coordinates, or leave both empty.';
    if (!errors.latitude && latStr === '') errors.latitude = msg;
    if (!errors.longitude && lngStr === '') errors.longitude = msg;
  }

  return {
    latitude: hasLat ? latStr : undefined,
    longitude: hasLng ? lngStr : undefined,
    errors,
  };
}

export function validateAndSanitizeWebsiteSettings(
  existing: WebsiteSettings,
  payload: unknown
): ValidationResult<WebsiteSettings> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, error: 'Invalid settings payload.', fieldErrors: {} };
  }

  const input = payload as Record<string, unknown>;
  const patch: Partial<WebsiteSettings> = {};
  const fieldErrors: Record<string, string> = {};

  const simpleStringFields: Array<keyof WebsiteSettings> = [
    'websiteName',
    'tagline',
    'primaryPhone',
    'whatsappNumber',
    'showroomAddress',
    'openingHours',
    'googleMapsPlaceId',
    'seoTitle',
    'seoDescription',
    'seoKeywords',
    'footerAboutText',
    'copyrightText',
  ];

  for (const key of simpleStringFields) {
    if (input[key] !== undefined) {
      if (typeof input[key] !== 'string') {
        fieldErrors[key] = `${key} must be a text value.`;
      } else {
        (patch as Record<string, unknown>)[key] = input[key].trim();
      }
    }
  }

  if (typeof patch.websiteName === 'string' && !patch.websiteName) {
    fieldErrors.websiteName = 'Website Name cannot be empty.';
  }
  if (typeof patch.seoTitle === 'string' && !patch.seoTitle) {
    fieldErrors.seoTitle = 'SEO Title cannot be empty.';
  }

  if (input.whatsappFloatingEnabled !== undefined) {
    if (typeof input.whatsappFloatingEnabled !== 'boolean') {
      fieldErrors.whatsappFloatingEnabled = 'whatsappFloatingEnabled must be a boolean.';
    } else {
      patch.whatsappFloatingEnabled = input.whatsappFloatingEnabled;
    }
  }

  const emailCheck = validateEmailField(input.supportEmail, 'supportEmail');
  if (emailCheck.error) fieldErrors.supportEmail = emailCheck.error;
  else if (emailCheck.value !== undefined) patch.supportEmail = emailCheck.value;

  const assetUrlFields: Array<keyof WebsiteSettings> = ['logoLight', 'logoDark', 'faviconUrl'];
  for (const key of assetUrlFields) {
    const check = validateUrlField(input[key], key, { allowEmpty: true, allowRelative: true });
    if (check.error) fieldErrors[key] = check.error;
    else if (check.value !== undefined) (patch as Record<string, unknown>)[key] = check.value;
  }

  const mapUrlFields: Array<keyof WebsiteSettings> = [
    'googleMapsUrl',
    'googleMapsEmbedUrl',
    'googleMapsDirectionsUrl',
  ];
  for (const key of mapUrlFields) {
    const check = validateUrlField(input[key], key, { allowEmpty: true });
    if (check.error) fieldErrors[key] = check.error;
    else if (check.value !== undefined) (patch as Record<string, unknown>)[key] = check.value;
  }

  const socialFields: Array<keyof WebsiteSettings> = ['instagramUrl', 'facebookUrl', 'youtubeUrl'];
  for (const key of socialFields) {
    const check = validateUrlField(input[key], key, { allowEmpty: true, stripTracking: true });
    if (check.error) fieldErrors[key] = check.error;
    else if (check.value !== undefined) (patch as Record<string, unknown>)[key] = check.value;
  }

  const gaCheck = validateGa4MeasurementId(input.googleAnalyticsId);
  if (gaCheck.error) fieldErrors.googleAnalyticsId = gaCheck.error;
  else if (gaCheck.value !== undefined) patch.googleAnalyticsId = gaCheck.value;

  if (Object.keys(fieldErrors).length > 0) {
    const firstError = Object.values(fieldErrors)[0];
    return { ok: false, error: firstError, fieldErrors };
  }

  return {
    ok: true,
    data: {
      ...existing,
      ...patch,
    },
  };
}

export function validateAndSanitizeLocationSettings(
  existing: BusinessLocationSettings,
  payload: unknown
): ValidationResult<BusinessLocationSettings> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, error: 'Invalid location payload.', fieldErrors: {} };
  }

  const input = payload as Record<string, unknown>;
  const patch: Partial<BusinessLocationSettings> = {};
  const fieldErrors: Record<string, string> = {};

  const stringFields: Array<keyof BusinessLocationSettings> = [
    'businessName',
    'phone',
    'whatsapp',
    'address',
    'city',
    'state',
    'postalCode',
    'googleMapsPlaceId',
    'openingHours',
    'nearbyLandmarks',
  ];

  for (const key of stringFields) {
    if (input[key] !== undefined) {
      if (typeof input[key] !== 'string') {
        fieldErrors[key] = `${key} must be a text value.`;
      } else {
        (patch as Record<string, unknown>)[key] = input[key].trim();
      }
    }
  }

  if (typeof patch.businessName === 'string' && !patch.businessName) {
    fieldErrors.businessName = 'Showroom Business Name cannot be empty.';
  }

  const emailCheck = validateEmailField(input.email, 'email');
  if (emailCheck.error) fieldErrors.email = emailCheck.error;
  else if (emailCheck.value !== undefined) patch.email = emailCheck.value;

  const coordsCheck = validateLatLngPair(
    input.latitude,
    input.longitude,
    existing.latitude || '',
    existing.longitude || ''
  );
  Object.assign(fieldErrors, coordsCheck.errors);
  if (coordsCheck.latitude !== undefined) patch.latitude = coordsCheck.latitude;
  if (coordsCheck.longitude !== undefined) patch.longitude = coordsCheck.longitude;

  const mapUrlFields: Array<keyof BusinessLocationSettings> = [
    'googleMapsUrl',
    'googleMapsEmbedUrl',
    'googleMapsDirectionsUrl',
  ];
  for (const key of mapUrlFields) {
    const check = validateUrlField(input[key], key, { allowEmpty: true });
    if (check.error) fieldErrors[key] = check.error;
    else if (check.value !== undefined) (patch as Record<string, unknown>)[key] = check.value;
  }

  const socialFields: Array<keyof BusinessLocationSettings> = [
    'instagramUrl',
    'facebookUrl',
    'youtubeUrl',
  ];
  for (const key of socialFields) {
    const check = validateUrlField(input[key], key, { allowEmpty: true, stripTracking: true });
    if (check.error) fieldErrors[key] = check.error;
    else if (check.value !== undefined) (patch as Record<string, unknown>)[key] = check.value;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: Object.values(fieldErrors)[0], fieldErrors };
  }

  return {
    ok: true,
    data: {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function validateAndSanitizeAboutSettings(
  existing: AboutSettings,
  payload: unknown
): ValidationResult<AboutSettings> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, error: 'Invalid About Us settings payload.', fieldErrors: {} };
  }

  const input = payload as Record<string, unknown>;
  const patch: Partial<AboutSettings> = {};
  const fieldErrors: Record<string, string> = {};

  const allowedStringKeys: Array<keyof AboutSettings> = [
    'heroBadge',
    'headline',
    'subheadline',
    'heroCarTitle',
    'heroCarSubtitle',
    'heroCarRating',
    'ownerName',
    'ownerDesignation',
    'ownerTagline',
    'ownerExperience',
    'ownerPhilosophy',
    'ownerSignature',
    'whyChooseBadge',
    'whyChooseTitle',
    'whyChooseDescription',
    'certificatesBadge',
    'certificatesTitle',
    'certificatesDescription',
    'galleryBadge',
    'galleryTitle',
    'galleryDescription',
    'videosBadge',
    'videosTitle',
    'videosDescription',
    'instagramHandle',
    'instagramBio',
    'facebookPageName',
    'facebookBio',
    'youtubeChannelName',
    'youtubeBio',
    'showroomName',
    'showroomAddress',
    'showroomLandmark',
    'showroomCity',
    'showroomState',
    'showroomPincode',
    'showroomPhone',
    'showroomWhatsapp',
    'showroomOpeningHours',
  ];

  for (const key of allowedStringKeys) {
    if (input[key] !== undefined) {
      if (typeof input[key] !== 'string') {
        fieldErrors[key] = `${key} must be a text value.`;
      } else {
        (patch as Record<string, unknown>)[key] = input[key].trim();
      }
    }
  }

  const emailCheck = validateEmailField(input.showroomEmail, 'showroomEmail');
  if (emailCheck.error) fieldErrors.showroomEmail = emailCheck.error;
  else if (emailCheck.value !== undefined) patch.showroomEmail = emailCheck.value;

  const assetFields: Array<keyof AboutSettings> = ['heroBgImage', 'heroCarImage', 'ownerImage'];
  for (const key of assetFields) {
    const check = validateUrlField(input[key], key, { allowEmpty: true, allowRelative: true });
    if (check.error) fieldErrors[key] = check.error;
    else if (check.value !== undefined) (patch as Record<string, unknown>)[key] = check.value;
  }

  const mapFields: Array<keyof AboutSettings> = ['googleMapsDirectionsUrl', 'googleMapsEmbedUrl'];
  for (const key of mapFields) {
    const check = validateUrlField(input[key], key, { allowEmpty: true });
    if (check.error) fieldErrors[key] = check.error;
    else if (check.value !== undefined) (patch as Record<string, unknown>)[key] = check.value;
  }

  const socialFields: Array<keyof AboutSettings> = ['instagramUrl', 'facebookUrl', 'youtubeUrl'];
  for (const key of socialFields) {
    const check = validateUrlField(input[key], key, { allowEmpty: true, stripTracking: true });
    if (check.error) fieldErrors[key] = check.error;
    else if (check.value !== undefined) (patch as Record<string, unknown>)[key] = check.value;
  }

  const arrayFields: Array<keyof AboutSettings> = [
    'heroStats',
    'ownerBio',
    'whyChooseItems',
    'certificatesItems',
    'galleryItems',
    'videoItems',
  ];
  for (const key of arrayFields) {
    if (input[key] !== undefined) {
      if (!Array.isArray(input[key])) {
        fieldErrors[key] = `${key} must be a list.`;
      } else {
        (patch as Record<string, unknown>)[key] = input[key];
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: Object.values(fieldErrors)[0], fieldErrors };
  }

  return {
    ok: true,
    data: {
      ...existing,
      ...patch,
    },
  };
}

export function validateAndSanitizeHomepageSettings(
  existing: HomepageSettings,
  payload: unknown
): ValidationResult<HomepageSettings> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, error: 'Invalid Homepage settings payload.', fieldErrors: {} };
  }

  const input = payload as Record<string, unknown>;
  const patch: Partial<HomepageSettings> = {};
  const fieldErrors: Record<string, string> = {};

  const stringFields: Array<keyof HomepageSettings> = [
    'heroHeading',
    'heroSubheadline',
    'heroTagline',
    'heroBadge',
    'promotionalBannerText',
    'ctaExploreText',
    'ctaCompareText',
    'whyChooseHeading',
    'whyChooseSubheading',
    'searchLabel',
    'searchPlaceholder',
    'brandLabel',
    'brandDefaultText',
    'budgetLabel',
    'budgetDefaultText',
    'fuelLabel',
    'fuelDefaultText',
    'searchButtonText',
  ];

  for (const key of stringFields) {
    if (input[key] !== undefined) {
      if (typeof input[key] !== 'string') {
        fieldErrors[key] = `${key} must be a text value.`;
      } else {
        (patch as Record<string, unknown>)[key] = input[key].trim();
      }
    }
  }

  if (typeof patch.heroHeading === 'string' && !patch.heroHeading) {
    fieldErrors.heroHeading = 'Hero Heading cannot be empty.';
  }

  if (input.promotionalBannerActive !== undefined) {
    if (typeof input.promotionalBannerActive !== 'boolean') {
      fieldErrors.promotionalBannerActive = 'promotionalBannerActive must be a boolean.';
    } else {
      patch.promotionalBannerActive = input.promotionalBannerActive;
    }
  }

  const ctaCheck = validateUrlField(input.ctaExploreLink, 'ctaExploreLink', {
    allowEmpty: true,
    allowRelative: true,
  });
  if (ctaCheck.error) fieldErrors.ctaExploreLink = ctaCheck.error;
  else if (ctaCheck.value !== undefined) patch.ctaExploreLink = ctaCheck.value;

  const arrayFields: Array<keyof HomepageSettings> = [
    'heroSlides',
    'featuredCarIds',
    'brandOptions',
    'budgetOptions',
    'fuelOptions',
  ];
  for (const key of arrayFields) {
    if (input[key] !== undefined) {
      if (!Array.isArray(input[key])) {
        fieldErrors[key] = `${key} must be a list.`;
      } else {
        (patch as Record<string, unknown>)[key] = input[key];
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: Object.values(fieldErrors)[0], fieldErrors };
  }

  return {
    ok: true,
    data: {
      ...existing,
      ...patch,
    },
  };
}

function buildLocationEmbedUrl(loc: BusinessLocationSettings): string {
  if (loc.googleMapsEmbedUrl?.trim()) {
    return loc.googleMapsEmbedUrl.trim();
  }
  const lat = Number(String(loc.latitude || '').trim());
  const lng = Number(String(loc.longitude || '').trim());
  if (Number.isFinite(lat) && Number.isFinite(lng) && String(loc.latitude || '').trim() && String(loc.longitude || '').trim()) {
    const label = encodeURIComponent(loc.businessName?.trim() || 'Wonder cars');
    return `https://maps.google.com/maps?q=loc:${lat},${lng}+(${label})&t=m&z=17&ie=UTF8&iwloc=&output=embed`;
  }
  return '';
}

function buildLocationDirectionsUrl(loc: BusinessLocationSettings): string {
  if (loc.googleMapsDirectionsUrl?.trim()) {
    return loc.googleMapsDirectionsUrl.trim();
  }
  const lat = Number(String(loc.latitude || '').trim());
  const lng = Number(String(loc.longitude || '').trim());
  if (Number.isFinite(lat) && Number.isFinite(lng) && String(loc.latitude || '').trim() && String(loc.longitude || '').trim()) {
    const label = encodeURIComponent(loc.businessName?.trim() || 'Wonder cars').replace(/%20/g, '+');
    const placeId = loc.googleMapsPlaceId?.trim() || '0x390cfbb6c71185b3:0x518ca5e40932dc6d';
    return `https://www.google.com/maps/dir//${label}/@${lat},${lng},17z/data=!4m6!3m5!1s${placeId}!8m2!3d${lat}!4d${lng}`;
  }
  return loc.googleMapsUrl?.trim() || '';
}

/**
 * Mirrors authoritative showroom Maps & address fields from LocationSettings onto AboutSettings
 * without overwriting unrelated About Us content (owner bio, gallery, videos, etc.).
 */
export function syncLocationMapsToAbout(
  about: AboutSettings,
  loc: BusinessLocationSettings
): AboutSettings {
  const embedUrl = buildLocationEmbedUrl(loc);
  const directionsUrl = buildLocationDirectionsUrl(loc);

  return {
    ...about,
    ...(loc.businessName?.trim() ? { showroomName: loc.businessName.trim() } : {}),
    ...(loc.address?.trim() ? { showroomAddress: loc.address.trim() } : {}),
    ...(loc.city?.trim() ? { showroomCity: loc.city.trim() } : {}),
    ...(loc.state?.trim() ? { showroomState: loc.state.trim() } : {}),
    ...(loc.postalCode?.trim() ? { showroomPincode: loc.postalCode.trim() } : {}),
    ...(loc.nearbyLandmarks?.trim() ? { showroomLandmark: loc.nearbyLandmarks.trim() } : {}),
    ...(embedUrl ? { googleMapsEmbedUrl: embedUrl } : {}),
    ...(directionsUrl ? { googleMapsDirectionsUrl: directionsUrl } : {}),
  };
}

const ABOUT_MAPS_SYNC_KEYS = [
  'showroomName',
  'showroomAddress',
  'showroomCity',
  'showroomState',
  'showroomPincode',
  'showroomLandmark',
  'googleMapsEmbedUrl',
  'googleMapsDirectionsUrl',
] as const;

/**
 * Mirrors explicitly submitted showroom Maps/address fields from AboutSettings updates back to LocationSettings
 * while preserving unrelated LocationSettings fields such as phone, email, coordinates, and social URLs.
 */
export function syncAboutMapsToLocation(
  loc: BusinessLocationSettings,
  rawPayload: unknown,
  updatedAbout: AboutSettings
): BusinessLocationSettings {
  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
    return loc;
  }
  const input = rawPayload as Record<string, unknown>;
  const hasAnyMapsField = ABOUT_MAPS_SYNC_KEYS.some((key) => input[key] !== undefined);
  if (!hasAnyMapsField) {
    return loc;
  }

  return {
    ...loc,
    ...(input.showroomName !== undefined && updatedAbout.showroomName !== undefined
      ? { businessName: updatedAbout.showroomName }
      : {}),
    ...(input.showroomAddress !== undefined && updatedAbout.showroomAddress !== undefined
      ? { address: updatedAbout.showroomAddress }
      : {}),
    ...(input.showroomCity !== undefined && updatedAbout.showroomCity !== undefined
      ? { city: updatedAbout.showroomCity }
      : {}),
    ...(input.showroomState !== undefined && updatedAbout.showroomState !== undefined
      ? { state: updatedAbout.showroomState }
      : {}),
    ...(input.showroomPincode !== undefined && updatedAbout.showroomPincode !== undefined
      ? { postalCode: updatedAbout.showroomPincode }
      : {}),
    ...(input.showroomLandmark !== undefined && updatedAbout.showroomLandmark !== undefined
      ? { nearbyLandmarks: updatedAbout.showroomLandmark }
      : {}),
    ...(input.googleMapsEmbedUrl !== undefined
      ? { googleMapsEmbedUrl: updatedAbout.googleMapsEmbedUrl || '' }
      : {}),
    ...(input.googleMapsDirectionsUrl !== undefined
      ? { googleMapsDirectionsUrl: updatedAbout.googleMapsDirectionsUrl || '' }
      : {}),
    updatedAt: new Date().toISOString(),
  };
}
