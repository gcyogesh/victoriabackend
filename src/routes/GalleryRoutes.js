// import express from 'express';
// import {
//   createCompany,
//   getAllCompanies,
//   getCompanyById,
//   updateCompany,
//   deleteCompany,
// } from '../controllers/CompaniesworkedController.js';

// import { AdminAccess } from '../middleware/authMiddleware.js';
// import { singleUpload } from '../middleware/multer.js';

// const router = express.Router();

// // Create a new company
// router.post('/',AdminAccess,singleUpload('imageUrl'), createCompany);

// // Get all companies
// router.get('/', getAllCompanies);

// // Get a single company by ID
// router.get('/:id', getCompanyById);

// // Update a company by ID
// router.put('/:id',AdminAccess,singleUpload('imageUrl'), updateCompany);

// // Delete a company by ID
// router.delete('/:id',AdminAccess, deleteCompany);

// export default router;


import express from 'express';
import {
  createGalleryItem,
  getAllGalleryItems,
  getGalleryItemById,
  updateGalleryItem,
  deleteGalleryItem,
} from '../controllers/GalleryController.js';

import { singleUpload } from '../middleware/multer.js';

const router = express.Router();

// Create a new gallery item
router.post('/', singleUpload('imageUrl'), createGalleryItem);

// Get all gallery items
router.get('/', getAllGalleryItems);

// Get a single gallery item by ID
router.get('/:id', getGalleryItemById);

// Update a gallery item by ID
router.put('/:id', singleUpload('imageUrl'), updateGalleryItem);

// Delete a gallery item by ID
router.delete('/:id', deleteGalleryItem);

export default router;