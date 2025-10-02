const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    // Determine upload path based on field name
    if (file.fieldname === 'profilePicture') {
      uploadPath = 'uploads/profiles/';
    } else if (file.fieldname === 'coverImage') {
      uploadPath = 'uploads/covers/';
    } else {
      uploadPath = 'uploads/misc/';
    }
    
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + extension;
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    // Check allowed image types
    const allowedTypes = process.env.ALLOWED_IMAGE_TYPES?.split(',') || [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 5 // Maximum 5 files
  },
  fileFilter: fileFilter
});

// Middleware for single file upload
const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const singleUpload = upload.single(fieldName);
    
    singleUpload(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};

// Middleware for multiple file upload
const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const multipleUpload = upload.array(fieldName, maxCount);
    
    multipleUpload(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};

// Middleware for fields with different names
const uploadFields = (fields) => {
  return (req, res, next) => {
    const fieldsUpload = upload.fields(fields);
    
    fieldsUpload(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};

// Utility function to delete file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Utility function to get file URL
const getFileUrl = (filename, type = 'misc') => {
  if (!filename) return null;
  
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  let folder = 'misc';
  
  if (type === 'profile') folder = 'profiles';
  else if (type === 'cover') folder = 'covers';
  
  return `${baseUrl}/uploads/${folder}/${filename}`;
};

// Middleware to clean up uploaded files on error
const cleanupOnError = (req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;
  
  const cleanup = () => {
    if (res.statusCode >= 400) {
      // Delete uploaded files if request failed
      if (req.file) {
        deleteFile(req.file.path);
      }
      if (req.files) {
        if (Array.isArray(req.files)) {
          req.files.forEach(file => deleteFile(file.path));
        } else {
          Object.values(req.files).flat().forEach(file => deleteFile(file.path));
        }
      }
    }
  };
  
  res.send = function(...args) {
    cleanup();
    return originalSend.apply(this, args);
  };
  
  res.json = function(...args) {
    cleanup();
    return originalJson.apply(this, args);
  };
  
  next();
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  deleteFile,
  getFileUrl,
  cleanupOnError
};