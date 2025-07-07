const logger = require('../utils/logger');
const config = require('../../../config/app.config.json');

const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Set default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    
    // Extract validation errors
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    
    return res.status(statusCode).json({
      status: 'error',
      error: {
        code,
        message,
        errors
      }
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'Resource already exists';
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    code = 'FOREIGN_KEY_ERROR';
    message = 'Referenced resource does not exist';
  }

  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Unauthorized access';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Token has expired';
  }

  // Don't expose internal errors in production
  if (config.app.environment === 'production' && statusCode === 500) {
    message = 'Something went wrong';
  }

  // Send error response
  res.status(statusCode).json({
    status: 'error',
    error: {
      code,
      message,
      ...(config.app.environment !== 'production' && { stack: err.stack })
    }
  });
};

module.exports = errorHandler;
