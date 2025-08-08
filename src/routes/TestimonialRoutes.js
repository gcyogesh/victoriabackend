// routes/testimonialRoutes.js
import express from 'express';
import {
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getTestimonialById,
  getTestimonialsByStars,
  searchTestimonials,
  getTestimonialsCount
} from '../controllers/TestimonialController.js';
// import { protect } from '../middleware/auth.js';
import { singleUpload } from '../middleware/multer.js';

const router = express.Router();

// Public routes
router.get('/', getAllTestimonials);                              // Get all testimonials
router.get('/count', getTestimonialsCount);                       // Get testimonials count
router.get('/stars/:rating', getTestimonialsByStars);             // Get by star rating
router.get('/search/:query', searchTestimonials);                 // Search testimonials
router.get('/:id', getTestimonialById);                           // Get single testimonial

// Protected routes (Admin only)
router.post('/', singleUpload('image'), createTestimonial);    // Create testimonial
router.put('/:id', singleUpload('image'), updateTestimonial);  // Update testimonial
router.delete('/:id', deleteTestimonial);                         // Delete testimonial

export default router;