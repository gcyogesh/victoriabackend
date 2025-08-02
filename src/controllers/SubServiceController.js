// controllers/SubServiceController.js
import SubService from "../models/SubServiceModel.js";
import { singleUpload, getFileUrl, deleteLocalFile, getFilenameFromPath } from "../middleware/multer.js";

// @desc    Create a new sub-service
// @route   POST /api/subservices
// @access  Private/Admin
export const createSubService = async (req, res) => {
  try {
    // Handle file upload
    const upload = singleUpload('image');
    upload(req, res, async (err) => {
      if (err) {
        console.error('Multer upload error:', err);
        return res.status(400).json({ error: err.message });
      }

      console.log('=== CREATE SUB-SERVICE REQUEST ===');
      console.log('Request body:', req.body);
      console.log('Request file:', req.file);

      if (!req.file) {
        console.log('Validation failed: Image is required');
        return res.status(400).json({ error: "Image is required" });
      }

      try {
        const { title, description, parentService } = req.body;
        
        if (!title || !description || !parentService) {
          // Clean up uploaded file if validation fails
          await deleteLocalFile(req.file.filename);
          return res.status(400).json({ 
            error: "Title, description, and parent service are required" 
          });
        }

        // Get file URL for local storage
        const imageUrl = getFileUrl(req.file.filename);
        
        console.log('File uploaded successfully:', {
          originalname: req.file.originalname,
          filename: req.file.filename,
          path: req.file.path,
          url: imageUrl
        });

        // Create sub-service
        const subService = new SubService({
          title,
          description,
          parentService,
          imageUrl
        });

        console.log('Saving sub-service to database...');
        const createdSubService = await subService.save();
        console.log('Sub-service created successfully:', createdSubService);
        
        res.status(201).json(createdSubService);
      } catch (error) {
        console.error('Error creating sub-service:', error);
        
        // Clean up uploaded file if creation failed
        if (req.file) {
          await deleteLocalFile(req.file.filename);
        }
        
        res.status(500).json({ error: error.message });
      }
    });
  } catch (error) {
    console.error('Error in createSubService:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get all sub-services
// @route   GET /api/subservices
// @access  Public
export const getSubServices = async (req, res) => {
  try {
    console.log('=== GET ALL SUB-SERVICES REQUEST ===');
    
    const subServices = await SubService.find().populate('parentService', 'title');
    console.log(`Found ${subServices.length} sub-services`);
    
    res.json(subServices);
  } catch (error) {
    console.error('Error fetching sub-services:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get sub-services by parent service ID
// @route   GET /api/subservices/parent/:parentId
// @access  Public
export const getSubServicesByParent = async (req, res) => {
  try {
    console.log('=== GET SUB-SERVICES BY PARENT REQUEST ===');
    console.log('Parent ID:', req.params.parentId);
    
    const subServices = await SubService.find({ 
      parentService: req.params.parentId 
    }).populate('parentService', 'title');
    
    console.log(`Found ${subServices.length} sub-services for parent ${req.params.parentId}`);
    res.json(subServices);
  } catch (error) {
    console.error('Error fetching sub-services by parent:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get single sub-service
// @route   GET /api/subservices/:id
// @access  Public
export const getSubService = async (req, res) => {
  try {
    console.log('=== GET SUB-SERVICE REQUEST ===');
    console.log('Sub-service ID:', req.params.id);
    
    const subService = await SubService.findById(req.params.id)
      .populate('parentService', 'title');

    if (!subService) {
      console.log('Sub-service not found');
      return res.status(404).json({ error: "Sub-service not found" });
    }

    console.log('Sub-service found:', subService);
    res.json(subService);
  } catch (error) {
    console.error('Error fetching sub-service:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update a sub-service
// @route   PUT /api/subservices/:id
// @access  Private/Admin
export const updateSubService = async (req, res) => {
  try {
    const upload = singleUpload('image');
    upload(req, res, async (err) => {
      if (err) {
        console.error('Multer upload error:', err);
        return res.status(400).json({ error: err.message });
      }

      console.log('=== UPDATE SUB-SERVICE REQUEST ===');
      console.log('Sub-service ID:', req.params.id);
      console.log('Request body:', req.body);
      console.log('Request file:', req.file);

      try {
        const subService = await SubService.findById(req.params.id);
        
        if (!subService) {
          // Clean up uploaded file if sub-service not found
          if (req.file) {
            await deleteLocalFile(req.file.filename);
          }
          return res.status(404).json({ error: "Sub-service not found" });
        }

        const { title, description, parentService } = req.body;
        
        // Update fields
        if (title) subService.title = title;
        if (description) subService.description = description;
        if (parentService) subService.parentService = parentService;

        // If new image was uploaded
        if (req.file) {
          console.log('Processing new image upload...');
          
          // Delete old image file
          if (subService.imageUrl) {
            const oldFilename = getFilenameFromPath(subService.imageUrl);
            if (oldFilename) {
              console.log('Deleting old image:', oldFilename);
              await deleteLocalFile(oldFilename);
            }
          }
          
          // Set new image URL
          subService.imageUrl = getFileUrl(req.file.filename);
          
          console.log('New image uploaded:', {
            originalname: req.file.originalname,
            filename: req.file.filename,
            url: subService.imageUrl
          });
        }

        console.log('Saving updated sub-service...');
        const updatedSubService = await subService.save();
        console.log('Sub-service updated successfully:', updatedSubService);
        
        res.json(updatedSubService);
      } catch (error) {
        console.error('Error updating sub-service:', error);
        
        // Clean up uploaded file if update failed
        if (req.file) {
          await deleteLocalFile(req.file.filename);
        }
        
        res.status(500).json({ error: error.message });
      }
    });
  } catch (error) {
    console.error('Error in updateSubService:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete a sub-service
// @route   DELETE /api/subservices/:id
// @access  Private/Admin
export const deleteSubService = async (req, res) => {
  try {
    console.log('=== DELETE SUB-SERVICE REQUEST ===');
    console.log('Sub-service ID:', req.params.id);
    
    const subService = await SubService.findById(req.params.id);
    
    if (!subService) {
      console.log('Sub-service not found');
      return res.status(404).json({ error: "Sub-service not found" });
    }

    // Delete associated image file
    if (subService.imageUrl) {
      const filename = getFilenameFromPath(subService.imageUrl);
      if (filename) {
        console.log('Deleting associated image:', filename);
        await deleteLocalFile(filename);
      }
    }

    console.log('Deleting sub-service from database...');
    await subService.deleteOne();
    console.log('Sub-service and associated files deleted successfully');
    
    res.json({ 
      message: "Sub-service and associated files deleted successfully",
      deletedSubService: subService
    });
  } catch (error) {
    console.error('Error deleting sub-service:', error);
    res.status(500).json({ error: error.message });
  }
};

// Additional helper functions

// @desc    Get sub-services by parent service slug
// @route   GET /api/subservices/parent/slug/:slug
// @access  Public
export const getSubServicesByParentSlug = async (req, res) => {
  try {
    console.log('=== GET SUB-SERVICES BY PARENT SLUG REQUEST ===');
    console.log('Parent slug:', req.params.slug);
    
    const subServices = await SubService.find()
      .populate({
        path: 'parentService',
        match: { slug: req.params.slug },
        select: 'title slug'
      });
    
    // Filter out sub-services where parentService didn't match
    const filteredSubServices = subServices.filter(sub => sub.parentService);
    
    console.log(`Found ${filteredSubServices.length} sub-services for parent slug ${req.params.slug}`);
    res.json(filteredSubServices);
  } catch (error) {
    console.error('Error fetching sub-services by parent slug:', error);
    res.status(500).json({ error: error.message });
  }
};