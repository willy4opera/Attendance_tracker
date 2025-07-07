const express = require('express');
const fileController = require('../controllers/fileController');
const { protect } = require('../middleware/auth');
const { uploadConfigs } = require('../config/multer.config');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Upload routes
router.post('/upload', uploadConfigs.attachments, fileController.uploadMultipleFiles);
router.post('/upload/single', uploadConfigs.document, fileController.uploadFile);
router.post('/avatar', uploadConfigs.avatar, fileController.updateAvatar);

// Get routes
router.get('/', fileController.getAllAttachments);
router.get('/:id', fileController.getAttachment);
router.get('/:id/download', fileController.downloadFile);
router.get('/session/:sessionId', fileController.getSessionFiles);

// Delete route
router.delete('/:id', fileController.deleteAttachment);

module.exports = router;
