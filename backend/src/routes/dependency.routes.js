const express = require('express');
const router = express.Router();
const { protect: authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation.middleware');
const dependencyController = require('../controllers/dependencies/dependency.controller');
const notificationController = require('../controllers/dependencies/dependencyNotification.controller');
const { body, param, query } = require('express-validator');

// Validation rules
const createDependencyValidation = [
  body('predecessorTaskId').isInt().withMessage('Predecessor task ID must be an integer'),
  body('successorTaskId').isInt().withMessage('Successor task ID must be an integer'),
  body('dependencyType').optional().isIn(['FS', 'SS', 'FF', 'SF']).withMessage('Invalid dependency type'),
  body('lagTime').optional().isInt({ min: 0 }).withMessage('Lag time must be a non-negative integer'),
  body('notifyUsers').optional().isBoolean()
];

const updateDependencyValidation = [
  param('id').isInt().withMessage('Dependency ID must be an integer'),
  body('dependencyType').optional().isIn(['FS', 'SS', 'FF', 'SF']).withMessage('Invalid dependency type'),
  body('lagTime').optional().isInt({ min: 0 }).withMessage('Lag time must be a non-negative integer'),
  body('isActive').optional().isBoolean()
];

const taskIdValidation = [
  param('taskId').isInt().withMessage('Task ID must be an integer')
];

const projectIdValidation = [
  param('projectId').isInt().withMessage('Project ID must be an integer')
];

// Dependency routes
router.post(
  '/',
  authenticateToken,
  createDependencyValidation,
  validateRequest,
  dependencyController.createDependency
);

router.get(
  '/tasks/:taskId',
  authenticateToken,
  taskIdValidation,
  validateRequest,
  dependencyController.getTaskDependencies
);

router.put(
  '/:id',
  authenticateToken,
  updateDependencyValidation,
  validateRequest,
  dependencyController.updateDependency
);

router.delete(
  '/:id',
  authenticateToken,
  param('id').isInt(),
  validateRequest,
  dependencyController.deleteDependency
);

router.get(
  '/projects/:projectId',
  authenticateToken,
  projectIdValidation,
  validateRequest,
  dependencyController.getProjectDependencies
);

router.post(
  '/tasks/:taskId/validate',
  authenticateToken,
  taskIdValidation,
  body('newStatus').isString(),
  validateRequest,
  dependencyController.validateTaskDependencies
);

router.post(
  '/check-circular',
  authenticateToken,
  body('predecessorTaskId').isInt(),
  body('successorTaskId').isInt(),
  validateRequest,
  dependencyController.checkCircularDependency
);

router.get(
  '/tasks/:taskId/chain',
  authenticateToken,
  taskIdValidation,
  query('direction').optional().isIn(['forward', 'backward']),
  validateRequest,
  dependencyController.getDependencyChain
);

// Notification routes
router.post(
  '/:dependencyId/notify',
  authenticateToken,
  param('dependencyId').isInt(),
  body('type').optional().isString(),
  body('recipients').optional().isArray(),
  body('channels').optional().isArray(),
  body('priority').optional().isIn(['low', 'normal', 'high', 'critical']),
  validateRequest,
  notificationController.createNotification
);

router.get(
  '/:dependencyId/notifications',
  authenticateToken,
  param('dependencyId').isInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  validateRequest,
  notificationController.getNotificationHistory
);

router.put(
  '/notifications/preferences/:projectId?',
  authenticateToken,
  notificationController.updatePreferences
);

router.get(
  '/notifications/preferences',
  authenticateToken,
  notificationController.getPreferences
);

router.get(
  '/notifications/analytics',
  authenticateToken,
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  validateRequest,
  notificationController.getAnalytics
);

router.post(
  '/:dependencyId/test-notification',
  authenticateToken,
  param('dependencyId').isInt(),
  body('type').optional().isString(),
  body('channel').optional().isIn(['email', 'inApp', 'push']),
  validateRequest,
  notificationController.testNotification
);

router.put(
  '/notifications/:notificationId/read',
  authenticateToken,
  param('notificationId').isInt(),
  validateRequest,
  notificationController.markAsRead
);

router.get(
  '/notifications/user',
  authenticateToken,
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('unreadOnly').optional().isBoolean(),
  query('channel').optional().isIn(['email', 'inApp', 'push']),
  validateRequest,
  notificationController.getUserNotifications
);

module.exports = router;
