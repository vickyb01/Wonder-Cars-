import type { Request, Response } from 'express';
import { readDb, writeDb, logActivity } from '../services/store.service.ts';
import { isAdminRequest } from '../middleware/auth.middleware.ts';
import { normalizeCarRecord } from '../utils/carDefaults.ts';
import { matchesBrandFilter } from '../utils/brands.ts';
import { DEFAULT_EMI_CONFIG, estimateCarEmiWithConfig } from '../utils/emi.ts';
import { slugifyCar } from '../utils/slugify.ts';
import type { Car } from '../models/types.ts';

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

