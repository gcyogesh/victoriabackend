// controllers/FounderController.js
import Founder from '../models/FounderModel.js';
import { singleUpload, getFileUrlWithRequest, deleteLocalFile, getFilenameFromPath } from '../middleware/multer.js';
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
  console.log('Request file:', req.file ? {
    originalname: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    filename: req.file.filename
  } : 'No file uploaded');

  try {
    const { name, position, title, description } = req.body;

    // Validate required fields
    if (!name || !position || !title || !description) {
      console.log('Validation failed - missing required fields');
      
      // Clean up uploaded file if validation fails
      if (req.file) {
        await deleteLocalFile(req.file.filename);
      }
      
      return validationErrorResponse(res, {
        name: !name ? 'Name is required' : undefined,
        position: !position ? 'Position is required' : undefined,
        title: !title ? 'Title is required' : undefined,
        description: !description ? 'Description is required' : undefined
      });
    }

    if (!req.file) {
      console.log('Validation failed - missing image file');
      return validationErrorResponse(res, {
        image: 'Founder image is required'
      });
    }

    // Check if founder with same name already exists
    const existingFounder = await Founder.findOne({ name });
    if (existingFounder) {
      console.log('Conflict - founder with same name exists');
      
      // Clean up uploaded file if conflict occurs
      if (req.file) {
        await deleteLocalFile(req.file.filename);
      }
      
      return conflictResponse(res, 'Founder with this name already exists');
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

    const newFounder = new Founder({
      name,
      position,
      title,
      description,
      imageUrl
    });

    console.log('Saving founder to database...');
    const savedFounder = await newFounder.save();
    console.log('Founder saved successfully:', savedFounder);

    return successResponse(res, savedFounder, 201);
  } catch (error) {
    console.error('Error in createFounder:', {
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
    
    return errorResponse(res, 'Failed to create founder', 500, error);
  }
};

/**
 * @desc    Get all founders
 * @route   GET /api/founders
 * @access  Public
 */
export const getAllFounders = async (req, res) => {
  console.log('=== GET ALL FOUNDERS REQUEST ===');
  
  try {
    console.log('Fetching all founders...');
    const founders = await Founder.find().sort({ createdAt: -1 });
    console.log(`Found ${founders.length} founders`);
    
    return successResponse(res, founders);
  } catch (error) {
    console.error('Error in getAllFounders:', error);
    return errorResponse(res, 'Failed to fetch founders', 500, error);
  }
};

/**
 * @desc    Get single founder by ID
 * @route   GET /api/founders/:id
 * @access  Public
 */
export const getFounderById = async (req, res) => {
  console.log('=== GET FOUNDER BY ID REQUEST ===');
  console.log('Founder ID:', req.params.id);
  
  try {
    console.log(`Fetching founder with ID: ${req.params.id}`);
    const founder = await Founder.findById(req.params.id);
    
    if (!founder) {
      console.log('Founder not found');
      return notFoundResponse(res, 'Founder');
    }
    
    console.log('Founder found:', founder);
    return successResponse(res, founder);
  } catch (error) {
    console.error('Error in getFounderById:', error);
    return errorResponse(res, 'Failed to fetch founder', 500, error);
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
  console.log('Request file:', req.file ? {
    originalname: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    filename: req.file.filename
  } : 'No file uploaded');

  try {
    const { id } = req.params;
    const { name, position, title, description } = req.body;
    
    const founder = await Founder.findById(id);
    
    if (!founder) {
      // Clean up uploaded file if founder not found
      if (req.file) {
        await deleteLocalFile(req.file.filename);
      }
      return notFoundResponse(res, 'Founder');
    }

    // Validate at least one field is being updated
    if (!name && !position && !title && !description && !req.file) {
      return validationErrorResponse(res, {
        update: 'At least one field (name, position, title, description, or image) must be provided for update'
      });
    }

    // Check if name was changed and if it conflicts with another founder
    if (name && name !== founder.name) {
      const existingFounder = await Founder.findOne({
        name,
        _id: { $ne: id }
      });
      
      if (existingFounder) {
        console.log('Conflict - another founder with this name exists');
        
        // Clean up uploaded file if conflict occurs
        if (req.file) {
          await deleteLocalFile(req.file.filename);
        }
        
        return conflictResponse(res, 'Founder with this name already exists');
      }
    }

    let imageUrl = founder.imageUrl;
    
    // Handle image update if new file was uploaded
    if (req.file) {
      try {
        console.log('Processing new image upload...');
        
        // Delete old image file if it exists
        if (founder.imageUrl) {
          const oldFilename = getFilenameFromPath(founder.imageUrl);
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
        
        return errorResponse(res, 'Failed to process new founder image', 500, uploadError);
      }
    }

    // Update fields if they are provided
    if (name) {
      founder.name = name;
      console.log('Name updated to:', name);
    }
    if (position) {
      founder.position = position;
      console.log('Position updated to:', position);
    }
    if (title) {
      founder.title = title;
      console.log('Title updated to:', title);
    }
    if (description) {
      founder.description = description;
      console.log('Description updated to:', description);
    }
    founder.imageUrl = imageUrl;

    console.log('Saving updated founder...');
    const updatedFounder = await founder.save();
    console.log('Founder updated successfully:', updatedFounder);

    return successResponse(res, updatedFounder);
  } catch (error) {
    console.error('Error in updateFounder:', error);
    
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
    
    return errorResponse(res, 'Failed to update founder', 500, error);
  }
};

/**
 * @desc    Delete a founder
 * @route   DELETE /api/founders/:id
 * @access  Private (Admin)
 */
export const deleteFounder = async (req, res) => {
  console.log('=== DELETE FOUNDER REQUEST ===');
  console.log('Founder ID:', req.params.id);
  
  try {
    const { id } = req.params;
    
    console.log(`Attempting to delete founder with ID: ${id}`);
    
    const founder = await Founder.findById(id);
    if (!founder) {
      console.log('Founder not found for deletion');
      return notFoundResponse(res, 'Founder');
    }

    // Delete associated image file
    if (founder.imageUrl) {
      const filename = getFilenameFromPath(founder.imageUrl);
      if (filename) {
        console.log('Deleting associated image:', filename);
        await deleteLocalFile(filename);
      }
    }

    console.log('Deleting founder from database...');
    await founder.deleteOne();
    console.log('Founder and associated files deleted successfully');
    
    return successResponse(res, { 
      message: 'Founder and associated files deleted successfully',
      deletedFounder: founder
    });
  } catch (error) {
    console.error('Error in deleteFounder:', error);
    return errorResponse(res, 'Failed to delete founder', 500, error);
  }
};

/**
 * @desc    Search founders by name, position, or title
 * @route   GET /api/founders/search/:query
 * @access  Public
 */
export const searchFounders = async (req, res) => {
  console.log('=== SEARCH FOUNDERS REQUEST ===');
  console.log('Search query:', req.params.query);
  
  try {
    const { query } = req.params;
    const founders = await Founder.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { position: { $regex: query, $options: 'i' } },
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${founders.length} founders matching: ${query}`);
    return successResponse(res, founders);
  } catch (error) {
    console.error('Error searching founders:', error);
    return errorResponse(res, 'Failed to search founders', 500, error);
  }
};

/**
 * @desc    Get founders by position
 * @route   GET /api/founders/position/:position
 * @access  Public
 */
export const getFoundersByPosition = async (req, res) => {
  console.log('=== GET FOUNDERS BY POSITION REQUEST ===');
  console.log('Position:', req.params.position);
  
  try {
    const { position } = req.params;
    
    if (!position) {
      return validationErrorResponse(res, {
        position: 'Position parameter is required'
      });
    }
    
    const founders = await Founder.find({ 
      position: { $regex: position, $options: 'i' } 
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${founders.length} founders with position: ${position}`);
    return successResponse(res, founders);
  } catch (error) {
    console.error('Error fetching founders by position:', error);
    return errorResponse(res, 'Failed to fetch founders by position', 500, error);
  }
};

/**
 * @desc    Get founders count
 * @route   GET /api/founders/count
 * @access  Public
 */
export const getFoundersCount = async (req, res) => {
  console.log('=== GET FOUNDERS COUNT REQUEST ===');
  
  try {
    const count = await Founder.countDocuments();
    console.log(`Total founders: ${count}`);
    
    return successResponse(res, { count });
  } catch (error) {
    console.error('Error getting founders count:', error);
    return errorResponse(res, 'Failed to get founders count', 500, error);
  }
};