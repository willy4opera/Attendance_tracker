const { User } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { Op } = require('sequelize');
const EmailService = require('../utils/email');

// Send verification email
exports.sendVerificationEmail = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const user = await User.findByPk(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.isEmailVerified) {
    return next(new AppError('Email already verified', 400));
  }

  // Generate new token and expiry
  await user.generateEmailVerificationToken();
  await user.save();

  // Send verification email
  await EmailService.sendWelcomeEmail(user);

  res.status(200).json({
    status: 'success',
    message: 'Verification email sent successfully'
  });
});

// Verify email with token or 6-digit code
exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.params || req.query || req.body;

  if (!token) {
    return next(new AppError('Verification token is required', 400));
  }

  console.log('Verifying token:', token);

  // First, try to find user with the exact token (full token from email link)
  let user = await User.unscoped().findOne({
    where: {
      emailVerificationToken: token,
      emailVerificationExpires: {
        [Op.gt]: new Date()
      }
    }
  });

  // If not found with full token, try with 6-digit code
  if (!user && token.length === 6) {
    console.log('Searching for 6-digit code:', token);
    
    // Find all users with non-expired tokens
    const users = await User.unscoped().findAll({
      where: {
        emailVerificationExpires: {
          [Op.gt]: new Date()
        },
        isEmailVerified: false
      }
    });
    
    console.log('Found users with active tokens:', users.length);

    // Check if any user's token ends with this 6-digit code
    for (const u of users) {
      if (u.emailVerificationToken && 
          u.emailVerificationToken.slice(-6).toUpperCase() === token.toUpperCase()) {
        console.log('Matched user:', u.email);
        user = u;
        break;
      }
    }
  }

  if (!user) {
    return next(new AppError('Invalid or expired verification token', 400));
  }

  // Verify email
  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save();

  // Send confirmation email
  await EmailService.sendVerificationSuccessEmail(user);

  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully'
  });
});

// Resend verification email
exports.resendVerificationEmail = catchAsync(async (req, res, next) => {
  const email = req.body.email || req.user?.email;

  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.isEmailVerified) {
    return next(new AppError('Email already verified', 400));
  }

  // Check rate limiting - prevent spam
  if (user.lastVerificationEmailSent) {
    const timeSinceLastEmail = Date.now() - new Date(user.lastVerificationEmailSent).getTime();
    const oneMinute = 60 * 1000;
    
    if (timeSinceLastEmail < oneMinute) {
      const waitTime = Math.ceil((oneMinute - timeSinceLastEmail) / 1000);
      return next(new AppError(`Please wait ${waitTime} seconds before requesting another email`, 429));
    }
  }

  // Generate new token and expiry
  await user.generateEmailVerificationToken();
  user.lastVerificationEmailSent = new Date();
  await user.save();

  // Send verification email
  await EmailService.sendWelcomeEmail(user);

  res.status(200).json({
    status: 'success',
    message: 'Verification email sent successfully. Please check your inbox.'
  });
});

// Check verification status
exports.checkVerificationStatus = catchAsync(async (req, res, next) => {
  const user = await User.findByPk(req.user.id);
  
  res.status(200).json({
    status: 'success',
    data: {
      isEmailVerified: user.isEmailVerified,
      email: user.email
    }
  });
});

module.exports = exports;
