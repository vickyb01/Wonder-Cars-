import { Router } from 'express';
import {
  exportAnalyticsCsv,
  getAnalyticsDashboard,
  getAnalyticsStatus,
  trackClientEvent,
} from '../controllers/analytics.controller.ts';
import { requireAdmin } from '../middleware/auth.middleware.ts';

const router = Router();

// Public telemetry tracking endpoint (lightweight, ad-blocker resilient showroom tracking)
router.post('/analytics/track', trackClientEvent);

// Secure Admin-only Analytics endpoints
router.get('/admin/analytics/overview', requireAdmin, getAnalyticsDashboard);
router.get('/admin/analytics/status', requireAdmin, getAnalyticsStatus);
router.get('/admin/analytics/export', requireAdmin, exportAnalyticsCsv);

export default router;
