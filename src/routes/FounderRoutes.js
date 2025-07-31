import express from 'express';
import {
  createFounder,
  getAllFounders,
  getFounderById,
  updateFounder,
  deleteFounder
} from '../controllers/FounderController.js';
import { singleUpload } from '../middleware/multer.js';

const router = express.Router();

// Public routes
router.get('/', getAllFounders);
router.get('/:id', getFounderById);

// Protected admin routes
router.post('/',  singleUpload('imageUrl'), createFounder);
router.put('/:id',  singleUpload('imageUrl'), updateFounder);
router.delete('/:id',  deleteFounder);

export default router;