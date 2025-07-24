const express = require('express');
const dashboardChartController = require('../controllers/dashboardChartController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Main comprehensive dashboard endpoint
router.get('/comprehensive', dashboardChartController.getComprehensiveDashboardData);

module.exports = router;
