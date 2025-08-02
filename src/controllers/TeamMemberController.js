// controllers/TeamMemberController.js
import TeamMember from '../models/TeamMemberModel.js';
import { singleUpload, getFileUrl, deleteLocalFile, getFilenameFromPath } from '../middleware/multer.js';
import { 
  successResponse, 
  errorResponse, 
  notFoundResponse, 
  validationErrorResponse 
} from '../utils/responseUtils.js';

// @desc    Create a new team member
// @route   POST /api/team-members
// @access  Protected
export const createTeamMember = async (req, res) => {
  console.log('=== CREATE TEAM MEMBER REQUEST ===');
  console.log('Request body:', req.body);
  console.log('Request file:', req.file ? {
    originalname: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    filename: req.file.filename
  } : 'No file uploaded');

  try {
    const { name, role } = req.body;
    
    if (!name || !role) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        await deleteLocalFile(req.file.filename);
      }
      
      return validationErrorResponse(res, {
        name: !name ? 'Name is required' : undefined,
        role: !role ? 'Role is required' : undefined
      });
    }

    if (!req.file) {
      return validationErrorResponse(res, {
        image: 'Team member image is required'
      });
    }

    // Get file URL for local storage
    const imageUrl = getFileUrl(req.file.filename);
    
    console.log('File uploaded successfully:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      url: imageUrl
    });
    
    const teamMember = new TeamMember({
      name,
      role,
      imageUrl
    });

    console.log('Saving team member to database...');
    const createdTeamMember = await teamMember.save();
    console.log('Team member created successfully:', createdTeamMember);
    
    return successResponse(res, createdTeamMember, 201);
  } catch (error) {
    console.error('Error creating team member:', {
      message: error.message,
      stack: error.stack,
      fullError: error
    });
    
    // Clean up uploaded file if error occurs
    if (req.file) {
      await deleteLocalFile(req.file.filename);
    }
    
    return errorResponse(res, "Failed to create team member", 500, error);
  }
};

// @desc    Get all team members
// @route   GET /api/team-members
// @access  Public
export const getTeamMembers = async (req, res) => {
  console.log('=== GET ALL TEAM MEMBERS REQUEST ===');
  
  try {
    const teamMembers = await TeamMember.find().sort({ createdAt: -1 });
    console.log(`Found ${teamMembers.length} team members`);
    
    return successResponse(res, teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return errorResponse(res, "Failed to fetch team members", 500, error);
  }
};

// @desc    Get single team member
// @route   GET /api/team-members/:id
// @access  Public
export const getTeamMemberById = async (req, res) => {
  console.log('=== GET TEAM MEMBER REQUEST ===');
  console.log('Team member ID:', req.params.id);
  
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    
    if (!teamMember) {
      console.log('Team member not found');
      return notFoundResponse(res, "Team member");
    }
    
    console.log('Team member found:', teamMember);
    return successResponse(res, teamMember);
  } catch (error) {
    console.error('Error fetching team member:', error);
    return errorResponse(res, "Failed to fetch team member", 500, error);
  }
};

// @desc    Update team member
// @route   PUT /api/team-members/:id
// @access  Protected
export const updateTeamMember = async (req, res) => {
  console.log('=== UPDATE TEAM MEMBER REQUEST ===');
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  console.log('Request file:', req.file ? {
    originalname: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    filename: req.file.filename
  } : 'No file uploaded');

  try {
    const { id } = req.params;
    const { name, role } = req.body;
    
    const teamMember = await TeamMember.findById(id);
    
    if (!teamMember) {
      // Clean up uploaded file if team member not found
      if (req.file) {
        await deleteLocalFile(req.file.filename);
      }
      return notFoundResponse(res, "Team member");
    }

    // Validate at least one field is being updated
    if (!name && !role && !req.file) {
      return validationErrorResponse(res, {
        update: 'At least one field (name, role, or image) must be provided for update'
      });
    }

    let imageUrl = teamMember.imageUrl;
    
    // If new image is uploaded
    if (req.file) {
      try {
        console.log('Processing new image upload...');
        
        // Delete old image file if it exists
        if (teamMember.imageUrl) {
          const oldFilename = getFilenameFromPath(teamMember.imageUrl);
          if (oldFilename) {
            console.log('Deleting old image:', oldFilename);
            await deleteLocalFile(oldFilename);
          }
        }
        
        // Set new image URL
        imageUrl = getFileUrl(req.file.filename);
        
        console.log('New image uploaded:', {
          originalname: req.file.originalname,
          filename: req.file.filename,
          url: imageUrl
        });
      } catch (uploadError) {
        console.error('Image processing error:', uploadError);
        
        // Clean up uploaded file if error occurs
        if (req.file) {
          await deleteLocalFile(req.file.filename);
        }
        
        return errorResponse(res, "Failed to process new team member image", 500, uploadError);
      }
    }

    // Update fields if they are provided
    if (name) {
      teamMember.name = name;
      console.log('Name updated to:', name);
    }
    if (role) {
      teamMember.role = role;
      console.log('Role updated to:', role);
    }
    teamMember.imageUrl = imageUrl;

    console.log('Saving updated team member...');
    const updatedTeamMember = await teamMember.save();
    console.log('Team member updated successfully:', updatedTeamMember);
    
    return successResponse(res, updatedTeamMember);
  } catch (error) {
    console.error('Error updating team member:', error);
    
    // Clean up uploaded file if error occurs
    if (req.file) {
      await deleteLocalFile(req.file.filename);
    }
    
    return errorResponse(res, "Failed to update team member", 500, error);
  }
};

// @desc    Delete team member
// @route   DELETE /api/team-members/:id
// @access  Protected
export const deleteTeamMember = async (req, res) => {
  console.log('=== DELETE TEAM MEMBER REQUEST ===');
  console.log('Team member ID:', req.params.id);
  
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    
    if (!teamMember) {
      console.log('Team member not found');
      return notFoundResponse(res, "Team member");
    }

    // Delete associated image file
    if (teamMember.imageUrl) {
      const filename = getFilenameFromPath(teamMember.imageUrl);
      if (filename) {
        console.log('Deleting associated image:', filename);
        await deleteLocalFile(filename);
      }
    }

    console.log('Deleting team member from database...');
    await teamMember.deleteOne();
    console.log('Team member and associated files deleted successfully');
    
    return successResponse(res, { 
      message: "Team member and associated files deleted successfully",
      deletedTeamMember: teamMember
    });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return errorResponse(res, "Failed to delete team member", 500, error);
  }
};

// Additional helper functions

// @desc    Get team members by role
// @route   GET /api/team-members/role/:role
// @access  Public
export const getTeamMembersByRole = async (req, res) => {
  console.log('=== GET TEAM MEMBERS BY ROLE REQUEST ===');
  console.log('Role:', req.params.role);
  
  try {
    const { role } = req.params;
    const teamMembers = await TeamMember.find({ 
      role: { $regex: role, $options: 'i' } 
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${teamMembers.length} team members with role: ${role}`);
    return successResponse(res, teamMembers);
  } catch (error) {
    console.error('Error fetching team members by role:', error);
    return errorResponse(res, "Failed to fetch team members by role", 500, error);
  }
};

// @desc    Search team members by name
// @route   GET /api/team-members/search/:query
// @access  Public
export const searchTeamMembers = async (req, res) => {
  console.log('=== SEARCH TEAM MEMBERS REQUEST ===');
  console.log('Search query:', req.params.query);
  
  try {
    const { query } = req.params;
    const teamMembers = await TeamMember.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { role: { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${teamMembers.length} team members matching: ${query}`);
    return successResponse(res, teamMembers);
  } catch (error) {
    console.error('Error searching team members:', error);
    return errorResponse(res, "Failed to search team members", 500, error);
  }
};

// @desc    Get team members count
// @route   GET /api/team-members/count
// @access  Public
export const getTeamMembersCount = async (req, res) => {
  console.log('=== GET TEAM MEMBERS COUNT REQUEST ===');
  
  try {
    const count = await TeamMember.countDocuments();
    console.log(`Total team members: ${count}`);
    
    return successResponse(res, { count });
  } catch (error) {
    console.error('Error getting team members count:', error);
    return errorResponse(res, "Failed to get team members count", 500, error);
  }
};