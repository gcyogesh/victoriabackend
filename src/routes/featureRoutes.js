import express from "express";
import FeatureController from "../controllers/FeatureController.js";

const router = express.Router();

// @route GET /api/features - Get all features
router.get("/", FeatureController.getAllFeatures);

// @route GET /api/features/paginated - Get features with pagination
router.get("/paginated", FeatureController.getFeaturesWithPagination);

// @route GET /api/features/:id - Get single feature by ID
router.get("/:id", FeatureController.getFeatureById);

// @route POST /api/features - Create new feature
router.post("/", FeatureController.createFeature);

// @route PUT /api/features/:id - Update feature
router.put("/:id", FeatureController.updateFeature);

// @route DELETE /api/features/:id - Delete feature
router.delete("/:id", FeatureController.deleteFeature);

export default router;  