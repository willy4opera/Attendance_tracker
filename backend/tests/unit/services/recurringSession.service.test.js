const recurringSessionService = require('../../../src/services/recurringSession.service');
const { Session } = require('../../../src/models');
const moment = require('moment');

describe('RecurringSessionService', () => {
  describe('generateRecurringSessions', () => {
    const baseSessionData = {
      title: 'Test Recurring Session',
      description: 'Test Description',
      facilitatorId: 'test-user-id',
      startTime: '09:00:00',
      endTime: '10:00:00',
      location: 'Room 101',
      capacity: 30
    };

    it('should generate daily recurring sessions', () => {
      const pattern = {
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        frequency: 'daily',
        interval: 1
      };

      const sessions = recurringSessionService.generateRecurringSessions(baseSessionData, pattern);

      expect(sessions).toHaveLength(7);
      expect(sessions[0].sessionDate).toBe('2024-01-01');
      expect(sessions[6].sessionDate).toBe('2024-01-07');
    });

    it('should generate weekly recurring sessions on specific days', () => {
      const pattern = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [1, 3, 5] // Monday, Wednesday, Friday
      };

      const sessions = recurringSessionService.generateRecurringSessions(baseSessionData, pattern);

      // Check that all sessions are on the correct days
      sessions.forEach(session => {
        const dayOfWeek = moment(session.sessionDate).day();
        expect([1, 3, 5]).toContain(dayOfWeek);
      });
    });

    it('should generate monthly recurring sessions', () => {
      const pattern = {
        startDate: '2024-01-01',
        endDate: '2024-06-30',
        frequency: 'monthly',
        interval: 1,
        dayOfMonth: 15
      };

      const sessions = recurringSessionService.generateRecurringSessions(baseSessionData, pattern);

      expect(sessions).toHaveLength(6);
      sessions.forEach(session => {
        const date = moment(session.sessionDate);
        expect(date.date()).toBe(15);
      });
    });

    it('should respect maxOccurrences limit', () => {
      const pattern = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        frequency: 'daily',
        interval: 1,
        maxOccurrences: 5
      };

      const sessions = recurringSessionService.generateRecurringSessions(baseSessionData, pattern);

      expect(sessions).toHaveLength(5);
    });
  });

  describe('createRecurringSessions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create parent and child sessions', async () => {
      const sessionData = {
        title: 'Weekly Meeting',
        description: 'Team sync',
        facilitatorId: 'test-user-id',
        startTime: '10:00:00',
        endTime: '11:00:00',
        recurringPattern: {
          startDate: '2024-01-01',
          endDate: '2024-01-15',
          frequency: 'weekly',
          interval: 1,
          daysOfWeek: [1] // Monday only
        }
      };

      // Mock Session.create and Session.bulkCreate
      const mockParentSession = { id: 'parent-id', ...sessionData, isRecurring: true };
      Session.create = jest.fn().mockResolvedValue(mockParentSession);
      Session.bulkCreate = jest.fn().mockResolvedValue([{}, {}, {}]); // 3 child sessions

      const result = await recurringSessionService.createRecurringSessions(sessionData);

      expect(Session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Weekly Meeting',
          isRecurring: true,
          recurringPattern: sessionData.recurringPattern
        })
      );

      expect(Session.bulkCreate).toHaveBeenCalled();
      expect(result.totalCreated).toBe(4); // 1 parent + 3 children
    });
  });

  describe('updateRecurringSessions', () => {
    it('should update sessions based on scope', async () => {
      const parentId = 'parent-session-id';
      const updateData = { location: 'New Room' };

      // Mock the parent session
      Session.findByPk = jest.fn().mockResolvedValue({
        id: parentId,
        isRecurring: true
      });

      Session.update = jest.fn().mockResolvedValue([5]);

      const result = await recurringSessionService.updateRecurringSessions(
        parentId,
        updateData,
        'all'
      );

      expect(Session.update).toHaveBeenCalledWith(
        updateData,
        expect.objectContaining({
          where: expect.any(Object)
        })
      );

      expect(result.updated).toBe(5);
      expect(result.scope).toBe('all');
    });

    it('should throw error for non-recurring session', async () => {
      Session.findByPk = jest.fn().mockResolvedValue({
        id: 'test-id',
        isRecurring: false
      });

      await expect(
        recurringSessionService.updateRecurringSessions('test-id', {}, 'all')
      ).rejects.toThrow('Parent session not found or not a recurring session');
    });
  });
});
