const jwt = require('jsonwebtoken');
const { User } = require('../../src/models');

const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    email: 'test@example.com',
    password: 'Test123!@#',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    isActive: true,
    isEmailVerified: true
  };

  const userData = { ...defaultUser, ...overrides };
  const user = await User.create(userData);
  
  // Generate token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return { user: user.toJSON(), token };
};

const createAdminUser = async (overrides = {}) => {
  return createTestUser({ ...overrides, role: 'admin', email: 'admin@example.com' });
};

const createModeratorUser = async (overrides = {}) => {
  return createTestUser({ ...overrides, role: 'moderator', email: 'moderator@example.com' });
};

module.exports = {
  createTestUser,
  createAdminUser,
  createModeratorUser
};
