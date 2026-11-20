import { Router } from 'express';
import {
  createSellRequest,
  getSellRequests,
  patchSellRequest,
  deleteSellRequest,
} from '../controllers/sellRequests.controller.ts';
import { requireAdmin } from '../middleware/auth.middleware.ts';

const router = Router();

// Public sell car request
router.post('/sell-requests', createSellRequest);

// Admin sell car management
router.get('/admin/sell-requests', requireAdmin, getSellRequests);
router.patch('/admin/sell-requests/:id', requireAdmin, patchSellRequest);
router.delete('/admin/sell-requests/:id', requireAdmin, deleteSellRequest);

export default router;

