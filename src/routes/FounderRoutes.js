import express from 'express';
import {
  createFounder,
  getAllFounders,
  getFounderById,
  updateFounder,
  deleteFounder
} from '../controllers/FounderController.js';
import { protect } from '../middleware/AuthMiddleware.js';
import { singleUpload } from '../middleware/multer.js';

const router = express.Router();

// Public routes
router.get('/', getAllFounders);
router.get('/:id', getFounderById);

// Protected admin routes
router.post('/', protect, singleUpload('imageUrl'), createFounder);
router.put('/:id', protect, singleUpload('imageUrl'), updateFounder);
router.delete('/:id', protect, deleteFounder);

export default router;