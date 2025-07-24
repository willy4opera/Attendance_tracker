const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Google OAuth routes
router.post('/google', authController.googleAuth);
router.get('/google/url', authController.getGoogleAuthUrl);
router.delete('/google/clear-codes', authController.clearProcessedCodes); // Changed to DELETE method

// Facebook OAuth routes  
router.post('/facebook', authController.facebookAuth);
router.get('/facebook/url', authController.getFacebookAuthUrl);

// GitHub OAuth routes
router.post('/github', authController.githubAuth);
router.get('/github/url', authController.getGitHubUrl);

// LinkedIn OAuth routes
router.post('/linkedin', authController.linkedinAuth);
router.get('/linkedin/url', authController.getLinkedInUrl);

module.exports = router;
