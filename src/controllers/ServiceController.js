import Service from "../models/ServiceModel.js";
import { singleUpload, uploadToCloudinary } from "../middleware/multer.js";

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
        const { title, description, category } = req.body;

        if (!title || !description || !category) {
          return handleError(res, new Error("All fields are required"), 400);
        }

        const imageUrl = req.file
          ? await uploadToCloudinary(req.file.path, "service-images")
          : null;

        const service = new Service({
          title,
          description,
          imageUrl,
          category,
        });

        await service.save();

        res.status(201).json({
          success: true,
          data: service,
        });
      } catch (error) {
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
    const { category, featured } = req.query;
    const filter = {};

    if (category) filter.category = category;
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

        if (req.file) {
          updateData.imageUrl = await uploadToCloudinary(
            req.file.path,
            "service-images"
          );
        }

        const updatedService = await Service.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true }
        );

        if (!updatedService) {
          return handleError(res, new Error("Service not found"), 404);
        }

        res.json({ success: true, data: updatedService });
      } catch (error) {
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
    const service = await Service.findByIdAndDelete(id);
    if (!service) return handleError(res, new Error("Service not found"), 404);
    res.json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    handleError(res, error);
  }
};