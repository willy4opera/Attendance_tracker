const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./user.routes'); // Updated to use new user routes
const sessionRoutes = require('./sessionRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const departmentRoutes = require('./department.routes');
const projectRoutes = require('./project.routes');
const boardRoutes = require('./board.routes');
const taskRoutes = require('./task.routes');
const commentRoutes = require('./comment.routes');
const activityRoutes = require('./activity.routes');
const notificationRoutes = require('./notification.routes');
// Import other route modules as they are created
// const analyticsRoutes = require('./analyticsRoutes');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Email verification routes - must be before protected routes
router.use('/email-verification', require('./emailVerification.routes'));

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/projects', projectRoutes);
router.use('/boards', boardRoutes);
router.use('/tasks', taskRoutes);
router.use('/comments', commentRoutes);
router.use('/activities', activityRoutes);
router.use('/notifications', notificationRoutes);
router.use('/sessions', sessionRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/files', require('./fileRoutes'));
router.use('/youtube', require('./youtube.routes'));
router.use('/qrcode', require('./qrcodeRoutes'));

router.use('/test-comment-upload', require('./test-comment-upload.routes'));
router.use('/debug-upload', require('./debug-upload.routes'));
router.use('/test', require('./test.routes'));
module.exports = router;
