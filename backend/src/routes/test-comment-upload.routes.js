const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const mediaService = require('../services/mediaService');

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/temp/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Test route - no validation
router.post('/test-upload', 
  protect,
  upload.single('image'), 
  async (req, res) => {
    try {
      console.log('Test upload - Body:', req.body);
      console.log('Test upload - File:', req.file);
      
      const attachments = [];
      
      // Process image if present
      if (req.file) {
        const imageAttachment = await mediaService.uploadImage(req.file);
        attachments.push(imageAttachment);
      }
      
      res.json({
        success: true,
        message: 'Test upload successful',
        data: {
          body: req.body,
          attachments: attachments
        }
      });
    } catch (error) {
      console.error('Test upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;
