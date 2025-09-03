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

// Base multer configuration with 1GB limit
const baseMulterConfig = {
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB
  },
};

// Upload middlewares
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
            message: 'File size too large. Maximum 1GB allowed.'
          });
        }
        
        if (err.message.includes('image files')) {
          return res.status(415).json({
            success: false,
            message: 'Only image files are allowed (JPEG, PNG, GIF, WEBP)'
          });
        }

        if (err.code === 'ENOENT') {
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

// Specific middlewares
export const blogImageUpload = fieldsUpload([{ name: 'image', maxCount: 1 }]);
export const aboutImageUplaod = fieldsUpload([{ name: 'image', maxCount: 1 }]);
export const blogWithAuthorUpload = fieldsUpload([
  { name: 'image', maxCount: 1 },
  { name: 'authorImageUrl', maxCount: 1 }
]);
export const featureImageUpload = fieldsUpload([{ name: 'image', maxCount: 1 }]);




// Helper functions for URLs and paths
export const getFileUrl = (filename, req = null) => {
  let baseUrl = process.env.BASE_URL;
  if (!baseUrl && req) {
    let protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('host');
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) protocol = 'https';
    baseUrl = `${protocol}://${host}`;
  }
  if (!baseUrl) baseUrl = 'http://localhost:5000';
  return `${baseUrl}/uploads/${filename}`;
};

export const getFileUrlWithRequest = (filename, req) => {
  let protocol = req.get('x-forwarded-proto') || req.protocol;
  const host = req.get('host');
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) protocol = 'https';
  return `${protocol}://${host}/uploads/${filename}`;
};

export const getFilePath = (filename) => path.join(getUploadsPath(), filename);

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

export const getFilenameFromPath = (filePath) => {
  if (!filePath) return null;
  if (filePath.includes('/uploads/')) return filePath.split('/uploads/')[1];
  return path.basename(filePath);
};

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

export const checkUploadsDirectory = async () => {
  const uploadPath = getUploadsPath();
  try {
    await promisify(fs.access)(uploadPath, fs.constants.F_OK);
    await promisify(fs.access)(uploadPath, fs.constants.W_OK);
    console.log('✓ Uploads directory exists and is writable');
    return true;
  } catch (error) {
    console.error('✗ Uploads directory issue:', error.message);
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
