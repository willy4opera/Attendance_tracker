const express = require('express');
const router = express.Router();
const youtubeService = require('../services/youtubeService');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/videos');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 128 * 1024 * 1024 // 128MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, WebM, OGG, and MOV videos are allowed.'));
    }
  }
});

/**
 * Check YouTube authentication status
 */
router.get('/status', protect, (req, res) => {
  const isAuthenticated = youtubeService.isAuthenticated();
  
  res.json({
    success: true,
    data: {
      isAuthenticated,
      message: isAuthenticated 
        ? 'YouTube service is connected and ready' 
        : 'YouTube service requires authentication'
    }
  });
});

/**
 * Upload video to YouTube
 */
router.post('/upload', protect, upload.single('video'), async (req, res) => {
  try {
    if (!youtubeService.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'YouTube service is not authenticated. Please contact administrator.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided'
      });
    }

    const { title, description, tags } = req.body;
    const metadata = {
      title: title || `Comment Video - ${new Date().toLocaleDateString()}`,
      description: description || 'Video uploaded via Attendance Tracker comment system',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : ['attendance-tracker']
    };

    console.log('Uploading video to YouTube:', req.file.filename);
    
    // Upload to YouTube
    const result = await youtubeService.uploadVideo(req.file.path, metadata);
    
    // Delete local file after successful upload
    await fs.unlink(req.file.path);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Video upload error:', error);
    
    // Clean up file on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload video'
    });
  }
});

/**
 * Delete video from YouTube
 */
router.delete('/video/:videoId', protect, async (req, res) => {
  try {
    if (!youtubeService.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'YouTube service is not authenticated'
      });
    }

    const { videoId } = req.params;
    await youtubeService.deleteVideo(videoId);
    
    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Video deletion error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete video'
    });
  }
});

module.exports = router;
