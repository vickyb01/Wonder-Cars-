import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import { normalizeLocationSettings, readDb, slugifyCar, writeDb } from './server/store.ts';
import { normalizeCarRecord } from './src/utils/carDefaults.ts';
import { matchesBrandFilter } from './src/data/brands.ts';
import { DEFAULT_EMI_CONFIG, estimateCarEmiWithConfig } from './src/utils/emi.ts';
import type { Car, Enquiry, SellRequest } from './src/types/car.ts';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@stradamotors.in';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'StradaAdmin@2026';
const JWT_SECRET = process.env.JWT_SECRET || 'strada-motors-signing-secret-2026';

const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeBase = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 32);
    cb(null, `${Date.now()}-${safeBase || 'vehicle'}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 35 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

function createSignedToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      email,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    })
  ).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifySignedToken(token: string): { email: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
      email?: string;
      exp?: number;
    };
    if (!decoded.email || !decoded.exp || decoded.exp < Date.now()) {
      return null;
    }
    return { email: decoded.email };
  } catch {
    return null;
  }
}

interface AuthenticatedRequest extends Request {
  adminEmail?: string;
}

function isAdminRequest(req: Request): boolean {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  return Boolean(token && verifySignedToken(token));
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const verified = token ? verifySignedToken(token) : null;
  if (!verified) {
    res.status(401).json({ error: 'Unauthorized. Please sign in to the Admin Portal.' });
    return;
  }
  req.adminEmail = verified.email;
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));
  app.use('/uploads', express.static(UPLOADS_DIR));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'strada-motors' });
  });

  // Public Showroom Business & Location Settings
  app.get('/api/location', (_req, res) => {
    const db = readDb();
    const mapsApiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
    res.json({
      location: db.locationSettings,
      mapsApiKey,
    });
  });

  // Public & Admin Car Listing
  app.get('/api/cars', (req, res) => {
    const db = readDb();
    let results = [...db.cars];

    const includeDrafts = req.query.includeDrafts === 'true' && isAdminRequest(req);
    if (!includeDrafts) {
      results = results.filter((car) => car.status !== 'Draft');
    }

    const search = String(req.query.search || '').trim().toLowerCase();
    const brand = String(req.query.brand || '').trim();
    const model = String(req.query.model || '').trim();
    const minPrice = Number(req.query.minPrice || 0);
    const maxPrice = Number(req.query.maxPrice || 0);
    const minEmi = Number(req.query.minEmi || 0);
    const maxEmi = Number(req.query.maxEmi || 0);
    const downPaymentPercent = req.query.downPaymentPercent !== undefined && req.query.downPaymentPercent !== ''
      ? Number(req.query.downPaymentPercent)
      : DEFAULT_EMI_CONFIG.downPaymentPercent;
    const interestRate = req.query.interestRate !== undefined && req.query.interestRate !== ''
      ? Number(req.query.interestRate)
      : DEFAULT_EMI_CONFIG.annualInterestRate;
    const tenureMonths = req.query.tenureMonths !== undefined && req.query.tenureMonths !== ''
      ? Number(req.query.tenureMonths)
      : DEFAULT_EMI_CONFIG.tenureMonths;
    const year = Number(req.query.year || 0);
    const fuelType = String(req.query.fuelType || '').trim();
    const transmission = String(req.query.transmission || '').trim();
    const maxKm = Number(req.query.maxKm || 0);
    const status = String(req.query.status || '').trim();
    const featured = String(req.query.featured || '').trim();
    const sort = String(req.query.sort || 'newest').trim();

    const emiConfig = {
      downPaymentPercent: Number.isFinite(downPaymentPercent) ? downPaymentPercent : DEFAULT_EMI_CONFIG.downPaymentPercent,
      annualInterestRate: Number.isFinite(interestRate) ? interestRate : DEFAULT_EMI_CONFIG.annualInterestRate,
      tenureMonths: Number.isFinite(tenureMonths) ? tenureMonths : DEFAULT_EMI_CONFIG.tenureMonths,
    };

    if (search) {
      results = results.filter((car) =>
        [car.brand, car.model, car.variant, car.location, car.fuelType, car.color, car.listingCode, String(car.year)]
          .join(' ')
          .toLowerCase()
          .includes(search)
      );
    }
    if (brand && brand !== 'All') {
      results = results.filter((car) => matchesBrandFilter(car.brand, brand));
    }
    if (model && model !== 'All') {
      results = results.filter((car) => car.model.toLowerCase().includes(model.toLowerCase()));
    }
    if (minPrice > 0) {
      results = results.filter((car) => car.priceInr >= minPrice);
    }
    if (maxPrice > 0) {
      results = results.filter((car) => car.priceInr <= maxPrice);
    }
    if (minEmi > 0) {
      results = results.filter((car) => estimateCarEmiWithConfig(car.priceInr, emiConfig) >= minEmi);
    }
    if (maxEmi > 0) {
      results = results.filter((car) => estimateCarEmiWithConfig(car.priceInr, emiConfig) <= maxEmi);
    }
    if (year > 0) {
      results = results.filter((car) => car.year === year);
    }
    if (fuelType && fuelType !== 'All') {
      results = results.filter((car) => car.fuelType.toLowerCase() === fuelType.toLowerCase());
    }
    if (transmission && transmission !== 'All') {
      results = results.filter((car) => car.transmission.toLowerCase() === transmission.toLowerCase());
    }
    if (maxKm > 0) {
      results = results.filter((car) => car.kilometres <= maxKm);
    }
    if (status && status !== 'All') {
      results = results.filter((car) => car.status.toLowerCase() === status.toLowerCase());
    }
    if (featured === 'true') {
      results = results.filter((car) => car.featured);
    }

    switch (sort) {
      case 'price_asc':
        results.sort((a, b) => a.priceInr - b.priceInr);
        break;
      case 'price_desc':
        results.sort((a, b) => b.priceInr - a.priceInr);
        break;
      case 'emi_asc':
        results.sort(
          (a, b) =>
            estimateCarEmiWithConfig(a.priceInr, emiConfig) -
            estimateCarEmiWithConfig(b.priceInr, emiConfig)
        );
        break;
      case 'emi_desc':
        results.sort(
          (a, b) =>
            estimateCarEmiWithConfig(b.priceInr, emiConfig) -
            estimateCarEmiWithConfig(a.priceInr, emiConfig)
        );
        break;
      case 'km_asc':
        results.sort((a, b) => a.kilometres - b.kilometres);
        break;
      case 'year_desc':
        results.sort((a, b) => b.year - a.year);
        break;
      case 'newest':
      default:
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    res.json(results);
  });

  // Public Single Car Detail + Similar Cars + Seller Other Cars
  app.get('/api/cars/:id', (req, res) => {
    const db = readDb();
    const idOrSlug = req.params.id;
    const car = db.cars.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
    if (!car || (car.status === 'Draft' && !isAdminRequest(req))) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    const availableOthers = db.cars.filter((c) => c.id !== car.id && c.status === 'Available');

    const similar = [...availableOthers]
      .sort((a, b) => {
        const score = (c: Car) => {
          let s = 0;
          if (c.brand === car.brand) s += 3;
          if (c.model === car.model) s += 2;
          if (c.bodyType === car.bodyType) s += 2;
          if (c.fuelType === car.fuelType) s += 1;
          if (Math.abs(c.year - car.year) <= 2) s += 1;
          if (car.priceInr > 0 && Math.abs(c.priceInr - car.priceInr) / car.priceInr <= 0.3) s += 2;
          return s;
        };
        return score(b) - score(a);
      })
      .slice(0, 3);

    const sellerOtherCars = availableOthers
      .filter((c) => c.sellerName === car.sellerName)
      .slice(0, 3);

    res.json({ car, similar, sellerOtherCars });
  });

  // Public Enquiries, Test Drives, Physical Inspections & Offers
  app.post('/api/enquiries', (req, res) => {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const phone = String(body.phone || '').trim();
    const message = String(body.message || '').trim();
    const allowedTypes = ['test-drive', 'inspection', 'offer', 'car-enquiry', 'general'];
    const type = allowedTypes.includes(body.type) ? body.type : 'general';

    if (!name || name.length < 2) {
      res.status(400).json({ error: 'Please enter your full name.' });
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      res.status(400).json({ error: 'Please enter a valid 10-digit phone number.' });
      return;
    }
    if (type === 'offer' && (!body.offerPriceInr || Number(body.offerPriceInr) <= 0)) {
      res.status(400).json({ error: 'Please enter your offer amount in INR.' });
      return;
    }
    if (!message || message.length < 3) {
      res.status(400).json({ error: 'Please include a short message or note.' });
      return;
    }

    const db = readDb();
    const newEnquiry: Enquiry = {
      id: `enq-${Date.now()}`,
      type,
      carId: body.carId ? String(body.carId) : undefined,
      carTitle: body.carTitle ? String(body.carTitle) : undefined,
      name,
      email: email || 'Not Provided',
      phone,
      preferredDate: body.preferredDate ? String(body.preferredDate) : undefined,
      preferredTime: body.preferredTime ? String(body.preferredTime) : undefined,
      city: body.city ? String(body.city) : undefined,
      offerPriceInr: body.offerPriceInr ? Number(body.offerPriceInr) : undefined,
      message,
      status: 'New',
      createdAt: new Date().toISOString(),
    };

    db.enquiries.unshift(newEnquiry);
    writeDb(db);
    res.status(201).json(newEnquiry);
  });

  // Public Sell Your Car Submissions
  app.post('/api/sell-requests', (req, res) => {
    const body = req.body || {};
    const brand = String(body.brand || '').trim();
    const model = String(body.model || '').trim();
    const year = Number(body.year || 0);
    const kilometres = Number(body.kilometres || 0);
    const expectedPriceInr = Number(body.expectedPriceInr || 0);
    const ownerName = String(body.ownerName || '').trim();
    const ownerPhone = String(body.ownerPhone || '').trim();
    const ownerEmail = String(body.ownerEmail || '').trim();

    if (!brand || !model || year < 2005 || year > 2027) {
      res.status(400).json({ error: 'Please provide valid vehicle brand, model, and manufacturing year.' });
      return;
    }
    if (!ownerName || ownerPhone.replace(/\D/g, '').length < 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
      res.status(400).json({ error: 'Please provide valid owner name, phone, and email.' });
      return;
    }

    const db = readDb();
    const record: SellRequest = {
      id: `sell-${Date.now()}`,
      brand,
      model,
      year,
      kilometres: Math.max(0, kilometres),
      fuelType: String(body.fuelType || 'Petrol'),
      transmission: String(body.transmission || 'Automatic'),
      ownership: String(body.ownership || '1st Owner'),
      city: String(body.city || 'Mumbai'),
      expectedPriceInr: Math.max(0, expectedPriceInr),
      ownerName,
      ownerPhone,
      ownerEmail,
      notes: String(body.notes || '').trim(),
      status: 'Pending Review',
      createdAt: new Date().toISOString(),
    };

    db.sellRequests.unshift(record);
    writeDb(db);
    res.status(201).json(record);
  });

  // Admin Login
  app.post('/api/admin/login', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (email !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
      res.status(401).json({ error: 'Invalid admin email or password.' });
      return;
    }

    const token = createSignedToken(ADMIN_EMAIL);
    res.json({ token, email: ADMIN_EMAIL });
  });

  app.get('/api/admin/me', requireAdmin, (req: AuthenticatedRequest, res) => {
    res.json({ email: req.adminEmail });
  });

  // Admin Overview Metrics
  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    const db = readDb();
    const availableCars = db.cars.filter((c) => c.status === 'Available');
    const reservedCars = db.cars.filter((c) => c.status === 'Reserved');
    const soldCars = db.cars.filter((c) => c.status === 'Sold');
    const draftCars = db.cars.filter((c) => c.status === 'Draft');
    res.json({
      totalCars: db.cars.length,
      availableCars: availableCars.length,
      reservedCars: reservedCars.length,
      soldCars: soldCars.length,
      draftCars: draftCars.length,
      featuredCars: db.cars.filter((c) => c.featured).length,
      totalInventoryValueInr: availableCars.reduce((sum, c) => sum + c.priceInr, 0),
      newEnquiriesCount: db.enquiries.filter((e) => e.status === 'New').length,
      totalEnquiriesCount: db.enquiries.length,
      pendingSellRequestsCount: db.sellRequests.filter((s) => s.status === 'Pending Review').length,
    });
  });

  // Admin Multi-Image Upload (up to 35 images)
  app.post('/api/admin/upload', requireAdmin, upload.array('images', 35), (req, res) => {
    const files = (req.files as Express.Multer.File[]) || [];
    if (!files.length) {
      res.status(400).json({ error: 'No image files received.' });
      return;
    }
    const urls = files.map((file) => `/uploads/${file.filename}`);
    res.json({ urls });
  });

  // Admin Create Car (supports Draft listings with minimal fields or full published listings)
  app.post('/api/admin/cars', requireAdmin, (req, res) => {
    const body = req.body || {};
    const brand = String(body.brand || '').trim();
    const model = String(body.model || '').trim();
    const year = Number(body.year || 0);
    const priceInr = Number(body.priceInr || 0);
    const isDraft = body.status === 'Draft';

    if (!brand || !model) {
      res.status(400).json({ error: 'Brand and Model are required.' });
      return;
    }
    if (!isDraft && (!year || priceInr <= 0)) {
      res.status(400).json({ error: 'Valid Year and positive INR Price are required for published listings.' });
      return;
    }

    const db = readDb();
    const id = `car-${Date.now()}`;
    const createdAt = new Date().toISOString();

    const rawGallery = Array.isArray(body.gallery) ? body.gallery.slice(0, 35) : [];
    const newCar = normalizeCarRecord({
      ...body,
      id,
      listingCode: body.listingCode || `SM-${String(Date.now()).slice(-4)}`,
      slug: `${slugifyCar(year || 2023, brand, model)}-${id.slice(-4)}`,
      brand,
      model,
      year: year || 2023,
      priceInr: Math.max(0, priceInr),
      gallery: rawGallery,
      images: rawGallery.length > 0 ? rawGallery.map((g: { url: string }) => g.url) : body.images || [],
      createdAt,
    });

    db.cars.unshift(newCar);
    writeDb(db);
    res.status(201).json(newCar);
  });

  // Admin Edit / Update Car
  app.put('/api/admin/cars/:id', requireAdmin, (req, res) => {
    const db = readDb();
    const index = db.cars.findIndex((c) => c.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Car listing not found.' });
      return;
    }

    const existing = db.cars[index];
    const patch = req.body || {};
    const gallery = Array.isArray(patch.gallery) ? patch.gallery.slice(0, 35) : existing.gallery;
    const priceChanged = patch.priceInr !== undefined && Number(patch.priceInr) !== existing.priceInr;

    const updated = normalizeCarRecord({
      ...existing,
      ...patch,
      id: existing.id,
      createdAt: existing.createdAt,
      gallery,
      images: gallery.length > 0 ? gallery.map((g: { url: string }) => g.url) : existing.images,
      priceLastUpdated: priceChanged ? new Date().toISOString().slice(0, 10) : patch.priceLastUpdated || existing.priceLastUpdated,
    });

    db.cars[index] = updated;
    writeDb(db);
    res.json(updated);
  });

  // Admin Delete Car
  app.delete('/api/admin/cars/:id', requireAdmin, (req, res) => {
    const db = readDb();
    const before = db.cars.length;
    db.cars = db.cars.filter((c) => c.id !== req.params.id);
    if (db.cars.length === before) {
      res.status(404).json({ error: 'Car listing not found.' });
      return;
    }
    writeDb(db);
    res.json({ ok: true });
  });

  // Admin Enquiries Management
  app.get('/api/admin/enquiries', requireAdmin, (_req, res) => {
    const db = readDb();
    res.json(db.enquiries);
  });

  app.patch('/api/admin/enquiries/:id', requireAdmin, (req, res) => {
    const db = readDb();
    const item = db.enquiries.find((e) => e.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Enquiry not found.' });
      return;
    }
    if (req.body?.status) {
      item.status = req.body.status;
    }
    writeDb(db);
    res.json(item);
  });

  app.delete('/api/admin/enquiries/:id', requireAdmin, (req, res) => {
    const db = readDb();
    db.enquiries = db.enquiries.filter((e) => e.id !== req.params.id);
    writeDb(db);
    res.json({ ok: true });
  });

  // Admin Sell Requests Management
  app.get('/api/admin/sell-requests', requireAdmin, (_req, res) => {
    const db = readDb();
    res.json(db.sellRequests);
  });

  app.patch('/api/admin/sell-requests/:id', requireAdmin, (req, res) => {
    const db = readDb();
    const item = db.sellRequests.find((s) => s.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Sell request not found.' });
      return;
    }
    if (req.body?.status) {
      item.status = req.body.status;
    }
    writeDb(db);
    res.json(item);
  });

  app.delete('/api/admin/sell-requests/:id', requireAdmin, (req, res) => {
    const db = readDb();
    db.sellRequests = db.sellRequests.filter((s) => s.id !== req.params.id);
    writeDb(db);
    res.json({ ok: true });
  });

  // Admin Business Location Settings Update
  app.put('/api/admin/location', requireAdmin, (req, res) => {
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
  });

  // Admin Server-Side Geocoding Helper (avoids browser CORS limits; uses Geocoding REST API)
  app.post('/api/admin/location/geocode', requireAdmin, async (req, res) => {
    const addressQuery = String(req.body?.address || '').trim();
    if (!addressQuery || addressQuery.length < 4) {
      res.status(400).json({ error: 'Please enter a street address or city first to look up coordinates.' });
      return;
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '';
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
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Strada Motors server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
