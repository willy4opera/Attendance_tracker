const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinaryController = require('../controllers/cloudinaryController');
const { protect } = require('../middleware/auth');
const AppError = require('../utils/AppError');

const router = express.Router();

// Ensure temp directory exists
const tempDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, 'temp-' + uniqueSuffix + '-' + sanitizedName);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
  
  if (allowedMimes.includes(file.mimetype) && allowedExtensions.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed. Received: ${file.mimetype}`, 400), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Public routes (no authentication required)
router.get('/test', cloudinaryController.testConnection);

// All routes below require authentication
router.use(protect);

// Upload routes
router.post('/upload', upload.single('image'), cloudinaryController.uploadImage);
router.post('/upload/multiple', upload.array('images', 10), cloudinaryController.uploadMultipleImages);
router.post('/upload/buffer', express.json({ limit: '10mb' }), cloudinaryController.uploadImageBuffer);

// Folder-specific upload routes
router.post('/upload/folder', upload.single('image'), cloudinaryController.uploadToFolder);
router.post('/upload/board-header', upload.single('image'), cloudinaryController.uploadBoardHeader);
router.post('/upload/buffer/folder', express.json({ limit: '10mb' }), cloudinaryController.uploadBufferToFolder);

// Signature generation for client-side uploads
router.post('/signature', cloudinaryController.generateUploadSignature);

// Image management routes
router.get('/:publicId', cloudinaryController.getImageDetails);
router.get('/:publicId/transform', cloudinaryController.transformImage);
router.get('/:publicId/optimize', cloudinaryController.getOptimizedUrl);
router.delete('/:publicId', cloudinaryController.deleteImage);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  // Clean up any uploaded files on error
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });
  }
  if (req.files) {
    req.files.forEach(file => {
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    });
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        status: 'fail',
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'fail',
        message: 'Too many files. Maximum is 10 files.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        status: 'fail',
        message: 'Unexpected field name. Please use the correct field name for file upload.'
      });
    }
    return res.status(400).json({
      status: 'fail',
      message: error.message
    });
  } else if (error.name === 'AppError') {
    return res.status(error.statusCode || 400).json({
      status: 'fail',
      message: error.message
    });
  } else if (error) {
    return res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
  next();
});

module.exports = router;
