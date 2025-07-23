import Founder from '../models/FounderModel.js';
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../middleware/multer.js';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  conflictResponse
} from '../utils/responseUtils.js';

/**
 * @desc    Create a new founder
 * @route   POST /api/founders
 * @access  Private (Admin)
 */
export const createFounder = async (req, res) => {
  console.log('=== CREATE FOUNDER REQUEST ===');
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);

  try {
    const { name, position, title, description } = req.body;

    // Validate required fields
    if (!name || !position || !title || !description) {
      console.log('Validation failed - missing required fields');
      return validationErrorResponse(res, 'All fields are required');
    }

    if (!req.file) {
      console.log('Validation failed - missing image file');
      return validationErrorResponse(res, 'Founder image is required');
    }

    // Check if founder with same name already exists
    const existingFounder = await Founder.findOne({ name });
    if (existingFounder) {
      console.log('Conflict - founder with same name exists');
      return conflictResponse(res, 'Founder');
    }

    console.log('Uploading founder image to Cloudinary...');
    const imageResult = await uploadToCloudinary(req.file.path, 'founder-images');
    console.log('Founder image uploaded:', imageResult);

    const newFounder = new Founder({
      name,
      position,
      title,
      description,
      imageUrl: imageResult.url
    });

    console.log('Saving founder to database...');
    const savedFounder = await newFounder.save();
    console.log('Founder saved successfully:', savedFounder);

    return successResponse(res, savedFounder, 201);
  } catch (error) {
    console.error('Error in createFounder:', error);
    
    // Detailed error information
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      ...(error.response && { response: error.response.data }),
      ...(error.code && { code: error.code })
    };
    
    console.error('Full error details:', errorInfo);
    return errorResponse(res, 'Failed to create founder', 500, errorInfo);
  }
};

/**
 * @desc    Get all founders
 * @route   GET /api/founders
 * @access  Public
 */
export const getAllFounders = async (req, res) => {
  try {
    console.log('Fetching all founders...');
    const founders = await Founder.find().sort({ createdAt: -1 });
    console.log(`Found ${founders.length} founders`);
    successResponse(res, founders);
  } catch (error) {
    console.error('Error in getAllFounders:', error);
    errorResponse(res, 'Failed to fetch founders', 500, error);
  }
};

/**
 * @desc    Get single founder by ID
 * @route   GET /api/founders/:id
 * @access  Public
 */
export const getFounderById = async (req, res) => {
  try {
    console.log(`Fetching founder with ID: ${req.params.id}`);
    const founder = await Founder.findById(req.params.id);
    
    if (!founder) {
      console.log('Founder not found');
      return notFoundResponse(res, 'Founder');
    }
    
    console.log('Founder found:', founder);
    successResponse(res, founder);
  } catch (error) {
    console.error('Error in getFounderById:', error);
    errorResponse(res, 'Failed to fetch founder', 500, error);
  }
};

/**
 * @desc    Update a founder
 * @route   PUT /api/founders/:id
 * @access  Private (Admin)
 */
export const updateFounder = async (req, res) => {
  console.log('=== UPDATE FOUNDER REQUEST ===');
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);

  try {
    const { name, position, title, description } = req.body;
    const updates = {
      ...(name && { name }),
      ...(position && { position }),
      ...(title && { title }),
      ...(description && { description })
    };

    // Check if name was changed and if it conflicts with another founder
    if (name) {
      const existingFounder = await Founder.findOne({
        name,
        _id: { $ne: req.params.id }
      });
      
      if (existingFounder) {
        console.log('Conflict - another founder with this name exists');
        return conflictResponse(res, 'Founder with this name already exists');
      }
    }

    // Handle image update if new file was uploaded
    if (req.file) {
      console.log('Uploading new founder image to Cloudinary...');
      const imageResult = await uploadToCloudinary(req.file.path, 'founder-images');
      updates.imageUrl = imageResult.url;
      console.log('New founder image uploaded:', imageResult.url);
      
      // Get old image public ID to delete later
      const founder = await Founder.findById(req.params.id);
      if (founder?.imageUrl) {
        try {
          const publicId = getPublicIdFromUrl(founder.imageUrl);
          console.log('Deleting old founder image from Cloudinary...');
          await deleteFromCloudinary(publicId);
        } catch (deleteError) {
          console.error('Error deleting old founder image:', deleteError);
        }
      }
    }

    console.log('Updating founder in database...');
    const updatedFounder = await Founder.findByIdAndUpdate(
      req.params.id,
      updates,
      { 
        new: true, 
        runValidators: true
      }
    );

    if (!updatedFounder) {
      console.log('Founder not found for update');
      return notFoundResponse(res, 'Founder');
    }

    console.log('Founder updated successfully:', updatedFounder);
    return successResponse(res, updatedFounder);
  } catch (error) {
    console.error('Error in updateFounder:', error);
    
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      ...(error.name === 'ValidationError' && { validationErrors: error.errors }),
      ...(error.response && { response: error.response.data }),
      ...(error.code && { code: error.code })
    };
    
    console.error('Full error details:', errorInfo);
    return errorResponse(res, 'Failed to update founder', 500, errorInfo);
  }
};

/**
 * @desc    Delete a founder
 * @route   DELETE /api/founders/:id
 * @access  Private (Admin)
 */
export const deleteFounder = async (req, res) => {
  try {
    console.log(`Attempting to delete founder with ID: ${req.params.id}`);
    
    const founder = await Founder.findById(req.params.id);
    if (!founder) {
      console.log('Founder not found for deletion');
      return notFoundResponse(res, 'Founder');
    }

    // Delete image from Cloudinary if it exists
    if (founder.imageUrl) {
      try {
        const publicId = getPublicIdFromUrl(founder.imageUrl);
        console.log('Deleting founder image from Cloudinary...');
        await deleteFromCloudinary(publicId);
      } catch (deleteError) {
        console.error('Error deleting founder image:', deleteError);
      }
    }

    console.log('Deleting founder from database...');
    await Founder.findByIdAndDelete(req.params.id);
    
    console.log('Founder deleted successfully');
    return successResponse(res, { message: 'Founder deleted successfully' });
  } catch (error) {
    console.error('Error in deleteFounder:', error);
    errorResponse(res, 'Failed to delete founder', 500, error);
  }
};