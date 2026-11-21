import fs from 'fs';
import path from 'path';
import type { Request, Response } from 'express';
import { ADMIN_EMAIL, ADMIN_PASSWORD, UPLOADS_DIR } from '../config/index.ts';
import { hashPassword, verifyPassword, createSignedToken } from '../services/auth.service.ts';
import { readDb, writeDb, logActivity } from '../services/store.service.ts';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.ts';
import type { AdminOverview, AdminUser } from '../models/types.ts';

export function login(req: Request, res: Response): void {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  const db = readDb();
  const users = db.adminUsers || [];
  const matchedUser = users.find((u) => u.email.toLowerCase() === email && u.active);

  if (matchedUser) {
    if (!verifyPassword(password, matchedUser.passwordHash || '')) {
      res.status(401).json({ error: 'Invalid admin email or password.' });
      return;
    }
    matchedUser.lastLogin = new Date().toISOString();
    writeDb(db);
    logActivity(matchedUser.email, 'Admin Sign In', `${matchedUser.name} (${matchedUser.role}) signed in.`);
    const token = createSignedToken({
      id: matchedUser.id,
      email: matchedUser.email,
      name: matchedUser.name,
      role: matchedUser.role,
    });
    res.json({
      token,
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role,
        avatar: matchedUser.avatar,
      },
    });
    return;
  }

  if (email === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
    logActivity(ADMIN_EMAIL, 'Admin Sign In', 'Master admin signed in via root credentials.');
    const token = createSignedToken({ email: ADMIN_EMAIL, name: 'Wonder Cars Admin', role: 'admin' });
    res.json({
      token,
      user: {
        id: 'admin-master',
        name: 'Wonder Cars Admin',
        email: ADMIN_EMAIL,
        role: 'admin',
      },
    });
    return;
  }

  res.status(401).json({ error: 'Invalid admin credentials or account is inactive.' });
}

export function forgotPassword(req: Request, res: Response): void {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const db = readDb();
  const user = (db.adminUsers || []).find((u) => u.email.toLowerCase() === email);
  if (!user && email !== ADMIN_EMAIL.toLowerCase()) {
    res.status(404).json({ error: 'No admin user found with this email address.' });
    return;
  }
  const resetCode = Math.random().toString(36).slice(-6).toUpperCase();
  logActivity(email, 'Password Reset Code Generated', `Reset token generated: ${resetCode}`);
  res.json({
    ok: true,
    message: `Password reset verification generated. Reset code is: ${resetCode}`,
    resetCode,
  });
}

export function resetPassword(req: Request, res: Response): void {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const newPassword = String(req.body?.newPassword || '');
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }
  const db = readDb();
  const user = (db.adminUsers || []).find((u) => u.email.toLowerCase() === email);
  if (user) {
    user.passwordHash = hashPassword(newPassword);
    writeDb(db);
    logActivity(email, 'Password Reset', 'Password changed successfully via reset flow.');
    res.json({ ok: true, message: 'Password has been reset successfully. Please log in.' });
    return;
  }
  res.status(404).json({ error: 'User not found.' });
}

export function getMe(req: AuthenticatedRequest, res: Response): void {
  const email = req.adminEmail || '';
  const db = readDb();
  const user = (db.adminUsers || []).find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (user) {
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      lastLogin: user.lastLogin,
    });
    return;
  }
  res.json({
    id: 'admin-master',
    name: req.adminUser?.name || 'Wonder Cars Admin',
    email: req.adminEmail || ADMIN_EMAIL,
    role: req.adminUser?.role || 'admin',
  });
}

export function updateProfile(req: AuthenticatedRequest, res: Response): void {
  const email = req.adminEmail || '';
  const db = readDb();
  const user = (db.adminUsers || []).find((u) => u.email.toLowerCase() === email.toLowerCase());
  const { name, currentPassword, newPassword, avatar } = req.body || {};

  if (user) {
    if (newPassword) {
      if (!currentPassword || !verifyPassword(currentPassword, user.passwordHash || '')) {
        res.status(400).json({ error: 'Current password does not match.' });
        return;
      }
      if (newPassword.length < 6) {
        res.status(400).json({ error: 'New password must be at least 6 characters.' });
        return;
      }
      user.passwordHash = hashPassword(newPassword);
    }
    if (name) user.name = String(name).trim();
    if (avatar !== undefined) user.avatar = String(avatar);
    writeDb(db);
    logActivity(email, 'Profile Updated', 'Admin profile/credentials updated.');
    res.json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    });
    return;
  }

  res.json({ ok: true, message: 'Master profile active.' });
}

export function getUsers(_req: AuthenticatedRequest, res: Response): void {
  const db = readDb();
  const users = (db.adminUsers || []).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    lastLogin: u.lastLogin,
    avatar: u.avatar,
    createdAt: u.createdAt,
  }));
  res.json(users);
}

export function createUser(req: AuthenticatedRequest, res: Response): void {
  if (req.adminUser?.role === 'staff') {
    res.status(403).json({ error: 'Staff members cannot create users.' });
    return;
  }
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required.' });
    return;
  }
  const db = readDb();
  const existing = (db.adminUsers || []).find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (existing) {
    res.status(400).json({ error: 'An admin user with this email already exists.' });
    return;
  }
  const newUser: AdminUser = {
    id: `usr-${Date.now()}`,
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    passwordHash: hashPassword(String(password)),
    role: role === 'staff' ? 'staff' : 'admin',
    permissions: role === 'staff' ? ['cars', 'enquiries', 'testimonials'] : ['all'],
    active: true,
    createdAt: new Date().toISOString(),
  };
  db.adminUsers = [...(db.adminUsers || []), newUser];
  writeDb(db);
  logActivity(req.adminEmail || 'admin', 'Created Admin User', `Created ${newUser.name} (${newUser.role})`);
  res.status(201).json({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, active: newUser.active });
}

export function updateUser(req: AuthenticatedRequest, res: Response): void {
  if (req.adminUser?.role === 'staff') {
    res.status(403).json({ error: 'Staff members cannot modify users.' });
    return;
  }
  const db = readDb();
  const user = (db.adminUsers || []).find((u) => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  const { name, role, active, password } = req.body || {};
  if (name) user.name = String(name).trim();
  if (role && (role === 'admin' || role === 'staff')) user.role = role;
  if (typeof active === 'boolean') user.active = active;
  if (password && password.length >= 6) user.passwordHash = hashPassword(password);
  writeDb(db);
  logActivity(req.adminEmail || 'admin', 'Updated Admin User', `Updated ${user.name}`);
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, active: user.active });
}

export function deleteUser(req: AuthenticatedRequest, res: Response): void {
  if (req.adminUser?.role === 'staff') {
    res.status(403).json({ error: 'Staff members cannot delete users.' });
    return;
  }
  const db = readDb();
  const user = (db.adminUsers || []).find((u) => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  if (user.email.toLowerCase() === req.adminEmail?.toLowerCase()) {
    res.status(400).json({ error: 'You cannot delete your own admin account.' });
    return;
  }
  db.adminUsers = db.adminUsers.filter((u) => u.id !== req.params.id);
  writeDb(db);
  logActivity(req.adminEmail || 'admin', 'Deleted Admin User', `Deleted ${user.name}`);
  res.json({ ok: true });
}

export function getOverview(_req: Request, res: Response): void {
  const db = readDb();
  const availableCars = db.cars.filter((c) => c.status === 'Available');
  const reservedCars = db.cars.filter((c) => c.status === 'Reserved');
  const soldCars = db.cars.filter((c) => c.status === 'Sold');
  const draftCars = db.cars.filter((c) => c.status === 'Draft');

  const monthNames = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  const monthlyListings = monthNames.map((month, idx) => ({
    month,
    count: 2 + ((idx * 3 + db.cars.length) % 7),
  }));
  const monthlyEnquiries = monthNames.map((month, idx) => ({
    month,
    count: 5 + ((idx * 4 + db.enquiries.length) % 12),
  }));

  const recentCars = [...db.cars].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const recentlySold = db.cars.filter((c) => c.status === 'Sold').slice(0, 5);
  const recentEnquiries = [...db.enquiries].slice(0, 5);

  const overviewData: AdminOverview = {
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
    totalVisitors: db.visitorCount || 14280,
    monthlyListings,
    monthlyEnquiries,
    recentCars,
    recentSoldCars: recentlySold,
    recentlySold,
    recentEnquiries,
    recentActivity: (db.activityLogs || []).slice(0, 8),
  };

  res.json(overviewData);
}

import {
  isCloudinaryConfigured,
  testCloudinaryConnection,
  uploadSingleFileToCloudinary,
} from '../services/cloudinary.service.ts';

export async function uploadMedia(req: Request, res: Response): Promise<void> {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No files were uploaded.' });
    return;
  }

  const urls: string[] = [];
  const useCloudinary = isCloudinaryConfigured();
  let cloudinaryError: string | undefined;

  for (const file of files) {
    if (useCloudinary) {
      try {
        const cloudUrl = await uploadSingleFileToCloudinary(file.path, file.originalname);
        urls.push(cloudUrl);
        continue;
      } catch (err) {
        cloudinaryError = err instanceof Error ? err.message : 'Cloudinary upload error';
        console.warn(`[Cloudinary] Upload failed for ${file.filename}, falling back to local:`, cloudinaryError);
      }
    }
    // Fallback: local disk URL
    urls.push(`/uploads/${file.filename}`);
  }

  res.json({
    urls,
    storage: useCloudinary && !cloudinaryError ? 'cloudinary' : 'local',
    warning: cloudinaryError ? `Cloudinary notice: ${cloudinaryError}. Stored on local server disk.` : undefined,
  });
}

export async function getCloudinaryStatus(_req: Request, res: Response): Promise<void> {
  const status = await testCloudinaryConnection();
  res.json(status);
}

export function getNotifications(_req: Request, res: Response): void {
  const db = readDb();
  res.json(db.notifications || []);
}

export function markNotificationRead(req: Request, res: Response): void {
  const db = readDb();
  const notif = (db.notifications || []).find((n) => n.id === req.params.id);
  if (notif) {
    notif.read = true;
    writeDb(db);
  }
  res.json({ ok: true });
}

export function markAllNotificationsRead(_req: Request, res: Response): void {
  const db = readDb();
  db.notifications = (db.notifications || []).map((n) => ({ ...n, read: true }));
  writeDb(db);
  res.json({ ok: true });
}

export function getActivityLogs(_req: Request, res: Response): void {
  const db = readDb();
  res.json(db.activityLogs || []);
}

export function getMedia(_req: Request, res: Response): void {
  const files = fs.existsSync(UPLOADS_DIR) ? fs.readdirSync(UPLOADS_DIR) : [];
  const media = files
    .filter((f) => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f))
    .map((filename) => {
      const filePath = path.join(UPLOADS_DIR, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        url: `/uploads/${filename}`,
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(media);
}

export function deleteMedia(req: Request, res: Response): void {
  const safeFilename = path.basename(req.params.filename);
  const targetPath = path.join(UPLOADS_DIR, safeFilename);
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
    logActivity('admin', 'Deleted Media File', `Removed image ${safeFilename}`);
    res.json({ ok: true });
    return;
  }
  res.status(404).json({ error: 'File not found.' });
}

