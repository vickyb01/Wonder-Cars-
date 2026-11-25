import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import {
  DEFAULT_API_URL,
  DEFAULT_SITE_URL,
  generateSitemapXml,
} from './scripts/sitemapGenerator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createSitemapPlugin(env: Record<string, string>): Plugin {
  const siteUrl = env.VITE_SITE_URL || env.SITE_URL || DEFAULT_SITE_URL;
  const apiBaseUrl = env.VITE_API_URL || env.VITE_API_BASE_URL || DEFAULT_API_URL;
  const backendDbPath = path.resolve(__dirname, '../backend/data/db.json');
  let isBuildCommand = false;

  return {
    name: 'generate-xml-sitemap',
    configResolved(config) {
      isBuildCommand = config.command === 'build';
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const requestPath = req.url?.split('?')[0];
        if (requestPath !== '/sitemap.xml') {
          next();
          return;
        }
        try {
          const xml = await generateSitemapXml({ siteUrl, apiBaseUrl, backendDbPath });
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/xml; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(xml);
        } catch (err) {
          next(err);
        }
      });
    },
    async closeBundle(error?: Error): Promise<void> {
      if (error || !isBuildCommand) return;
      const distDir = path.resolve(__dirname, 'dist');
      if (!fs.existsSync(distDir)) return;
      const xml = await generateSitemapXml({ siteUrl, apiBaseUrl, backendDbPath });
      fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml, 'utf8');
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      createSitemapPlugin(env),
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) return;
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, { recursive: true, force: true });
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/api': {
          target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
          changeOrigin: true,
        },
        '/uploads': {
          target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
          changeOrigin: true,
        },
      },
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

