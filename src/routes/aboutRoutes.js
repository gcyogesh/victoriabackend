import express from "express";
import {
  getAboutPage,
  getAboutPageBySlug,
  createOrUpdateAbout,
  updateCategory,
  deleteCategory,
  deleteSection,
} from "../controllers/aboutController.js";

import { aboutImageUplaod } from "../middleware/multer.js";


const router = express.Router();

// GET About page (entire page)
router.get("/", getAboutPage);

// GET About page by slug
router.get("/:slug", getAboutPageBySlug);

// Preflight OPTIONS request for POST
router.options("/", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*"); // Or your frontend domain
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(200);
});

// POST About page (create or update full data with image)
router.post("/", aboutImageUplaod, createOrUpdateAbout);

// PUT Update category
router.put("/category/:categoryId", updateCategory);

// DELETE Category
router.delete("/category/:categoryId", deleteCategory);

// DELETE Section inside a category
router.delete("/category/:categoryId/section/:sectionId", deleteSection);

export default router;
