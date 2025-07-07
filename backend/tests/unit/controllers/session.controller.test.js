const request = require('supertest');
const app = require('../../../server');
const { Session, User } = require('../../../src/models');
const { createAdminUser, createTestUser } = require('../../helpers/auth.helper');

describe('Session Controller', () => {
  let adminUser, regularUser;

  beforeEach(async () => {
    adminUser = await createAdminUser();
    regularUser = await createTestUser();
  });

  describe('POST /api/v1/sessions', () => {
    it('should create a session as admin', async () => {
      const sessionData = {
        title: 'Test Session',
        description: 'Test Description',
        sessionType: 'lecture',
        startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        endTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
        location: 'Room 101',
        meetingLink: 'https://zoom.us/j/123456789',
        maxAttendees: 50
      };

      const response = await request(app)
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send(sessionData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.session.title).toBe(sessionData.title);
      expect(response.body.data.session.instructorId).toBe(adminUser.user.id);
    });

    it('should not allow regular user to create session', async () => {
      const sessionData = {
        title: 'Unauthorized Session',
        description: 'Should fail',
        sessionType: 'lecture',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString()
      };

      const response = await request(app)
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${regularUser.token}`)
        .send(sessionData);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/v1/sessions', () => {
    beforeEach(async () => {
      // Create test sessions
      await Session.bulkCreate([
        {
          title: 'Past Session',
          instructorId: adminUser.user.id,
          sessionType: 'lecture',
          startTime: new Date(Date.now() - 7200000),
          endTime: new Date(Date.now() - 3600000),
          status: 'completed'
        },
        {
          title: 'Current Session',
          instructorId: adminUser.user.id,
          sessionType: 'workshop',
          startTime: new Date(Date.now() - 1800000),
          endTime: new Date(Date.now() + 1800000),
          status: 'active'
        },
        {
          title: 'Future Session',
          instructorId: adminUser.user.id,
          sessionType: 'seminar',
          startTime: new Date(Date.now() + 3600000),
          endTime: new Date(Date.now() + 7200000),
          status: 'scheduled'
        }
      ]);
    });

    it('should get all sessions', async () => {
      const response = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${regularUser.token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.sessions).toHaveLength(3);
    });

    it('should filter sessions by status', async () => {
      const response = await request(app)
        .get('/api/v1/sessions?status=active')
        .set('Authorization', `Bearer ${regularUser.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.sessions).toHaveLength(1);
      expect(response.body.data.sessions[0].status).toBe('active');
    });

    it('should filter sessions by type', async () => {
      const response = await request(app)
        .get('/api/v1/sessions?sessionType=workshop')
        .set('Authorization', `Bearer ${regularUser.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.sessions).toHaveLength(1);
      expect(response.body.data.sessions[0].sessionType).toBe('workshop');
    });
  });
});
