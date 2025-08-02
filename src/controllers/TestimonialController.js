// controllers/TestimonialController.js
import ClientReviewModel from '../models/TestimonialModel.js';
import { singleUpload, getFileUrl, deleteLocalFile, getFilenameFromPath } from '../middleware/multer.js';
import { 
  successResponse, 
  errorResponse, 
  notFoundResponse, 
  validationErrorResponse 
} from '../utils/responseUtils.js';

// @desc    Get all testimonials
// @route   GET /api/testimonials
// @access  Public
export const getAllTestimonials = async (req, res) => {
  console.log('=== GET ALL TESTIMONIALS REQUEST ===');
  
  try {
    const testimonials = await ClientReviewModel.find().sort({ createdAt: -1 });
    console.log(`Found ${testimonials.length} testimonials`);
    
    return successResponse(res, testimonials);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return errorResponse(res, "Failed to fetch testimonials", 500, error);
  }
};

// @desc    Create a new testimonial
// @route   POST /api/testimonials
// @access  Private (Admin)
export const createTestimonial = async (req, res) => {
  console.log('=== CREATE TESTIMONIAL REQUEST ===');
  console.log('Request body:', req.body);
  console.log('Request file:', req.file ? {
    originalname: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    filename: req.file.filename
  } : 'No file uploaded');

  try {
    const { name, stars, description } = req.body;
    
    // Validate required fields
    if (!name || !stars || !description) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        await deleteLocalFile(req.file.filename);
      }
      
      return validationErrorResponse(res, {
        name: !name ? 'Name is required' : undefined,
        stars: !stars ? 'Stars rating is required' : undefined,
        description: !description ? 'Description is required' : undefined
      });
    }

    if (!req.file) {
      return validationErrorResponse(res, {
        image: 'Testimonial image is required'
      });
    }

    // Get file URL for local storage with dynamic protocol/host
    const imageUrl = getFileUrlWithRequest(req.file.filename, req);
    
    console.log('File uploaded successfully:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      url: imageUrl,
      generatedFrom: `${req.protocol}://${req.get('host')}`
    });

    const testimonial = new ClientReviewModel({
      imageUrl,
      name,
      stars,
      description
    });

    console.log('Saving testimonial to database...');
    const createdTestimonial = await testimonial.save();
    console.log('Testimonial created successfully:', createdTestimonial);

    return successResponse(res, createdTestimonial, 201);
  } catch (error) {
    console.error('Error creating testimonial:', {
      message: error.message,
      stack: error.stack,
      fullError: error
    });
    
    // Clean up uploaded file if error occurs
    if (req.file) {
      await deleteLocalFile(req.file.filename);
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return validationErrorResponse(res, {
        validation: messages
      });
    }

    return errorResponse(res, "Failed to create testimonial", 500, error);
  }
};


// @desc    Update a testimonial
// @route   PUT /api/testimonials/:id
// @access  Private (Admin)
export const updateTestimonial = async (req, res) => {
  console.log('=== UPDATE TESTIMONIAL REQUEST ===');
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  console.log('Request file:', req.file ? {
    originalname: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    filename: req.file.filename
  } : 'No file uploaded');

  try {
    const { id } = req.params;
    const { name, stars, description } = req.body;
    
    const testimonial = await ClientReviewModel.findById(id);
    
    if (!testimonial) {
      // Clean up uploaded file if testimonial not found
      if (req.file) {
        await deleteLocalFile(req.file.filename);
      }
      return notFoundResponse(res, "Testimonial");
    }

    // Validate at least one field is being updated
    if (!name && !stars && !description && !req.file) {
      return validationErrorResponse(res, {
        update: 'At least one field (name, stars, description, or image) must be provided for update'
      });
    }

    let imageUrl = testimonial.imageUrl;
    
    // If new image is uploaded
    if (req.file) {
      try {
        console.log('Processing new image upload...');
        
        // Delete old image file if it exists
        if (testimonial.imageUrl) {
          const oldFilename = getFilenameFromPath(testimonial.imageUrl);
          if (oldFilename) {
            console.log('Deleting old image:', oldFilename);
            await deleteLocalFile(oldFilename);
          }
        }
        
        // Set new image URL with dynamic protocol/host
        imageUrl = getFileUrlWithRequest(req.file.filename, req);
        
        console.log('New image uploaded:', {
          originalname: req.file.originalname,
          filename: req.file.filename,
          url: imageUrl,
          generatedFrom: `${req.protocol}://${req.get('host')}`
        });
      } catch (uploadError) {
        console.error('Image processing error:', uploadError);
        
        // Clean up uploaded file if error occurs
        if (req.file) {
          await deleteLocalFile(req.file.filename);
        }
        
        return errorResponse(res, "Failed to process new testimonial image", 500, uploadError);
      }
    }

    // Update fields if they are provided
    if (name) {
      testimonial.name = name;
      console.log('Name updated to:', name);
    }
    if (stars) {
      testimonial.stars = stars;
      console.log('Stars updated to:', stars);
    }
    if (description) {
      testimonial.description = description;
      console.log('Description updated to:', description);
    }
    testimonial.imageUrl = imageUrl;

    console.log('Saving updated testimonial...');
    const updatedTestimonial = await testimonial.save();
    console.log('Testimonial updated successfully:', updatedTestimonial);

    return successResponse(res, updatedTestimonial);
  } catch (error) {
    console.error('Error updating testimonial:', error);
    
    // Clean up uploaded file if error occurs
    if (req.file) {
      await deleteLocalFile(req.file.filename);
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return validationErrorResponse(res, {
        validation: messages
      });
    }

    return errorResponse(res, "Failed to update testimonial", 500, error);
  }
};

// @desc    Delete a testimonial
// @route   DELETE /api/testimonials/:id
// @access  Private (Admin)
export const deleteTestimonial = async (req, res) => {
  console.log('=== DELETE TESTIMONIAL REQUEST ===');
  console.log('Testimonial ID:', req.params.id);
  
  try {
    const { id } = req.params;
    
    const testimonial = await ClientReviewModel.findById(id);
    
    if (!testimonial) {
      console.log('Testimonial not found');
      return notFoundResponse(res, "Testimonial");
    }

    // Delete associated image file
    if (testimonial.imageUrl) {
      const filename = getFilenameFromPath(testimonial.imageUrl);
      if (filename) {
        console.log('Deleting associated image:', filename);
        await deleteLocalFile(filename);
      }
    }

    console.log('Deleting testimonial from database...');
    await testimonial.deleteOne();
    console.log('Testimonial and associated files deleted successfully');

    return successResponse(res, { 
      message: "Testimonial and associated files deleted successfully",
      deletedTestimonial: testimonial
    });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return errorResponse(res, "Failed to delete testimonial", 500, error);
  }
};

// Additional helper functions

// @desc    Get testimonials by star rating
// @route   GET /api/testimonials/stars/:rating
// @access  Public
export const getTestimonialsByStars = async (req, res) => {
  console.log('=== GET TESTIMONIALS BY STARS REQUEST ===');
  console.log('Star rating:', req.params.rating);
  
  try {
    const { rating } = req.params;
    const stars = parseInt(rating);
    
    if (isNaN(stars) || stars < 1 || stars > 5) {
      return validationErrorResponse(res, {
        rating: 'Star rating must be between 1 and 5'
      });
    }
    
    const testimonials = await ClientReviewModel.find({ stars }).sort({ createdAt: -1 });
    
    console.log(`Found ${testimonials.length} testimonials with ${stars} stars`);
    return successResponse(res, testimonials);
  } catch (error) {
    console.error('Error fetching testimonials by stars:', error);
    return errorResponse(res, "Failed to fetch testimonials by star rating", 500, error);
  }
};

// @desc    Search testimonials by name or description
// @route   GET /api/testimonials/search/:query
// @access  Public
export const searchTestimonials = async (req, res) => {
  console.log('=== SEARCH TESTIMONIALS REQUEST ===');
  console.log('Search query:', req.params.query);
  
  try {
    const { query } = req.params;
    const testimonials = await ClientReviewModel.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${testimonials.length} testimonials matching: ${query}`);
    return successResponse(res, testimonials);
  } catch (error) {
    console.error('Error searching testimonials:', error);
    return errorResponse(res, "Failed to search testimonials", 500, error);
  }
};

// @desc    Get testimonials count
// @route   GET /api/testimonials/count
// @access  Public
export const getTestimonialsCount = async (req, res) => {
  console.log('=== GET TESTIMONIALS COUNT REQUEST ===');
  
  try {
    const count = await ClientReviewModel.countDocuments();
    console.log(`Total testimonials: ${count}`);
    
    return successResponse(res, { count });
  } catch (error) {
    console.error('Error getting testimonials count:', error);
    return errorResponse(res, "Failed to get testimonials count", 500, error);
  }
};

// @desc    Get single testimonial
// @route   GET /api/testimonials/:id
// @access  Public
export const getTestimonialById = async (req, res) => {
  console.log('=== GET TESTIMONIAL REQUEST ===');
  console.log('Testimonial ID:', req.params.id);
  
  try {
    const testimonial = await ClientReviewModel.findById(req.params.id);
    
    if (!testimonial) {
      console.log('Testimonial not found');
      return notFoundResponse(res, "Testimonial");
    }
    
    console.log('Testimonial found:', testimonial);
    return successResponse(res, testimonial);
  } catch (error) {
    console.error('Error fetching testimonial:', error);
    return errorResponse(res, "Failed to fetch testimonial", 500, error);
  }
};