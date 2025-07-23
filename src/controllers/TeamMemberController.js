// import TeamMember from '../models/TeamMemberModel.js';
// import { singleUpload, uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../middleware/multer.js';
// import fs from "fs"
// import { successResponse } from '../utils/responseUtils.js';
// import { errorResponse } from '../utils/responseUtils.js';

// // @desc    Create a new team member
// // @route   POST /api/team-members
// // @access  Protected

// export const createTeamMember = async (req, res) => {

//   console.log('Request files:', req.files); // Check if files exist
//   console.log('Request file:', req.file);   // Check single file
//   console.log('Request body:', req.body); 
//   console.log('=== CREATE TEAM MEMBER REQUEST ===');
//   console.log('Request body:', req.body);
//   console.log('Request file:', req.file ? {
//     originalname: req.file.originalname,
//     size: req.file.size,
//     mimetype: req.file.mimetype
//   } : 'No file uploaded');

//   try {
//     const { name, role } = req.body;
    
//     if (!name || !role) {
//       return res.status(400).json({ 
//         success: false,
//         message: "Name and role are required" 
//       });
//     }

//     if (!req.file) {
//       return res.status(400).json({ 
//         success: false,
//         message: "Team member image is required" 
//       });
//     }

//     const uploadResult = await uploadToCloudinary(req.file.path, 'team-members');
    
//     const teamMember = new TeamMember({
//       name,
//       role,
//       imageUrl: uploadResult.url
//     });

//     const createdTeamMember = await teamMember.save();
    
//     return res.status(201).json({
//       success: true,
//       data: createdTeamMember
//     });
//   } catch (error) {
//     console.error('Detailed error:', {
//       message: error.message,
//       stack: error.stack,
//       fullError: error
//     });
    
//     // Clean up uploaded file if error occurs
//     if (req.file?.path) {
//       try {
//         fs.unlinkSync(req.file.path);
//       } catch (cleanupError) {
//         console.error('Cleanup error:', cleanupError);
//       }
//     }
    
//     return res.status(500).json({
//       success: false,
//       message: "Failed to create team member",
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

// // @desc    Get all team members
// // @route   GET /api/team-members
// // @access  Public
// export const getTeamMembers = async (req, res) => {
//   try {
//     const teamMembers = await TeamMember.find().sort({ createdAt: -1 });
//     const data =  res.json(teamMembers);


//    ;
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // @desc    Get single team member
// // @route   GET /api/team-members/:id
// // @access  Public
// export const getTeamMemberById = async (req, res) => {
//   try {
//     const teamMember = await TeamMember.findById(req.params.id);
    
//     if (!teamMember) {
//       return res.status(404).json({ error: "Team member not found" });
//     }
    
//     res.json(teamMember);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // @desc    Update team member
// // @route   PUT /api/team-members/:id
// // @access  Protected
// export const updateTeamMember = async (req, res) => {
//   console.log('=== UPDATE TEAM MEMBER REQUEST ===');
//   console.log('Request params:', req.params);
//   console.log('Request body:', req.body);
//   console.log('Request file:', req.file ? {
//     originalname: req.file.originalname,
//     size: req.file.size,
//     mimetype: req.file.mimetype
//   } : 'No file uploaded');

//   try {
//     const { id } = req.params;
//     const { name, role } = req.body;
    
//     const teamMember = await TeamMember.findById(id);
    
//     if (!teamMember) {
//       return res.status(404).json({ 
//         success: false,
//         message: "Team member not found" 
//       });
//     }

//     // Validate at least one field is being updated
//     if (!name && !role && !req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "At least one field (name, role, or image) must be provided for update"
//       });
//     }

//     let imageUrl = teamMember.imageUrl;
    
//     // If new image is uploaded
//     if (req.file) {
//       try {
//         // Delete old image from Cloudinary if it exists
//         if (teamMember.imageUrl) {
//           const publicId = getPublicIdFromUrl(teamMember.imageUrl);
//           if (publicId) {
//             await deleteFromCloudinary(publicId);
//           }
//         }
        
//         // Upload new image
//         const uploadResult = await uploadToCloudinary(req.file.path, 'team-members');
//         imageUrl = uploadResult.url;
//       } catch (uploadError) {
//         console.error('Image upload error:', uploadError);
//         // Clean up uploaded file if error occurs
//         if (req.file?.path) {
//           try {
//             fs.unlinkSync(req.file.path);
//           } catch (cleanupError) {
//             console.error('Cleanup error:', cleanupError);
//           }
//         }
        
//         return res.status(500).json({
//           success: false,
//           message: "Failed to upload new team member image",
//           error: process.env.NODE_ENV === 'development' ? uploadError.message : undefined
//         });
//       }
//     }

//     // Update fields if they are provided
//     if (name) teamMember.name = name;
//     if (role) teamMember.role = role;
//     teamMember.imageUrl = imageUrl;

//     const updatedTeamMember = await teamMember.save();
    
//     // Clean up uploaded file after successful update
//     if (req.file?.path) {
//       try {
//         fs.unlinkSync(req.file.path);
//       } catch (cleanupError) {
//         console.error('Cleanup error:', cleanupError);
//       }
//     }
    
//     return res.status(200).json({
//       success: true,
//       data: updatedTeamMember
//     });
//   } catch (error) {
//     console.error('Error:', error);
    
//     // Clean up uploaded file if error occurs
//     if (req.file?.path) {
//       try {
//         fs.unlinkSync(req.file.path);
//       } catch (cleanupError) {
//         console.error('Cleanup error:', cleanupError);
//       }
//     }
    
//     return res.status(500).json({
//       success: false,
//       message: "Failed to update team member",
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

// // @desc    Delete team member
// // @route   DELETE /api/team-members/:id
// // @access  Protected
// export const deleteTeamMember = async (req, res) => {
//   try {
//     const teamMember = await TeamMember.findById(req.params.id);
    
//     if (!teamMember) {
//       return res.status(404).json({ error: "Team member not found" });
//     }

//     // Delete image from Cloudinary
//     const publicId = getPublicIdFromUrl(teamMember.imageUrl);
//     if (publicId) {
//       await deleteFromCloudinary(publicId);
//     }

//     await teamMember.deleteOne();
//     res.json({ message: "Team member removed" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

import TeamMember from '../models/TeamMemberModel.js';
import { singleUpload, uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../middleware/multer.js';
import fs from "fs"
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
    mimetype: req.file.mimetype
  } : 'No file uploaded');

  try {
    const { name, role } = req.body;
    
    if (!name || !role) {
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

    const uploadResult = await uploadToCloudinary(req.file.path, 'team-members');
    
    const teamMember = new TeamMember({
      name,
      role,
      imageUrl: uploadResult.url
    });

    const createdTeamMember = await teamMember.save();
    
    // Clean up the uploaded file after successful creation
    try {
      if (req.file?.path) {
        fs.unlinkSync(req.file.path);
      }
    } catch (cleanupError) {
      console.error('File cleanup error:', cleanupError);
    }
    
    return successResponse(res, createdTeamMember, 201);
  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      fullError: error
    });
    
    // Clean up uploaded file if error occurs
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
    
    return errorResponse(res, "Failed to create team member", 500, error);
  }
};

// @desc    Get all team members
// @route   GET /api/team-members
// @access  Public
export const getTeamMembers = async (req, res) => {
  try {
    const teamMembers = await TeamMember.find().sort({ createdAt: -1 });
    return successResponse(res, teamMembers);
  } catch (error) {
    return errorResponse(res, "Failed to fetch team members", 500, error);
  }
};

// @desc    Get single team member
// @route   GET /api/team-members/:id
// @access  Public
export const getTeamMemberById = async (req, res) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    
    if (!teamMember) {
      return notFoundResponse(res, "Team member");
    }
    
    return successResponse(res, teamMember);
  } catch (error) {
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
    mimetype: req.file.mimetype
  } : 'No file uploaded');

  try {
    const { id } = req.params;
    const { name, role } = req.body;
    
    const teamMember = await TeamMember.findById(id);
    
    if (!teamMember) {
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
        // Delete old image from Cloudinary if it exists
        if (teamMember.imageUrl) {
          const publicId = getPublicIdFromUrl(teamMember.imageUrl);
          if (publicId) {
            await deleteFromCloudinary(publicId);
          }
        }
        
        // Upload new image
        const uploadResult = await uploadToCloudinary(req.file.path, 'team-members');
        imageUrl = uploadResult.url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        // Clean up uploaded file if error occurs
        if (req.file?.path) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
        }
        
        return errorResponse(res, "Failed to upload new team member image", 500, uploadError);
      }
    }

    // Update fields if they are provided
    if (name) teamMember.name = name;
    if (role) teamMember.role = role;
    teamMember.imageUrl = imageUrl;

    const updatedTeamMember = await teamMember.save();
    
    // Clean up uploaded file after successful update
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
    
    return successResponse(res, updatedTeamMember);
  } catch (error) {
    console.error('Error:', error);
    
    // Clean up uploaded file if error occurs
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
    
    return errorResponse(res, "Failed to update team member", 500, error);
  }
};

// @desc    Delete team member
// @route   DELETE /api/team-members/:id
// @access  Protected
export const deleteTeamMember = async (req, res) => {
  try {
    const teamMember = await TeamMember.findById(req.params.id);
    
    if (!teamMember) {
      return notFoundResponse(res, "Team member");
    }

    // Delete image from Cloudinary
    const publicId = getPublicIdFromUrl(teamMember.imageUrl);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }

    await teamMember.deleteOne();
    return successResponse(res, { message: "Team member removed successfully" });
  } catch (error) {
    return errorResponse(res, "Failed to delete team member", 500, error);
  }
};