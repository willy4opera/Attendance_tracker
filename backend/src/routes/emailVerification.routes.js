const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendVerificationEmail,
  verifyEmail,
  resendVerificationEmail,
  checkVerificationStatus
} = require('../controllers/emailVerification.controller');

// Test route - no auth required
router.get('/test', (req, res) => {
  res.json({ message: 'Test route works - no auth required' });
});

// Public routes
router.post('/verify/:token', verifyEmail);
router.get('/verify/:token', verifyEmail);
router.post('/resend', resendVerificationEmail);

// Protected routes
router.get('/status', protect, checkVerificationStatus);
router.post('/send', protect, sendVerificationEmail);

module.exports = router;
