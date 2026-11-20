import { Router } from 'express';
import {
  getLocationSettings,
  updateLocationSettings,
  geocodeAddress,
  getWebsiteSettings,
  updateWebsiteSettings,
} from '../controllers/settings.controller.ts';
import { requireAdmin } from '../middleware/auth.middleware.ts';

const router = Router();

// Location
router.get('/location', getLocationSettings);
router.put('/admin/location', requireAdmin, updateLocationSettings);
router.post('/admin/location/geocode', requireAdmin, geocodeAddress);

// Website settings
router.get('/settings', getWebsiteSettings);
router.put('/admin/settings', requireAdmin, updateWebsiteSettings);

export default router;

