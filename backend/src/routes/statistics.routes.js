const express = require('express');
const router = express.Router();
const { getProjectStatsReport } = require('../controllers/statistics.controller');

// Protect middleware to ensure authentication
const { protect } = require('../middleware/auth');

// Route to get statistics report
router.get('/report', protect, getProjectStatsReport);

module.exports = router;
