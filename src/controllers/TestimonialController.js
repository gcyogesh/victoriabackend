import ClientReviewModel from '../models/TestimonialModel.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../middleware/multer.js';

// @desc    Get all testimonials
// @route   GET /api/testimonials
// @access  Public
export const getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await ClientReviewModel.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching testimonials'
    });
  }
};

// @desc    Create a new testimonial
// @route   POST /api/testimonials
// @access  Private (Admin)
export const createTestimonial = async (req, res) => {
  try {
    const { name, stars, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image is required'
      });
    }

    // Validate required fields
    if (!name || !stars || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, stars, description'
      });
    }

    // Upload image to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file.path, 'testimonials');

    const newTestimonial = await ClientReviewModel.create({
      imageUrl: cloudinaryResult.url,
      name,
      stars,
      description
    });

    res.status(201).json({
      success: true,
      data: newTestimonial
    });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    
    // Delete uploaded file if testimonial creation failed
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating testimonial'
    });
  }
};

// @desc    Update a testimonial
// @route   PUT /api/testimonials/:id
// @access  Private (Admin)
export const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, stars, description } = req.body;
    
    // Find the existing testimonial
    const existingTestimonial = await ClientReviewModel.findById(id);
    if (!existingTestimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }

    let imageUrl = existingTestimonial.imageUrl;
    
    // If new image was uploaded
    if (req.file) {
      // Upload new image to Cloudinary
      const cloudinaryResult = await uploadToCloudinary(req.file.path, 'testimonials');
      
      // Delete old image from Cloudinary
      try {
        await deleteFromCloudinary(getPublicIdFromUrl(existingTestimonial.imageUrl));
      } catch (deleteError) {
        console.error('Error deleting old image from Cloudinary:', deleteError);
      }
      
      imageUrl = cloudinaryResult.url;
    }

    const updatedTestimonial = await ClientReviewModel.findByIdAndUpdate(
      id,
      {
        imageUrl,
        name: name || existingTestimonial.name,
        stars: stars || existingTestimonial.stars,
        description: description || existingTestimonial.description
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedTestimonial
    });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    
    // Delete uploaded file if update failed
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating testimonial'
    });
  }
};

// @desc    Delete a testimonial
// @route   DELETE /api/testimonials/:id
// @access  Private (Admin)
export const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    
    const testimonial = await ClientReviewModel.findById(id);
    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }

    // Delete image from Cloudinary
    try {
      await deleteFromCloudinary(getPublicIdFromUrl(testimonial.imageUrl));
    } catch (deleteError) {
      console.error('Error deleting image from Cloudinary:', deleteError);
      // Continue with deletion even if image deletion fails
    }

    await testimonial.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Testimonial deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting testimonial'
    });
  }
};