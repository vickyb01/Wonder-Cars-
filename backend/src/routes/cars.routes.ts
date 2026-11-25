import { Router } from 'express';
import {
  getCars,
  getCarByIdOrSlug,
  getCarBrochurePdf,
  createCar,
  updateCar,
  deleteCar,
  duplicateCar,
  patchCarStatus,
  patchCarFeatured,
  batchSyncCars,
} from '../controllers/cars.controller.ts';
import { requireAdmin } from '../middleware/auth.middleware.ts';

const router = Router();

// Public car brochure / printable PDF endpoint
router.get('/cars/:id/brochure', getCarBrochurePdf);
router.get('/cars/:id/pdf', getCarBrochurePdf);

// Public & filtered car listings
router.get('/cars', getCars);
router.get('/cars/:id', getCarByIdOrSlug);

// Inventory sync / rehydration endpoints (admin-protected)
router.post('/cars/sync', requireAdmin, batchSyncCars);
router.post('/admin/cars/batch-sync', requireAdmin, batchSyncCars);

// Admin car management
router.post('/admin/cars', requireAdmin, createCar);
router.put('/admin/cars/:id', requireAdmin, updateCar);
router.delete('/admin/cars/:id', requireAdmin, deleteCar);
router.post('/admin/cars/:id/duplicate', requireAdmin, duplicateCar);
router.patch('/admin/cars/:id/status', requireAdmin, patchCarStatus);
router.patch('/admin/cars/:id/featured', requireAdmin, patchCarFeatured);

export default router;

