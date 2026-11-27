import type { Request, Response } from 'express';
import { readDb, writeDb, logActivity } from '../services/store.service.ts';
import { GOOGLE_MAPS_API_KEY } from '../config/index.ts';
import {
  syncLocationMapsToAbout,
  validateAndSanitizeLocationSettings,
  validateAndSanitizeWebsiteSettings,
} from '../utils/settingsValidation.ts';

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
  const db = readDb();
  const validation = validateAndSanitizeLocationSettings(db.locationSettings, req.body);
  if (!validation.ok) {
    res.status(400).json({ error: validation.error, fieldErrors: validation.fieldErrors });
    return;
  }

  db.locationSettings = validation.data;
  db.aboutSettings = syncLocationMapsToAbout(db.aboutSettings, validation.data);
  writeDb(db);
  logActivity('admin', 'Updated Showroom Location Settings', 'Updated showroom address, coordinates, or Maps configuration.');
  res.json(db.locationSettings);
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
  const validation = validateAndSanitizeWebsiteSettings(db.websiteSettings, req.body);
  if (!validation.ok) {
    res.status(400).json({ error: validation.error, fieldErrors: validation.fieldErrors });
    return;
  }

  db.websiteSettings = validation.data;
  writeDb(db);
  logActivity('admin', 'Updated Website Settings', 'Changed branding, contact, SEO, analytics, or footer settings.');
  res.json(db.websiteSettings);
}

