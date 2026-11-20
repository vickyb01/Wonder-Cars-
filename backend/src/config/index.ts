import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PORT = Number(process.env.PORT || 5000);
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@wondercars.in';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'WonderCars@2026';
export const JWT_SECRET = process.env.JWT_SECRET || 'wonder-cars-signing-secret-2026';
export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

export const BACKEND_ROOT = path.resolve(__dirname, '../../');
export const DATA_DIR = path.resolve(BACKEND_ROOT, 'data');
export const DB_PATH = path.join(DATA_DIR, 'db.json');
export const UPLOADS_DIR = path.resolve(BACKEND_ROOT, 'src', 'uploads');

