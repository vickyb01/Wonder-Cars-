import type { Request, Response } from 'express';
import { readDb, writeDb, logActivity } from '../services/store.service.ts';
import type { NotificationItem, SellRequest } from '../models/types.ts';

export function createSellRequest(req: Request, res: Response): void {
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
    city: String(body.city || 'Delhi NCR'),
    expectedPriceInr: Math.max(0, expectedPriceInr),
    ownerName,
    ownerPhone,
    ownerEmail,
    notes: String(body.notes || '').trim(),
    status: 'Pending Review',
    createdAt: new Date().toISOString(),
  };

  db.sellRequests.unshift(record);
  const newNotif: NotificationItem = {
    id: `notif-${Date.now()}`,
    title: 'New Sell Car Valuation Request',
    message: `${ownerName} submitted valuation request for ${year} ${brand} ${model} (${ownerPhone})`,
    type: 'lead',
    read: false,
    link: '/admin?tab=sell-requests',
    createdAt: new Date().toISOString(),
  };
  db.notifications = [newNotif, ...(db.notifications || [])].slice(0, 100);
  writeDb(db);
  logActivity('System', 'New Sell Request Received', `${ownerName} submitted ${year} ${brand} ${model}`);
  res.status(201).json(record);
}

export function getSellRequests(_req: Request, res: Response): void {
  const db = readDb();
  res.json(db.sellRequests);
}

export function patchSellRequest(req: Request, res: Response): void {
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
}

export function deleteSellRequest(req: Request, res: Response): void {
  const db = readDb();
  db.sellRequests = db.sellRequests.filter((s) => s.id !== req.params.id);
  writeDb(db);
  res.json({ ok: true });
}

