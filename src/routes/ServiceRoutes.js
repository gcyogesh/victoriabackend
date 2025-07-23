import express from "express";
import {
  createService,
  getAllServices,
  getServiceBySlug,
  updateService,
  deleteService,
} from "../controllers/ServiceController.js";


const router = express.Router();

// Public routes
router.get("/", getAllServices);
router.get("/:slug", getServiceBySlug);

// Protected routes (admin only)
// router.use(protect);
router.post("/", createService);
router.put("/:id", updateService);
router.delete("/:id", deleteService);

export default router;