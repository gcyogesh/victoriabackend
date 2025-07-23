import express from 'express';
import {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  updateBlog,
  deleteBlog
} from '../controllers/BlogController.js';
import { fieldsUpload } from '../middleware/multer.js';

import { protect } from '../middleware/AuthMiddleware.js';
const router = express.Router();

// Get all blog posts
router.get('/', getAllBlogs);

// Get a single blog post by slug
router.get('/:slug', getBlogBySlug);

// Create a new blog post (Admin only)
router.post(
  '/',protect,
  fieldsUpload([
    { name: 'imageUrl', maxCount: 1 },
    { name: 'authorImageUrl', maxCount: 1 }
  ]),
  createBlog
);

// Update a blog post by ID (Admin only)
router.put(
  '/:id',protect,
  fieldsUpload([
    { name: 'imageUrl', maxCount: 1 },
    { name: 'authorImageUrl', maxCount: 1 }
  ]),
  updateBlog
);

// Delete a blog post by ID (Admin only)
router.delete('/:id',protect, deleteBlog);

export default router;