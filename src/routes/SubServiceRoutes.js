
// routes/subServiceRoutes.js
import express from 'express';
import {
  createSubService,
  getSubServices,
  getSubServicesByParent,
  getSubService,
  updateSubService,
  deleteSubService,
  getSubServicesByParentSlug
} from '../controllers/SubServiceController.js';

const router = express.Router();

// Sub-service routes
router.post('/', createSubService);                           // Create sub-service
router.get('/', getSubServices);                             // Get all sub-services
router.get('/parent/:parentId', getSubServicesByParent);    // Get by parent ID
router.get('/parent/slug/:slug', getSubServicesByParentSlug); // Get by parent slug
router.get('/:id', getSubService);                          // Get single sub-service
router.put('/:id', updateSubService);                       // Update sub-service
router.delete('/:id', deleteSubService);                    // Delete sub-service

export default router;