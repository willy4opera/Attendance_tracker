const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public authentication routes
router.post('/signup', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);

// YouTube OAuth routes (must be public)
router.use(require('./youtube-auth.routes'));

// Protected routes
router.use(protect); // All routes after this middleware are protected

router.get('/me', authController.getMe);
router.patch('/update-password', authController.updatePassword);

module.exports = router;
