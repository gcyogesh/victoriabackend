import express from 'express';
import { 
  registerAdmin, loginAdmin, changeAdminPassword, getCurrentAdmin,
} from '../controllers/AdminController.js';


const router = express.Router();


router.post("/login", loginAdmin);
router.post("/register", registerAdmin);

// ✅ Add authenticate middleware here
router.put("/change-password", changeAdminPassword);
router.get("/", getCurrentAdmin);

export default router;