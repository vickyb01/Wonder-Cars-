import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  getHomepageSettings,
  updateHomepageSettings,
  getAboutSettings,
  updateAboutSettings,
  getPublicTestimonials,
  getAdminTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from '../controllers/content.controller.ts';
import { requireAdmin } from '../middleware/auth.middleware.ts';

const router = Router();

// Categories
router.get('/categories', getCategories);
router.post('/admin/categories', requireAdmin, createCategory);
router.put('/admin/categories/:id', requireAdmin, updateCategory);
router.delete('/admin/categories/:id', requireAdmin, deleteCategory);

// Brands
router.get('/brands', getBrands);
router.post('/admin/brands', requireAdmin, createBrand);
router.put('/admin/brands/:id', requireAdmin, updateBrand);
router.delete('/admin/brands/:id', requireAdmin, deleteBrand);

// Homepage settings
router.get('/homepage', getHomepageSettings);
router.put('/admin/homepage', requireAdmin, updateHomepageSettings);

// About Us settings
router.get('/about', getAboutSettings);
router.put('/admin/about', requireAdmin, updateAboutSettings);

// Testimonials
router.get('/testimonials', getPublicTestimonials);
router.get('/admin/testimonials', requireAdmin, getAdminTestimonials);
router.post('/admin/testimonials', requireAdmin, createTestimonial);
router.put('/admin/testimonials/:id', requireAdmin, updateTestimonial);
router.delete('/admin/testimonials/:id', requireAdmin, deleteTestimonial);

export default router;

