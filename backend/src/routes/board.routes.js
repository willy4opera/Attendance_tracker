const express = require('express');
const router = express.Router();
const boardController = require('../controllers/board.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation.middleware');
const { body, param, query } = require('express-validator');

// Validation rules
const createBoardValidation = [
  body('name').notEmpty().withMessage('Board name is required'),
  body('description').optional().isString(),
  body('projectId').optional().isInt(),
  body('departmentId').optional().isInt(),
  body('visibility').optional().isIn(['private', 'department', 'organization', 'public']),
  body('backgroundColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid color format'),
  body('backgroundImage').optional().isString(),
  body('settings').optional().isObject()
];

const updateBoardValidation = [
  param('id').isInt().withMessage('Invalid board ID'),
  body('name').optional().notEmpty().withMessage('Board name cannot be empty'),
  body('description').optional().isString(),
  body('visibility').optional().isIn(['private', 'department', 'organization', 'public']),
  body('backgroundColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid color format'),
  body('backgroundImage').optional().isString(),
  body('settings').optional().isObject(),
  body('isArchived').optional().isBoolean()
];

const createListValidation = [
  param('boardId').isInt().withMessage('Invalid board ID'),
  body('name').notEmpty().withMessage('List name is required'),
  body('position').optional().isInt().withMessage('Position must be an integer')
];

const updateListValidation = [
  param('boardId').isInt().withMessage('Invalid board ID'),
  param('listId').isInt().withMessage('Invalid list ID'),
  body('name').optional().notEmpty().withMessage('List name cannot be empty'),
  body('position').optional().isInt().withMessage('Position must be an integer')
];

const addMemberValidation = [
  param('boardId').isInt().withMessage('Invalid board ID'),
  body('userId').isUUID().withMessage('Invalid user ID'),
  body('role').optional().isIn(['owner', 'admin', 'member', 'viewer']).withMessage('Invalid role')
];

// Routes
router.use(protect); // All routes require authentication

// Get all boards with filtering
router.get('/', 
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString(),
  query('projectId').optional().isInt(),
  query('visibility').optional().isIn(['private', 'department', 'organization', 'public', 'all']),
  query('includeArchived').optional().isBoolean(),
  query('sortBy').optional().isIn(['name', 'createdAt', 'updatedAt']),
  query('sortOrder').optional().isIn(['ASC', 'DESC']),
  validateRequest,
  boardController.getBoards
);

// Get board by ID
router.get('/:id',
  param('id').isInt().withMessage('Invalid board ID'),
  validateRequest,
  boardController.getBoardById
);

// Create new board
router.post('/',
  createBoardValidation,
  validateRequest,
  boardController.createBoard
);

// Update board
router.put('/:id',
  updateBoardValidation,
  validateRequest,
  boardController.updateBoard
);

// Archive board
router.patch('/:id/archive',
  param('id').isInt().withMessage('Invalid board ID'),
  validateRequest,
  boardController.archiveBoard
);

// Unarchive board
router.patch('/:id/unarchive',
  param('id').isInt().withMessage('Invalid board ID'),
  validateRequest,
  boardController.unarchiveBoard
);

// Delete board
router.delete('/:id',
  param('id').isInt().withMessage('Invalid board ID'),
  validateRequest,
  boardController.deleteBoard
);

// Board Lists Routes
// Get board lists
router.get('/:boardId/lists',
  param('boardId').isInt().withMessage('Invalid board ID'),
  validateRequest,
  boardController.getBoardLists
);

// Create board list
router.post('/:boardId/lists',
  createListValidation,
  validateRequest,
  boardController.createBoardList
);

// Update board list
router.put('/:boardId/lists/:listId',
  updateListValidation,
  validateRequest,
  boardController.updateBoardList
);

// Delete board list
router.delete('/:boardId/lists/:listId',
  param('boardId').isInt().withMessage('Invalid board ID'),
  param('listId').isInt().withMessage('Invalid list ID'),
  validateRequest,
  boardController.deleteBoardList
);

// Board Members Routes
// Get board members
router.get('/:boardId/members',
  param('boardId').isInt().withMessage('Invalid board ID'),
  validateRequest,
  boardController.getBoardMembers
);

// Add board member
router.post('/:boardId/members',
  addMemberValidation,
  validateRequest,
  boardController.addBoardMember
);

// Remove board member
router.delete('/:boardId/members/:memberId',
  param('boardId').isInt().withMessage('Invalid board ID'),
  param('memberId').isInt().withMessage('Invalid member ID'),
  validateRequest,
  boardController.removeBoardMember
);

module.exports = router;
