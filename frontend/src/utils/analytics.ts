import { API_BASE, LIVE_BACKEND_URL } from './api';
import { isValidGa4MeasurementId } from './settingsHelpers.mjs';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID as string) || '';

let isGaBaseReady = false;
let configuredGaId = '';

/**
 * Resolves the active GA4 Measurement ID, prioritizing build-time VITE_GA_MEASUREMENT_ID
 * and falling back to a validated runtime ID saved in Website Settings.
 */
export function resolveActiveGaId(runtimeMeasurementId?: string): string {
  const buildId = GA_MEASUREMENT_ID.trim().toUpperCase();
  if (isValidGa4MeasurementId(buildId)) return buildId;
  const runtimeId = String(runtimeMeasurementId || '').trim().toUpperCase();
  if (isValidGa4MeasurementId(runtimeId)) return runtimeId;
  return '';
}

/**
 * Initialize Google Analytics 4 (GA4) with SPA manual route tracking mode.
 */
export function initGA(runtimeMeasurementId?: string): void {
  if (typeof window === 'undefined') return;

  if (!isGaBaseReady) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer?.push(arguments);
    };
    window.gtag('js', new Date());
    isGaBaseReady = true;
  }

  const id = resolveActiveGaId(runtimeMeasurementId);
  if (id && id !== configuredGaId && window.gtag) {
    const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${id}"]`);
    if (!existingScript) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
      document.head.appendChild(script);
    }

    // Configure GA4 without automatic pageview to avoid duplicates in Single Page Applications
    window.gtag('config', id, {
      send_page_view: false,
    });
    configuredGaId = id;
  }
}

function getClientId(): string {
  try {
    let id = localStorage.getItem('wc_client_id');
    if (!id) {
      id = 'wc_c_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem('wc_client_id', id);
    }
    return id;
  } catch {
    return 'wc_c_anon';
  }
}

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem('wc_session_id');
    if (!id) {
      id = 'wc_s_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      sessionStorage.setItem('wc_session_id', id);
    }
    return id;
  } catch {
    return 'wc_s_anon';
  }
}

function getDeviceType(): 'Mobile' | 'Desktop' | 'Tablet' {
  if (typeof window === 'undefined') return 'Desktop';
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'Tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    return 'Mobile';
  }
  return 'Desktop';
}

/**
 * Dispatch lightweight telemetry to backend /api/analytics/track (fail-safe)
 */
async function sendServerTelemetry(payload: Record<string, unknown>): Promise<void> {
  try {
    const fullPayload = {
      ...payload,
      clientId: getClientId(),
      sessionId: getSessionId(),
      device: getDeviceType(),
      timestamp: new Date().toISOString(),
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };
    const targetUrl = API_BASE ? `${API_BASE}/api/analytics/track` : '/api/analytics/track';
    fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullPayload),
      keepalive: true,
    }).catch(() => {
      // Secondary fallback to Live Render backend if needed
      if (!API_BASE) {
        fetch(`${LIVE_BACKEND_URL}/api/analytics/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullPayload),
          keepalive: true,
        }).catch(() => {});
      }
    });
  } catch {}
}

/**
 * Track SPA Route change (page_view)
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  if (typeof window === 'undefined') return;
  initGA();

  const title = pageTitle || document.title;
  const url = window.location.href;

  // Track in GA4
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: title,
      page_location: url,
    });
  }

  // Send to backend telemetry
  sendServerTelemetry({
    eventName: 'page_view',
    pagePath,
    pageTitle: title,
  });
}

/**
 * Custom event: view_car
 */
export function trackViewCar(car: {
  id: string;
  brand: string;
  model: string;
  year?: number;
  priceInr?: number;
}): void {
  initGA();
  const carTitle = `${car.year ? car.year + ' ' : ''}${car.brand} ${car.model}`.trim();

  if (window.gtag) {
    window.gtag('event', 'view_car', {
      car_id: car.id,
      car_name: carTitle,
      brand: car.brand,
      model: car.model,
      value: car.priceInr || 0,
      currency: 'INR',
    });
  }

  sendServerTelemetry({
    eventName: 'view_car',
    carId: car.id,
    carTitle,
    brand: car.brand,
    priceInr: car.priceInr,
  });
}

/**
 * Custom event: search_car
 */
export function trackSearchCar(
  searchTerm: string,
  filters?: Record<string, unknown>
): void {
  initGA();

  if (window.gtag) {
    window.gtag('event', 'search_car', {
      search_term: searchTerm,
      ...filters,
    });
  }

  sendServerTelemetry({
    eventName: 'search_car',
    searchTerm,
    filters,
  });
}

/**
 * Custom event: click_call
 */
export function trackClickCall(
  phoneNumber: string,
  sourcePage: string,
  carTitle?: string
): void {
  initGA();

  if (window.gtag) {
    window.gtag('event', 'click_call', {
      phone_number: phoneNumber,
      source_page: sourcePage,
      car_title: carTitle,
    });
  }

  sendServerTelemetry({
    eventName: 'click_call',
    phoneNumber,
    pagePath: sourcePage,
    carTitle,
  });
}

/**
 * Custom event: click_whatsapp
 */
export function trackClickWhatsApp(
  whatsappNumber: string,
  sourcePage: string,
  carTitle?: string
): void {
  initGA();

  if (window.gtag) {
    window.gtag('event', 'click_whatsapp', {
      whatsapp_number: whatsappNumber,
      source_page: sourcePage,
      car_title: carTitle,
    });
  }

  sendServerTelemetry({
    eventName: 'click_whatsapp',
    whatsappNumber,
    pagePath: sourcePage,
    carTitle,
  });
}

/**
 * Custom event: generate_lead / enquiry submission
 */
export function trackGenerateLead(
  enquiryType: string,
  carTitle?: string,
  carId?: string,
  priceInr?: number
): void {
  initGA();

  if (window.gtag) {
    window.gtag('event', 'generate_lead', {
      enquiry_type: enquiryType,
      car_title: carTitle,
      car_id: carId,
      value: priceInr || 0,
      currency: 'INR',
    });
  }

  sendServerTelemetry({
    eventName: 'generate_lead',
    enquiryType,
    carTitle,
    carId,
    priceInr,
  });
}
