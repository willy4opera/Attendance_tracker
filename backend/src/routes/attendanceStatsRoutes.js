const express = require('express');
const attendanceStatsController = require('../controllers/attendanceStatsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Overall statistics for dashboard cards
router.get('/overall', attendanceStatsController.getOverallStats);

// Dashboard statistics with today and week data
router.get('/dashboard', attendanceStatsController.getDashboardStats);

// Comprehensive attendance statistics with filters
router.get('/comprehensive', attendanceStatsController.getAttendanceStatistics);

module.exports = router;
