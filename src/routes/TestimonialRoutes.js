import express from 'express';
import {
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial
} from '../controllers/TestimonialController.js'
// import { protect } from '../middleware/auth.js';
import { singleUpload } from '../middleware/multer.js';

const router = express.Router();

// Public routes
router.get('/', getAllTestimonials);

// Protected routes (Admin only)
router.post('/', singleUpload('imageUrl'), createTestimonial);
router.put('/:id', singleUpload('imageUrl'), updateTestimonial);
router.delete('/:id', deleteTestimonial);

export default router;