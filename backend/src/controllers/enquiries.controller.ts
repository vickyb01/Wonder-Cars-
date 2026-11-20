import type { Request, Response } from 'express';
import { readDb, writeDb, logActivity } from '../services/store.service.ts';
import type { Enquiry, NotificationItem } from '../models/types.ts';

export function createEnquiry(req: Request, res: Response): void {
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
    status: 'New',
    createdAt: new Date().toISOString(),
  };

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

