import express from 'express';
import {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  updateBlog,
  deleteBlog
} from '../controllers/BlogController.js';
import { fieldsUpload } from '../middleware/multer.js';


const router = express.Router();

// Get all blog posts
router.get('/', getAllBlogs);

// Get a single blog post by slug
router.get('/:slug', getBlogBySlug);

// Create a new blog post (Admin only)
router.post(
  '/',
  fieldsUpload([
    { name: 'imageUrl', maxCount: 1 }
  ]),
  createBlog
);

// Update a blog post by ID (Admin only)
router.put(
  '/:id',
  fieldsUpload([
    { name: 'imageUrl', maxCount: 1 }
  ]),
  updateBlog
);

// Delete a blog post by ID (Admin only)
router.delete('/:id', deleteBlog);

export default router;