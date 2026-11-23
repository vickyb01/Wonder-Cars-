import fs from 'fs';
import path from 'path';
import type { Request, Response } from 'express';
import { readDb, writeDb, logActivity } from '../services/store.service.ts';
import { isAdminRequest } from '../middleware/auth.middleware.ts';
import { normalizeCarRecord } from '../utils/carDefaults.ts';
import { matchesBrandFilter } from '../utils/brands.ts';
import { DEFAULT_EMI_CONFIG, estimateCarEmiWithConfig } from '../utils/emi.ts';
import { slugifyCar } from '../utils/slugify.ts';
import type { Car } from '../models/types.ts';
import { DATA_DIR, APP_BASE_URL } from '../config/index.ts';

export function getCars(req: Request, res: Response): void {
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
}

export function getCarByIdOrSlug(req: Request, res: Response): void {
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
        // Prioritize same brand / company cars first
        if (c.brand?.toLowerCase() === car.brand?.toLowerCase()) s += 20;
        if (c.model?.toLowerCase() === car.model?.toLowerCase()) s += 5;
        if (c.bodyType === car.bodyType) s += 2;
        if (c.fuelType === car.fuelType) s += 1;
        if (Math.abs(c.year - car.year) <= 2) s += 1;
        if (car.priceInr > 0 && Math.abs(c.priceInr - car.priceInr) / car.priceInr <= 0.3) s += 2;
        return s;
      };
      return score(b) - score(a);
    })
    .slice(0, 8);

  const sellerOtherCars = availableOthers
    .filter((c) => c.sellerName === car.sellerName)
    .slice(0, 3);

  res.json({ car, similar, sellerOtherCars });
}

export function createCar(req: Request, res: Response): void {
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
    listingCode: body.listingCode || `WC-${String(Date.now()).slice(-4)}`,
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
  logActivity('admin', 'Created Car', `Added ${newCar.year} ${newCar.brand} ${newCar.model} (${newCar.listingCode})`);
  res.status(201).json(newCar);
}

export function updateCar(req: Request, res: Response): void {
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
  logActivity('admin', 'Updated Car', `Updated ${updated.year} ${updated.brand} ${updated.model}`);
  res.json(updated);
}

export function deleteCar(req: Request, res: Response): void {
  const db = readDb();
  const car = db.cars.find((c) => c.id === req.params.id);
  if (!car) {
    res.status(404).json({ error: 'Car listing not found.' });
    return;
  }
  db.cars = db.cars.filter((c) => c.id !== req.params.id);
  writeDb(db);
  logActivity('admin', 'Deleted Car', `Deleted ${car.year} ${car.brand} ${car.model} (${car.listingCode})`);
  res.json({ ok: true });
}

export function duplicateCar(req: Request, res: Response): void {
  const db = readDb();
  const source = db.cars.find((c) => c.id === req.params.id);
  if (!source) {
    res.status(404).json({ error: 'Source car listing not found.' });
    return;
  }
  const newId = `car-${Date.now()}`;
  const duplicated: Car = normalizeCarRecord({
    ...source,
    id: newId,
    listingCode: `WC-${String(Date.now()).slice(-4)}`,
    slug: `${slugifyCar(source.year, source.brand, source.model)}-copy-${newId.slice(-4)}`,
    model: `${source.model} (Copy)`,
    status: 'Draft',
    featured: false,
    createdAt: new Date().toISOString(),
  });
  db.cars.unshift(duplicated);
  writeDb(db);
  logActivity('admin', 'Duplicated Car', `Created draft copy of ${source.brand} ${source.model}`);
  res.status(201).json(duplicated);
}

export function patchCarStatus(req: Request, res: Response): void {
  const db = readDb();
  const car = db.cars.find((c) => c.id === req.params.id);
  if (!car) {
    res.status(404).json({ error: 'Car listing not found.' });
    return;
  }
  const status = req.body?.status;
  if (['Available', 'Sold', 'Reserved', 'Draft'].includes(status)) {
    car.status = status;
    writeDb(db);
    logActivity('admin', 'Updated Car Status', `${car.brand} ${car.model} status set to ${status}`);
    res.json(car);
    return;
  }
  res.status(400).json({ error: 'Invalid car status.' });
}

export function patchCarFeatured(req: Request, res: Response): void {
  const db = readDb();
  const car = db.cars.find((c) => c.id === req.params.id);
  if (!car) {
    res.status(404).json({ error: 'Car listing not found.' });
    return;
  }
  car.featured = Boolean(req.body?.featured);
  writeDb(db);
  logActivity('admin', 'Toggled Car Featured', `${car.brand} ${car.model} featured: ${car.featured}`);
  res.json(car);
}

export function getCarBrochurePdf(req: Request, res: Response): void {
  const db = readDb();
  const id = String(req.params.id || '').trim();
  const car = db.cars.find(
    (c) => c.id === id || c.slug === id || c.listingCode.toLowerCase() === id.toLowerCase()
  );

  if (!car) {
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Vehicle Not Found - Wonder Cars</title></head>
        <body style="font-family: sans-serif; background: #0B0E14; color: #fff; text-align: center; padding: 50px;">
          <h2>Vehicle Not Found</h2>
          <p>The requested vehicle brochure could not be located in our showroom inventory.</p>
          <a href="/" style="color: #F59E0B;">Return to Showroom</a>
        </body>
      </html>
    `);
    return;
  }

  const html = generateCarBrochureHtml(car);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

export function saveCarBrochureFile(
  car: Car,
  baseUrl = APP_BASE_URL
): { filePath: string; fileName: string; brochureHtml: string; brochureUrl: string } {
  const brochureDir = path.join(DATA_DIR, 'brochures');
  if (!fs.existsSync(brochureDir)) {
    fs.mkdirSync(brochureDir, { recursive: true });
  }
  const brochureHtml = generateCarBrochureHtml(car, baseUrl);
  const cleanBrand = (car.brand || 'Car').replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanModel = (car.model || 'Model').replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `WonderCars-${cleanBrand}-${cleanModel}-Brochure.html`;
  const filePath = path.join(brochureDir, `${car.id}.html`);
  fs.writeFileSync(filePath, brochureHtml, 'utf-8');
  const brochureUrl = `${baseUrl.replace(/\/$/, '')}/api/cars/${car.id}/brochure`;
  return { filePath, fileName, brochureHtml, brochureUrl };
}

export function generateCarBrochureHtml(car: Car, baseUrl = APP_BASE_URL): string {
  const priceFormatted = `₹${car.priceInr.toLocaleString('en-IN')}`;
  const kmFormatted = `${car.kilometres.toLocaleString('en-IN')} km`;
  const warrantyText = car.warrantyPeriod && car.warrantyPeriod !== 'No Warranty'
    ? `${car.warrantyPeriod} Warranty Included`
    : '6 Months Certified Warranty Included';

  const heroImage = car.images?.[0] || 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80';
  const additionalImages = (car.images || []).slice(1, 4);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${car.year} ${car.brand} ${car.model} (${car.listingCode}) — Wonder Cars Official Brochure</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #0d1117;
      color: #1e293b;
      line-height: 1.5;
      padding-bottom: 40px;
    }

    /* Interactive Top Action Bar (hidden on print) */
    .top-action-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #161b22;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }

    .action-brand {
      color: #f59e0b;
      font-weight: 800;
      font-size: 15px;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-buttons {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 700;
      padding: 9px 18px;
      border-radius: 8px;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: #000;
      box-shadow: 0 2px 10px rgba(245, 158, 11, 0.35);
    }
    .btn-primary:hover {
      background: #eab308;
    }

    .btn-whatsapp {
      background-color: #10b981;
      color: #fff;
    }
    .btn-whatsapp:hover {
      background-color: #059669;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: #e2e8f0;
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.18);
    }

    /* Main Printable Sheet */
    .document-page {
      max-width: 900px;
      margin: 24px auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      padding: 36px 40px;
      border: 1px solid #e2e8f0;
      position: relative;
    }

    /* Dealership Header */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #f59e0b;
      padding-bottom: 18px;
      margin-bottom: 24px;
      gap: 20px;
    }

    .brand-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      line-height: 1.2;
    }

    .brand-tagline {
      font-size: 11px;
      font-weight: 700;
      color: #d97706;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      margin-top: 3px;
    }

    .brand-address {
      font-size: 11.5px;
      color: #64748b;
      margin-top: 5px;
      line-height: 1.4;
      max-width: 440px;
    }

    .doc-meta {
      text-align: right;
    }

    .listing-badge {
      display: inline-block;
      background: #0f172a;
      color: #f59e0b;
      font-family: 'Space Grotesk', monospace;
      font-weight: 700;
      font-size: 13px;
      padding: 5px 12px;
      border-radius: 6px;
      letter-spacing: 1px;
    }

    .doc-status {
      font-size: 11px;
      color: #10b981;
      font-weight: 700;
      text-transform: uppercase;
      margin-top: 5px;
    }

    /* Vehicle Banner */
    .vehicle-intro {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
      margin-bottom: 20px;
    }

    .car-main-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }

    .car-variant {
      font-size: 14px;
      font-weight: 600;
      color: #64748b;
      margin-top: 4px;
    }

    .car-pricing {
      text-align: right;
      shrink: 0;
    }

    .car-price {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 26px;
      font-weight: 800;
      color: #d97706;
      line-height: 1;
    }

    .car-price-note {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      margin-top: 4px;
    }

    /* Image Gallery Grid */
    .image-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }

    .hero-img {
      width: 100%;
      height: 280px;
      object-fit: cover;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      background: #f1f5f9;
    }

    .thumb-column {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .thumb-img {
      width: 100%;
      height: 84px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      background: #f1f5f9;
    }

    /* Quick Specifications Grid */
    .section-heading {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0f172a;
      border-left: 3px solid #f59e0b;
      padding-left: 10px;
      margin-bottom: 12px;
    }

    .spec-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 12.5px;
    }

    .spec-table td {
      padding: 9px 12px;
      border-bottom: 1px solid #e2e8f0;
    }

    .spec-table tr:nth-child(even) {
      background-color: #f8fafc;
    }

    .spec-label {
      font-weight: 600;
      color: #64748b;
      width: 25%;
    }

    .spec-val {
      font-weight: 700;
      color: #0f172a;
      width: 25%;
    }

    /* 210-Point Inspection Section */
    .inspection-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }

    .inspection-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 10px;
    }

    .check-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 600;
      color: #1e293b;
    }

    .check-icon {
      color: #10b981;
      font-weight: 800;
      font-size: 14px;
    }

    /* Certification Guarantee */
    .guarantee-box {
      border: 1.5px dashed #f59e0b;
      background: #fffbeb;
      border-radius: 10px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
    }

    .guarantee-title {
      font-size: 14px;
      font-weight: 800;
      color: #92400e;
    }

    .guarantee-desc {
      font-size: 11.5px;
      color: #78350f;
      margin-top: 3px;
    }

    .seal-badge {
      background: #f59e0b;
      color: #000;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 11px;
      font-weight: 800;
      padding: 6px 12px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }

    /* Dealership Contact Footer */
    .doc-footer {
      border-top: 2px solid #e2e8f0;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11.5px;
      color: #64748b;
    }

    .footer-highlight {
      color: #0f172a;
      font-weight: 700;
    }

    /* Print Formatting Rules */
    @media print {
      body {
        background: #ffffff !important;
        color: #000000 !important;
        padding-bottom: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .document-page {
        box-shadow: none !important;
        border: none !important;
        margin: 0 !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
      @page {
        size: A4 portrait;
        margin: 12mm 15mm;
      }
    }
  </style>
</head>
<body>

  <!-- Top Sticky Bar for user controls -->
  <div class="top-action-bar no-print">
    <div class="action-brand">
      <span>★ WONDER CARS SPEC SHEET & BROCHURE</span>
    </div>
    <div class="action-buttons">
      <button class="btn btn-primary" onclick="window.print()">
        🖨️ Print / Save as PDF
      </button>
      <a class="btn btn-whatsapp" id="waShareBtn" href="#" target="_blank">
        💬 Send via WhatsApp
      </a>
      <a class="btn btn-secondary" href="/">
        ← Showroom
      </a>
    </div>
  </div>

  <div class="document-page">
    
    <!-- Dealership Header -->
    <div class="doc-header">
      <div>
        <div class="brand-title">WONDER CARS</div>
        <div class="brand-tagline">Certified Pre-Owned Luxury Gallery</div>
        <div class="brand-address">
          Shop No.-3, Rajkamal Sadan, Preet Vihar, Commercial Complex, Delhi-92.<br>
          <strong>Dealership Contact:</strong> Naman Jain · +91 83840 68347 · amanjain.nj784@gmail.com
        </div>
      </div>
      <div class="doc-meta">
        <div class="listing-badge">${car.listingCode}</div>
        <div class="doc-status">✓ 100% Verified & Inspected</div>
        <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
      </div>
    </div>

    <!-- Vehicle Intro & Price -->
    <div class="vehicle-intro">
      <div>
        <h1 class="car-main-title">${car.year} ${car.brand} ${car.model}</h1>
        <div class="car-variant">${car.variant} · ${car.color} Exterior</div>
      </div>
      <div class="car-pricing">
        <div class="car-price">${priceFormatted}</div>
        <div class="car-price-note">${car.priceType === 'Fixed' ? 'Fixed Showroom Price' : 'Negotiable Price'} · Ex-Gallery</div>
      </div>
    </div>

    <!-- Images Showcase -->
    <div class="image-grid">
      <img src="${heroImage}" alt="${car.brand} ${car.model}" class="hero-img" />
      <div class="thumb-column">
        ${
          additionalImages.length > 0
            ? additionalImages.map(img => `<img src="${img}" alt="Angle" class="thumb-img" />`).join('')
            : `<img src="${heroImage}" alt="Angle" class="thumb-img" />`
        }
      </div>
    </div>

    <!-- Quick Specifications Table -->
    <div class="section-heading">Certified Vehicle Specifications</div>
    <table class="spec-table">
      <tr>
        <td class="spec-label">Model Year</td>
        <td class="spec-val">${car.year}</td>
        <td class="spec-label">Kilometers</td>
        <td class="spec-val">${kmFormatted}</td>
      </tr>
      <tr>
        <td class="spec-label">Fuel Type</td>
        <td class="spec-val">${car.fuelType}</td>
        <td class="spec-label">Transmission</td>
        <td class="spec-val">${car.transmission}</td>
      </tr>
      <tr>
        <td class="spec-label">Ownership</td>
        <td class="spec-val">${car.ownership}</td>
        <td class="spec-label">Registration State</td>
        <td class="spec-val">${car.registrationState}</td>
      </tr>
      <tr>
        <td class="spec-label">Engine / Power</td>
        <td class="spec-val">${car.engine || 'Standard'} ${car.power ? `(${car.power})` : ''}</td>
        <td class="spec-label">Drivetrain</td>
        <td class="spec-val">${car.drivetrain || 'Standard'}</td>
      </tr>
      <tr>
        <td class="spec-label">Insurance Valid Until</td>
        <td class="spec-val">${car.insuranceValidUntil || 'Valid Policy'}</td>
        <td class="spec-label">Certified Warranty</td>
        <td class="spec-val" style="color: #10b981;">${warrantyText}</td>
      </tr>
    </table>

    <!-- 210-Point Quality Inspection Summary -->
    <div class="inspection-box">
      <div class="section-heading" style="border: none; padding-left: 0; margin-bottom: 6px;">
        ★ 210-Point Inspection & Verification Passed
      </div>
      <div class="inspection-grid">
        <div class="check-item"><span class="check-icon">✓</span> Engine & Drivetrain Tested</div>
        <div class="check-item"><span class="check-icon">✓</span> Transmission Smoothness OK</div>
        <div class="check-item"><span class="check-icon">✓</span> Non-Accidental Verified</div>
        <div class="check-item"><span class="check-icon">✓</span> Suspension & Brakes Inspected</div>
        <div class="check-item"><span class="check-icon">✓</span> Electronics & AC Tested</div>
        <div class="check-item"><span class="check-icon">✓</span> Genuine Odometer Verified</div>
        <div class="check-item"><span class="check-icon">✓</span> Complete RC & Document Check</div>
        <div class="check-item"><span class="check-icon">✓</span> No Bank / Hypothecation Issues</div>
        <div class="check-item"><span class="check-icon">✓</span> Professional Detailing Done</div>
      </div>
    </div>

    <!-- Dealership Guarantee Banner -->
    <div class="guarantee-box">
      <div>
        <div class="guarantee-title">Wonder Cars Certified Ownership Guarantee</div>
        <div class="guarantee-desc">
          Every vehicle undergoes our 210-point rigorous technical inspection. Comes with peace-of-mind warranty and clear legal title guarantee.
        </div>
      </div>
      <div class="seal-badge">★ 100% Certified ★</div>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>
        <span class="footer-highlight">Wonder Cars Preet Vihar</span> · Shop No.-3, Rajkamal Sadan, Preet Vihar, Delhi-92
      </div>
      <div>
        Call / WhatsApp: <span class="footer-highlight">+91 83840 68347</span> · Mon–Sun (10:00 AM – 8:00 PM)
      </div>
    </div>

  </div>

  <script>
    const cleanPhone = '8384068347';
    const waText = encodeURIComponent(
      '★ Wonder Cars Official Car Brochure ★\\n' +
      'Vehicle: ${car.year} ${car.brand} ${car.model} (${car.listingCode})\\n' +
      'Price: ${priceFormatted}\\n' +
      'Fuel/Trans: ${car.fuelType} · ${car.transmission}\\n' +
      'Warranty: ${warrantyText}\\n' +
      'Location: Shop No.-3, Rajkamal Sadan, Preet Vihar, Delhi-92\\n\\n' +
      'View Full Brochure: ' + window.location.href
    );
    const waLink = document.getElementById('waShareBtn');
    if (waLink) {
      waLink.href = 'https://wa.me/?text=' + waText;
    }

    // Auto-trigger print / save-as-PDF prompt when auto=true or print=true
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auto') === 'true' || urlParams.get('print') === 'true') {
      window.addEventListener('load', function() {
        setTimeout(function() {
          window.print();
        }, 500);
      });
    }
  </script>

</body>
</html>`;
}


