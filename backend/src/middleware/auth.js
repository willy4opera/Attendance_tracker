const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { verifyToken } = require('../utils/jwt');

const protect = async (req, res, next) => {
  try {
    // 1) Getting token and check if it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in! Please log in to get access.'
      });
    }

    // 2) Verification token
    const decoded = await verifyToken(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token does no longer exist.'
      });
    }

    // 4) Check if user is active
    if (!currentUser.isActive) {
      return res.status(401).json({
        status: 'fail',
        message: 'Your account has been deactivated. Please contact admin.'
      });
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid token. Please log in again!'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Your token has expired! Please log in again.'
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong during authentication'
    });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo
};
