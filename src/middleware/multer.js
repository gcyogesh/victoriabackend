// middleware/multer.js - Updated version with HTTPS support
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { promisify } from 'util';

// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the uploads directory path consistently
const getUploadsPath = () => {
  return path.join(process.cwd(), 'uploads');
};

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
  const uploadPath = getUploadsPath();

  try {
    await promisify(fs.access)(uploadPath);
    console.log('Uploads directory exists:', uploadPath);
  } catch {
    await promisify(fs.mkdir)(uploadPath, { recursive: true });
    console.log('Created uploads directory:', uploadPath);
  }
};

// Multer storage config
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      await ensureUploadsDir();
      const uploadPath = getUploadsPath();
      console.log('Saving file to:', uploadPath);
      cb(null, uploadPath);
    } catch (error) {
      console.error('Error setting up destination:', error);
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WEBP)'), false);
  }
};

// Base multer configuration
const baseMulterConfig = {
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
};

// Upload middleware with enhanced error handling
export const singleUpload = (fieldName) => multer(baseMulterConfig).single(fieldName);
export const arrayUpload = (fieldName, maxCount) => multer(baseMulterConfig).array(fieldName, maxCount);

export const fieldsUpload = (fieldsConfig) => {
  return (req, res, next) => {
    console.log('=== MULTER FIELDS CONFIG ===');
    console.log('Expected fields:', fieldsConfig);
    console.log('Upload path will be:', getUploadsPath());
    
    const upload = multer(baseMulterConfig).fields(fieldsConfig);
    
    upload(req, res, (err) => {
      if (err) {
        console.error('Multer upload error:', err);
        
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          console.error('Unexpected field received:', err.field);
          console.error('Expected fields:', fieldsConfig.map(f => f.name));
          return res.status(400).json({
            success: false,
            message: `Unexpected field '${err.field}'. Expected fields: ${fieldsConfig.map(f => f.name).join(', ')}`,
            expectedFields: fieldsConfig.map(f => f.name),
            receivedField: err.field
          });
        }
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            message: 'File size too large. Maximum 100MB allowed.'
          });
        }
        
        if (err.message.includes('image files')) {
          return res.status(415).json({
            success: false,
            message: 'Only image files are allowed (JPEG, PNG, GIF, WEBP)'
          });
        }

        // Handle ENOENT errors specifically
        if (err.code === 'ENOENT') {
          console.error('File not found error. Check upload directory permissions and path.');
          return res.status(500).json({
            success: false,
            message: 'Upload directory not accessible. Please check server configuration.',
            error: err.message
          });
        }
        
        return res.status(500).json({
          success: false,
          message: 'File upload failed',
          error: err.message
        });
      }
      
      // Log successful file uploads
      if (req.files) {
        console.log('Uploaded files:', Object.keys(req.files).map(key => ({
          field: key,
          files: req.files[key].map(f => ({
            originalname: f.originalname,
            size: f.size,
            mimetype: f.mimetype,
            path: f.path,
            filename: f.filename
          }))
        })));
      }
      
      next();
    });
  };
};

// Specific middleware for blog uploads
export const blogImageUpload = fieldsUpload([
  { name: 'imageUrl', maxCount: 1 }
]);

export const blogWithAuthorUpload = fieldsUpload([
  { name: 'imageUrl', maxCount: 1 },
  { name: 'authorImageUrl', maxCount: 1 }
]);

/**
 * Get full file URL with protocol and domain - FIXED FOR HTTPS
 * @param {string} filename - The filename
 * @param {object} req - Express request object (optional)
 * @returns {string} - Full URL to the file
 */
export const getFileUrl = (filename, req = null) => {
  // Try to get base URL from environment variable first
  let baseUrl = process.env.BASE_URL;
  
  // If no BASE_URL in env and we have request object, construct from request
  if (!baseUrl && req) {
    // Check for forwarded protocol (from reverse proxy like nginx)
    let protocol = req.get('x-forwarded-proto') || req.protocol;
    
    // Force HTTPS in production (when not localhost)
    const host = req.get('host');
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      protocol = 'https';
    }
    
    baseUrl = `${protocol}://${host}`;
    console.log('Constructed baseUrl:', baseUrl, 'from protocol:', protocol, 'host:', host);
  }
  
  // Fallback to localhost if nothing else works
  if (!baseUrl) {
    baseUrl = 'http://localhost:5000';
  }
  
  const fullUrl = `${baseUrl}/uploads/${filename}`;
  console.log('Generated file URL:', fullUrl);
  return fullUrl;
};

/**
 * Get full file URL with request context (recommended) - FIXED FOR HTTPS
 * @param {string} filename - The filename
 * @param {object} req - Express request object
 * @returns {string} - Full URL to the file
 */
export const getFileUrlWithRequest = (filename, req) => {
  // Check for forwarded protocol first (from reverse proxy)
  let protocol = req.get('x-forwarded-proto') || req.protocol;
  const host = req.get('host');
  
  // Force HTTPS in production (when not localhost)
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    protocol = 'https';
  }
  
  const fullUrl = `${protocol}://${host}/uploads/${filename}`;
  console.log('Generated file URL with request:', fullUrl);
  return fullUrl;
};

// Helper to get full file path
export const getFilePath = (filename) => {
  return path.join(getUploadsPath(), filename);
};

// Helper to delete local files
export const deleteLocalFile = async (filename) => {
  try {
    const filePath = getFilePath(filename);
    await promisify(fs.unlink)(filePath);
    console.log(`File deleted: ${filename}`);
    return true;
  } catch (error) {
    console.error(`Error deleting file ${filename}:`, error.message);
    return false;
  }
};

// Helper to extract filename from file path or URL
export const getFilenameFromPath = (filePath) => {
  if (!filePath) return null;
  
  // Handle full URLs (e.g., http://localhost:5000/uploads/filename.jpg)
  if (filePath.includes('/uploads/')) {
    return filePath.split('/uploads/')[1];
  }
  
  // If it's just a filename
  return path.basename(filePath);
};

// Debug middleware to log form data
export const debugFormData = (req, res, next) => {
  console.log('=== INCOMING FORM DATA DEBUG ===');
  console.log('Content-Type:', req.get('Content-Type'));
  console.log('Protocol:', req.protocol);
  console.log('Secure:', req.secure);
  console.log('X-Forwarded-Proto:', req.get('x-forwarded-proto'));
  console.log('Host:', req.get('host'));
  console.log('Body fields:', Object.keys(req.body || {}));
  console.log('Body values:', req.body);
  console.log('Upload directory:', getUploadsPath());
  next();
};

// Helper function to check if uploads directory exists and is writable
export const checkUploadsDirectory = async () => {
  const uploadPath = getUploadsPath();
  
  try {
    // Check if directory exists
    await promisify(fs.access)(uploadPath, fs.constants.F_OK);
    console.log('✓ Uploads directory exists:', uploadPath);
    
    // Check if directory is writable
    await promisify(fs.access)(uploadPath, fs.constants.W_OK);
    console.log('✓ Uploads directory is writable');
    
    return true;
  } catch (error) {
    console.error('✗ Uploads directory issue:', error.message);
    console.log('Attempting to create uploads directory...');
    
    try {
      await promisify(fs.mkdir)(uploadPath, { recursive: true });
      console.log('✓ Created uploads directory:', uploadPath);
      return true;
    } catch (createError) {
      console.error('✗ Failed to create uploads directory:', createError.message);
      return false;
    }
  }
};