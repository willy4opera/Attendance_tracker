const express = require('express');
const qrcodeController = require('../controllers/qrcodeController');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/rbac');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Generate QR code for session (admin/moderator/facilitator)
router.post('/session/:sessionId/generate', qrcodeController.generateSessionQR);

// Get existing QR code for session
router.get('/session/:sessionId', qrcodeController.getSessionQR);

// Generate personal attendance QR
router.post('/attendance/:sessionId', qrcodeController.generateAttendanceQR);

// Scan QR code to mark attendance
router.post('/scan', qrcodeController.scanQRCode);

// Validate attendance token
router.post('/validate', qrcodeController.validateAttendanceToken);

// Admin only - cleanup old QR codes
router.post('/cleanup', restrictTo('admin'), qrcodeController.cleanupQRCodes);

module.exports = router;
