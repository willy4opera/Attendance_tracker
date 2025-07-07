const request = require('supertest');
const app = require('../../server');
const { User } = require('../../src/models');

describe('Auth Endpoints', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'Test123!@#',
        firstName: 'New',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      // Verify user in database
      const user = await User.findOne({ where: { email: userData.email } });
      expect(user).toBeDefined();
      expect(user.isEmailVerified).toBe(false); // Should need verification
    });

    it('should not register user with existing email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'Test123!@#',
        firstName: 'Existing',
        lastName: 'User'
      };

      // Create first user
      await User.create(userData);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'incomplete@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let testUser;
    const password = 'Test123!@#';

    beforeEach(async () => {
      testUser = await User.create({
        email: 'login@example.com',
        password,
        firstName: 'Login',
        lastName: 'Test',
        isEmailVerified: true
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should not login if email not verified', async () => {
      const unverifiedUser = await User.create({
        email: 'unverified@example.com',
        password,
        firstName: 'Unverified',
        lastName: 'User',
        isEmailVerified: false
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: unverifiedUser.email,
          password
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('verify your email');
    });

    it('should not login if user is inactive', async () => {
      const inactiveUser = await User.create({
        email: 'inactive@example.com',
        password,
        firstName: 'Inactive',
        lastName: 'User',
        isEmailVerified: true,
        isActive: false
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: inactiveUser.email,
          password
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('deactivated');
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    it('should refresh token with valid refresh token', async () => {
      // First login to get tokens
      const user = await User.create({
        email: 'refresh@example.com',
        password: 'Test123!@#',
        firstName: 'Refresh',
        lastName: 'Test',
        isEmailVerified: true
      });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'Test123!@#'
        });

      const { refreshToken } = loginResponse.body.data;

      // Use refresh token
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });
  });
});
