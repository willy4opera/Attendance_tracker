const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/rbac');

const router = express.Router();

// Public route - for marking attendance via link (token auth is handled in controller)
router.get('/sessions/:sessionId/join', attendanceController.markAttendanceViaLink);

// Protected routes
router.use(protect);

// Dashboard statistics
router.get('/stats/today', attendanceController.getTodayStats);
router.get('/recent', attendanceController.getRecentAttendance);

// Generate attendance link for a session
router.get('/sessions/:sessionId/attendance-link', attendanceController.generateAttendanceLink);

// Get session attendance (admin/moderator)
router.get('/sessions/:sessionId/attendance', 
  restrictTo('admin', 'moderator'), 
  attendanceController.getSessionAttendance
);

// Get user's own attendance history
router.get('/users/me/attendance', attendanceController.getUserAttendance);

// Get any user's attendance history (admin only)
router.get('/users/:userId/attendance', 
  restrictTo('admin'), 
  attendanceController.getUserAttendance
);

// Manual attendance marking (admin/moderator)
router.post('/manual', 
  restrictTo('admin', 'moderator'), 
  attendanceController.markAttendanceManually
);

module.exports = router;
