import { API_BASE, LIVE_BACKEND_URL } from './api';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID as string) || '';

let isGaInitialized = false;

/**
 * Initialize Google Analytics 4 (GA4) with SPA manual route tracking mode
 */
export function initGA(): void {
  if (typeof window === 'undefined' || isGaInitialized) return;

  const id = GA_MEASUREMENT_ID.trim();

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments);
  };

  window.gtag('js', new Date());

  if (id && id.startsWith('G-')) {
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
  }

  isGaInitialized = true;
}

/**
 * Dispatch lightweight telemetry to backend /api/analytics/track (fail-safe)
 */
async function sendServerTelemetry(payload: Record<string, unknown>): Promise<void> {
  try {
    const targetUrl = API_BASE ? `${API_BASE}/api/analytics/track` : '/api/analytics/track';
    fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
      }),
      keepalive: true,
    }).catch(() => {
      // Secondary fallback to Live Render backend if needed
      if (!API_BASE) {
        fetch(`${LIVE_BACKEND_URL}/api/analytics/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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
