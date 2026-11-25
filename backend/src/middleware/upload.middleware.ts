import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { UPLOADS_DIR } from '../config/index.ts';

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.jpg';
    const safeBase = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 32);
    const rand = Math.random().toString(36).slice(2, 6);
    cb(null, `${Date.now()}-${rand}-${safeBase || 'vehicle'}${safeExt}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 70 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeOk = ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase());
    const extOk = ALLOWED_EXTENSIONS.has(ext);
    if (mimeOk || (file.mimetype === 'application/octet-stream' && extOk)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported image format "${file.originalname}". Allowed formats: JPG, PNG, WebP, AVIF.`));
    }
  },
});
