
// import GalleryModel from '../models/GalleryModel.js';
// import { uploadToCloudinary } from '../middleware/multer.js';
// import {
//   successResponse,
//   errorResponse,
//   notFoundResponse,
//   validationErrorResponse,
//   conflictResponse
// } from '../utils/responseUtils.js';

// export const createGalleryItem = async (req, res) => {
//   const { title } = req.body;

//   if (!title) {
//     return validationErrorResponse(res, 'Title is required');
//   }

//   if (!req.file) {
//     return validationErrorResponse(res, 'Image file is required');
//   }

//   try {
//     const existing = await GalleryModel.findOne({ title });
//     if (existing) {
//       return conflictResponse(res, 'Gallery item');
//     }

//     const imageUrl = await uploadToCloudinary(req.file.path, 'uploads');

//     const newGalleryItem = new GalleryModel({ title, imageUrl });
//     const savedGalleryItem = await newGalleryItem.save();

//     successResponse(res, savedGalleryItem, 201);
//   } catch (error) {
//     errorResponse(res, 'Failed to create gallery item', 500, error);
//   }
// };

// export const getAllGalleryItems = async (req, res) => {
//   try {
//     const galleryItems = await GalleryModel.find().sort({ createdAt: -1 });
//     successResponse(res, galleryItems);
//   } catch (error) {
//     errorResponse(res, 'Failed to fetch gallery items', 500, error);
//   }
// };

// export const getGalleryItemById = async (req, res) => {
//   try {
//     const galleryItem = await GalleryModel.findById(req.params.id);
//     if (!galleryItem) {
//       return notFoundResponse(res, 'Gallery item');
//     }
//     successResponse(res, galleryItem);
//   } catch (error) {
//     errorResponse(res, 'Failed to fetch gallery item', 500, error);
//   }
// };

// export const updateGalleryItem = async (req, res) => {
//   try {
//     const { title } = req.body;
//     const updates = {};

//     if (title) updates.title = title;

//     if (req.file) {
//       const newImageUrl = await uploadToCloudinary(req.file.path, 'uploads');
//       updates.imageUrl = newImageUrl;
//     }

//     const updatedGalleryItem = await GalleryModel.findByIdAndUpdate(
//       req.params.id,
//       updates,
//       { new: true, runValidators: true }
//     );

//     if (!updatedGalleryItem) {
//       return notFoundResponse(res, 'Gallery item');
//     }

//     successResponse(res, updatedGalleryItem);
//   } catch (error) {
//     errorResponse(res, 'Failed to update gallery item', 500, error);
//   }
// };

// export const deleteGalleryItem = async (req, res) => {
//   try {
//     const deletedGalleryItem = await GalleryModel.findByIdAndDelete(req.params.id);
//     if (!deletedGalleryItem) {
//       return notFoundResponse(res, 'Gallery item');
//     }
//     successResponse(res, { message: 'Gallery item deleted successfully' });
//   } catch (error) {
//     errorResponse(res, 'Failed to delete gallery item', 500, error);
//   }
// };

import GalleryModel from '../models/GalleryModel.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../middleware/multer.js';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  conflictResponse
} from '../utils/responseUtils.js';

// Helper function to extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  const uploadIndex = parts.findIndex(part => part === 'upload');
  return parts.slice(uploadIndex + 2).join('/').split('.')[0];
};

export const createGalleryItem = async (req, res) => {
  console.log('=== CREATE GALLERY ITEM REQUEST ===');
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);

  const { title } = req.body;

  if (!title) {
    console.log('Validation failed: Title is required');
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
      return conflictResponse(res, 'Gallery item with this title already exists');
    }

    console.log('Uploading image to Cloudinary...');
    const imageResult = await uploadToCloudinary(req.file.path, 'gallery-uploads');
    console.log('Image uploaded successfully. URL:', imageResult.url);

    const newGalleryItem = new GalleryModel({
      title,
      imageUrl: imageResult.url,
      publicId: imageResult.public_id
    });

    console.log('Saving new gallery item to database...');
    const savedGalleryItem = await newGalleryItem.save();
    console.log('Gallery item created successfully:', savedGalleryItem);

    return successResponse(res, savedGalleryItem, 201);
  } catch (error) {
    console.error('Error creating gallery item:', error);
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
    let oldPublicId = null;

    // Get existing item to check for image cleanup
    const existingItem = await GalleryModel.findById(req.params.id);
    if (!existingItem) {
      console.log('Gallery item not found for update');
      return notFoundResponse(res, 'Gallery item');
    }

    if (title) {
      updates.title = title;
      console.log('Title updated to:', title);
    }

    if (req.file) {
      console.log('Uploading new image to Cloudinary...');
      const imageResult = await uploadToCloudinary(req.file.path, 'gallery-uploads');
      updates.imageUrl = imageResult.url;
      updates.publicId = imageResult.public_id;
      console.log('New image uploaded. URL:', imageResult.url);
      
      // Store old public ID for cleanup
      oldPublicId = existingItem.publicId;
    }

    console.log('Updating gallery item in database...');
    const updatedGalleryItem = await GalleryModel.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedGalleryItem) {
      console.log('Gallery item not found after update attempt');
      return notFoundResponse(res, 'Gallery item');
    }

    // Clean up old image if it was replaced
    if (oldPublicId) {
      try {
        console.log('Cleaning up old image from Cloudinary...');
        await deleteFromCloudinary(oldPublicId);
        console.log('Old image deleted successfully');
      } catch (deleteError) {
        console.error('Error deleting old image:', deleteError);
        // Continue even if cleanup fails
      }
    }

    console.log('Gallery item updated successfully:', updatedGalleryItem);
    return successResponse(res, updatedGalleryItem);
  } catch (error) {
    console.error('Error updating gallery item:', error);
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

    // Delete image from Cloudinary if exists
    if (galleryItem.publicId) {
      try {
        console.log('Deleting image from Cloudinary...');
        await deleteFromCloudinary(galleryItem.publicId);
        console.log('Image deleted from Cloudinary');
      } catch (deleteError) {
        console.error('Error deleting image from Cloudinary:', deleteError);
        // Continue with deletion even if image cleanup fails
      }
    }

    console.log('Deleting gallery item from database...');
    await GalleryModel.findByIdAndDelete(req.params.id);
    console.log('Gallery item deleted successfully');

    return successResponse(res, { 
      message: 'Gallery item deleted successfully',
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