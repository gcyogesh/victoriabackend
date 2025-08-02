import express from 'express';
import { 
  createBlog, 
  getAllBlogs, 
  getBlogBySlug, 
  updateBlog, 
  deleteBlog 
} from '../controllers/BlogController.js';
import { blogImageUpload } from '../middleware/multer.js';

const router = express.Router();

// Debug middleware (optional - remove in production)
// router.use(debugFormData);

// Blog routes
router.post('/', blogImageUpload, createBlog);
router.get('/', getAllBlogs);
router.get('/:slug', getBlogBySlug);
router.put('/:id', blogImageUpload, updateBlog);
router.delete('/:id', deleteBlog);

export default router;