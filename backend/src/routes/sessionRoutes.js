const express = require('express');
const sessionController = require('../controllers/sessionController');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/rbac');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Public session routes (for authenticated users)
router.get('/', sessionController.getAllSessions);
router.get('/statistics/summary', sessionController.getSessionStatistics);
router.get("/by-status", sessionController.getSessionsByStatus);
router.get('/search/autocomplete', sessionController.searchSessions);
router.get('/:sessionId', sessionController.getSessionDetails);

// Admin/Moderator only routes
router.use(restrictTo('admin', 'moderator'));

router.post('/', sessionController.createSession);
router.patch('/:sessionId', sessionController.updateSession);
router.delete('/:sessionId', sessionController.deleteSession);

// Session attendance and files management
router.patch('/:sessionId/attendance-count', sessionController.updateSessionAttendanceCount);
router.post('/:sessionId/files', sessionController.addFilesToSession);
router.delete('/:sessionId/files/:fileId', sessionController.removeFileFromSession);

module.exports = router;

// Recurring session routes
router.post('/recurring', sessionController.createRecurringSessions);
router.put('/recurring/:id', sessionController.updateRecurringSessions);
router.delete('/recurring/:id', sessionController.deleteRecurringSessions);
router.get('/recurring/:id/instances', sessionController.getRecurringInstances);
router.post('/recurring/generate-upcoming', sessionController.generateUpcomingSessions);
