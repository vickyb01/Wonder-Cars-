import fs from 'fs';
import path from 'path';
import express from 'express';
import { PORT, UPLOADS_DIR } from './src/config/index.ts';
import apiRouter from './src/routes/index.ts';

const app = express();

// Standard CORS middleware with support for credentials and preflight
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Body parsing with 12mb limit for rich car data and base64 assets
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Also check frontend public uploads directory as fallback if present
const frontendUploads = path.resolve(process.cwd(), '../frontend/public/uploads');
if (fs.existsSync(frontendUploads)) {
  app.use('/uploads', express.static(frontendUploads));
}

// Mount all API routes under /api
app.use('/api', apiRouter);

// Global 404 handler for unknown API routes
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Serve built frontend assets in production / single-service deployment
const candidateDistDirs = [
  path.resolve(__dirname, '../frontend/dist'),
  path.resolve(process.cwd(), '../frontend/dist'),
  path.resolve(process.cwd(), './frontend/dist'),
  path.resolve(process.cwd(), './dist'),
];

const resolvedFrontendDist = candidateDistDirs.find((dir) => fs.existsSync(dir));

if (resolvedFrontendDist) {
  app.use(express.static(resolvedFrontendDist));
  // Any non-API route serves the frontend SPA index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(resolvedFrontendDist, 'index.html'));
  });
}

// Start listening
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚗 Wonder Cars Backend Server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 API available at http://0.0.0.0:${PORT}/api`);
});

export default app;
