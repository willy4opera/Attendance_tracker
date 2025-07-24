const rateLimit = require('express-rate-limit');

// Get rate limit configuration from environment variables
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Development-friendly rate limiting
const rateLimiterConfig = {
  windowMs: isDevelopment ? 1 * 60 * 1000 : 15 * 60 * 1000, // 1 minute in dev, 15 minutes in prod
  max: isDevelopment ? 1000 : 100, // 1000 requests in dev, 100 in prod
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.'
      }
    });
  }
};

// Create rate limiter
const rateLimiter = rateLimit(rateLimiterConfig);

// Create strict rate limiter for auth endpoints
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 50 : 5, // 50 requests in dev, 5 in prod
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

// Skip rate limiting for certain routes in development
const skipRateLimitForDev = (req, res, next) => {
  if (isDevelopment && (req.path.includes('/users/me') || req.path.includes('/auth/refresh'))) {
    return next();
  }
  return rateLimiter(req, res, next);
};

module.exports = { 
  rateLimiter: isDevelopment ? skipRateLimitForDev : rateLimiter, 
  authRateLimiter 
};
