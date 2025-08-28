import express from "express";
import { getAboutPage, createOrUpdateAbout } from "../controllers/aboutController.js";

const router = express.Router();

// GET About page (optionally filter by slug)
router.get("/:slug?", getAboutPage);  // make slug optional

// POST About page (with all categories & sections)
router.post("/", createOrUpdateAbout);

export default router;
