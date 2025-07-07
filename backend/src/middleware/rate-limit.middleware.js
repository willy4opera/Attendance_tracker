const rateLimit = require('express-rate-limit');
const config = require('../../../config/app.config.json');

// Create rate limiter
const rateLimiter = rateLimit({
  windowMs: config.app.rateLimit.windowMs || 15 * 60 * 1000, // 15 minutes
  max: config.app.rateLimit.max || 100, // limit each IP to 100 requests per windowMs
  message: config.app.rateLimit.message || 'Too many requests, please try again later.',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: config.app.rateLimit.message
      }
    });
  }
});

// Create strict rate limiter for auth endpoints
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: 'Too many authentication attempts, please try again later.',
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts, please try again later.'
      }
    });
  }
});

module.exports = { rateLimiter, authRateLimiter };
