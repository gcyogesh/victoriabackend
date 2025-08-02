import express from 'express';
import { singleUpload } from '../middleware/multer.js';
import {
  createGalleryItem,
  getAllGalleryItems,
  getGalleryItemById,
  updateGalleryItem,
  deleteGalleryItem,
  getGalleryItemsPaginated,
  searchGalleryItems
} from '../controllers/GalleryController.js';

const router = express.Router();

// Gallery routes
router.post('/', singleUpload('image'), createGalleryItem);      // Create gallery item
router.get('/', getAllGalleryItems);                             // Get all gallery items
router.get('/paginated', getGalleryItemsPaginated);             // Get paginated gallery items
router.get('/search', searchGalleryItems);                      // Search gallery items
router.get('/:id', getGalleryItemById);                         // Get single gallery item
router.put('/:id', singleUpload('image'), updateGalleryItem);   // Update gallery item
router.delete('/:id', deleteGalleryItem);                       // Delete gallery item

export default router;