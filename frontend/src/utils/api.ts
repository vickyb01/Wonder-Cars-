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

export async function adminLogin(
  email: string,
  password: string
): Promise<{ token: string; email: string; user?: { id?: string; name?: string; email: string; role?: string; avatar?: string } }> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleJsonResponse<{ token: string; email: string; user?: { id?: string; name?: string; email: string; role?: string; avatar?: string } }>(res);
}

export async function adminForgotPassword(email: string): Promise<{ ok: boolean; message: string; resetCode?: string }> {
  const res = await fetch('/api/admin/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handleJsonResponse<{ ok: boolean; message: string; resetCode?: string }>(res);
}

export async function adminResetPassword(email: string, newPassword: string): Promise<{ ok: boolean; message: string }> {
  const res = await fetch('/api/admin/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword }),
  });
  return handleJsonResponse<{ ok: boolean; message: string }>(res);
}

export async function verifyAdminSession(): Promise<{ id?: string; name?: string; email: string; role?: string; avatar?: string }> {
  const res = await fetch('/api/admin/me', {
    headers: authHeaders(),
  });
  return handleJsonResponse<{ id?: string; name?: string; email: string; role?: string; avatar?: string }>(res);
}

export const fetchAdminProfile = verifyAdminSession;

export async function updateAdminProfile(data: { name?: string; currentPassword?: string; newPassword?: string; avatar?: string }): Promise<any> {
  const res = await fetch('/api/admin/profile', {
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
  const data = await handleJsonResponse<{ urls: string[]; storage?: string; warning?: string }>(res);
  return data.urls;
}

export async function fetchCloudinaryStatus(): Promise<{
  configured: boolean;
  connected: boolean;
  cloudName: string;
  error?: string;
}> {
  const res = await fetch('/api/admin/cloudinary/status', {
    headers: authHeaders(),
  });
  return handleJsonResponse(res);
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

// Cars Enhancements
export async function duplicateCar(id: string): Promise<Car> {
  const res = await fetch(`/api/admin/cars/${encodeURIComponent(id)}/duplicate`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleJsonResponse<Car>(res);
}

export async function patchCarStatus(id: string, status: CarStatus): Promise<Car> {
  const res = await fetch(`/api/admin/cars/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ status }),
  });
  return handleJsonResponse<Car>(res);
}

export async function patchCarFeatured(id: string, featured: boolean): Promise<Car> {
  const res = await fetch(`/api/admin/cars/${encodeURIComponent(id)}/featured`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ featured }),
  });
  return handleJsonResponse<Car>(res);
}

// CRM Enquiries & Export
export async function updateEnquiry(id: string, patch: Partial<Enquiry>): Promise<Enquiry> {
  const res = await fetch(`/api/admin/enquiries/${encodeURIComponent(id)}`, {
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
  const res = await fetch('/api/admin/enquiries/export', {
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
  const res = await fetch('/api/admin/users', {
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
  const res = await fetch('/api/admin/users', {
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
  const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
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
  const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleJsonResponse<{ ok: boolean }>(res);
}

// Categories Management
export async function fetchCategories(): Promise<CategoryItem[]> {
  const res = await fetch('/api/categories');
  return handleJsonResponse<CategoryItem[]>(res);
}

export async function createCategory(data: Partial<CategoryItem>): Promise<CategoryItem> {
  const res = await fetch('/api/admin/categories', {
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
  const res = await fetch(`/api/admin/categories/${encodeURIComponent(id)}`, {
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
  const res = await fetch(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleJsonResponse<{ ok: boolean }>(res);
}

// Brands Management
export async function fetchBrands(): Promise<BrandItem[]> {
  const res = await fetch('/api/brands');
  return handleJsonResponse<BrandItem[]>(res);
}

export async function createBrand(data: Partial<BrandItem>): Promise<BrandItem> {
  const res = await fetch('/api/admin/brands', {
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
  const res = await fetch(`/api/admin/brands/${encodeURIComponent(id)}`, {
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
  const res = await fetch(`/api/admin/brands/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleJsonResponse<{ ok: boolean }>(res);
}

// Homepage Settings
export async function fetchHomepageSettings(): Promise<HomepageSettings> {
  const res = await fetch('/api/homepage');
  return handleJsonResponse<HomepageSettings>(res);
}

export async function updateHomepageSettings(data: Partial<HomepageSettings>): Promise<HomepageSettings> {
  const res = await fetch('/api/admin/homepage', {
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
  const res = await fetch('/api/about');
  return handleJsonResponse<AboutSettings>(res);
}

export async function updateAboutSettings(data: Partial<AboutSettings>): Promise<AboutSettings> {
  const res = await fetch('/api/admin/about', {
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
  const res = await fetch('/api/testimonials');
  return handleJsonResponse<TestimonialItem[]>(res);
}

export async function fetchAdminTestimonials(): Promise<TestimonialItem[]> {
  const res = await fetch('/api/admin/testimonials', {
    headers: authHeaders(),
  });
  return handleJsonResponse<TestimonialItem[]>(res);
}

export async function createTestimonial(data: Partial<TestimonialItem>): Promise<TestimonialItem> {
  const res = await fetch('/api/admin/testimonials', {
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
  const res = await fetch(`/api/admin/testimonials/${encodeURIComponent(id)}`, {
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
  const res = await fetch(`/api/admin/testimonials/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleJsonResponse<{ ok: boolean }>(res);
}

// Website Settings
export async function fetchWebsiteSettings(): Promise<WebsiteSettings> {
  const res = await fetch('/api/settings');
  return handleJsonResponse<WebsiteSettings>(res);
}

export async function updateWebsiteSettings(data: Partial<WebsiteSettings>): Promise<WebsiteSettings> {
  const res = await fetch('/api/admin/settings', {
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
  const res = await fetch('/api/admin/notifications', {
    headers: authHeaders(),
  });
  return handleJsonResponse<NotificationItem[]>(res);
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await fetch(`/api/admin/notifications/${encodeURIComponent(id)}/read`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  await handleJsonResponse<{ ok: boolean }>(res);
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await fetch('/api/admin/notifications/mark-all-read', {
    method: 'POST',
    headers: authHeaders(),
  });
  await handleJsonResponse<{ ok: boolean }>(res);
}

export async function fetchActivityLogs(): Promise<ActivityLogItem[]> {
  const res = await fetch('/api/admin/activity-logs', {
    headers: authHeaders(),
  });
  return handleJsonResponse<ActivityLogItem[]>(res);
}

// Media Library
export async function fetchMediaLibrary(): Promise<Array<{ filename: string; url: string; size: number; createdAt: string }>> {
  const res = await fetch('/api/admin/media', {
    headers: authHeaders(),
  });
  return handleJsonResponse<Array<{ filename: string; url: string; size: number; createdAt: string }>>(res);
}

export async function deleteMediaFile(filename: string): Promise<void> {
  const res = await fetch(`/api/admin/media/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleJsonResponse<{ ok: boolean }>(res);
}

