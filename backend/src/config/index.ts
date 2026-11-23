import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const BACKEND_ROOT = path.resolve(__dirname, '../../');

// Load environment variables from backend/.env and root .env fallback
dotenv.config({ path: path.resolve(BACKEND_ROOT, '.env') });
dotenv.config({ path: path.resolve(BACKEND_ROOT, '../.env') });

export const PORT = Number(process.env.PORT || 5000);
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@wondercars.in';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'WonderCars@2026';
export const JWT_SECRET = process.env.JWT_SECRET || 'wonder-cars-signing-secret-2026';
export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

// Cloudinary Configuration
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

export const DATA_DIR = path.resolve(BACKEND_ROOT, 'data');
export const DB_PATH = path.join(DATA_DIR, 'db.json');
export const UPLOADS_DIR = path.resolve(BACKEND_ROOT, 'src', 'uploads');

// Email Lead Notification Configuration
export const LEAD_NOTIFICATION_EMAIL = process.env.LEAD_NOTIFICATION_EMAIL || 'vickybhelave25@navgurukul.org';
export const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
export const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
export const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
export const SMTP_USER = process.env.SMTP_USER || '';
export const SMTP_PASS = process.env.SMTP_PASS || '';
export const SMTP_FROM = process.env.SMTP_FROM || 'Wonder Cars Leads <leads@wondercars.in>';

