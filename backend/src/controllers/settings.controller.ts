import type { Request, Response } from 'express';
import { readDb, writeDb, logActivity, normalizeLocationSettings } from '../services/store.service.ts';
import { GOOGLE_MAPS_API_KEY } from '../config/index.ts';

// Location Settings
export function getLocationSettings(_req: Request, res: Response): void {
  const db = readDb();
  const mapsApiKey = GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '';
  res.json({
    location: db.locationSettings,
    mapsApiKey,
  });
}

export function updateLocationSettings(req: Request, res: Response): void {
  const normalized = normalizeLocationSettings(req.body || {});

  if (normalized.latitude !== '') {
    const latNum = Number(normalized.latitude);
    if (!Number.isFinite(latNum) || latNum < -90 || latNum > 90) {
      res.status(400).json({ error: 'Latitude must be a valid number between -90 and 90.' });
      return;
    }
  }

  if (normalized.longitude !== '') {
    const lngNum = Number(normalized.longitude);
    if (!Number.isFinite(lngNum) || lngNum < -180 || lngNum > 180) {
      res.status(400).json({ error: 'Longitude must be a valid number between -180 and 180.' });
      return;
    }
  }

  if ((normalized.latitude !== '' && normalized.longitude === '') || (normalized.latitude === '' && normalized.longitude !== '')) {
    res.status(400).json({ error: 'Please provide both Latitude and Longitude coordinates, or leave both empty.' });
    return;
  }

  if (normalized.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
    res.status(400).json({ error: 'Please enter a valid official email address.' });
    return;
  }

  if (normalized.googleMapsUrl && !/^https?:\/\//i.test(normalized.googleMapsUrl)) {
    res.status(400).json({ error: 'Google Maps URL must start with http:// or https://.' });
    return;
  }

  normalized.updatedAt = new Date().toISOString();

  const db = readDb();
  db.locationSettings = normalized;
  writeDb(db);
  res.json(normalized);
}

export async function geocodeAddress(req: Request, res: Response): Promise<void> {
  const addressQuery = String(req.body?.address || '').trim();
  if (!addressQuery || addressQuery.length < 4) {
    res.status(400).json({ error: 'Please enter a street address or city first to look up coordinates.' });
    return;
  }

  const apiKey = GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '';
  if (!apiKey) {
    res.status(400).json({
      error: 'Google Maps API key is not configured on the server yet. Please enter Latitude and Longitude manually.',
    });
    return;
  }

  try {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressQuery)}&key=${encodeURIComponent(apiKey)}`;
    const apiRes = await fetch(geocodeUrl);
    if (apiRes.status === 429) {
      res.status(429).json({
        error: 'Google Maps Geocoding quota exceeded. Please enter Latitude and Longitude manually or update your billing plan.',
      });
      return;
    }

    const data = (await apiRes.json()) as {
      status?: string;
      error_message?: string;
      results?: Array<{
        formatted_address?: string;
        geometry?: { location?: { lat?: number; lng?: number } };
      }>;
    };

    if (data.status === 'OVER_QUERY_LIMIT' || data.status === 'OVER_DAILY_LIMIT') {
      res.status(429).json({
        error: 'Google Maps Geocoding quota reached. Please enter Latitude and Longitude manually.',
      });
      return;
    }

    if (data.status !== 'OK' || !data.results?.[0]?.geometry?.location) {
      res.status(422).json({
        error: data.error_message || 'Could not resolve coordinates for this address. You can enter Latitude and Longitude manually.',
      });
      return;
    }

    const loc = data.results[0].geometry.location;
    res.json({
      latitude: String(loc.lat),
      longitude: String(loc.lng),
      formattedAddress: data.results[0].formatted_address || addressQuery,
    });
  } catch {
    res.status(502).json({
      error: 'Unable to reach Geocoding service right now. Please enter Latitude and Longitude manually.',
    });
  }
}

// Website Settings
export function getWebsiteSettings(_req: Request, res: Response): void {
  const db = readDb();
  res.json(db.websiteSettings);
}

export function updateWebsiteSettings(req: Request, res: Response): void {
  const db = readDb();
  db.websiteSettings = {
    ...db.websiteSettings,
    ...(req.body || {}),
  };
  writeDb(db);
  logActivity('admin', 'Updated Website Settings', 'Changed branding, contact, SEO, or footer settings.');
  res.json(db.websiteSettings);
}

