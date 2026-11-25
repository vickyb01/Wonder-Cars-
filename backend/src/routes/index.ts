import { Router } from 'express';
import carsRoutes from './cars.routes.ts';
import enquiriesRoutes from './enquiries.routes.ts';
import sellRequestsRoutes from './sellRequests.routes.ts';
import contentRoutes from './content.routes.ts';
import settingsRoutes from './settings.routes.ts';
import adminRoutes from './admin.routes.ts';
import analyticsRoutes from './analytics.routes.ts';

const router = Router();

// Healthcheck endpoint
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Wonder Cars Backend API',
    timestamp: new Date().toISOString(),
  });
});

// Mount domain routes
router.use(carsRoutes);
router.use(enquiriesRoutes);
router.use(sellRequestsRoutes);
router.use(contentRoutes);
router.use(settingsRoutes);
router.use(adminRoutes);
router.use(analyticsRoutes);

export default router;

