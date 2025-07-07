const { User } = require('../../../src/models');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'testuser@example.com',
        password: 'Test123!@#',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user'
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.role).toBe(userData.role);
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    it('should not create a user with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Test123!@#',
        firstName: 'John',
        lastName: 'Doe'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should not create a user without required fields', async () => {
      const userData = {
        email: 'test@example.com'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should not create duplicate users with same email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'Test123!@#',
        firstName: 'John',
        lastName: 'Doe'
      };

      await User.create(userData);
      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('Password Management', () => {
    it('should hash password on creation', async () => {
      const password = 'Test123!@#';
      const user = await User.create({
        email: 'hash@example.com',
        password,
        firstName: 'Hash',
        lastName: 'Test'
      });

      expect(user.password).not.toBe(password);
      expect(user.password).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt hash pattern
    });

    it('should validate password correctly using bcrypt', async () => {
      const password = 'Test123!@#';
      const user = await User.create({
        email: 'validate@example.com',
        password,
        firstName: 'Validate',
        lastName: 'Test'
      });

      // Manually compare passwords using bcrypt since validatePassword might not exist
      const isValid = await bcrypt.compare(password, user.password);
      const isInvalid = await bcrypt.compare('wrongpassword', user.password);

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });

  describe('User Model Features', () => {
    it('should have correct default values', async () => {
      const user = await User.create({
        email: 'defaults@example.com',
        password: 'Test123!@#',
        firstName: 'Default',
        lastName: 'User'
      });

      expect(user.isActive).toBe(true);
      expect(user.emailVerified).toBe(false);
      expect(user.role).toBe('user');
    });

    it('should exclude password in JSON representation', async () => {
      const user = await User.create({
        email: 'json@example.com',
        password: 'Test123!@#',
        firstName: 'JSON',
        lastName: 'Test'
      });

      const json = user.toJSON();
      expect(json.password).toBeUndefined();
      expect(json.email).toBeDefined();
    });
  });

  describe('User Associations', () => {
    it('should have correct associations defined', () => {
      const associations = User.associations;

      // Check for actual association names based on the model
      expect(associations).toHaveProperty('facilitatedSessions');
      expect(associations).toHaveProperty('attendances');
      expect(associations).toHaveProperty('markedAttendances');
      expect(associations).toHaveProperty('approvedAttendances');
      expect(associations).toHaveProperty('uploads');
    });
  });
});
