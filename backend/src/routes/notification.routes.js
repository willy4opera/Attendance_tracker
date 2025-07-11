const express = require('express');
const { protect } = require('../middleware/auth');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

// Protect all notification routes
router.use(protect);

// GET /api/v1/notifications/user/:userId - Get user notifications
router.get('/user/:userId', notificationController.getUserNotifications);

// GET /api/v1/notifications/user/:userId/unread-count - Get unread notifications count
router.get('/user/:userId/unread-count', notificationController.getUnreadCount);

// POST /api/v1/notifications/:notificationId/read - Mark notification as read
router.post('/:notificationId/read', notificationController.markAsRead);

// POST /api/v1/notifications/mark-all-read - Mark all notifications as read
router.post('/mark-all-read', notificationController.markAllAsRead);

// POST /api/v1/notifications - Create notification (admin only)
router.post('/', notificationController.createNotification);

// DELETE /api/v1/notifications/:notificationId - Delete notification
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;
