import express from "express";
import { 
  createSubService, 
  getSubServices, 
  getSubService, 
  updateSubService, 
  deleteSubService,
  getSubServicesByParent
} from "../controllers/SubServiceController.js";


const router = express.Router();

// Public routes
router.get("/", getSubServices);
router.get("/parent/:parentId", getSubServicesByParent);
router.get("/:id", getSubService);

// Protected admin routes

router.post("/", createSubService);
router.put("/:id", updateSubService);
router.delete("/:id", deleteSubService);

export default router;