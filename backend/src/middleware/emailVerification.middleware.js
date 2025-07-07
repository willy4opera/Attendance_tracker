const { User } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// Middleware to ensure email is verified
exports.requireVerifiedEmail = catchAsync(async (req, res, next) => {
  const user = await User.findByPk(req.user.userId);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  if (!user.emailVerified) {
    return next(new AppError('Please verify your email address to access this resource', 403));
  }
  
  next();
});

// Middleware to check but not require verification (adds warning)
exports.checkEmailVerification = catchAsync(async (req, res, next) => {
  const user = await User.findByPk(req.user.userId);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  // Add verification status to request
  req.emailVerified = user.emailVerified;
  
  // Add warning header if not verified
  if (!user.emailVerified) {
    res.setHeader('X-Email-Verification-Required', 'true');
    res.setHeader('X-Email-Verification-Message', 'Please verify your email for full access');
  }
  
  next();
});

// Middleware for optional verification check (for public endpoints)
exports.optionalEmailCheck = catchAsync(async (req, res, next) => {
  if (req.user && req.user.userId) {
    const user = await User.findByPk(req.user.userId);
    if (user) {
      req.emailVerified = user.emailVerified;
    }
  }
  next();
});
