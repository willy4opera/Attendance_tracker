const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { signToken, verifyToken } = require('../utils/jwt');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { sendWelcomeEmail, sendLoginNotification } = require('../utils/email');

// Helper function to send token response
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.cookie('jwt', token, cookieOptions);
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    refreshToken,
    data: {
      user
    }
  });
};

// Login controller
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ 
    where: { email },
    attributes: {
      include: ['password'] // Include password field for comparison
    }
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) Check if user is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact admin.', 401));
  }

  // 4) Update last login
  await user.update({ lastLogin: new Date() });

  // Send login notification email (async, don't wait)
  const loginDetails = {
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  };
  sendLoginNotification(user, loginDetails).catch(err => {
    console.error('Failed to send login notification:', err.message);
  });

  // 5) If everything ok, send token to client
  createSendToken(user, 200, res);
});

// Logout controller
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.cookie('refreshToken', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

// Refresh token controller
exports.refreshToken = catchAsync(async (req, res, next) => {
  // 1) Get refresh token from cookies or body
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return next(new AppError('No refresh token provided', 401));
  }

  // 2) Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    return next(new AppError('Invalid refresh token', 401));
  }

  // 3) Check if user still exists
  const user = await User.findByPk(decoded.id);
  if (!user) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401));
  }

  // 4) Check if user is still active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact admin.', 401));
  }

  // 5) Issue new tokens
  createSendToken(user, 200, res);
});

// Get current user
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password'] }
  });

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// Update current user password
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, passwordConfirm } = req.body;

  // 1) Check if all fields are provided
  if (!currentPassword || !newPassword || !passwordConfirm) {
    return next(new AppError('Please provide current password, new password and password confirmation', 400));
  }

  // 2) Check if new password and confirm password match
  if (newPassword !== passwordConfirm) {
    return next(new AppError('New password and password confirmation do not match', 400));
  }

  // 3) Get user from collection
  const user = await User.findByPk(req.user.id, {
    attributes: {
      include: ['password']
    }
  });

  // 4) Check if current password is correct
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return next(new AppError('Your current password is incorrect', 401));
  }

  // 5) Update password
  user.password = newPassword;
  await user.save();

  // 6) Log user in, send JWT
  createSendToken(user, 200, res);
});

// Register controller
exports.register = catchAsync(async (req, res, next) => {
  const { email, password, passwordConfirm, firstName, lastName, phoneNumber } = req.body;

  // 1) Check if required fields exist
  if (!email || !password || !passwordConfirm || !firstName || !lastName) {
    return next(new AppError('Please provide all required fields!', 400));
  }

  // 2) Check if passwords match
  if (password !== passwordConfirm) {
    return next(new AppError('Passwords do not match!', 400));
  }

  // 3) Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return next(new AppError('User with this email already exists!', 400));
  }

  // 4) Create new user
  const newUser = await User.create({
    email,
    password, // Will be hashed by Sequelize beforeCreate hook
    firstName,
    lastName,
    phoneNumber: phoneNumber || null,
    role: 'user', // Default role
    isActive: true
  })
  // Generate email verification token
  const verificationToken = newUser.generateEmailVerificationToken();
  await newUser.save();

  // Send verification email
  try {
    await sendVerificationEmail(newUser, verificationToken);
  } catch (err) {
    console.error('Failed to send verification email:', err);
    // Continue with registration even if email fails
  }
;

  // 5) Send token to client
  console.log('About to send welcome email to:', newUser.email);
  // Send welcome email (async, don't wait for it)
  // Send email verification

  sendWelcomeEmail(newUser).catch(err => {
    console.error('Failed to send welcome email:', err.message, err.stack);
  });

  // Reload user to get updated token fields
  const userWithToken = await User.findByPk(newUser.id, {
    attributes: { exclude: ['password'] }
  });
  
  createSendToken(userWithToken, 201, res);
});

// Helper function to send verification email
const sendVerificationEmail = async (user, verificationToken) => {
  const EmailService = require('../utils/email');
  
  // Create verification URL
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  
  // Send verification email
  const emailService = new EmailService();
  await emailService.sendEmailVerification(user.email, {
    firstName: user.firstName,
    verificationUrl
  });
};

// Export the function if needed
exports.sendVerificationEmail = sendVerificationEmail;

// Google Auth
const { googleAuth, getGoogleAuthUrl, clearProcessedCodes } = require('./auth/googleAuth');
exports.googleAuth = googleAuth;
exports.getGoogleAuthUrl = getGoogleAuthUrl;
exports.clearProcessedCodes = clearProcessedCodes;

// Facebook Auth
const { facebookAuth, getFacebookAuthUrl, verifyFacebookToken, exchangeFacebookCode } = require('./auth/facebookAuth');
exports.facebookAuth = facebookAuth;
exports.getFacebookAuthUrl = getFacebookAuthUrl;
exports.verifyFacebookToken = verifyFacebookToken;
exports.exchangeFacebookCode = exchangeFacebookCode;

// GitHub Auth
const { githubAuth, getGitHubAuthUrl, getGitHubUrl } = require('./auth/githubAuth');
exports.githubAuth = githubAuth;
exports.getGitHubAuthUrl = getGitHubAuthUrl;
exports.getGitHubUrl = getGitHubUrl;

// LinkedIn OAuth
const { linkedinAuth, getLinkedInAuthUrl, getLinkedInUrl } = require('./auth/linkedinAuth');
exports.linkedinAuth = linkedinAuth;
exports.getLinkedInAuthUrl = getLinkedInAuthUrl;
exports.getLinkedInUrl = getLinkedInUrl;
