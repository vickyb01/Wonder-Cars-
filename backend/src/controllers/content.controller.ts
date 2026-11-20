import type { Request, Response } from 'express';
import { readDb, writeDb, logActivity } from '../services/store.service.ts';
import type { BrandItem, CategoryItem, TestimonialItem } from '../models/types.ts';

// Categories
export function getCategories(_req: Request, res: Response): void {
  const db = readDb();
  res.json(db.categories || []);
}

export function createCategory(req: Request, res: Response): void {
  const { name, icon, description } = req.body || {};
  if (!name) {
    res.status(400).json({ error: 'Category name is required.' });
    return;
  }
  const db = readDb();
  const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const newCat: CategoryItem = {
    id: `cat-${Date.now()}`,
    name: String(name).trim(),
    slug,
    icon: icon ? String(icon) : 'Car',
    description: description ? String(description) : undefined,
  };
  db.categories = [...(db.categories || []), newCat];
  writeDb(db);
  logActivity('admin', 'Added Category', `Added category: ${newCat.name}`);
  res.status(201).json(newCat);
}

export function updateCategory(req: Request, res: Response): void {
  const db = readDb();
  const cat = (db.categories || []).find((c) => c.id === req.params.id);
  if (!cat) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }
  const { name, icon, description } = req.body || {};
  if (name) {
    cat.name = String(name).trim();
    cat.slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  if (icon) cat.icon = String(icon);
  if (description !== undefined) cat.description = String(description);
  writeDb(db);
  logActivity('admin', 'Updated Category', `Updated category: ${cat.name}`);
  res.json(cat);
}

export function deleteCategory(req: Request, res: Response): void {
  const db = readDb();
  const cat = (db.categories || []).find((c) => c.id === req.params.id);
  if (!cat) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }
  db.categories = db.categories.filter((c) => c.id !== req.params.id);
  writeDb(db);
  logActivity('admin', 'Deleted Category', `Deleted category: ${cat.name}`);
  res.json({ ok: true });
}

// Brands
export function getBrands(_req: Request, res: Response): void {
  const db = readDb();
  res.json(db.brands || []);
}

export function createBrand(req: Request, res: Response): void {
  const { name, logo, origin, description } = req.body || {};
  if (!name) {
    res.status(400).json({ error: 'Brand name is required.' });
    return;
  }
  const db = readDb();
  const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const newBrand: BrandItem = {
    id: `brand-${Date.now()}`,
    name: String(name).trim(),
    slug,
    logo: logo ? String(logo) : undefined,
    origin: origin ? String(origin) : undefined,
    description: description ? String(description) : undefined,
  };
  db.brands = [...(db.brands || []), newBrand];
  writeDb(db);
  logActivity('admin', 'Added Brand', `Added brand: ${newBrand.name}`);
  res.status(201).json(newBrand);
}

export function updateBrand(req: Request, res: Response): void {
  const db = readDb();
  const brand = (db.brands || []).find((b) => b.id === req.params.id);
  if (!brand) {
    res.status(404).json({ error: 'Brand not found.' });
    return;
  }
  const { name, logo, origin, description } = req.body || {};
  if (name) {
    brand.name = String(name).trim();
    brand.slug = brand.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  if (logo !== undefined) brand.logo = String(logo);
  if (origin !== undefined) brand.origin = String(origin);
  if (description !== undefined) brand.description = String(description);
  writeDb(db);
  logActivity('admin', 'Updated Brand', `Updated brand: ${brand.name}`);
  res.json(brand);
}

export function deleteBrand(req: Request, res: Response): void {
  const db = readDb();
  const brand = (db.brands || []).find((b) => b.id === req.params.id);
  if (!brand) {
    res.status(404).json({ error: 'Brand not found.' });
    return;
  }
  db.brands = db.brands.filter((b) => b.id !== req.params.id);
  writeDb(db);
  logActivity('admin', 'Deleted Brand', `Deleted brand: ${brand.name}`);
  res.json({ ok: true });
}

// Homepage
export function getHomepageSettings(_req: Request, res: Response): void {
  const db = readDb();
  res.json(db.homepageSettings);
}

export function updateHomepageSettings(req: Request, res: Response): void {
  const db = readDb();
  db.homepageSettings = {
    ...db.homepageSettings,
    ...(req.body || {}),
  };
  writeDb(db);
  logActivity('admin', 'Updated Homepage Settings', 'Modified hero, promotional banner, and CTAs.');
  res.json(db.homepageSettings);
}

// About Us
export function getAboutSettings(_req: Request, res: Response): void {
  const db = readDb();
  res.json(db.aboutSettings);
}

export function updateAboutSettings(req: Request, res: Response): void {
  const db = readDb();
  db.aboutSettings = {
    ...db.aboutSettings,
    ...(req.body || {}),
  };
  writeDb(db);
  logActivity('admin', 'Updated About Us Settings', 'Modified owner profile, story, and gallery.');
  res.json(db.aboutSettings);
}

// Testimonials
export function getPublicTestimonials(_req: Request, res: Response): void {
  const db = readDb();
  const list = (db.testimonials || []).filter((t) => t.published);
  res.json(list);
}

export function getAdminTestimonials(_req: Request, res: Response): void {
  const db = readDb();
  res.json(db.testimonials || []);
}

export function createTestimonial(req: Request, res: Response): void {
  const { name, carPurchased, city, rating, review, customerImage, published, date } = req.body || {};
  const customerName = String(name || req.body?.customerName || '').trim();
  if (!customerName || !review) {
    res.status(400).json({ error: 'Customer name and review are required.' });
    return;
  }
  const db = readDb();
  const newTestimonial: TestimonialItem = {
    id: `test-${Date.now()}`,
    customerName,
    name: customerName,
    carPurchased: String(carPurchased || 'Certified Luxury Car'),
    city: String(city || 'Delhi NCR'),
    rating: Math.max(1, Math.min(5, Number(rating) || 5)),
    review: String(review).trim(),
    customerImage: customerImage ? String(customerImage) : undefined,
    published: published !== false,
    date: date ? String(date) : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  };
  db.testimonials = [newTestimonial, ...(db.testimonials || [])];
  writeDb(db);
  logActivity('admin', 'Added Testimonial', `Added review by ${customerName}`);
  res.status(201).json(newTestimonial);
}

export function updateTestimonial(req: Request, res: Response): void {
  const db = readDb();
  const item = (db.testimonials || []).find((t) => t.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Testimonial not found.' });
    return;
  }
  const patch = req.body || {};
  if (patch.name || patch.customerName) {
    const cName = String(patch.customerName || patch.name).trim();
    item.customerName = cName;
    item.name = cName;
  }
  if (patch.carPurchased) item.carPurchased = String(patch.carPurchased).trim();
  if (patch.city) item.city = String(patch.city).trim();
  if (patch.rating) item.rating = Math.max(1, Math.min(5, Number(patch.rating)));
  if (patch.review) item.review = String(patch.review).trim();
  if (patch.customerImage !== undefined) item.customerImage = String(patch.customerImage);
  if (typeof patch.published === 'boolean') item.published = patch.published;
  if (patch.date) item.date = String(patch.date);
  writeDb(db);
  logActivity('admin', 'Updated Testimonial', `Updated review by ${item.customerName || item.name || 'customer'}`);
  res.json(item);
}

export function deleteTestimonial(req: Request, res: Response): void {
  const db = readDb();
  const item = (db.testimonials || []).find((t) => t.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Testimonial not found.' });
    return;
  }
  db.testimonials = db.testimonials.filter((t) => t.id !== req.params.id);
  writeDb(db);
  logActivity('admin', 'Deleted Testimonial', `Deleted review by ${item.customerName || item.name || 'customer'}`);
  res.json({ ok: true });
}

