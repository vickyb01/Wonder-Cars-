import type { Request, Response } from 'express';
import { readDb, writeDb, logActivity } from '../services/store.service.ts';
import type { Enquiry, NotificationItem, Car } from '../models/types.ts';
import {
  sendShowroomOwnerBookingEmail,
  sendCustomerConfirmationEmail,
} from '../services/email.service.ts';
import { sendAutomaticCustomerWhatsappDocument } from '../services/whatsapp.service.ts';
import { saveCarBrochureFile, generateCarBrochureHtml } from './cars.controller.ts';

// Track recent submissions to prevent duplicate PDF & email dispatches
const recentSubmissions = new Map<string, number>();

function checkDuplicateBooking(phone: string, carId?: string, preferredDate?: string): boolean {
  const clean = phone.replace(/\D/g, '').slice(-10);
  const key = `${clean}_${carId || 'none'}_${preferredDate || 'none'}`;
  const now = Date.now();
  const lastTime = recentSubmissions.get(key);
  if (lastTime && now - lastTime < 25_000) {
    return true;
  }
  recentSubmissions.set(key, now);
  if (recentSubmissions.size > 200) {
    for (const [k, v] of recentSubmissions.entries()) {
      if (now - v > 60_000) recentSubmissions.delete(k);
    }
  }
  return false;
}

export async function createEnquiry(req: Request, res: Response): Promise<void> {
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

  // Prevent duplicate PDF sending on repeated submissions
  const isDuplicate = checkDuplicateBooking(phone, body.carId, body.preferredDate);
  if (isDuplicate) {
    console.warn(`[EnquiryController] Duplicate booking submission prevented for ${phone}. Skipping duplicate PDF and email dispatches.`);
    const existing = db.enquiries.find((e) => e.phone.replace(/\D/g, '').slice(-10) === phone.replace(/\D/g, '').slice(-10));
    res.status(200).json(existing || { id: `enq-dup-${Date.now()}`, message: 'Booking already recorded' });
    return;
  }

  const carTitle = body.carTitle ? String(body.carTitle) : undefined;
  const newEnquiry: Enquiry = {
    id: `enq-${Date.now()}`,
    type,
    carId: body.carId ? String(body.carId) : undefined,
    carTitle,
    name,
    email: email || 'Not Provided',
    phone,
    preferredDate: body.preferredDate ? String(body.preferredDate) : undefined,
    preferredTime: body.preferredTime ? String(body.preferredTime) : undefined,
    city: body.city ? String(body.city) : undefined,
    offerPriceInr: body.offerPriceInr ? Number(body.offerPriceInr) : undefined,
    message,
    source: body.source ? String(body.source).trim() : 'Website Booking Form',
    status: 'New',
    createdAt: new Date().toISOString(),
  };

  // 1. Save booking to database first (guarantees booking is saved even if WhatsApp/Email fails)
  db.enquiries.unshift(newEnquiry);
  const newNotif: NotificationItem = {
    id: `notif-${Date.now()}`,
    title: `New Enquiry: ${type === 'test-drive' ? 'Test Drive' : type === 'offer' ? 'Price Offer' : 'Car Enquiry'}`,
    message: `${name} enquired about ${carTitle || 'a car'} (${phone})`,
    type: 'enquiry',
    read: false,
    link: '/admin?tab=enquiries',
    createdAt: new Date().toISOString(),
  };
  db.notifications = [newNotif, ...(db.notifications || [])].slice(0, 100);
  writeDb(db);
  logActivity('System', 'New Enquiry Received', `${name} submitted enquiry for ${carTitle || 'car'}`);
  
  // 2. Find actual car details from database using selected carId
  let car: Car | undefined;
  const rawCarId = String(body.carId || '').trim();
  if (rawCarId) {
    car = db.cars.find(
      (c) =>
        c.id === rawCarId ||
        c.slug === rawCarId ||
        (c.listingCode && c.listingCode.toLowerCase() === rawCarId.toLowerCase())
    );
  }

  // 3. Run existing PDF/brochure generation logic (reuses existing design & layout)
  let brochureHtml = '';
  let brochureUrl = '';
  if (car) {
    try {
      const saved = saveCarBrochureFile(car);
      brochureHtml = saved.brochureHtml;
      brochureUrl = saved.brochureUrl;
    } catch (err) {
      console.error('[EnquiryController] Error generating brochure file:', err);
      brochureHtml = generateCarBrochureHtml(car);
    }
  }

  // 4. Automatically send existing PDF as document attachment to Customer's WhatsApp
  let waDelivery: any = { success: false, status: 'pending_credentials' };
  try {
    waDelivery = await sendAutomaticCustomerWhatsappDocument(newEnquiry, car, brochureUrl, brochureHtml);
  } catch (err) {
    console.error('[EnquiryController] Error dispatching automatic WhatsApp document:', err);
    waDelivery = {
      success: false,
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // 5 & 6. Dispatch completely separate Owner Notification Email & Customer Confirmation Email
  const [ownerResult, customerResult] = await Promise.allSettled([
    sendShowroomOwnerBookingEmail(newEnquiry, car, brochureHtml),
    email && email !== 'Not Provided'
      ? sendCustomerConfirmationEmail(newEnquiry, car)
      : Promise.resolve({ success: false, message: 'No customer email provided' }),
  ]);

  if (ownerResult.status === 'rejected') {
    console.error('[EnquiryController] Error sending showroom owner notification email:', ownerResult.reason);
  }
  if (customerResult.status === 'rejected') {
    console.error('[EnquiryController] Error sending customer confirmation email:', customerResult.reason);
  }

  // Attach delivery status so the frontend and database have verifiable confirmation
  newEnquiry.whatsappDelivery = waDelivery;

  res.status(201).json(newEnquiry);
}

export function getEnquiries(_req: Request, res: Response): void {
  const db = readDb();
  res.json(db.enquiries);
}

export function exportEnquiriesCsv(_req: Request, res: Response): void {
  const db = readDb();
  const enquiries = db.enquiries || [];
  const headers = [
    'ID',
    'Date',
    'Status',
    'Type',
    'Customer Name',
    'Phone',
    'Email',
    'Car Interested',
    'City',
    'Offer Price INR',
    'Source',
    'Follow-up Date',
    'Internal Notes',
    'Message',
  ];
  const escapeCsv = (str: unknown) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };
  const rows = enquiries.map((e) =>
    [
      escapeCsv(e.id),
      escapeCsv(new Date(e.createdAt).toLocaleDateString('en-IN')),
      escapeCsv(e.status),
      escapeCsv(e.type),
      escapeCsv(e.name),
      escapeCsv(e.phone),
      escapeCsv(e.email),
      escapeCsv(e.carTitle || ''),
      escapeCsv(e.city || ''),
      escapeCsv(e.offerPriceInr || ''),
      escapeCsv(e.source || 'Website Form'),
      escapeCsv(e.followUpDate || ''),
      escapeCsv(e.notes || ''),
      escapeCsv(e.message || ''),
    ].join(',')
  );

  const csvContent = [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="wonder-cars-enquiries.csv"');
  res.send(csvContent);
}

export function patchEnquiry(req: Request, res: Response): void {
  const db = readDb();
  const item = db.enquiries.find((e) => e.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Enquiry not found.' });
    return;
  }
  if (req.body?.status) item.status = req.body.status;
  if (req.body?.notes !== undefined) item.notes = String(req.body.notes);
  if (req.body?.followUpDate !== undefined) item.followUpDate = String(req.body.followUpDate);
  if (req.body?.assignedTo !== undefined) item.assignedTo = String(req.body.assignedTo);
  writeDb(db);
  res.json(item);
}

export function deleteEnquiry(req: Request, res: Response): void {
  const db = readDb();
  db.enquiries = db.enquiries.filter((e) => e.id !== req.params.id);
  writeDb(db);
  res.json({ ok: true });
}

