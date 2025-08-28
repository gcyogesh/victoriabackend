import Feature from "../models/FeatureModel.js";

class FeatureController {
  // Get all features
  async getAllFeatures(req, res) {
    try {
      const features = await Feature.find().sort({ createdAt: -1 });
      
      res.status(200).json({
        success: true,
        count: features.length,
        data: features
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Server Error",
        message: error.message
      });
    }
  }

  // Get single feature by ID
  async getFeatureById(req, res) {
    try {
      const feature = await Feature.findById(req.params.id);
      
      if (!feature) {
        return res.status(404).json({
          success: false,
          error: "Feature not found"
        });
      }

      res.status(200).json({
        success: true,
        data: feature
      });
    } catch (error) {
      // Handle invalid ObjectId
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          error: "Invalid feature ID"
        });
      }

      res.status(500).json({
        success: false,
        error: "Server Error",
        message: error.message
      });
    }
  }

  // Create new feature
  async createFeature(req, res) {
    try {
      const { title, subtitle, image } = req.body;

      // Basic validation
      if (!title || !subtitle || !image) {
        return res.status(400).json({
          success: false,
          error: "Please provide title, subtitle, and image"
        });
      }

      const newFeature = new Feature({
        title: title.trim(),
        subtitle: subtitle.trim(),
        image: image.trim()
      });

      const savedFeature = await newFeature.save();

      res.status(201).json({
        success: true,
        data: savedFeature,
        message: "Feature created successfully"
      });
    } catch (error) {
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          error: "Validation Error",
          details: validationErrors
        });
      }

      res.status(500).json({
        success: false,
        error: "Server Error",
        message: error.message
      });
    }
  }

  // Update feature
  async updateFeature(req, res) {
    try {
      const { title, subtitle, image } = req.body;

      // Prepare update object (only include provided fields)
      const updateData = {};
      if (title !== undefined) updateData.title = title.trim();
      if (subtitle !== undefined) updateData.subtitle = subtitle.trim();
      if (image !== undefined) updateData.image = image.trim();

      const updatedFeature = await Feature.findByIdAndUpdate(
        req.params.id,
        updateData,
        { 
          new: true, 
          runValidators: true 
        }
      );

      if (!updatedFeature) {
        return res.status(404).json({
          success: false,
          error: "Feature not found"
        });
      }

      res.status(200).json({
        success: true,
        data: updatedFeature,
        message: "Feature updated successfully"
      });
    } catch (error) {
      // Handle invalid ObjectId
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          error: "Invalid feature ID"
        });
      }

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          error: "Validation Error",
          details: validationErrors
        });
      }

      res.status(500).json({
        success: false,
        error: "Server Error",
        message: error.message
      });
    }
  }

  // Delete feature
  async deleteFeature(req, res) {
    try {
      const deletedFeature = await Feature.findByIdAndDelete(req.params.id);

      if (!deletedFeature) {
        return res.status(404).json({
          success: false,
          error: "Feature not found"
        });
      }

      res.status(200).json({
        success: true,
        data: deletedFeature,
        message: "Feature deleted successfully"
      });
    } catch (error) {
      // Handle invalid ObjectId
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          error: "Invalid feature ID"
        });
      }

      res.status(500).json({
        success: false,
        error: "Server Error",
        message: error.message
      });
    }
  }

  // Get features with pagination
  async getFeaturesWithPagination(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const features = await Feature.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Feature.countDocuments();
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        data: features,
        pagination: {
          currentPage: page,
          totalPages,
          totalFeatures: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Server Error",
        message: error.message
      });
    }
  }
}

export default new FeatureController();