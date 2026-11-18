import type {
  AdminOverview,
  BusinessLocationSettings,
  Car,
  CarFilters,
  Enquiry,
  EnquiryStatus,
  EnquiryType,
  LocationApiResponse,
  SellRequest,
  SellRequestStatus,
} from '../types/car';

const ADMIN_TOKEN_KEY = 'strada_admin_token';
const WISHLIST_KEY = 'strada_wishlist_ids';

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

async function handleJsonResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof data?.error === 'string' ? data.error : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

function authHeaders(): HeadersInit {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchCars(filters: CarFilters = {}): Promise<Car[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'All') {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  const res = await fetch(`/api/cars${query ? `?${query}` : ''}`, {
    headers: filters.includeDrafts === 'true' ? authHeaders() : undefined,
  });
  return handleJsonResponse<Car[]>(res);
}

export async function fetchCarDetail(id: string): Promise<{
  car: Car;
  similar: Car[];
  sellerOtherCars: Car[];
}> {
  const res = await fetch(`/api/cars/${encodeURIComponent(id)}`);
  return handleJsonResponse<{
    car: Car;
    similar: Car[];
    sellerOtherCars: Car[];
  }>(res);
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
}): Promise<Enquiry> {
  const res = await fetch('/api/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleJsonResponse<Enquiry>(res);
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
  const res = await fetch('/api/sell-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleJsonResponse<SellRequest>(res);
}

export async function adminLogin(email: string, password: string): Promise<{ token: string; email: string }> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleJsonResponse<{ token: string; email: string }>(res);
}

export async function verifyAdminSession(): Promise<{ email: string }> {
  const res = await fetch('/api/admin/me', {
    headers: authHeaders(),
  });
  return handleJsonResponse<{ email: string }>(res);
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const res = await fetch('/api/admin/overview', {
    headers: authHeaders(),
  });
  return handleJsonResponse<AdminOverview>(res);
}

export async function createCar(payload: Partial<Car>): Promise<Car> {
  const res = await fetch('/api/admin/cars', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleJsonResponse<Car>(res);
}

export async function updateCar(id: string, payload: Partial<Car>): Promise<Car> {
  const res = await fetch(`/api/admin/cars/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleJsonResponse<Car>(res);
}

export async function deleteCar(id: string): Promise<void> {
  const res = await fetch(`/api/admin/cars/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleJsonResponse<{ ok: boolean }>(res);
}

export async function uploadCarImages(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  const data = await handleJsonResponse<{ urls: string[] }>(res);
  return data.urls;
}

export async function fetchAdminEnquiries(): Promise<Enquiry[]> {
  const res = await fetch('/api/admin/enquiries', {
    headers: authHeaders(),
  });
  return handleJsonResponse<Enquiry[]>(res);
}

export async function updateEnquiryStatus(id: string, status: EnquiryStatus): Promise<Enquiry> {
  const res = await fetch(`/api/admin/enquiries/${encodeURIComponent(id)}`, {
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
  const res = await fetch(`/api/admin/enquiries/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleJsonResponse<{ ok: boolean }>(res);
}

export async function fetchAdminSellRequests(): Promise<SellRequest[]> {
  const res = await fetch('/api/admin/sell-requests', {
    headers: authHeaders(),
  });
  return handleJsonResponse<SellRequest[]>(res);
}

export async function updateSellRequestStatus(id: string, status: SellRequestStatus): Promise<SellRequest> {
  const res = await fetch(`/api/admin/sell-requests/${encodeURIComponent(id)}`, {
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
  const res = await fetch(`/api/admin/sell-requests/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleJsonResponse<{ ok: boolean }>(res);
}

export async function fetchBusinessLocation(): Promise<LocationApiResponse> {
  const res = await fetch('/api/location');
  return handleJsonResponse<LocationApiResponse>(res);
}

export async function updateBusinessLocation(
  payload: BusinessLocationSettings
): Promise<BusinessLocationSettings> {
  const res = await fetch('/api/admin/location', {
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
  const res = await fetch('/api/admin/location/geocode', {
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

