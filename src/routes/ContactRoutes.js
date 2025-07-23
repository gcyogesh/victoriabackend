import express from "express";
import {
  submitContactForm,
  getAllContacts,
  getContact,
  updateContactStatus,
  deleteContact,
} from "../controllers/ContactController.js"
// import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route
router.post("/", submitContactForm);

// Protected admin routes
// router.use(protect);

router.get("/", getAllContacts);
router.get("/:id", getContact);
router.patch("/:id/status", updateContactStatus);
router.delete("/:id", deleteContact);

export default router;