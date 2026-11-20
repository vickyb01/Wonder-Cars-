import type { NextFunction, Request, Response } from 'express';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../config/index.ts';
import { verifySignedToken, type TokenPayload } from '../services/auth.service.ts';
import { readDb } from '../services/store.service.ts';

export interface AuthenticatedRequest extends Request {
  adminEmail?: string;
  adminUser?: TokenPayload;
}

export function isAdminRequest(req: Request): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader) return false;

  const basicMatch = authHeader.match(/^Basic\s+(.*)$/i);
  if (basicMatch) {
    try {
      const decoded = Buffer.from(basicMatch[1], 'base64').toString('utf-8');
      const [email, pass] = decoded.split(':');
      if (email === ADMIN_EMAIL && pass === ADMIN_PASSWORD) {
        return true;
      }
    } catch {
      return false;
    }
  }

  const bearerMatch = authHeader.match(/^Bearer\s+(.*)$/i);
  if (bearerMatch) {
    const token = bearerMatch[1].trim();
    const payload = verifySignedToken(token);
    if (!payload) return false;

    try {
      const db = readDb();
      const user = db.adminUsers.find((u) => u.email.toLowerCase() === payload.email.toLowerCase() && u.active);
      return Boolean(user);
    } catch {
      return false;
    }
  }

  return false;
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Unauthorized: missing Authorization header' });
    return;
  }

  const basicMatch = authHeader.match(/^Basic\s+(.*)$/i);
  if (basicMatch) {
    try {
      const decoded = Buffer.from(basicMatch[1], 'base64').toString('utf-8');
      const [email, pass] = decoded.split(':');
      if (email === ADMIN_EMAIL && pass === ADMIN_PASSWORD) {
        req.adminEmail = email;
        req.adminUser = {
          email,
          role: 'admin',
          name: 'Wonder Cars Admin',
          exp: Date.now() + 86400000,
        };
        next();
        return;
      }
    } catch {
      // Fall through to 401
    }
  }

  const bearerMatch = authHeader.match(/^Bearer\s+(.*)$/i);
  if (bearerMatch) {
    const token = bearerMatch[1].trim();
    const payload = verifySignedToken(token);
    if (payload) {
      try {
        const db = readDb();
        const user = db.adminUsers.find((u) => u.email.toLowerCase() === payload.email.toLowerCase() && u.active);
        if (user) {
          req.adminEmail = user.email;
          req.adminUser = payload;
          next();
          return;
        }
      } catch {
        // Fall through to 401
      }
    }
  }

  res.status(401).json({ error: 'Unauthorized: invalid or expired session token' });
}

