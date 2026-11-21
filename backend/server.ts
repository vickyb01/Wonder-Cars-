import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { PORT, UPLOADS_DIR } from './src/config/index.ts';
import apiRouter from './src/routes/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const frontendUploads = [
  path.resolve(__dirname, '../frontend/public/uploads'),
  path.resolve(process.cwd(), '../frontend/public/uploads'),
  path.resolve(process.cwd(), './frontend/public/uploads'),
].find((dir) => fs.existsSync(dir));

if (frontendUploads) {
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
} else {
  // Friendly landing status page when backend is deployed standalone (e.g. on Render)
  app.get('/', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Wonder Cars Backend API</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0A0A0C; color: #F3F4F6; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { background: #121217; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 40px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6); }
    .status-pill { display: inline-flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.15); color: #34D399; font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 9999px; margin-bottom: 20px; border: 1px solid rgba(52, 211, 153, 0.3); }
    .dot { width: 8px; height: 8px; background: #10B981; border-radius: 50%; box-shadow: 0 0 10px #10B981; }
    h1 { margin: 0 0 12px; font-size: 24px; color: #F59E0B; letter-spacing: -0.5px; }
    p { color: #9CA3AF; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
    .btn-group { display: flex; gap: 12px; justify-content: center; }
    .btn { display: inline-block; text-decoration: none; font-weight: 600; padding: 10px 18px; border-radius: 10px; font-size: 13px; transition: all 0.2s; }
    .btn-primary { background: linear-gradient(135deg, #F59E0B, #D97706); color: #000; }
    .btn-secondary { background: rgba(255, 255, 255, 0.08); color: #FFF; border: 1px solid rgba(255, 255, 255, 0.12); }
  </style>
</head>
<body>
  <div class="card">
    <div class="status-pill"><span class="dot"></span> Backend Active &amp; Live</div>
    <h1>🚗 Wonder Cars API Server</h1>
    <p>Wonder Cars luxury dealership backend is running successfully on Render. Connect your Vercel frontend via <code>VITE_API_URL</code>.</p>
    <div class="btn-group">
      <a href="/api/cars" class="btn btn-primary" target="_blank">Cars API JSON →</a>
      <a href="/api/brands" class="btn btn-secondary" target="_blank">Brands API →</a>
    </div>
  </div>
</body>
</html>`);
  });
}

// Start listening
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚗 Wonder Cars Backend Server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 API available at http://0.0.0.0:${PORT}/api`);
});

export default app;
