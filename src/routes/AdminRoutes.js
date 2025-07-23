import express from 'express';
import { 
  adminSignup, 
  adminLogin, 
  adminLogout, 
  getAdminProfile, 
  updateAdminProfile, 
  deleteAdminAccount 
} from '../controllers/AdminController.js';
import { protect } from '../middleware/AuthMiddleware.js';

const router = express.Router();

router.post('/signup', adminSignup);
router.post('/login', adminLogin);
router.post('/logout', adminLogout);
router.route('/profile')
  .get(protect, getAdminProfile)
  .put(protect, updateAdminProfile)
  .delete(protect, deleteAdminAccount);

export default router;