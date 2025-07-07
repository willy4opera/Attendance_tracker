const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Test route without protection
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Test route with protection
router.get('/protected', protect, (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'You are authenticated',
    user: req.user
  });
});

module.exports = router;
