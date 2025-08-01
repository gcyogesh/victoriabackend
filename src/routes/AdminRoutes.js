import express from 'express';
import { 
  registerAdmin, loginAdmin, changeAdminPassword, getCurrentAdmin,
} from '../controllers/AdminController.js';
import { authenticate } from '../middleware/AuthMiddleware.js';

const router = express.Router();

router.post("/login", loginAdmin);
router.post("/register", registerAdmin);

// ✅ Add authenticate middleware here
router.put("/change-password", authenticate, changeAdminPassword);
router.get("/", authenticate, getCurrentAdmin);

export default router;