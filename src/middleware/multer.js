// middleware/multer.js
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { promisify } from 'util';

// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
  const uploadPath = path.join(__dirname, '../../../uploads');
  try {
    await promisify(fs.access)(uploadPath);
  } catch {
    await promisify(fs.mkdir)(uploadPath, { recursive: true });
  }
};

// Multer storage config
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    await ensureUploadsDir();
    cb(null, path.join(__dirname, '../../../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
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
 * Get full file URL with protocol and domain
 * @param {string} filename - The filename
 * @param {object} req - Express request object (optional)
 * @returns {string} - Full URL to the file
 */
export const getFileUrl = (filename, req = null) => {
  // Try to get base URL from environment variable first
  let baseUrl = process.env.BASE_URL;
  
  // If no BASE_URL in env and we have request object, construct from request
  if (!baseUrl && req) {
    const protocol = req.protocol;
    const host = req.get('host');
    baseUrl = `${protocol}://${host}`;
  }
  
  // Fallback to localhost if nothing else works
  if (!baseUrl) {
    baseUrl = 'http://localhost:5000';
  }
  
  return `${baseUrl}/uploads/${filename}`;
};

/**
 * Get full file URL with request context (recommended)
 * @param {string} filename - The filename
 * @param {object} req - Express request object
 * @returns {string} - Full URL to the file
 */
export const getFileUrlWithRequest = (filename, req) => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/${filename}`;
};

// Helper to get full file path
export const getFilePath = (filename) => {
  return path.join(__dirname, '../../../uploads', filename);
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
  console.log('Body fields:', Object.keys(req.body || {}));
  console.log('Body values:', req.body);
  next();
};