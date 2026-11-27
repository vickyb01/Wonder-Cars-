import type {
  AboutSettings,
  ActivityLogItem,
  AdminOverview,
  AdminUser,
  BrandItem,
  BusinessLocationSettings,
  Car,
  CarFilters,
  CarStatus,
  CategoryItem,
  Enquiry,
  EnquiryStatus,
  EnquiryType,
  HomepageSettings,
  LocationApiResponse,
  NotificationItem,
  SellRequest,
  SellRequestStatus,
  TestimonialItem,
  WebsiteSettings,
} from '../types/car';
import { normalizeCarRecord } from './carDefaults';

const ADMIN_TOKEN_KEY = 'strada_admin_token';
const WISHLIST_KEY = 'strada_wishlist_ids';
export const CUSTOM_CARS_KEY = 'wonder_cars_custom_inventory';
export const FULL_CATALOG_CACHE_KEY = 'wonder_cars_full_catalog_cache';
const SYNC_CHANNEL_NAME = 'wonder_cars_inventory_sync';

let syncChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  }
} catch {}

export function broadcastInventoryUpdate(data: { type: string; car?: Car; carId?: string }): void {
  try {
    syncChannel?.postMessage(data);
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wonder_cars_inventory_sync', { detail: data }));
  }
}

export function subscribeToInventoryUpdates(callback: (data: { type: string; car?: Car; carId?: string }) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handleMessage = (e: MessageEvent) => {
    callback(e.data);
  };
  const handleCustomEvent = (e: Event) => {
    callback((e as CustomEvent).detail);
  };
  const handleStorage = (e: StorageEvent) => {
    if (e.key === CUSTOM_CARS_KEY || e.key === FULL_CATALOG_CACHE_KEY) {
      callback({ type: 'storage_change' });
    }
  };

  syncChannel?.addEventListener('message', handleMessage);
  window.addEventListener('wonder_cars_inventory_sync', handleCustomEvent);
  window.addEventListener('storage', handleStorage);

  return () => {
    syncChannel?.removeEventListener('message', handleMessage);
    window.removeEventListener('wonder_cars_inventory_sync', handleCustomEvent);
    window.removeEventListener('storage', handleStorage);
  };
}

export function getLocalCustomCars(): Car[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CARS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeCarImages) : [];
  } catch {
    return [];
  }
}

export function saveLocalCustomCar(car: Car): void {
  try {
    const current = getLocalCustomCars();
    const index = current.findIndex((c) => c.id === car.id || (car.slug && c.slug === car.slug));
    let next: Car[];
    if (index >= 0) {
      next = [...current];
      next[index] = car;
    } else {
      next = [car, ...current];
    }
    localStorage.setItem(CUSTOM_CARS_KEY, JSON.stringify(next));
    updateGlobalCatalogCache([car]);
    broadcastInventoryUpdate({ type: 'upsert', car });
  } catch (e) {
    console.error('Failed to save car to local storage:', e);
  }
}

export function removeLocalCustomCar(carId: string): void {
  try {
    const target = String(carId || '').trim();
    const targetLower = target.toLowerCase();
    const matchesTarget = (c: Car) =>
      c.id === target ||
      c.slug === target ||
      (Boolean(c.listingCode) && c.listingCode.toLowerCase() === targetLower);

    const current = getLocalCustomCars();
    const next = current.filter((c) => !matchesTarget(c));
    localStorage.setItem(CUSTOM_CARS_KEY, JSON.stringify(next));

    const cached = getGlobalCatalogCache().filter((c) => !matchesTarget(c));
    localStorage.setItem(FULL_CATALOG_CACHE_KEY, JSON.stringify(cached));

    broadcastInventoryUpdate({ type: 'delete', carId });
  } catch (e) {
    console.error('Failed to remove car from local storage:', e);
  }
}

export function getGlobalCatalogCache(): Car[] {
  try {
    const raw = localStorage.getItem(FULL_CATALOG_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeCarImages) : [];
  } catch {
    return [];
  }
}

export function updateGlobalCatalogCache(incoming: Car[]): void {
  try {
    const current = getGlobalCatalogCache();
    const map = new Map<string, Car>();
    incoming.forEach((c) => {
      if (c && c.id) map.set(c.id, c);
    });
    current.forEach((c) => {
      if (c && c.id && !map.has(c.id)) map.set(c.id, c);
    });
    localStorage.setItem(FULL_CATALOG_CACHE_KEY, JSON.stringify(Array.from(map.values())));
  } catch {}
}

let isSyncing = false;
export async function rehydrateBackendCars(): Promise<{ ok: boolean; count?: number }> {
  if (isSyncing) return { ok: true, count: 0 };
  const customCars = getLocalCustomCars();
  if (!customCars.length) return { ok: true, count: 0 };

  isSyncing = true;
  try {
    const res = await apiFetch('/api/cars/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({ cars: customCars }),
    });
    const data = await handleJsonResponse<{ ok: boolean; addedCount?: number; updatedCount?: number }>(res);
    return { ok: true, count: (data.addedCount || 0) + (data.updatedCount || 0) };
  } catch {
    return { ok: false };
  } finally {
    isSyncing = false;
  }
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function getWishlistIds(): string[] {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toggleWishlistId(carId: string): { ids: string[]; saved: boolean } {
  const current = getWishlistIds();
  const exists = current.includes(carId);
  const next = exists ? current.filter((id) => id !== carId) : [...current, carId];
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
  return { ids: next, saved: !exists };
}

export const LIVE_BACKEND_URL = 'https://wonder-cars-1.onrender.com';
export const BACKEND_READY_EVENT = 'wonder-backend-ready';

let backendAwakeState = false;
let wakePromise: Promise<boolean> | null = null;

export function isBackendAwake(): boolean {
  return backendAwakeState;
}

function markBackendAwake(): void {
  const wasAwake = backendAwakeState;
  backendAwakeState = true;
  if (!wasAwake && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BACKEND_READY_EVENT));
  }
}

export function wakeBackend(): Promise<boolean> {
  if (backendAwakeState) return Promise.resolve(true);
  if (wakePromise) return wakePromise;

  wakePromise = (async () => {
    const bases = Array.from(
      new Set([API_BASE || '', LIVE_BACKEND_URL].map((b) => b.replace(/\/$/, '')))
    );
    const delays = [0, 2500, 4000, 6000, 8000, 10000, 12000, 15000, 15000, 15000];
    for (const delay of delays) {
      if (delay > 0) {
        await new Promise((r) => setTimeout(r, delay));
      }
      if (backendAwakeState) return true;
      for (const base of bases) {
        try {
          const url = base ? `${base}/healthz` : '/healthz';
          const res = await fetch(url, { cache: 'no-store' });
          if (res.ok) {
            markBackendAwake();
            return true;
          }
        } catch {
          // Render still cold-starting or offline; keep polling
        }
      }
    }
    return false;
  })().finally(() => {
    wakePromise = null;
  });

  return wakePromise;
}

let preferDirectRenderUploads = false;

export function markUploadProxyFailed(): void {
  preferDirectRenderUploads = true;
}

export function getUploadUrlCandidates(url?: string): string[] {
  const normalized = normalizeMediaUrl(url);
  if (!normalized) return [];
  if (normalized.includes('/uploads/')) {
    const match = normalized.match(/\/uploads\/[^?#]+/);
    if (match) {
      const relativePath = match[0];
      const directRenderUrl = `${LIVE_BACKEND_URL.replace(/\/$/, '')}${relativePath}`;
      if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
        return Array.from(new Set([normalized, directRenderUrl, relativePath]));
      }
      if (preferDirectRenderUploads) {
        return Array.from(new Set([directRenderUrl, relativePath]));
      }
      return Array.from(new Set([relativePath, directRenderUrl]));
    }
  }
  return [normalized];
}

export const API_BASE = (
  (import.meta.env.VITE_API_URL as string) ||
  (import.meta.env.VITE_API_BASE_URL as string) ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? LIVE_BACKEND_URL
    : '')
).replace(/\/$/, '');

export function normalizeMediaUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    // Keep /uploads/... relative so Vercel CDN (public/uploads) + Vercel proxy rewrite (/uploads/:path* -> Render) work fast
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }
  return trimmed;
}

export function normalizeCarImages(car: Car): Car {
  if (!car) return car;
  return {
    ...car,
    images: (car.images || []).map((img) => normalizeMediaUrl(img)),
    gallery: (car.gallery || []).map((g) => ({ ...g, url: normalizeMediaUrl(g.url) })),
  };
}

async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const isApiRequest = typeof input === 'string' && input.startsWith('/api');
  const isGetMethod = !init?.method || init.method.toUpperCase() === 'GET';
  const targetUrl = isApiRequest ? `${API_BASE}${input}` : input;

  const performFetch = async (url: RequestInfo | URL): Promise<Response> => {
    try {
      const res = await fetch(url, init);
      if (res.ok) {
        markBackendAwake();
      }
      // If local dev server proxy returned 502 Bad Gateway (local backend offline), seamlessly fallback to Live Render backend
      if (!res.ok && res.status === 502 && !API_BASE && isApiRequest) {
        markUploadProxyFailed();
        const directRes = await fetch(`${LIVE_BACKEND_URL}${input}`, init);
        if (directRes.ok) markBackendAwake();
        return directRes;
      }
      return res;
    } catch (err) {
      if (!API_BASE && isApiRequest) {
        markUploadProxyFailed();
        const directRes = await fetch(`${LIVE_BACKEND_URL}${input}`, init);
        if (directRes.ok) markBackendAwake();
        return directRes;
      }
      throw err;
    }
  };

  try {
    let res = await performFetch(targetUrl);
    // Cold start retries: if Render returns 502/503/504 while waking up, trigger warmup & retry cleanly
    if (!res.ok && [502, 503, 504].includes(res.status) && isApiRequest) {
      void wakeBackend();
      const retryDelays = isGetMethod ? [2000, 3500, 5000] : [2500];
      for (const delay of retryDelays) {
        await new Promise((r) => setTimeout(r, delay));
        res = await performFetch(targetUrl);
        if (res.ok || ![502, 503, 504].includes(res.status)) break;
      }
    }
    return res;
  } catch (err) {
    if (isApiRequest && typeof input === 'string') {
      void wakeBackend();
      const fallbackUrl = `${LIVE_BACKEND_URL}${input}`;
      if (targetUrl !== fallbackUrl) {
        try {
          return await performFetch(fallbackUrl);
        } catch {}
      }
    }
    throw err;
  }
}

export class ApiRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

async function handleJsonResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof data?.error === 'string' ? data.error : `Request failed (${res.status})`;
    throw new ApiRequestError(msg, res.status);
  }
  return data as T;
}

function authHeaders(): HeadersInit {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function applyLocalFilters(cars: Car[], filters: CarFilters = {}): Car[] {
  let results = [...cars];
  if (filters.includeDrafts !== 'true') {
    results = results.filter((c) => c.status !== 'Draft');
  }
  const search = String(filters.search || '').trim().toLowerCase();
  if (search) {
    results = results.filter((car) =>
      [car.brand, car.model, car.variant, car.location, car.fuelType, car.color, car.listingCode, String(car.year)]
        .join(' ')
        .toLowerCase()
        .includes(search)
    );
  }
  if (filters.brand && filters.brand !== 'All') {
    results = results.filter((c) => c.brand.toLowerCase() === filters.brand?.toLowerCase());
  }
  if (filters.model && filters.model !== 'All') {
    results = results.filter((c) => c.model.toLowerCase().includes(filters.model!.toLowerCase()));
  }
  if (filters.minPrice) {
    results = results.filter((c) => c.priceInr >= Number(filters.minPrice));
  }
  if (filters.maxPrice) {
    results = results.filter((c) => c.priceInr <= Number(filters.maxPrice));
  }
  if (filters.year && filters.year !== 'All') {
    results = results.filter((c) => c.year === Number(filters.year));
  }
  if (filters.fuelType && filters.fuelType !== 'All') {
    results = results.filter((c) => c.fuelType.toLowerCase() === filters.fuelType?.toLowerCase());
  }
  if (filters.transmission && filters.transmission !== 'All') {
    results = results.filter((c) => c.transmission.toLowerCase() === filters.transmission?.toLowerCase());
  }
  if (filters.maxKm) {
    results = results.filter((c) => c.kilometres <= Number(filters.maxKm));
  }
  if (filters.status && filters.status !== 'All') {
    results = results.filter((c) => c.status.toLowerCase() === filters.status?.toLowerCase());
  }
  if (filters.featured === 'true') {
    results = results.filter((c) => c.featured);
  }
  if (filters.sort === 'price_asc') {
    results.sort((a, b) => a.priceInr - b.priceInr);
  } else if (filters.sort === 'price_desc') {
    results.sort((a, b) => b.priceInr - a.priceInr);
  } else if (filters.sort === 'km_asc') {
    results.sort((a, b) => a.kilometres - b.kilometres);
  } else if (filters.sort === 'year_desc') {
    results.sort((a, b) => b.year - a.year);
  } else {
    results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }
  return results;
}

export async function fetchCars(filters: CarFilters = {}): Promise<Car[]> {
  const cached = getGlobalCatalogCache();

  let fetchedCars: Car[] | null = null;
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== 'All') {
        params.set(key, String(value));
      }
    });
    const query = params.toString();
    const res = await apiFetch(`/api/cars${query ? `?${query}` : ''}`, {
      headers: filters.includeDrafts === 'true' ? authHeaders() : undefined,
    });
    const data = await handleJsonResponse<Car[]>(res);
    if (Array.isArray(data)) {
      fetchedCars = data.map(normalizeCarImages);
    }
  } catch (err) {
    console.warn('Backend fetchCars failed (Render cold start or offline), loading cached fleet:', err);
  }

  if (fetchedCars !== null) {
    // Deduplicate by ID preserving server order and keep offline cache synchronized with authoritative server state
    const dedupedMap = new Map<string, Car>();
    fetchedCars.forEach((c) => {
      if (c && c.id && !dedupedMap.has(c.id)) {
        dedupedMap.set(c.id, c);
      }
    });
    const authoritative = Array.from(dedupedMap.values());

    // Replace cache cleanly on unfiltered reads so deleted cars never reappear from stale browser cache
    const hasFilterQuery = Boolean(
      filters.search ||
      (filters.brand && filters.brand !== 'All') ||
      (filters.model && filters.model !== 'All') ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.minEmi ||
      filters.maxEmi ||
      (filters.year && filters.year !== 'All') ||
      (filters.fuelType && filters.fuelType !== 'All') ||
      (filters.transmission && filters.transmission !== 'All') ||
      filters.maxKm ||
      (filters.status && filters.status !== 'All') ||
      filters.featured === 'true'
    );
    if (!hasFilterQuery) {
      try {
        localStorage.setItem(FULL_CATALOG_CACHE_KEY, JSON.stringify(authoritative));
        // Prune any deleted/broken cars from legacy local custom cache so deleted vehicles never return
        const serverIds = new Set(authoritative.map((c) => c.id));
        const customCars = getLocalCustomCars().filter((c) => serverIds.has(c.id));
        localStorage.setItem(CUSTOM_CARS_KEY, JSON.stringify(customCars));
      } catch {}
    } else {
      updateGlobalCatalogCache(authoritative);
    }
    return authoritative;
  }

  return applyLocalFilters(cached, filters);
}

function purgeCarFromLocalCaches(identifier: string): void {
  try {
    const target = String(identifier || '').trim();
    if (!target) return;
    const targetLower = target.toLowerCase();
    const matchesTarget = (c: Car) =>
      c.id === target ||
      c.slug === target ||
      (Boolean(c.listingCode) && c.listingCode.toLowerCase() === targetLower);

    const customCars = getLocalCustomCars().filter((c) => !matchesTarget(c));
    localStorage.setItem(CUSTOM_CARS_KEY, JSON.stringify(customCars));

    const cached = getGlobalCatalogCache().filter((c) => !matchesTarget(c));
    localStorage.setItem(FULL_CATALOG_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore localStorage unavailability
  }
}

export async function fetchCarDetail(id: string): Promise<{
  car: Car;
  similar: Car[];
  sellerOtherCars: Car[];
}> {
  const cleanId = String(id || '').trim();
  const hasAdminToken = Boolean(getAdminToken());
  const customCars = getLocalCustomCars();
  const cached = getGlobalCatalogCache();
  const allKnown = [...customCars, ...cached];

  const localMatch = allKnown.find(
    (c) =>
      c.id === cleanId ||
      c.slug === cleanId ||
      (c.listingCode && c.listingCode.toLowerCase() === cleanId.toLowerCase())
  );

  try {
    const res = await apiFetch(`/api/cars/${encodeURIComponent(cleanId)}`, {
      headers: authHeaders(),
    });
    const data = await handleJsonResponse<{
      car: Car;
      similar: Car[];
      sellerOtherCars: Car[];
    }>(res);

    if (!data?.car || (!hasAdminToken && data.car.status === 'Draft')) {
      purgeCarFromLocalCaches(cleanId);
      throw new ApiRequestError('Vehicle not found', 404);
    }

    const normalizedCar = normalizeCarImages(data.car);
    const result = {
      car: normalizedCar,
      similar: (data.similar || []).map(normalizeCarImages),
      sellerOtherCars: (data.sellerOtherCars || []).map(normalizeCarImages),
    };

    if (normalizedCar.status !== 'Draft') {
      updateGlobalCatalogCache([normalizedCar]);
    }
    return result;
  } catch (err) {
    const errStatus = err instanceof ApiRequestError ? err.status : undefined;
    // Never restore deleted, 404, or client-rejected cars from localStorage fallback
    if (errStatus !== undefined && errStatus >= 400 && errStatus < 500) {
      purgeCarFromLocalCaches(cleanId);
      if (localMatch?.id && localMatch.id !== cleanId) {
        purgeCarFromLocalCaches(localMatch.id);
      }
      throw err;
    }

    // Transient network or 5xx backend outage only: allow non-Draft cached fallback without rehydrating backend
    if (localMatch && (localMatch.status !== 'Draft' || hasAdminToken)) {
      console.warn(`Serving car ${cleanId} from cached catalog during backend outage:`, err);
      const publicOthers = allKnown.filter((c) => c.id !== localMatch.id && c.status !== 'Draft');
      const similar = publicOthers
        .filter((c) => c.bodyType === localMatch.bodyType || c.brand === localMatch.brand)
        .slice(0, 4);
      const sellerOtherCars = publicOthers
        .filter((c) => c.brand === localMatch.brand)
        .slice(0, 4);

      return {
        car: localMatch,
        similar: similar.length ? similar : publicOthers.slice(0, 4),
        sellerOtherCars: sellerOtherCars.length ? sellerOtherCars : publicOthers.slice(0, 4),
      };
    }
    throw err;
  }
}

export async function submitEnquiry(payload: {
  type: EnquiryType;
  carId?: string;
  carTitle?: string;
  name: string;
  email: string;
  phone: string;
  preferredDate?: string;
  preferredTime?: string;
  city?: string;
  offerPriceInr?: number;
  message: string;
  source?: string;
}): Promise<Enquiry> {
  const res = await apiFetch('/api/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleJsonResponse<Enquiry>(res);
}

export function buildBookingPdfUrl(
  carId: string,
  params?: {
    bookingId?: string;
    name?: string;
    phone?: string;
    email?: string;
    date?: string;
    time?: string;
    type?: string;
    city?: string;
    download?: boolean;
  }
): string {
  const query = new URLSearchParams({ format: 'pdf' });
  if (params?.download !== false) query.set('download', '1');
  if (params?.bookingId) query.set('bookingId', params.bookingId);
  if (params?.name) query.set('name', params.name);
  if (params?.phone) query.set('phone', params.phone);
  if (params?.email) query.set('email', params.email);
  if (params?.date) query.set('date', params.date);
  if (params?.time) query.set('time', params.time);
  if (params?.type) query.set('type', params.type);
  if (params?.city) query.set('city', params.city);
  const path = `/api/cars/${encodeURIComponent(carId)}/brochure?${query.toString()}`;
  return API_BASE ? `${API_BASE}${path}` : path;
}

/**
 * Downloads the generated real PDF brochure immediately on desktop and mobile devices.
 */
export async function downloadBookingPdf(
  car: Pick<Car, 'id' | 'brand' | 'model'>,
  params?: {
    bookingId?: string;
    name?: string;
    phone?: string;
    email?: string;
    date?: string;
    time?: string;
    type?: string;
    city?: string;
  }
): Promise<void> {
  const cleanBrand = (car.brand || 'Car').replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanModel = (car.model || 'Brochure').replace(/[^a-zA-Z0-9_-]/g, '');
  const filename = `WonderCars-${cleanBrand}-${cleanModel}-Brochure.pdf`;
  const pdfUrl = buildBookingPdfUrl(car.id, { ...params, download: true });

  try {
    const res = await fetch(pdfUrl, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
    const objectUrl = URL.createObjectURL(pdfBlob);

    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.rel = 'noopener noreferrer';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 60_000);
  } catch {
    // Fallback for strict mobile webviews or direct attachment navigation
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  }
}

export async function submitSellRequest(payload: {
  brand: string;
  model: string;
  year: number;
  kilometres: number;
  fuelType: string;
  transmission: string;
  ownership: string;
  city: string;
  expectedPriceInr: number;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  notes: string;
}): Promise<SellRequest> {
  const res = await apiFetch('/api/sell-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleJsonResponse<SellRequest>(res);
}

export async function adminLogin(
  email: string,
  password: string
): Promise<{ token: string; email: string; user?: { id?: string; name?: string; email: string; role?: string; avatar?: string } }> {
  const res = await apiFetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleJsonResponse<{ token: string; email: string; user?: { id?: string; name?: string; email: string; role?: string; avatar?: string } }>(res);
}

export async function adminForgotPassword(email: string): Promise<{ ok: boolean; message: string; resetCode?: string }> {
  const res = await apiFetch('/api/admin/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handleJsonResponse<{ ok: boolean; message: string; resetCode?: string }>(res);
}

export async function adminResetPassword(email: string, newPassword: string): Promise<{ ok: boolean; message: string }> {
  const res = await apiFetch('/api/admin/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword }),
  });
  return handleJsonResponse<{ ok: boolean; message: string }>(res);
}

export async function verifyAdminSession(): Promise<{ id?: string; name?: string; email: string; role?: string; avatar?: string }> {
  const res = await apiFetch('/api/admin/me', {
    headers: authHeaders(),
  });
  return handleJsonResponse<{ id?: string; name?: string; email: string; role?: string; avatar?: string }>(res);
}

export const fetchAdminProfile = verifyAdminSession;

export async function updateAdminProfile(data: { name?: string; currentPassword?: string; newPassword?: string; avatar?: string }): Promise<any> {
  const res = await apiFetch('/api/admin/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });
  return handleJsonResponse(res);
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const res = await apiFetch('/api/admin/overview', {
    headers: authHeaders(),
  });
  return handleJsonResponse<AdminOverview>(res);
}

export async function createCar(payload: Partial<Car> & { clientRequestId?: string }): Promise<Car> {
  const res = await apiFetch('/api/admin/cars', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  const data = await handleJsonResponse<Car>(res);
  const serverCar = normalizeCarImages(data);
  updateGlobalCatalogCache([serverCar]);
  broadcastInventoryUpdate({ type: 'upsert', car: serverCar });
  return serverCar;
}

export async function updateCar(id: string, payload: Partial<Car>): Promise<Car> {
  const res = await apiFetch(`/api/admin/cars/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  const data = await handleJsonResponse<Car>(res);
  const normalized = normalizeCarImages(data);
  updateGlobalCatalogCache([normalized]);
  broadcastInventoryUpdate({ type: 'upsert', car: normalized });
  return normalized;
}

export async function deleteCar(id: string): Promise<void> {
  const res = await apiFetch(`/api/admin/cars/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleJsonResponse<{ ok: boolean }>(res);
  removeLocalCustomCar(id);
}

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/jfif',
  'image/png',
  'image/webp',
  'image/avif',
]);
const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024;

export async function uploadCarImages(files: File[]): Promise<string[]> {
  if (!files || files.length === 0) {
    throw new Error('Please select at least one image file to upload.');
  }
  if (files.length > 70) {
    throw new Error('Maximum 70 images can be uploaded at once.');
  }

  for (const file of files) {
    const extValid = /\.(jpe?g|jfif|png|webp|avif)$/i.test(file.name);
    const mimeValid = file.type ? ALLOWED_IMAGE_MIME_TYPES.has(file.type.toLowerCase()) : extValid;
    if (!mimeValid && !extValid) {
      throw new Error(`Unsupported file "${file.name}". Please upload JPG, PNG, WebP, or AVIF images.`);
    }
    if (file.size <= 0) {
      throw new Error(`Image "${file.name}" appears to be empty.`);
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error(`Image "${file.name}" exceeds the 15 MB size limit.`);
    }
  }

  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  const res = await apiFetch('/api/admin/upload', {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  const data = await handleJsonResponse<{ urls: string[]; storage?: string; warning?: string }>(res);
  const urls = (data.urls || []).filter((u) => typeof u === 'string' && u.trim().length > 0);
  if (urls.length === 0) {
    throw new Error('Image upload returned no valid URLs. Please try again.');
  }
  return urls.map((u) => normalizeMediaUrl(u));
}

export async function fetchCloudinaryStatus(): Promise<{
  configured: boolean;
  connected: boolean;
  cloudName: string;
  error?: string;
}> {
  const res = await apiFetch('/api/admin/cloudinary/status', {
    headers: authHeaders(),
  });
  return handleJsonResponse(res);
}

export async function fetchAdminEnquiries(): Promise<Enquiry[]> {
  const res = await apiFetch('/api/admin/enquiries', {
    headers: authHeaders(),
  });
  return handleJsonResponse<Enquiry[]>(res);
}

export async function updateEnquiryStatus(id: string, status: EnquiryStatus): Promise<Enquiry> {
  const res = await apiFetch(`/api/admin/enquiries/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ status }),
  });
  return handleJsonResponse<Enquiry>(res);
}

export async function deleteEnquiry(id: string): Promise<void> {
  const res = await apiFetch(`/api/admin/enquiries/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleJsonResponse<{ ok: boolean }>(res);
}

export async function fetchAdminSellRequests(): Promise<SellRequest[]> {
  const res = await apiFetch('/api/admin/sell-requests', {
    headers: authHeaders(),
  });
  return handleJsonResponse<SellRequest[]>(res);
}

export async function updateSellRequestStatus(id: string, status: SellRequestStatus): Promise<SellRequest> {
  const res = await apiFetch(`/api/admin/sell-requests/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ status }),
  });
  return handleJsonResponse<SellRequest>(res);
}

export async function deleteSellRequest(id: string): Promise<void> {
  const res = await apiFetch(`/api/admin/sell-requests/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleJsonResponse<{ ok: boolean }>(res);
}

export async function fetchBusinessLocation(): Promise<LocationApiResponse> {
  const res = await apiFetch('/api/location');
  return handleJsonResponse<LocationApiResponse>(res);
}

export async function updateBusinessLocation(
  payload: Partial<BusinessLocationSettings>
): Promise<BusinessLocationSettings> {
  const res = await apiFetch('/api/admin/location', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleJsonResponse<BusinessLocationSettings>(res);
}

export async function geocodeLocationServer(address: string): Promise<{
  latitude: string;
  longitude: string;
  formattedAddress: string;
}> {
  const res = await apiFetch('/api/admin/location/geocode', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ address }),
  });
  if (res.status === 429) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
  return handleJsonResponse<{
    latitude: string;
    longitude: string;
    formattedAddress: string;
  }>(res);
}

// Cars Enhancements
export async function duplicateCar(id: string): Promise<Car> {
  const res = await apiFetch(`/api/admin/cars/${encodeURIComponent(id)}/duplicate`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await handleJsonResponse<Car>(res);
  const normalized = normalizeCarImages(data);
  updateGlobalCatalogCache([normalized]);
  broadcastInventoryUpdate({ type: 'upsert', car: normalized });
  return normalized;
}

export async function patchCarStatus(id: string, status: CarStatus): Promise<Car> {
  const res = await apiFetch(`/api/admin/cars/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ status }),
  });
  const data = await handleJsonResponse<Car>(res);
  const normalized = normalizeCarImages(data);
  updateGlobalCatalogCache([normalized]);
  broadcastInventoryUpdate({ type: 'upsert', car: normalized });
  return normalized;
}

export async function patchCarFeatured(
  id: string,
  featured: boolean,
  featuredOrder?: number
): Promise<Car> {
  const res = await apiFetch(`/api/admin/cars/${encodeURIComponent(id)}/featured`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ featured, featuredOrder }),
  });
  const data = await handleJsonResponse<Car>(res);
  const normalized = normalizeCarImages(data);
  updateGlobalCatalogCache([normalized]);
  broadcastInventoryUpdate({ type: 'upsert', car: normalized });
  return normalized;
}

// CRM Enquiries & Export
export async function updateEnquiry(id: string, patch: Partial<Enquiry>): Promise<Enquiry> {
  const res = await apiFetch(`/api/admin/enquiries/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(patch),
  });
  return handleJsonResponse<Enquiry>(res);
}

export async function downloadEnquiriesCsv(): Promise<void> {
  const res = await apiFetch('/api/admin/enquiries/export', {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to download CSV export');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wonder-cars-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// Admin Users Management
export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const res = await apiFetch('/api/admin/users', {
    headers: authHeaders(),
  });
  return handleJsonResponse<AdminUser[]>(res);
}

export async function createAdminUser(data: {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'staff';
}): Promise<AdminUser> {
  const res = await apiFetch('/api/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });
  return handleJsonResponse<AdminUser>(res);
}

export async function updateAdminUser(
  id: string,
  data: Partial<AdminUser> & { password?: string }
): Promise<AdminUser> {
  const res = await apiFetch(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });
  return handleJsonResponse<AdminUser>(res);
}

export async function deleteAdminUser(id: string): Promise<void> {
  const res = await apiFetch(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleJsonResponse<{ ok: boolean }>(res);
}

// Categories Management
export async function fetchCategories(): Promise<CategoryItem[]> {
  const res = await apiFetch('/api/categories');
  return handleJsonResponse<CategoryItem[]>(res);
}

export async function createCategory(data: Partial<CategoryItem>): Promise<CategoryItem> {
  const res = await apiFetch('/api/admin/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });
  return handleJsonResponse<CategoryItem>(res);
}

export async function updateCategory(id: string, data: Partial<CategoryItem>): Promise<CategoryItem> {
  const res = await apiFetch(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });
  return handleJsonResponse<CategoryItem>(res);
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await apiFetch(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleJsonResponse<{ ok: boolean }>(res);
}

// Brands Management
export async function fetchBrands(): Promise<BrandItem[]> {
  const res = await apiFetch('/api/brands');
  return handleJsonResponse<BrandItem[]>(res);
}

export async function createBrand(data: Partial<BrandItem>): Promise<BrandItem> {
  const res = await apiFetch('/api/admin/brands', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });
  return handleJsonResponse<BrandItem>(res);
}

export async function updateBrand(id: string, data: Partial<BrandItem>): Promise<BrandItem> {
  const res = await apiFetch(`/api/admin/brands/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });
  return handleJsonResponse<BrandItem>(res);
}

export async function deleteBrand(id: string): Promise<void> {
  const res = await apiFetch(`/api/admin/brands/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleJsonResponse<{ ok: boolean }>(res);
}

// Homepage Settings
export async function fetchHomepageSettings(): Promise<HomepageSettings> {
  const res = await apiFetch('/api/homepage');
  return handleJsonResponse<HomepageSettings>(res);
}

export async function updateHomepageSettings(data: Partial<HomepageSettings>): Promise<HomepageSettings> {
  const res = await apiFetch('/api/admin/homepage', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });
  return handleJsonResponse<HomepageSettings>(res);
}

// About Us Settings
export async function fetchAboutSettings(): Promise<AboutSettings> {
  const res = await apiFetch('/api/about');
  return handleJsonResponse<AboutSettings>(res);
}

export async function updateAboutSettings(data: Partial<AboutSettings>): Promise<AboutSettings> {
  const res = await apiFetch('/api/admin/about', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });
  return handleJsonResponse<AboutSettings>(res);
}

// Testimonials & Reviews
export async function fetchTestimonials(): Promise<TestimonialItem[]> {
  const res = await apiFetch('/api/testimonials');
  return handleJsonResponse<TestimonialItem[]>(res);
}

export async function fetchAdminTestimonials(): Promise<TestimonialItem[]> {
  const res = await apiFetch('/api/admin/testimonials', {
    headers: authHeaders(),
  });
  return handleJsonResponse<TestimonialItem[]>(res);
}

export async function createTestimonial(data: Partial<TestimonialItem>): Promise<TestimonialItem> {
  const res = await apiFetch('/api/admin/testimonials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });
  return handleJsonResponse<TestimonialItem>(res);
}

export async function updateTestimonial(id: string, data: Partial<TestimonialItem>): Promise<TestimonialItem> {
  const res = await apiFetch(`/api/admin/testimonials/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });
  return handleJsonResponse<TestimonialItem>(res);
}

export async function deleteTestimonial(id: string): Promise<void> {
  const res = await apiFetch(`/api/admin/testimonials/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleJsonResponse<{ ok: boolean }>(res);
}

// Website Settings
export async function fetchWebsiteSettings(): Promise<WebsiteSettings> {
  const res = await apiFetch('/api/settings');
  return handleJsonResponse<WebsiteSettings>(res);
}

export async function updateWebsiteSettings(data: Partial<WebsiteSettings>): Promise<WebsiteSettings> {
  const res = await apiFetch('/api/admin/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });
  return handleJsonResponse<WebsiteSettings>(res);
}

// Notifications & Activity Logs
export async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await apiFetch('/api/admin/notifications', {
    headers: authHeaders(),
  });
  return handleJsonResponse<NotificationItem[]>(res);
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await apiFetch(`/api/admin/notifications/${encodeURIComponent(id)}/read`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  await handleJsonResponse<{ ok: boolean }>(res);
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await apiFetch('/api/admin/notifications/mark-all-read', {
    method: 'POST',
    headers: authHeaders(),
  });
  await handleJsonResponse<{ ok: boolean }>(res);
}

export async function fetchActivityLogs(): Promise<ActivityLogItem[]> {
  const res = await apiFetch('/api/admin/activity-logs', {
    headers: authHeaders(),
  });
  return handleJsonResponse<ActivityLogItem[]>(res);
}

// Media Library
export async function fetchMediaLibrary(): Promise<Array<{ filename: string; url: string; size: number; createdAt: string }>> {
  const res = await apiFetch('/api/admin/media', {
    headers: authHeaders(),
  });
  return handleJsonResponse<Array<{ filename: string; url: string; size: number; createdAt: string }>>(res);
}

export async function deleteMediaFile(filename: string): Promise<void> {
  const res = await apiFetch(`/api/admin/media/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleJsonResponse<{ ok: boolean }>(res);
}

// Outgoing Email CRM & Monitoring
export interface OutgoingEmailLog {
  id: string;
  enquiryId?: string;
  recipients?: string[];
  recipient?: string;
  subject: string;
  customerName?: string;
  customerPhone?: string;
  carTitle?: string;
  bookingTime?: string;
  attachedFiles?: string[];
  timestamp: string;
  status: 'sent' | 'pending' | 'failed' | 'recorded_locally';
  method: string;
}

export async function fetchEmailLogs(): Promise<OutgoingEmailLog[]> {
  const res = await apiFetch('/api/admin/email-logs', {
    headers: authHeaders(),
  });
  return handleJsonResponse<OutgoingEmailLog[]>(res);
}

export async function fetchEmailConfig(): Promise<{
  configured: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  ownerEmails: string[];
}> {
  const res = await apiFetch('/api/admin/email/config', {
    headers: authHeaders(),
  });
  return handleJsonResponse(res);
}

export async function sendTestEmail(targetEmail?: string): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  const res = await apiFetch('/api/admin/email/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ targetEmail }),
  });
  return handleJsonResponse(res);
}

// ==========================================
// Google Analytics 4 (GA4) & Showroom Analytics API
// ==========================================
import type { AnalyticsDashboardResponse, AnalyticsDateRangeKey, AnalyticsStatus } from '../types/analytics';

export async function fetchAnalyticsDashboard(
  dateRange: AnalyticsDateRangeKey = '30d',
  startDate?: string,
  endDate?: string
): Promise<AnalyticsDashboardResponse> {
  const params = new URLSearchParams();
  if (dateRange) params.set('dateRange', dateRange);
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const query = params.toString();
  const res = await apiFetch(`/api/admin/analytics/overview${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
  });
  return handleJsonResponse<AnalyticsDashboardResponse>(res);
}

export async function fetchAnalyticsStatus(): Promise<AnalyticsStatus> {
  const res = await apiFetch('/api/admin/analytics/status', {
    headers: authHeaders(),
  });
  return handleJsonResponse<AnalyticsStatus>(res);
}

export async function downloadAnalyticsCsv(
  dateRange: AnalyticsDateRangeKey = '30d',
  startDate?: string,
  endDate?: string
): Promise<void> {
  const params = new URLSearchParams();
  if (dateRange) params.set('dateRange', dateRange);
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const query = params.toString();
  const res = await apiFetch(`/api/admin/analytics/export${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error(`CSV export failed (${res.status})`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wonder-cars-analytics-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

