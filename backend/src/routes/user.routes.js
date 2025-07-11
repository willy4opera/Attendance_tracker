const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation.middleware');
const { body, param, query } = require('express-validator');

// Validation rules
const createUserValidation = [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('phoneNumber').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('role').optional().isIn(['admin', 'moderator', 'user']),
  body('departmentId').optional().isInt()
];

const updateUserValidation = [
  param('id').isInt().withMessage('Invalid user ID'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('phoneNumber').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('departmentId').optional().isInt()
];

const updateMeValidation = [
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('phoneNumber').optional().isMobilePhone().withMessage('Invalid phone number')
];

// Routes
router.use(protect); // All routes require authentication

// ===== User's own profile routes =====
router.get('/me', userController.getProfile); // Get current user profile
router.get('/profile', userController.getProfile); // Alias for profile
router.patch('/updateMe', updateMeValidation, validateRequest, userController.updateProfile); // Update own profile
router.put('/profile', updateMeValidation, validateRequest, userController.updateProfile); // Alias for update
router.delete('/deleteMe', userController.deleteMe); // Soft delete own account

// Dashboard and stats
router.get('/dashboard-stats', userController.getDashboardStats);

// Password management (in auth controller)
router.patch('/updatePassword', authController.updatePassword);

// ===== Admin only routes =====
router.use(restrictTo('admin'));

// User statistics
router.get('/stats', userController.getStatistics);

// Export users
router.get('/export', userController.exportUsers);

// Get all users with filtering, sorting, pagination
router.get('/', userController.getAll);

// Create new user
router.post('/',
  createUserValidation,
  validateRequest,
  userController.create
);

// Get specific user by ID
router.get('/:id',
  param('id').isInt().withMessage('Invalid user ID'),
  validateRequest,
  userController.getById
);

// Update user
router.put('/:id',
  updateUserValidation,
  validateRequest,
  userController.update
);

router.patch('/:id',
  updateUserValidation,
  validateRequest,
  userController.update
);

// Change user role
router.patch('/:id/role',
  param('id').isInt().withMessage('Invalid user ID'),
  body('role').isIn(['admin', 'moderator', 'user']).withMessage('Invalid role'),
  validateRequest,
  userController.changeRole
);

// Change user department
router.patch('/:id/department',
  param('id').isInt().withMessage('Invalid user ID'),
  body('departmentId').optional().isInt().withMessage('Invalid department ID'),
  validateRequest,
  userController.changeDepartment
);

// Toggle user active status
router.patch('/:id/toggle-status',
  param('id').isInt().withMessage('Invalid user ID'),
  validateRequest,
  userController.toggleActive
);

// Alternative endpoint for status toggle
router.patch('/:id/status',
  param('id').isInt().withMessage('Invalid user ID'),
  body('isActive').isBoolean().withMessage('isActive must be boolean'),
  validateRequest,
  userController.toggleActive
);

// Delete user
router.delete('/:id',
  param('id').isInt().withMessage('Invalid user ID'),
  validateRequest,
  userController.delete
);

// Bulk update users
router.post('/bulk-update',
  body('userIds').isArray().withMessage('User IDs must be an array'),
  body('userIds.*').isInt().withMessage('Invalid user ID'),
  body('updates').isObject().withMessage('Updates must be an object'),
  validateRequest,
  userController.bulkUpdate
);

module.exports = router;

// Social feature routes
router.post('/:userId/follow',
  param('userId').isInt().withMessage('Valid user ID is required'),
  validateRequest,
  userController.toggleFollowUser
);

router.get('/:userId/followers',
  param('userId').isInt().withMessage('Valid user ID is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validateRequest,
  userController.getFollowers
);

router.get('/:userId/following',
  param('userId').isInt().withMessage('Valid user ID is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validateRequest,
  userController.getFollowing
);
