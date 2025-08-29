import express from "express";
import {
  getAboutPage,
  createOrUpdateAbout,
  updateCategory,
  deleteCategory,
  deleteSection,
} from "../controllers/aboutController.js";

const router = express.Router();

// GET About page (entire page)
router.get("/", getAboutPage);

// POST About page (create or update full data)
router.post("/", createOrUpdateAbout);

// PUT Update category
router.put("/category/:categoryId", updateCategory);

// DELETE Category
router.delete("/category/:categoryId", deleteCategory);

// DELETE Section inside a category
router.delete("/category/:categoryId/section/:sectionId", deleteSection);

export default router;
