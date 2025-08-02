// controllers/ServiceController.js
import Service from "../models/ServiceModel.js";
import { singleUpload, getFileUrl, deleteLocalFile, getFilenameFromPath } from "../middleware/multer.js";

const handleError = (res, error, statusCode = 500) => {
  console.error(error);
  res.status(statusCode).json({
    success: false,
    error: error.message || "Something went wrong",
  });
};

// Create new service
export const createService = async (req, res) => {
  try {
    const upload = singleUpload("image");
    
    upload(req, res, async (err) => {
      if (err) return handleError(res, err, 400);
      
      try {
        const { title, description } = req.body;
        
        console.log('=== CREATE SERVICE REQUEST ===');
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);
        
        if (!title || !description) {
          // Clean up uploaded file if validation fails
          if (req.file) {
            await deleteLocalFile(req.file.filename);
          }
          return handleError(res, new Error("Title and description are required"), 400);
        }
        
        // Handle image upload
        let imageUrl = null;
        if (req.file) {
          imageUrl = getFileUrl(req.file.filename);
          console.log('File uploaded successfully:', {
            originalname: req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            url: imageUrl
          });
        }
        
        const service = new Service({
          title,
          description,
          imageUrl,
        });
        
        console.log('Saving service to database...');
        await service.save();
        console.log('Service saved successfully:', service);
        
        res.status(201).json({
          success: true,
          data: service,
        });
      } catch (error) {
        console.error('Error in createService:', error);
        
        // Clean up uploaded file if service creation failed
        if (req.file) {
          await deleteLocalFile(req.file.filename);
        }
        
        handleError(res, error);
      }
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get all services
export const getAllServices = async (req, res) => {
  try {
    const { featured } = req.query;
    const filter = {};
    
    if (featured) filter.isFeatured = featured === "true";
    
    const services = await Service.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: services });
  } catch (error) {
    handleError(res, error);
  }
};

// Get single service by slug
export const getServiceBySlug = async (req, res) => {
  try {
    const service = await Service.findOne({ slug: req.params.slug });
    if (!service) return handleError(res, new Error("Service not found"), 404);
    res.json({ success: true, data: service });
  } catch (error) {
    handleError(res, error);
  }
};

// Update service
export const updateService = async (req, res) => {
  try {
    const upload = singleUpload("image");
    
    upload(req, res, async (err) => {
      if (err) return handleError(res, err, 400);
      
      try {
        const { id } = req.params;
        const updateData = { ...req.body };
        
        console.log('=== UPDATE SERVICE REQUEST ===');
        console.log('Request params:', req.params);
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);
        
        // Handle image update
        if (req.file) {
          console.log('Processing new image upload...');
          
          // Get old service to delete old image
          const oldService = await Service.findById(id);
          if (oldService?.imageUrl) {
            const oldFilename = getFilenameFromPath(oldService.imageUrl);
            if (oldFilename) {
              console.log('Deleting old image:', oldFilename);
              await deleteLocalFile(oldFilename);
            }
          }
          
          // Set new image URL
          updateData.imageUrl = getFileUrl(req.file.filename);
          
          console.log('New image uploaded:', {
            originalname: req.file.originalname,
            filename: req.file.filename,
            url: updateData.imageUrl
          });
        }
        
        console.log('Updating service in database...');
        const updatedService = await Service.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true }
        );
        
        if (!updatedService) {
          // Clean up uploaded file if service not found
          if (req.file) {
            await deleteLocalFile(req.file.filename);
          }
          return handleError(res, new Error("Service not found"), 404);
        }
        
        console.log('Service updated successfully:', updatedService);
        res.json({ success: true, data: updatedService });
      } catch (error) {
        console.error('Error in updateService:', error);
        
        // Clean up uploaded file if update failed
        if (req.file) {
          await deleteLocalFile(req.file.filename);
        }
        
        handleError(res, error);
      }
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Delete service
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get service first to access image info
    const service = await Service.findById(id);
    if (!service) return handleError(res, new Error("Service not found"), 404);
    
    // Delete associated image file
    if (service.imageUrl) {
      const filename = getFilenameFromPath(service.imageUrl);
      if (filename) {
        console.log('Deleting associated image:', filename);
        await deleteLocalFile(filename);
      }
    }
    
    // Delete service from database
    await Service.findByIdAndDelete(id);
    
    console.log('Service and associated files deleted successfully');
    res.json({ 
      success: true, 
      message: "Service and associated files deleted successfully" 
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Additional helper functions for service management

// Get service by ID (useful for admin panels)
export const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return handleError(res, new Error("Service not found"), 404);
    res.json({ success: true, data: service });
  } catch (error) {
    handleError(res, error);
  }
};

// Toggle featured status
export const toggleFeaturedService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);
    
    if (!service) return handleError(res, new Error("Service not found"), 404);
    
    service.isFeatured = !service.isFeatured;
    await service.save();
    
    res.json({ 
      success: true, 
      data: service,
      message: `Service ${service.isFeatured ? 'featured' : 'unfeatured'} successfully`
    });
  } catch (error) {
    handleError(res, error);
  }
};