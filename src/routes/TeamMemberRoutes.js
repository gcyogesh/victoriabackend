import express from 'express';
import { 
  createTeamMember, 
  getTeamMembers, 
  getTeamMemberById, 
  updateTeamMember, 
  deleteTeamMember 
} from '../controllers/TeamMemberController.js';
import { protect } from '../middleware/AuthMiddleware.js';
import { singleUpload } from '../middleware/multer.js';

const router = express.Router();

// router.route('/')
//   .post(protect, singleUpload('image'), createTeamMember)
//   .get(getTeamMembers);

// router.route('/:id')
//   .get(getTeamMemberById)
//   .put(protect, singleUpload('image'), updateTeamMember)
//   .delete(protect, deleteTeamMember);

router.route('/')
  .post(singleUpload('imageUrl'), createTeamMember)
  .get(getTeamMembers);

router.route('/:id')
  .get(getTeamMemberById)
  .put(singleUpload('imageUrl'), updateTeamMember)
  .delete(deleteTeamMember);

export default router;