const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const { protect } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation.middleware');
const { body, param, query } = require('express-validator');

// Validation rules
const createActivityValidation = [
  body('taskId').optional().isInt().withMessage('Task ID must be an integer'),
  body('boardId').isInt().withMessage('Board ID is required'),
  body('activityType').isIn([
    'created', 'updated', 'deleted', 'assigned', 'unassigned', 
    'moved', 'archived', 'restored', 'commented', 'liked', 
    'followed', 'watched', 'unwatched', 'mentioned', 'attachment_added'
  ]).withMessage('Invalid activity type'),
  body('description').notEmpty().withMessage('Description is required'),
  body('visibility').optional().isIn(['public', 'board', 'private']).withMessage('Invalid visibility')
];

// All routes require authentication
router.use(protect);

// General activity feed with optional filters
router.get('/',
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('taskId').optional().isInt().withMessage('Task ID must be an integer'),
  query('boardId').optional().isInt().withMessage('Board ID must be an integer'),
  query('userId').optional().isInt().withMessage('User ID must be an integer'),
  query('activityType').optional().isString(),
  validateRequest,
  activityController.getActivities
);

// Get user activity feed
router.get('/user/:userId',
  param('userId').isInt().withMessage('Valid user ID is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('activityType').optional().isString(),
  validateRequest,
  activityController.getUserActivityFeed
);

// Get board activity feed
router.get('/board/:boardId',
  param('boardId').isInt().withMessage('Valid board ID is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('activityType').optional().isString(),
  validateRequest,
  activityController.getBoardActivityFeed
);

// Get task activity feed
router.get('/task/:taskId',
  param('taskId').isInt().withMessage('Valid task ID is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('activityType').optional().isString(),
  validateRequest,
  activityController.getTaskActivityFeed
);

// Create activity
router.post('/',
  createActivityValidation,
  validateRequest,
  activityController.createActivity
);

// Get activity stats
router.get('/stats/:userId',
  param('userId').isInt().withMessage('Valid user ID is required'),
  query('timeRange').optional().isIn(['1d', '7d', '30d']).withMessage('Invalid time range'),
  validateRequest,
  activityController.getActivityStats
);

module.exports = router;
