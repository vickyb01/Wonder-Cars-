import { Router, type NextFunction, type Request, type Response } from 'express';
import {
  login,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getOverview,
  uploadMedia,
  getCloudinaryStatus,
  getStorageStatus,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getActivityLogs,
  getMedia,
  deleteMedia,
  getEmailLogs,
  getEmailConfig,
  testEmailDelivery,
} from '../controllers/admin.controller.ts';
import { requireAdmin } from '../middleware/auth.middleware.ts';
import { upload } from '../middleware/upload.middleware.ts';

const router = Router();

// Authentication
router.post('/admin/login', login);
router.post('/admin/forgot-password', forgotPassword);
router.post('/admin/reset-password', resetPassword);

// Profile
router.get('/admin/me', requireAdmin, getMe);
router.put('/admin/profile', requireAdmin, updateProfile);

// User management
router.get('/admin/users', requireAdmin, getUsers);
router.post('/admin/users', requireAdmin, createUser);
router.put('/admin/users/:id', requireAdmin, updateUser);
router.delete('/admin/users/:id', requireAdmin, deleteUser);

// Dashboard overview
router.get('/admin/overview', requireAdmin, getOverview);

// File uploads & Storage
const handleUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.array('images', 70)(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : 'File upload failed.';
      res.status(400).json({ error: message });
      return;
    }
    next();
  });
};

router.post('/admin/upload', requireAdmin, handleUploadMiddleware, uploadMedia);
router.get('/admin/cloudinary/status', requireAdmin, getCloudinaryStatus);
router.get('/admin/storage/status', requireAdmin, getStorageStatus);

// Notifications & Activity
router.get('/admin/notifications', requireAdmin, getNotifications);
router.patch('/admin/notifications/:id/read', requireAdmin, markNotificationRead);
router.post('/admin/notifications/mark-all-read', requireAdmin, markAllNotificationsRead);
router.get('/admin/activity-logs', requireAdmin, getActivityLogs);

// Media library
router.get('/admin/media', requireAdmin, getMedia);
router.delete('/admin/media/:filename', requireAdmin, deleteMedia);

// Email Logs & SMTP Monitoring
router.get('/admin/email-logs', requireAdmin, getEmailLogs);
router.get('/admin/email/config', requireAdmin, getEmailConfig);
router.post('/admin/email/test', requireAdmin, testEmailDelivery);

export default router;

