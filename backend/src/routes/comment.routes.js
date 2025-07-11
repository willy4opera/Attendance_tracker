const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads/temp';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 128 * 1024 * 1024, // 128MB max
    files: 10 // Max 10 files per request
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    const imageTypes = /jpeg|jpg|png|gif|webp/;
    const videoTypes = /mp4|webm|ogg|mov/;
    const extname = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;

    if (imageTypes.test(extname) && mimetype.startsWith('image/')) {
      return cb(null, true);
    } else if (videoTypes.test(extname) && mimetype.startsWith('video/')) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  }
});

// Middleware to handle file uploads
const uploadFields = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'videos', maxCount: 2 }
]);

// Apply authentication to all routes
router.use(protect);

// Comment routes
router.post('/', uploadFields, commentController.createComment);
router.get('/task/:taskId', commentController.getTaskComments);
router.put('/:id', commentController.updateComment);
router.delete('/:id', commentController.deleteComment);

// Like/reaction routes
router.post('/:id/like', commentController.toggleCommentLike);

// Share routes
router.post('/share', commentController.shareComment);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large. Maximum size is 128MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 5 images and 2 videos.'
      });
    }
  }
  next(error);
});

module.exports = router;
