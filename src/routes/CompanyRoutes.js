import express from 'express';
import { singleUpload } from '../middleware/multer.js';
import {
  createCompany,
  updateCompany,
  getCompany,
  deleteCompany
} from "../controllers/CompanyController.js"

const router = express.Router();

// Public route
router.get('/', getCompany);

// Protected routes (admin only)
// router.use(protect);
router.post('/', singleUpload('image'), createCompany);  // Changed from 'logo' to 'image'
router.put('/', singleUpload('image'), updateCompany);   // Changed from 'logo' to 'image'
router.delete('/', deleteCompany);

export default router;