// controllers/ServiceController.js
import Service from "../models/ServiceModel.js";
import { singleUpload, getFileUrlWithRequest, deleteLocalFile, getFilenameFromPath } from "../middleware/multer.js";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse
} from '../utils/responseUtils.js';

/**
 * @desc    Create new service
 * @route   POST /api/services
 * @access  Private (Admin)
 */
export const createService = async (req, res) => {
  try {
    const upload = singleUpload("image");
    
    upload(req, res, async (err) => {
      if (err) {
        console.error('Multer upload error:', err);
        return errorResponse(res, err.message || "File upload failed", 400, err);
      }
      
      try {
        console.log('=== CREATE SERVICE REQUEST ===');
        console.log('Request body:', req.body);
        console.log('Request file:', req.file ? {
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          filename: req.file.filename
        } : 'No file uploaded');

        const { title, description } = req.body;
        const bestFor = req.body.bestFor || "";
        let subservices = [];
        if (req.body.subservices) {
          try {
            subservices = JSON.parse(req.body.subservices);
            console.log('Parsed subservices:', subservices);
          } catch (e) {
            console.error('Invalid subservices JSON:', e, req.body.subservices);
          }
        }
        let faq = [];
        if (req.body.faq) {
          try {
            faq = JSON.parse(req.body.faq);
            console.log('Parsed faq:', faq);
          } catch (e) {
            console.error('Invalid faq JSON:', e, req.body.faq);
          }
        }
        // Validate required fields BEFORE creating the Service instance
        if (!title || !description) {
          console.log('Validation failed - missing required fields');
          // Clean up uploaded file if validation fails
          if (req.file) {
            await deleteLocalFile(req.file.filename);
          }
          return validationErrorResponse(res, {
            title: !title ? 'Title is required' : undefined,
            description: !description ? 'Description is required' : undefined
          });
        }
        // Handle image upload (optional for services)
        let imageUrl = null;
        if (req.file) {
          // Get file URL for local storage with dynamic protocol/host
          imageUrl = getFileUrlWithRequest(req.file.filename, req);
          console.log('File uploaded successfully:', {
            originalname: req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            url: imageUrl,
            generatedFrom: `${req.protocol}://${req.get('host')}`
          });
        }
        console.log('Saving service with:', { title, description, bestFor, subservices, faq, imageUrl });
        const service = new Service({
          title,
          description,
          bestFor,
          subservices,
          faq,
          imageUrl
        });
    
    console.log('Saving service to database...');
    const createdService = await service.save();
    console.log('Service created successfully:', createdService);
    
        return successResponse(res, createdService, 201);
      } catch (error) {
        console.error('Error creating service:', {
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

        return errorResponse(res, "Failed to create service", 500, error);
      }
    });
  } catch (error) {
    console.error('Error in createService wrapper:', error);
    return errorResponse(res, "Failed to create service", 500, error);
  }
};

/**
 * @desc    Get all services
 * @route   GET /api/services
 * @access  Public
 */
export const getAllServices = async (req, res) => {
  console.log('=== GET ALL SERVICES REQUEST ===');
  
  try {
    const { featured } = req.query;
    const filter = {};
    
    if (featured) {
      filter.isFeatured = featured === "true";
      console.log('Filtering by featured status:', featured);
    }
    
    console.log('Fetching services with filter:', filter);
    const services = await Service.find(filter).sort({ createdAt: -1 });
    console.log(`Found ${services.length} services`);
    
    return successResponse(res, services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return errorResponse(res, "Failed to fetch services", 500, error);
  }
};

/**
 * @desc    Get single service by slug
 * @route   GET /api/services/slug/:slug
 * @access  Public
 */
export const getServiceBySlug = async (req, res) => {
  console.log('=== GET SERVICE BY SLUG REQUEST ===');
  console.log('Service slug:', req.params.slug);
  
  try {
    const { slug } = req.params;
    
    if (!slug) {
      return validationErrorResponse(res, {
        slug: 'Service slug is required'
      });
    }
    
    console.log(`Fetching service with slug: ${slug}`);
    const service = await Service.findOne({ slug });
    
    if (!service) {
      console.log('Service not found');
      return notFoundResponse(res, "Service");
    }
    
    console.log('Service found:', service);
    return successResponse(res, service);
  } catch (error) {
    console.error('Error fetching service by slug:', error);
    return errorResponse(res, "Failed to fetch service", 500, error);
  }
};

/**
 * @desc    Get single service by ID
 * @route   GET /api/services/:id
 * @access  Public
 */
export const getServiceById = async (req, res) => {
  console.log('=== GET SERVICE BY ID REQUEST ===');
  console.log('Service ID:', req.params.id);
  
  try {
    console.log(`Fetching service with ID: ${req.params.id}`);
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      console.log('Service not found');
      return notFoundResponse(res, "Service");
    }
    
    console.log('Service found:', service);
    return successResponse(res, service);
  } catch (error) {
    console.error('Error fetching service by ID:', error);
    return errorResponse(res, "Failed to fetch service", 500, error);
  }
};

/**
 * @desc    Update service
 * @route   PUT /api/services/:id
 * @access  Private (Admin)
 */
export const updateService = async (req, res) => {
  try {
    const upload = singleUpload("image");
    
    upload(req, res, async (err) => {
      if (err) {
        console.error('Multer upload error:', err);
        return errorResponse(res, err.message || "File upload failed", 400, err);
      }
      
      try {
        console.log('=== UPDATE SERVICE REQUEST ===');
        console.log('Request params:', req.params);
        console.log('Request body:', req.body);
        console.log('Request file:', req.file ? {
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          filename: req.file.filename
        } : 'No file uploaded');

        const { id } = req.params;
        const { title, description, isFeatured, bestFor } = req.body;
        let subservices = [];
        if (req.body.subservices) {
          try {
            subservices = JSON.parse(req.body.subservices);
          } catch (e) {
            console.error('Invalid subservices JSON:', e);
          }
        }
    
    const service = await Service.findById(id);
    
    if (!service) {
      // Clean up uploaded file if service not found
      if (req.file) {
        await deleteLocalFile(req.file.filename);
      }
      return notFoundResponse(res, "Service");
    }

    // Validate at least one field is being updated
    if (!title && !description && isFeatured === undefined && !req.file && !bestFor && subservices.length === 0) {
      return validationErrorResponse(res, {
        update: 'At least one field (title, description, isFeatured, or image) must be provided for update'
      });
    }

    let imageUrl = service.imageUrl;
    
    // Handle image update if new file was uploaded
    if (req.file) {
      try {
        console.log('Processing new image upload...');
        
        // Delete old image file if it exists
        if (service.imageUrl) {
          const oldFilename = getFilenameFromPath(service.imageUrl);
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
        
        return errorResponse(res, "Failed to process new service image", 500, uploadError);
      }
    }

    // Update fields if they are provided
    if (title) {
      service.title = title;
      console.log('Title updated to:', title);
    }
    if (description) {
      service.description = description;
      console.log('Description updated to:', description);
    }
    if (isFeatured !== undefined) {
      service.isFeatured = isFeatured;
      console.log('Featured status updated to:', isFeatured);
    }
    if (bestFor) {
      service.bestFor = bestFor;
      console.log('Best for updated to:', bestFor);
    }
    if (subservices) {
      service.subservices = subservices;
      console.log('Subservices updated to:', subservices);
    }
    service.imageUrl = imageUrl;

    console.log('Saving updated service...');
    const updatedService = await service.save();
    console.log('Service updated successfully:', updatedService);

        return successResponse(res, updatedService);
      } catch (error) {
        console.error('Error updating service:', error);
        
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

        return errorResponse(res, "Failed to update service", 500, error);
      }
    });
  } catch (error) {
    console.error('Error in updateService wrapper:', error);
    return errorResponse(res, "Failed to update service", 500, error);
  }
};

/**
 * @desc    Delete service
 * @route   DELETE /api/services/:id
 * @access  Private (Admin)
 */
export const deleteService = async (req, res) => {
  console.log('=== DELETE SERVICE REQUEST ===');
  console.log('Service ID:', req.params.id);
  
  try {
    const { id } = req.params;
    
    console.log(`Attempting to delete service with ID: ${id}`);
    
    const service = await Service.findById(id);
    if (!service) {
      console.log('Service not found for deletion');
      return notFoundResponse(res, "Service");
    }

    // Delete associated image file
    if (service.imageUrl) {
      const filename = getFilenameFromPath(service.imageUrl);
      if (filename) {
        console.log('Deleting associated image:', filename);
        await deleteLocalFile(filename);
      }
    }

    console.log('Deleting service from database...');
    await service.deleteOne();
    console.log('Service and associated files deleted successfully');

    return successResponse(res, { 
      message: "Service and associated files deleted successfully",
      deletedService: service
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    return errorResponse(res, "Failed to delete service", 500, error);
  }
};

/**
 * @desc    Toggle featured status
 * @route   PATCH /api/services/:id/toggle-featured
 * @access  Private (Admin)
 */
export const toggleFeaturedService = async (req, res) => {
  console.log('=== TOGGLE FEATURED SERVICE REQUEST ===');
  console.log('Service ID:', req.params.id);
  
  try {
    const { id } = req.params;
    
    const service = await Service.findById(id);
    
    if (!service) {
      console.log('Service not found');
      return notFoundResponse(res, "Service");
    }
    
    const previousStatus = service.isFeatured;
    service.isFeatured = !service.isFeatured;
    await service.save();
    
    console.log(`Service featured status changed from ${previousStatus} to ${service.isFeatured}`);
    
    return successResponse(res, {
      service,
      message: `Service ${service.isFeatured ? 'featured' : 'unfeatured'} successfully`
    });
  } catch (error) {
    console.error('Error toggling featured service:', error);
    return errorResponse(res, "Failed to toggle featured status", 500, error);
  }
};

/**
 * @desc    Search services by title or description
 * @route   GET /api/services/search/:query
 * @access  Public
 */
export const searchServices = async (req, res) => {
  console.log('=== SEARCH SERVICES REQUEST ===');
  console.log('Search query:', req.params.query);
  
  try {
    const { query } = req.params;
    
    if (!query || !query.trim()) {
      return validationErrorResponse(res, { query: 'Search query is required' });
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    const services = await Service.find({
      $or: [
        { title: searchRegex },
        { description: searchRegex }
      ]
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${services.length} services matching: ${query}`);
    return successResponse(res, services);
  } catch (error) {
    console.error('Error searching services:', error);
    return errorResponse(res, "Failed to search services", 500, error);
  }
};

/**
 * @desc    Get featured services
 * @route   GET /api/services/featured
 * @access  Public
 */
export const getFeaturedServices = async (req, res) => {
  console.log('=== GET FEATURED SERVICES REQUEST ===');
  
  try {
    console.log('Fetching featured services...');
    const services = await Service.find({ isFeatured: true }).sort({ createdAt: -1 });
    console.log(`Found ${services.length} featured services`);
    
    return successResponse(res, services);
  } catch (error) {
    console.error('Error fetching featured services:', error);
    return errorResponse(res, "Failed to fetch featured services", 500, error);
  }
};

/**
 * @desc    Get services count
 * @route   GET /api/services/count
 * @access  Public
 */
export const getServicesCount = async (req, res) => {
  console.log('=== GET SERVICES COUNT REQUEST ===');
  
  try {
    const totalCount = await Service.countDocuments();
    const featuredCount = await Service.countDocuments({ isFeatured: true });
    
    console.log(`Total services: ${totalCount}, Featured: ${featuredCount}`);
    
    return successResponse(res, { 
      total: totalCount,
      featured: featuredCount
    });
  } catch (error) {
    console.error('Error getting services count:', error);
    return errorResponse(res, "Failed to get services count", 500, error);
  }
};