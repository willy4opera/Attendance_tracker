const express = require('express');
const projectMembersController = require("../controllers/projectMembers.controller");
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation.middleware');
const { body, param, query } = require('express-validator');

// Validation rules
const createProjectValidation = [
  body('name').notEmpty().withMessage('Project name is required'),
  body('code').notEmpty().withMessage('Project code is required')
    .isLength({ max: 20 }).withMessage('Code must be at most 20 characters'),
  body('description').optional().isString(),
  body('projectManagerId').optional().isInt(),
  body('departmentId').optional().isInt(),
  body('startDate').optional().isISO8601().withMessage('Invalid start date'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date'),
  body('budget').optional().isDecimal().withMessage('Invalid budget format'),
  body('status').optional().isIn(['planning', 'active', 'on_hold', 'completed', 'cancelled']),
  body('teamMembers').optional().isArray(),
  body('teamMembers.*.userId').optional().isInt(),
  body('teamMembers.*.role').optional().isIn(['member', 'lead', 'viewer'])
];

const updateProjectValidation = [
  param('id').isInt().withMessage('Invalid project ID'),
  body('name').optional().notEmpty().withMessage('Project name cannot be empty'),
  body('code').optional().isLength({ max: 20 }).withMessage('Code must be at most 20 characters'),
  body('description').optional().isString(),
  body('projectManagerId').optional().isInt(),
  body('departmentId').optional().isInt(),
  body('startDate').optional().isISO8601().withMessage('Invalid start date'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date'),
  body('budget').optional().isDecimal().withMessage('Invalid budget format'),
  body('status').optional().isIn(['planning', 'active', 'on_hold', 'completed', 'cancelled'])
];

// Routes
router.use(protect); // All routes require authentication
console.log("🚀 Project routes - protect middleware applied");

// Get all projects with filtering
router.get('/', projectController.getAll);

// Get project by ID
router.get('/:id',
  param('id').isInt().withMessage('Invalid project ID'),
  validateRequest,
  projectController.getById
);

// Admin and moderator routes
router.use(restrictTo('admin', 'moderator'));

// Create new project
router.post('/',
  createProjectValidation,
  validateRequest,
  projectController.create
);

// Update project
router.put('/:id',
  updateProjectValidation,
  validateRequest,
  projectController.update
);

// Manage project members
router.post('/:id/members',
  param('id').isInt().withMessage('Invalid project ID'),
  body('userId').isInt().withMessage('Invalid user ID'),
  body('role').optional().isIn(['member', 'lead', 'viewer']),
  body('action').isIn(['add', 'remove', 'update']).withMessage('Invalid action'),
  validateRequest,
  projectController.manageMember
);

// Admin-only routes
router.use(restrictTo('admin'));

// Delete project
router.delete('/:id',
  param('id').isInt().withMessage('Invalid project ID'),
  validateRequest,
  projectController.delete
);


// Add this route to your project routes


// Get project task members
router.get("/:projectId/task-members", protect, projectMembersController.getProjectTaskMembers);

module.exports = router;
