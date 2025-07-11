const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation.middleware');
const { body, param, query } = require('express-validator');

// Validation rules
const createDepartmentValidation = [
  body('name').notEmpty().withMessage('Department name is required'),
  body('code').notEmpty().withMessage('Department code is required')
    .isLength({ max: 10 }).withMessage('Code must be at most 10 characters')
    .isAlphanumeric().withMessage('Code must be alphanumeric'),
  body('description').optional().isString(),
  body('headOfDepartmentId').optional().isInt(),
  body('parentDepartmentId').optional().isInt()
];

const updateDepartmentValidation = [
  param('id').isInt().withMessage('Invalid department ID'),
  body('name').optional().notEmpty().withMessage('Department name cannot be empty'),
  body('code').optional().isLength({ max: 10 }).withMessage('Code must be at most 10 characters'),
  body('description').optional().isString(),
  body('headOfDepartmentId').optional().isInt(),
  body('parentDepartmentId').optional().isInt()
];

// Routes
router.use(protect); // All routes require authentication

// Get department hierarchy (available to all authenticated users)
router.get('/hierarchy', departmentController.getHierarchy);

// Get all departments with filtering
router.get('/', departmentController.getAll);

// Get department by ID
router.get('/:id', 
  param('id').isInt().withMessage('Invalid department ID'),
  validateRequest,
  departmentController.getById
);

// Admin-only routes
router.use(restrictTo('admin'));

// Create new department
router.post('/', 
  createDepartmentValidation,
  validateRequest,
  departmentController.create
);

// Update department
router.put('/:id',
  updateDepartmentValidation,
  validateRequest,
  departmentController.update
);

// Delete department
router.delete('/:id',
  param('id').isInt().withMessage('Invalid department ID'),
  validateRequest,
  departmentController.delete
);

// Bulk update departments
router.post('/bulk-update',
  body('departmentIds').isArray().withMessage('Department IDs must be an array'),
  body('departmentIds.*').isInt().withMessage('Invalid department ID'),
  body('updates').isObject().withMessage('Updates must be an object'),
  validateRequest,
  departmentController.bulkUpdate
);

module.exports = router;
