const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create subdirectories for different file types
const directories = ['avatars', 'documents', 'attachments'];
directories.forEach(dir => {
  const dirPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'attachments'; // default folder
    
    if (file.fieldname === 'avatar' || file.fieldname === 'profilePicture') {
      folder = 'avatars';
    } else if (file.fieldname === 'document') {
      folder = 'documents';
    }
    
    cb(null, path.join(uploadsDir, folder));
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '-');
    
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types by field
  const allowedTypes = {
    avatar: /\.(jpg|jpeg|png|gif)$/i,
    profilePicture: /\.(jpg|jpeg|png|gif)$/i,
    document: /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i,
    attachment: /\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar)$/i
  };
  
  const fieldType = allowedTypes[file.fieldname] || allowedTypes.attachment;
  
  if (fieldType.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid file type. Allowed types for ${file.fieldname}: ${fieldType}`, 400), false);
  }
};

// File size limits
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB default
  files: 5 // Maximum 5 files per request
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits
});

// Specific upload configurations
const uploadConfigs = {
  // Single avatar upload
  avatar: upload.single('avatar'),
  
  // Single document upload
  document: upload.single('document'),
  
  // Multiple attachments (up to 5)
  attachments: upload.array('attachments', 5),
  
  // Mixed upload (avatar + documents)
  mixed: upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'documents', maxCount: 3 }
  ])
};

// Helper function to delete file
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Helper function to get file URL
const getFileUrl = (filename, folder = 'attachments') => {
  return `/uploads/${folder}/${filename}`;
};

module.exports = {
  upload,
  uploadConfigs,
  deleteFile,
  getFileUrl,
  uploadsDir
};
