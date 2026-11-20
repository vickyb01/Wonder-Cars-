import crypto from 'crypto';
import { JWT_SECRET } from '../config/index.ts';

export interface TokenPayload {
  id?: string;
  email: string;
  role?: 'admin' | 'staff';
  name?: string;
  exp: number;
}

export function hashPassword(password: string, salt = 'wondercars_secure_salt_2026'): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha512').toString('hex');
}

export function verifyPassword(password: string, hash: string, salt = 'wondercars_secure_salt_2026'): boolean {
  try {
    const check = hashPassword(password, salt);
    const bufCheck = Buffer.from(check, 'hex');
    const bufHash = Buffer.from(hash, 'hex');
    if (bufCheck.length !== bufHash.length) return false;
    return crypto.timingSafeEqual(bufCheck, bufHash);
  } catch {
    return false;
  }
}

export function createSignedToken(payloadData: {
  id?: string;
  email: string;
  role?: 'admin' | 'staff';
  name?: string;
}): string {
  const payload = Buffer.from(
    JSON.stringify({
      ...payloadData,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    })
  ).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifySignedToken(token: string): TokenPayload | null {
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
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as TokenPayload;
    if (!decoded.email || !decoded.exp || decoded.exp < Date.now()) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

