// routes/founderRoutes.js
import express from 'express';
import {
  createFounder,
  getAllFounders,
  getFounderById,
  updateFounder,
  deleteFounder,
  searchFounders,
  getFoundersByPosition,
  getFoundersCount
} from '../controllers/FounderController.js';
// import { protect } from '../middleware/auth.js';
import { singleUpload } from '../middleware/multer.js';

const router = express.Router();

// Public routes
router.get('/', getAllFounders);                                  // Get all founders
router.get('/count', getFoundersCount);                           // Get founders count
router.get('/position/:position', getFoundersByPosition);         // Get by position
router.get('/search/:query', searchFounders);                     // Search founders
router.get('/:id', getFounderById);                               // Get single founder

// Protected routes (Admin only)
// router.post('/', protect, singleUpload('image'), createFounder);        // Create founder
// router.put('/:id', protect, singleUpload('image'), updateFounder);      // Update founder
// router.delete('/:id', protect, deleteFounder);                          // Delete founder

// Uncomment these when auth middleware is not needed (for testing)
router.post('/', singleUpload('image'), createFounder);           // Create founder
router.put('/:id', singleUpload('image'), updateFounder);         // Update founder
router.delete('/:id', deleteFounder);                             // Delete founder

export default router;