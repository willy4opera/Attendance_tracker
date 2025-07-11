const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { protect } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation.middleware');
const { body, param, query } = require('express-validator');

// Validation rules
const createTaskValidation = [
  body('title').notEmpty().withMessage('Task title is required'),
  body('taskListId').isInt().withMessage('Valid task list ID is required'),
  body('description').optional().isString(),
  body('position').optional().isInt().withMessage('Position must be an integer'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('assignedTo').optional().isArray().withMessage('Assigned users must be an array'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date format'),
  body('labels').optional().isArray().withMessage('Labels must be an array'),
  body('checklist').optional().isArray().withMessage('Checklist must be an array')
];

const updateTaskValidation = [
  param('id').isInt().withMessage('Valid task ID is required'),
  body('title').optional().notEmpty().withMessage('Task title cannot be empty'),
  body('description').optional().isString(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done', 'cancelled']).withMessage('Invalid status'),
  body('assignedTo').optional().isArray().withMessage('Assigned users must be an array'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date format'),
  body('labels').optional().isArray().withMessage('Labels must be an array'),
  body('checklist').optional().isArray().withMessage('Checklist must be an array')
];

// All routes require authentication
router.use(protect);

// Get all tasks for the current user (NEW ENDPOINT)
router.get('/',
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('status').optional().isIn(['todo', 'in_progress', 'review', 'done', 'cancelled']).withMessage('Invalid status'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  validateRequest,
  taskController.getAllTasks
);

// Create task
router.post('/',
  createTaskValidation,
  validateRequest,
  taskController.createTask
);

// Get task by ID
router.get('/:id',
  param('id').isInt().withMessage('Valid task ID is required'),
  validateRequest,
  taskController.getTaskById
);

// Update task
router.put('/:id',
  updateTaskValidation,
  validateRequest,
  taskController.updateTask
);

// Delete task
router.delete('/:id',
  param('id').isInt().withMessage('Valid task ID is required'),
  validateRequest,
  taskController.deleteTask
);

// Watch/Unwatch task
router.post('/:id/watch',
  param('id').isInt().withMessage('Valid task ID is required'),
  validateRequest,
  taskController.toggleWatchTask
);

// Get tasks for a list
router.get('/list/:listId',
  param('listId').isInt().withMessage('Valid list ID is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validateRequest,
  taskController.getListTasks
);

module.exports = router;
