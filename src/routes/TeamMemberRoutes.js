// routes/teamMemberRoutes.js
import express from 'express';
import { singleUpload } from '../middleware/multer.js';
import {
  createTeamMember,
  getTeamMembers,
  getTeamMemberById,
  updateTeamMember,
  deleteTeamMember,
  getTeamMembersByRole,
  searchTeamMembers,
  getTeamMembersCount
} from '../controllers/TeamMemberController.js';

const router = express.Router();

// Team member routes
router.post('/', singleUpload('image'), createTeamMember);        // Create team member
router.get('/', getTeamMembers);                                  // Get all team members
router.get('/count', getTeamMembersCount);                       // Get team members count
router.get('/role/:role', getTeamMembersByRole);                 // Get by role
router.get('/search/:query', searchTeamMembers);                 // Search team members
router.get('/:id', getTeamMemberById);                           // Get single team member
router.put('/:id', singleUpload('image'), updateTeamMember);     // Update team member
router.delete('/:id', deleteTeamMember);                         // Delete team member

export default router;