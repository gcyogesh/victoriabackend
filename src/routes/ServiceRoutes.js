// routes/serviceRoutes.js
import express from 'express';
import { 
  createService, 
  getAllServices, 
  getServiceBySlug,
  getServiceById,
  updateService, 
  deleteService,
  toggleFeaturedService
} from '../controllers/ServiceController.js';

const router = express.Router();

// Service routes
router.post('/', createService);                    // Create service
router.get('/', getAllServices);                    // Get all services (with optional featured filter)
router.get('/id/:id', getServiceById);            // Get service by ID
router.get('/:slug', getServiceBySlug);           // Get service by slug
router.put('/:id', updateService);                // Update service
router.patch('/:id/featured', toggleFeaturedService); // Toggle featured status
router.delete('/:id', deleteService);             // Delete service

export default router;