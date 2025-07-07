const AppError = require('../utils/appError');

// Role hierarchy
const roleHierarchy = {
  admin: ['admin', 'moderator', 'user'],
  moderator: ['moderator', 'user'],
  user: ['user']
};

// Check if user has required role
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Check if user is logged in
    if (!req.user) {
      return next(new AppError('You must be logged in to access this resource', 401));
    }

    // Check if user's role is allowed
    const userRole = req.user.role;
    const hasPermission = roles.some(role => roleHierarchy[userRole]?.includes(role));

    if (!hasPermission) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};

// Check if user owns the resource or is admin
exports.checkOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    // Admins can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params.userId || req.body[resourceUserIdField] || req.params.id;
    
    if (resourceUserId !== req.user.id) {
      return next(new AppError('You can only access your own resources', 403));
    }

    next();
  };
};

// Permission definitions for different resources
exports.permissions = {
  user: {
    create: ['admin'],
    read: ['admin', 'moderator', 'user'], // Users can read their own profile
    update: ['admin', 'user'], // Users can update their own profile
    delete: ['admin', 'user'] // Users can delete their own account
  },
  session: {
    create: ['admin', 'moderator'],
    read: ['admin', 'moderator', 'user'],
    update: ['admin', 'moderator'],
    delete: ['admin']
  },
  attendance: {
    create: ['admin', 'moderator', 'user'], // Users can mark their own attendance
    read: ['admin', 'moderator', 'user'], // Users can view their own attendance
    update: ['admin', 'moderator'],
    delete: ['admin']
  },
  analytics: {
    read: ['admin', 'moderator']
  }
};

// Generic permission checker
exports.checkPermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You must be logged in to access this resource', 401));
    }

    const userRole = req.user.role;
    const allowedRoles = exports.permissions[resource]?.[action] || [];
    
    const hasPermission = allowedRoles.some(role => roleHierarchy[userRole]?.includes(role));

    if (!hasPermission) {
      return next(new AppError(`You do not have permission to ${action} ${resource}`, 403));
    }

    next();
  };
};
