// controllers/BlogController.js
import BlogModel from '../models/BlogModel.js';
import { getFileUrl, deleteLocalFile, getFilenameFromPath } from '../middleware/multer.js';
import slugify from 'slugify';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  conflictResponse
} from '../utils/responseUtils.js';

export const createBlog = async (req, res) => {
  console.log('=== CREATE BLOG REQUEST ===');
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);
  
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      console.log('Validation failed - missing required fields');
      return validationErrorResponse(res, 'Title and description are required');
    }

    if (!req.files || !req.files['imageUrl']) {
      console.log('Validation failed - missing image file');
      return validationErrorResponse(res, 'Blog image is required');
    }

    const slug = slugify(title, { lower: true, strict: true });
    const existingBlog = await BlogModel.findOne({ slug });
    if (existingBlog) {
      console.log('Conflict - blog with same slug exists');
      return conflictResponse(res, 'Blog');
    }

    // Get the uploaded file info
    const uploadedFile = req.files['imageUrl'][0];
    const imageUrl = getFileUrl(uploadedFile.filename);
    
    console.log('File uploaded successfully:', {
      originalname: uploadedFile.originalname,
      filename: uploadedFile.filename,
      path: uploadedFile.path,
      url: imageUrl
    });

    const newBlog = new BlogModel({
      title,
      description,
      slug,
      imageUrl: imageUrl // Store the URL path
    });

    console.log('Saving blog to database...');
    const savedBlog = await newBlog.save();
    console.log('Blog saved successfully:', savedBlog);

    return successResponse(res, savedBlog, 201);
  } catch (error) {
    console.error('Error in createBlog:', error);
    
    // Clean up uploaded file if blog creation failed
    if (req.files && req.files['imageUrl']) {
      const filename = req.files['imageUrl'][0].filename;
      await deleteLocalFile(filename);
    }
    
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      ...(error.name === 'ValidationError' && { validationErrors: error.errors })
    };
    
    console.error('Full error details:', errorInfo);
    return errorResponse(res, 'Failed to create blog post', 500, errorInfo);
  }
};

export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await BlogModel.find().sort({ postedAt: -1 });
    successResponse(res, blogs);
  } catch (error) {
    errorResponse(res, 'Failed to fetch blog posts', 500, error);
  }
};

export const getBlogBySlug = async (req, res) => {
  try {
    const blog = await BlogModel.findOne({ slug: req.params.slug });
    if (!blog) {
      return notFoundResponse(res, 'Blog post');
    }
    successResponse(res, blog);
  } catch (error) {
    errorResponse(res, 'Failed to fetch blog post', 500, error);
  }
};

export const updateBlog = async (req, res) => {
  console.log('=== UPDATE BLOG REQUEST ===');
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);
  
  try {
    const { title, description } = req.body;
    const updates = {
      ...(title && { title }),
      ...(description && { description })
    };

    // Handle image update
    if (req.files && req.files['imageUrl']) {
      console.log('Processing new image upload...');
      
      // Get old blog to delete old image
      const oldBlog = await BlogModel.findById(req.params.id);
      if (oldBlog?.imageUrl) {
        const oldFilename = getFilenameFromPath(oldBlog.imageUrl);
        if (oldFilename) {
          console.log('Deleting old image:', oldFilename);
          await deleteLocalFile(oldFilename);
        }
      }
      
      // Set new image URL
      const uploadedFile = req.files['imageUrl'][0];
      updates.imageUrl = getFileUrl(uploadedFile.filename);
      
      console.log('New image uploaded:', {
        originalname: uploadedFile.originalname,
        filename: uploadedFile.filename,
        url: updates.imageUrl
      });
    }

    // Handle slug update if title changed
    if (title) {
      updates.slug = slugify(title, { lower: true, strict: true });
      console.log('New slug generated:', updates.slug);
      
      // Check if new slug conflicts with other blogs
      const existingBlog = await BlogModel.findOne({ 
        slug: updates.slug,
        _id: { $ne: req.params.id }
      });
      
      if (existingBlog) {
        console.log('Slug conflict detected');
        
        // Clean up new uploaded file if there's a conflict
        if (req.files && req.files['imageUrl']) {
          const filename = req.files['imageUrl'][0].filename;
          await deleteLocalFile(filename);
        }
        
        return conflictResponse(res, 'Blog with this title already exists');
      }
    }

    console.log('Updating blog in database...');
    const updatedBlog = await BlogModel.findByIdAndUpdate(
      req.params.id,
      updates,
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    );

    if (!updatedBlog) {
      console.log('Blog not found for update');
      
      // Clean up uploaded file if blog not found
      if (req.files && req.files['imageUrl']) {
        const filename = req.files['imageUrl'][0].filename;
        await deleteLocalFile(filename);
      }
      
      return notFoundResponse(res, 'Blog post');
    }

    console.log('Blog updated successfully:', updatedBlog);
    return successResponse(res, updatedBlog);
  } catch (error) {
    console.error('Error in updateBlog:', error);
    
    // Clean up uploaded file if update failed
    if (req.files && req.files['imageUrl']) {
      const filename = req.files['imageUrl'][0].filename;
      await deleteLocalFile(filename);
    }
    
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      ...(error.name === 'ValidationError' && { validationErrors: error.errors })
    };
    
    console.error('Full error details:', errorInfo);
    return errorResponse(res, 'Failed to update blog post', 500, errorInfo);
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const blog = await BlogModel.findById(req.params.id);
    if (!blog) {
      return notFoundResponse(res, 'Blog post');
    }

    // Delete associated image file
    if (blog.imageUrl) {
      const filename = getFilenameFromPath(blog.imageUrl);
      if (filename) {
        console.log('Deleting associated image:', filename);
        await deleteLocalFile(filename);
      }
    }

    // Delete blog from database
    await BlogModel.findByIdAndDelete(req.params.id);
    
    successResponse(res, { message: 'Blog post and associated files deleted successfully' });
  } catch (error) {
    console.error('Error in deleteBlog:', error);
    errorResponse(res, 'Failed to delete blog post', 500, error);
  }
};