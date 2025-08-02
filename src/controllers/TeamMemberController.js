// controllers/TeamMemberController.js
import TeamMember from '../models/TeamMemberModel.js';
import { singleUpload, getFileUrlWithRequest, deleteLocalFile, getFilenameFromPath } from '../middleware/multer.js';
import { 
  successResponse, 
  errorResponse, 
  notFoundResponse, 
  validationErrorResponse 
} from '../utils/responseUtils.js';

/**
 * @desc    Create a new team member
 * @route   POST /api/team-members
 * @access  Private (Admin)
 */
export const createTeamMember = async (req, res) => {
  try {
    const { name, role } = req.body;

    console.log('=== CREATE TEAM MEMBER REQUEST ===');
    console.log('Body:', req.body);
    console.log('File:', req.file);

    if (!name || !role || !req.file) {
      if (req.file) await deleteLocalFile(req.file.filename);

      return validationErrorResponse(res, {
        name: !name ? 'Name is required' : undefined,
        role: !role ? 'Role is required' : undefined,
        image: !req.file ? 'Team member image is required' : undefined,
      });
    }

    const imageUrl = getFileUrlWithRequest(req.file.filename, req);

    const teamMember = new TeamMember({ name, role, imageUrl });
    const createdTeamMember = await teamMember.save();

    return successResponse(res, createdTeamMember, 201);
  } catch (error) {
    console.error('Error creating team member:', error);

    if (req.file) await deleteLocalFile(req.file.filename);

    return errorResponse(res, "Failed to create team member", 500, error);
  }
};


/**
 * @desc    Get all team members
 * @route   GET /api/team-members
 * @access  Public
 */
export const getTeamMembers = async (req, res) => {
  console.log('=== GET ALL TEAM MEMBERS REQUEST ===');
  
  try {
    console.log('Fetching all team members...');
    const teamMembers = await TeamMember.find().sort({ createdAt: -1 });
    console.log(`Found ${teamMembers.length} team members`);
    
    return successResponse(res, teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return errorResponse(res, "Failed to fetch team members", 500, error);
  }
};

/**
 * @desc    Get single team member
 * @route   GET /api/team-members/:id
 * @access  Public
 */
export const getTeamMemberById = async (req, res) => {
  console.log('=== GET TEAM MEMBER REQUEST ===');
  console.log('Team member ID:', req.params.id);
  
  try {
    console.log(`Fetching team member with ID: ${req.params.id}`);
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

/**
 * @desc    Update team member
 * @route   PUT /api/team-members/:id
 * @access  Private (Admin)
 */
export const updateTeamMember = async (req, res) => {
  try {
    const upload = singleUpload("image");
    
    upload(req, res, async (err) => {
      if (err) {
        console.error('Multer upload error:', err);
        return errorResponse(res, err.message || "File upload failed", 400, err);
      }
      
      try {
        console.log('=== UPDATE TEAM MEMBER REQUEST ===');
        console.log('Request params:', req.params);
        console.log('Request body:', req.body);
        console.log('Request file:', req.file ? {
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          filename: req.file.filename
        } : 'No file uploaded');

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
        
        // Handle image update if new file was uploaded
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
            
            // Set new image URL with dynamic protocol/host
            imageUrl = getFileUrlWithRequest(req.file.filename, req);
            
            console.log('New image uploaded:', {
              originalname: req.file.originalname,
              filename: req.file.filename,
              url: imageUrl,
              generatedFrom: `${req.protocol}://${req.get('host')}`
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

        // Handle validation errors
        if (error.name === 'ValidationError') {
          const messages = Object.values(error.errors).map(val => val.message);
          return validationErrorResponse(res, {
            validation: messages
          });
        }
        
        return errorResponse(res, "Failed to update team member", 500, error);
      }
    });
  } catch (error) {
    console.error('Error in updateTeamMember wrapper:', error);
    return errorResponse(res, "Failed to update team member", 500, error);
  }
};

/**
 * @desc    Delete team member
 * @route   DELETE /api/team-members/:id
 * @access  Private (Admin)
 */
export const deleteTeamMember = async (req, res) => {
  console.log('=== DELETE TEAM MEMBER REQUEST ===');
  console.log('Team member ID:', req.params.id);
  
  try {
    const { id } = req.params;
    
    console.log(`Attempting to delete team member with ID: ${id}`);
    
    const teamMember = await TeamMember.findById(id);
    if (!teamMember) {
      console.log('Team member not found for deletion');
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

/**
 * @desc    Get team members by role
 * @route   GET /api/team-members/role/:role
 * @access  Public
 */
export const getTeamMembersByRole = async (req, res) => {
  console.log('=== GET TEAM MEMBERS BY ROLE REQUEST ===');
  console.log('Role:', req.params.role);
  
  try {
    const { role } = req.params;
    
    if (!role || !role.trim()) {
      return validationErrorResponse(res, { role: 'Role parameter is required' });
    }
    
    const teamMembers = await TeamMember.find({ 
      role: { $regex: role.trim(), $options: 'i' } 
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${teamMembers.length} team members with role: ${role}`);
    return successResponse(res, teamMembers);
  } catch (error) {
    console.error('Error fetching team members by role:', error);
    return errorResponse(res, "Failed to fetch team members by role", 500, error);
  }
};

/**
 * @desc    Search team members by name or role
 * @route   GET /api/team-members/search/:query
 * @access  Public
 */
export const searchTeamMembers = async (req, res) => {
  console.log('=== SEARCH TEAM MEMBERS REQUEST ===');
  console.log('Search query:', req.params.query);
  
  try {
    const { query } = req.params;
    
    if (!query || !query.trim()) {
      return validationErrorResponse(res, { query: 'Search query is required' });
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    const teamMembers = await TeamMember.find({
      $or: [
        { name: searchRegex },
        { role: searchRegex }
      ]
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${teamMembers.length} team members matching: ${query}`);
    return successResponse(res, teamMembers);
  } catch (error) {
    console.error('Error searching team members:', error);
    return errorResponse(res, "Failed to search team members", 500, error);
  }
};

/**
 * @desc    Get team members count
 * @route   GET /api/team-members/count
 * @access  Public
 */
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

/**
 * @desc    Get team members grouped by role
 * @route   GET /api/team-members/grouped-by-role
 * @access  Public
 */
export const getTeamMembersGroupedByRole = async (req, res) => {
  console.log('=== GET TEAM MEMBERS GROUPED BY ROLE REQUEST ===');
  
  try {
    const teamMembers = await TeamMember.aggregate([
      {
        $group: {
          _id: '$role',
          members: { $push: '$$ROOT' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    console.log(`Found team members grouped into ${teamMembers.length} roles`);
    
    // Transform the data for better readability
    const groupedData = teamMembers.reduce((acc, group) => {
      acc[group._id] = {
        role: group._id,
        count: group.count,
        members: group.members.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      };
      return acc;
    }, {});
    
    return successResponse(res, {
      totalRoles: teamMembers.length,
      groupedByRole: groupedData
    });
  } catch (error) {
    console.error('Error getting team members grouped by role:', error);
    return errorResponse(res, "Failed to get team members grouped by role", 500, error);
  }
};

/**
 * @desc    Get unique roles
 * @route   GET /api/team-members/roles
 * @access  Public
 */
export const getUniqueRoles = async (req, res) => {
  console.log('=== GET UNIQUE ROLES REQUEST ===');
  
  try {
    const roles = await TeamMember.distinct('role');
    console.log(`Found ${roles.length} unique roles:`, roles);
    
    return successResponse(res, {
      count: roles.length,
      roles: roles.sort()
    });
  } catch (error) {
    console.error('Error getting unique roles:', error);
    return errorResponse(res, "Failed to get unique roles", 500, error);
  }
};