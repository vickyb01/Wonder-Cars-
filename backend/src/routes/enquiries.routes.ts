import { Router } from 'express';
import {
  createEnquiry,
  getEnquiries,
  exportEnquiriesCsv,
  patchEnquiry,
  deleteEnquiry,
} from '../controllers/enquiries.controller.ts';
import { requireAdmin } from '../middleware/auth.middleware.ts';

const router = Router();

// Public enquiry submission
router.post('/enquiries', createEnquiry);

// Admin enquiry management
router.get('/admin/enquiries', requireAdmin, getEnquiries);
router.get('/admin/enquiries/export', requireAdmin, exportEnquiriesCsv);
router.patch('/admin/enquiries/:id', requireAdmin, patchEnquiry);
router.delete('/admin/enquiries/:id', requireAdmin, deleteEnquiry);

export default router;

