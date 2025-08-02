// controllers/GalleryController.js
import GalleryModel from '../models/GalleryModel.js';
import { getFileUrl, deleteLocalFile, getFilenameFromPath } from '../middleware/multer.js';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  conflictResponse
} from '../utils/responseUtils.js';

export const createGalleryItem = async (req, res) => {
  console.log('=== CREATE GALLERY ITEM REQUEST ===');
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);

  const { title } = req.body;

  if (!title) {
    console.log('Validation failed: Title is required');
    // Clean up uploaded file if validation fails
    if (req.file) {
      await deleteLocalFile(req.file.filename);
    }
    return validationErrorResponse(res, 'Title is required');
  }

  if (!req.file) {
    console.log('Validation failed: Image file is required');
    return validationErrorResponse(res, 'Image file is required');
  }

  try {
    console.log('Checking for existing gallery item with title:', title);
    const existing = await GalleryModel.findOne({ title });
    if (existing) {
      console.log('Conflict: Gallery item with this title already exists');
      // Clean up uploaded file if there's a conflict
      await deleteLocalFile(req.file.filename);
      return conflictResponse(res, 'Gallery item with this title already exists');
    }

    // Get file URL for local storage
    const imageUrl = getFileUrl(req.file.filename);
    
    console.log('File uploaded successfully:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      url: imageUrl
    });

    const newGalleryItem = new GalleryModel({
      title,
      imageUrl
    });

    console.log('Saving new gallery item to database...');
    const savedGalleryItem = await newGalleryItem.save();
    console.log('Gallery item created successfully:', savedGalleryItem);

    return successResponse(res, savedGalleryItem, 201);
  } catch (error) {
    console.error('Error creating gallery item:', error);
    
    // Clean up uploaded file if creation failed
    if (req.file) {
      await deleteLocalFile(req.file.filename);
    }
    
    return errorResponse(res, 'Failed to create gallery item', 500, {
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

export const getAllGalleryItems = async (req, res) => {
  console.log('=== GET ALL GALLERY ITEMS REQUEST ===');
  
  try {
    console.log('Fetching all gallery items...');
    const galleryItems = await GalleryModel.find().sort({ createdAt: -1 });
    console.log(`Found ${galleryItems.length} items`);
    
    return successResponse(res, galleryItems);
  } catch (error) {
    console.error('Error fetching gallery items:', error);
    return errorResponse(res, 'Failed to fetch gallery items', 500, {
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

export const getGalleryItemById = async (req, res) => {
  console.log('=== GET GALLERY ITEM REQUEST ===');
  console.log('Item ID:', req.params.id);

  try {
    console.log('Fetching gallery item from database...');
    const galleryItem = await GalleryModel.findById(req.params.id);
    
    if (!galleryItem) {
      console.log('Gallery item not found');
      return notFoundResponse(res, 'Gallery item');
    }

    console.log('Gallery item found:', galleryItem);
    return successResponse(res, galleryItem);
  } catch (error) {
    console.error('Error fetching gallery item:', error);
    return errorResponse(res, 'Failed to fetch gallery item', 500, {
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

export const updateGalleryItem = async (req, res) => {
  console.log('=== UPDATE GALLERY ITEM REQUEST ===');
  console.log('Item ID:', req.params.id);
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);

  try {
    const { title } = req.body;
    const updates = {};

    // Get existing item to check for image cleanup
    const existingItem = await GalleryModel.findById(req.params.id);
    if (!existingItem) {
      console.log('Gallery item not found for update');
      // Clean up uploaded file if item not found
      if (req.file) {
        await deleteLocalFile(req.file.filename);
      }
      return notFoundResponse(res, 'Gallery item');
    }

    if (title) {
      updates.title = title;
      console.log('Title updated to:', title);
    }

    if (req.file) {
      console.log('Processing new image upload...');
      
      // Delete old image file
      if (existingItem.imageUrl) {
        const oldFilename = getFilenameFromPath(existingItem.imageUrl);
        if (oldFilename) {
          console.log('Deleting old image:', oldFilename);
          await deleteLocalFile(oldFilename);
        }
      }
      
      // Set new image URL
      updates.imageUrl = getFileUrl(req.file.filename);
      
      console.log('New image uploaded:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        url: updates.imageUrl
      });
    }

    console.log('Updating gallery item in database...');
    const updatedGalleryItem = await GalleryModel.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedGalleryItem) {
      console.log('Gallery item not found after update attempt');
      // Clean up uploaded file if update failed
      if (req.file) {
        await deleteLocalFile(req.file.filename);
      }
      return notFoundResponse(res, 'Gallery item');
    }

    console.log('Gallery item updated successfully:', updatedGalleryItem);
    return successResponse(res, updatedGalleryItem);
  } catch (error) {
    console.error('Error updating gallery item:', error);
    
    // Clean up uploaded file if update failed
    if (req.file) {
      await deleteLocalFile(req.file.filename);
    }
    
    return errorResponse(res, 'Failed to update gallery item', 500, {
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

export const deleteGalleryItem = async (req, res) => {
  console.log('=== DELETE GALLERY ITEM REQUEST ===');
  console.log('Item ID:', req.params.id);

  try {
    console.log('Finding gallery item to delete...');
    const galleryItem = await GalleryModel.findById(req.params.id);
    
    if (!galleryItem) {
      console.log('Gallery item not found');
      return notFoundResponse(res, 'Gallery item');
    }

    // Delete associated image file
    if (galleryItem.imageUrl) {
      const filename = getFilenameFromPath(galleryItem.imageUrl);
      if (filename) {
        console.log('Deleting associated image:', filename);
        await deleteLocalFile(filename);
      }
    }

    console.log('Deleting gallery item from database...');
    await GalleryModel.findByIdAndDelete(req.params.id);
    console.log('Gallery item and associated files deleted successfully');

    return successResponse(res, { 
      message: 'Gallery item and associated files deleted successfully',
      deletedItem: galleryItem
    });
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    return errorResponse(res, 'Failed to delete gallery item', 500, {
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

// Additional helper functions

// Get gallery items with pagination
export const getGalleryItemsPaginated = async (req, res) => {
  console.log('=== GET PAGINATED GALLERY ITEMS REQUEST ===');
  
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    console.log(`Fetching page ${page} with limit ${limit}`);
    
    const [galleryItems, totalCount] = await Promise.all([
      GalleryModel.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      GalleryModel.countDocuments()
    ]);
    
    const totalPages = Math.ceil(totalCount / limit);
    
    console.log(`Found ${galleryItems.length} items out of ${totalCount} total`);
    
    return successResponse(res, {
      items: galleryItems,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching paginated gallery items:', error);
    return errorResponse(res, 'Failed to fetch gallery items', 500, {
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

// Search gallery items by title
export const searchGalleryItems = async (req, res) => {
  console.log('=== SEARCH GALLERY ITEMS REQUEST ===');
  
  try {
    const { q } = req.query;
    
    if (!q) {
      return validationErrorResponse(res, 'Search query is required');
    }
    
    console.log('Search query:', q);
    
    const galleryItems = await GalleryModel.find({
      title: { $regex: q, $options: 'i' }
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${galleryItems.length} items matching "${q}"`);
    
    return successResponse(res, galleryItems);
  } catch (error) {
    console.error('Error searching gallery items:', error);
    return errorResponse(res, 'Failed to search gallery items', 500, {
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};  