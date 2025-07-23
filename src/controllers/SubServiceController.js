import SubService from "../models/SubServiceModel.js";
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from "../middleware/multer.js";
import { singleUpload } from "../middleware/multer.js";

// @desc    Create a new sub-service
// @route   POST /api/subservices
// @access  Private/Admin
export const createSubService = async (req, res) => {
  try {
    // Handle file upload
    const upload = singleUpload('image');
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Image is required" });
      }

      try {
        // Upload image to Cloudinary
        const imageUrl = await uploadToCloudinary(req.file.path, 'subservices');

        // Create sub-service
        const { title, description, parentService } = req.body;
        
        const subService = new SubService({
          title,
          description,
          parentService,
          imageUrl
        });

        const createdSubService = await subService.save();
        res.status(201).json(createdSubService);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get all sub-services
// @route   GET /api/subservices
// @access  Public
export const getSubServices = async (req, res) => {
  try {
    const subServices = await SubService.find().populate('parentService', 'title');
    res.json(subServices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get sub-services by parent service ID
// @route   GET /api/subservices/parent/:parentId
// @access  Public
export const getSubServicesByParent = async (req, res) => {
  try {
    const subServices = await SubService.find({ parentService: req.params.parentId }).populate('parentService', 'title');
    res.json(subServices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get single sub-service
// @route   GET /api/subservices/:id
// @access  Public
export const getSubService = async (req, res) => {
  try {
    const subService = await SubService.findById(req.params.id).populate('parentService', 'title');

    if (!subService) {
      return res.status(404).json({ error: "Sub-service not found" });
    }

    res.json(subService);
  } catch (error) {
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
        return res.status(400).json({ error: err.message });
      }

      try {
        const subService = await SubService.findById(req.params.id);
        
        if (!subService) {
          return res.status(404).json({ error: "Sub-service not found" });
        }

        const { title, description, parentService } = req.body;
        
        // Update fields
        subService.title = title || subService.title;
        subService.description = description || subService.description;
        subService.parentService = parentService || subService.parentService;

        // If new image was uploaded
        if (req.file) {
          // Delete old image from Cloudinary
          if (subService.imageUrl) {
            const publicId = getPublicIdFromUrl(subService.imageUrl);
            if (publicId) {
              await deleteFromCloudinary(publicId);
            }
          }
          
          // Upload new image
          subService.imageUrl = await uploadToCloudinary(req.file.path, 'subservices');
        }

        const updatedSubService = await subService.save();
        res.json(updatedSubService);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete a sub-service
// @route   DELETE /api/subservices/:id
// @access  Private/Admin
export const deleteSubService = async (req, res) => {
  try {
    const subService = await SubService.findById(req.params.id);
    
    if (!subService) {
      return res.status(404).json({ error: "Sub-service not found" });
    }

    // Delete image from Cloudinary
    if (subService.imageUrl) {
      const publicId = getPublicIdFromUrl(subService.imageUrl);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }

    await subService.deleteOne();
    res.json({ message: "Sub-service removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};