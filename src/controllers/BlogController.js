import BlogModel from '../models/BlogModel.js';
import { uploadToCloudinary } from '../middleware/multer.js';
import slugify from 'slugify';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  conflictResponse
} from '../utils/responseUtils.js';

// export const createBlog = async (req, res) => {
//   const { title, description, author } = req.body;

//   if (!title || !description || !author) {
//     return validationErrorResponse(res, 'Title, description, and author are required');
//   }

//   if (!req.files || !req.files['imageUrl']) {
//     return validationErrorResponse(res, 'Blog image is required');
//   }

//   try {
//     const slug = slugify(title, { lower: true, strict: true });
//     const existingBlog = await BlogModel.findOne({ slug });
//     if (existingBlog) {
//       return conflictResponse(res, 'Blog');
//     }

//     const imageUrl = await uploadToCloudinary(req.files['imageUrl'][0].path, 'blog-images');
    
//     let authorImageUrl = null;
//     if (req.files['authorImageUrl']) {
//       authorImageUrl = await uploadToCloudinary(req.files['authorImageUrl'][0].path, 'author-images');
//     }

//     const newBlog = new BlogModel({
//       title,
//       description,
//       author,
//       slug,
//       imageUrl,
//       authorImageUrl
//     });

//     const savedBlog = await newBlog.save();
//     successResponse(res, savedBlog, 201);
//   } catch (error) {
//     errorResponse(res, 'Failed to create blog post', 500, error);
//   }
// };

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

    console.log('Uploading blog image to Cloudinary...');
    const imageUrl = await uploadToCloudinary(req.files['imageUrl'][0].path, 'blog-images');
    console.log('Blog image uploaded:', imageUrl);

    const newBlog = new BlogModel({
      title,
      description,
      slug,
      imageUrl: imageUrl.url
    });

    console.log('Saving blog to database...');
    const savedBlog = await newBlog.save();
    console.log('Blog saved successfully:', savedBlog);

    return successResponse(res, savedBlog, 201);
  } catch (error) {
    console.error('Error in createBlog:', error);
    
    // Detailed error information
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      ...(error.response && { response: error.response.data }),
      ...(error.code && { code: error.code }),
      ...(error.config && { 
        config: {
          method: error.config.method,
          url: error.config.url,
          headers: error.config.headers
        }
      })
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

// controllers/BlogController.js
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

          if (req.files && req.files['imageUrl']) {
        console.log('Uploading new blog image to Cloudinary...');
        const imageResult = await uploadToCloudinary(req.files['imageUrl'][0].path, 'blog-images');
        updates.imageUrl = imageResult.url;
        console.log('New blog image uploaded:', imageResult.url);
        
        // Get old image public ID to delete later
        const blog = await BlogModel.findById(req.params.id);
        if (blog?.imageUrl) {
          try {
            const publicId = getPublicIdFromUrl(blog.imageUrl);
            console.log('Deleting old blog image from Cloudinary...');
            await deleteFromCloudinary(publicId);
          } catch (deleteError) {
            console.error('Error deleting old blog image:', deleteError);
          }
        }
      }

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
        context: 'query' // Needed for proper slug validation
      }
    );

    if (!updatedBlog) {
      console.log('Blog not found for update');
      return notFoundResponse(res, 'Blog post');
    }

    console.log('Blog updated successfully:', updatedBlog);
    return successResponse(res, updatedBlog);
  } catch (error) {
    console.error('Error in updateBlog:', error);
    
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      ...(error.name === 'ValidationError' && { validationErrors: error.errors }),
      ...(error.response && { response: error.response.data }),
      ...(error.code && { code: error.code })
    };
    
    console.error('Full error details:', errorInfo);
    return errorResponse(res, 'Failed to update blog post', 500, errorInfo);
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const deleted = await BlogModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return notFoundResponse(res, 'Blog post');
    }
    successResponse(res, { message: 'Blog post deleted successfully' });
  } catch (error) {
    errorResponse(res, 'Failed to delete blog post', 500, error);
  }
};