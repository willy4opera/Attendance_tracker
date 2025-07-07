const { Session } = require('../models');
const moment = require('moment');
const { Op } = require('sequelize');

class RecurringSessionService {
  /**
   * Generate recurring session objects based on pattern
   */
  generateRecurringSessions(baseSessionData, pattern) {
    const sessions = [];
    const { startDate, endDate, frequency, interval = 1, daysOfWeek, dayOfMonth, maxOccurrences } = pattern;
    
    let currentDate = moment(startDate);
    const endMoment = endDate ? moment(endDate) : moment(startDate).add(1, 'year');
    let occurrenceCount = 0;
    
    while (currentDate.isSameOrBefore(endMoment) && (!maxOccurrences || occurrenceCount < maxOccurrences)) {
      let shouldAddSession = false;
      
      switch (frequency) {
        case 'daily':
          shouldAddSession = true;
          break;
          
        case 'weekly':
          if (daysOfWeek && daysOfWeek.includes(currentDate.day())) {
            shouldAddSession = true;
          }
          break;
          
        case 'monthly':
          if (dayOfMonth && currentDate.date() === dayOfMonth) {
            shouldAddSession = true;
          }
          break;
      }
      
      if (shouldAddSession) {
        sessions.push({
          ...baseSessionData,
          sessionDate: currentDate.format('YYYY-MM-DD'),
          isRecurring: true,
          recurringPattern: pattern
        });
        occurrenceCount++;
      }
      
      // Move to next potential date
      switch (frequency) {
        case 'daily':
          currentDate.add(interval, 'days');
          break;
        case 'weekly':
          currentDate.add(1, 'days');
          break;
        case 'monthly':
          currentDate.add(1, 'days');
          break;
      }
    }
    
    return sessions;
  }
  
  /**
   * Create recurring sessions - parent and children
   */
  async createRecurringSessions(sessionData) {
    try {
      const { recurringPattern, ...baseData } = sessionData;
      
      // Create parent session
      const parentSession = await Session.create({
        ...baseData,
        sessionDate: recurringPattern.startDate,
        isRecurring: true,
        recurringPattern: recurringPattern
      });
      
      // Generate child sessions
      const childSessions = this.generateRecurringSessions(baseData, recurringPattern);
      
      // Prepare child sessions with parent reference
      const childSessionsData = childSessions.map(session => ({
        ...session,
        parentSessionId: parentSession.id,
        sessionDate: moment(session.sessionDate).toDate()
      }));
      
      // Create child sessions
      const createdChildren = await Session.bulkCreate(childSessionsData);
      
      return {
        parentSession,
        childSessions: createdChildren,
        totalCreated: 1 + createdChildren.length
      };
    } catch (error) {
      throw new Error(`Error creating recurring sessions: ${error.message}`);
    }
  }
  
  /**
   * Update recurring sessions based on scope
   */
  async updateRecurringSessions(parentId, updateData, scope = 'all') {
    try {
      // Find parent session
      const parentSession = await Session.findByPk(parentId);
      
      if (!parentSession || !parentSession.isRecurring) {
        throw new Error('Parent session not found or not a recurring session');
      }
      
      let whereClause = {};
      let updated = 0;
      
      switch (scope) {
        case 'this':
          // Update only the specific session
          whereClause = { id: parentId };
          break;
          
        case 'future':
          // Update parent and future child sessions
          whereClause = {
            [Op.or]: [
              { id: parentId },
              {
                parentSessionId: parentId,
                sessionDate: { [Op.gte]: new Date() }
              }
            ]
          };
          break;
          
        case 'all':
          // Update parent and all child sessions
          whereClause = {
            [Op.or]: [
              { id: parentId },
              { parentSessionId: parentId }
            ]
          };
          break;
      }
      
      const [updateCount] = await Session.update(updateData, {
        where: whereClause
      });
      
      updated = updateCount;
      
      return {
        updated,
        scope
      };
    } catch (error) {
      throw new Error(`Error updating recurring sessions: ${error.message}`);
    }
  }
  
  /**
   * Delete recurring sessions based on scope
   */
  async deleteRecurringSessions(parentId, scope = 'all') {
    try {
      // Find parent session
      const parentSession = await Session.findByPk(parentId);
      
      if (!parentSession || !parentSession.isRecurring) {
        throw new Error('Parent session not found or not a recurring session');
      }
      
      let whereClause = {};
      let deleted = 0;
      
      switch (scope) {
        case 'this':
          // Delete only the specific session
          whereClause = { id: parentId };
          break;
          
        case 'future':
          // Delete parent and future child sessions
          whereClause = {
            [Op.or]: [
              { id: parentId },
              {
                parentSessionId: parentId,
                sessionDate: { [Op.gte]: new Date() }
              }
            ]
          };
          break;
          
        case 'all':
          // Delete parent and all child sessions
          whereClause = {
            [Op.or]: [
              { id: parentId },
              { parentSessionId: parentId }
            ]
          };
          break;
      }
      
      deleted = await Session.destroy({
        where: whereClause
      });
      
      return {
        deleted,
        scope
      };
    } catch (error) {
      throw new Error(`Error deleting recurring sessions: ${error.message}`);
    }
  }
  
  /**
   * Get all recurring session patterns (parent sessions)
   */
  async getRecurringPatterns(filters = {}) {
    try {
      const where = {
        isRecurring: true,
        parentSessionId: null // Only parent sessions
      };
      
      if (filters.facilitatorId) {
        where.facilitatorId = filters.facilitatorId;
      }
      
      const patterns = await Session.findAll({
        where,
        include: [{
          model: require('../models/user.model'),
          as: 'facilitator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }],
        order: [['createdAt', 'DESC']]
      });
      
      return patterns;
    } catch (error) {
      throw new Error(`Error fetching recurring patterns: ${error.message}`);
    }
  }
  
  /**
   * Get child sessions of a recurring pattern
   */
  async getChildSessions(parentId, filters = {}) {
    try {
      const where = {
        parentSessionId: parentId
      };
      
      if (filters.fromDate) {
        where.sessionDate = {
          [Op.gte]: moment(filters.fromDate).toDate()
        };
      }
      
      if (filters.toDate) {
        where.sessionDate = {
          ...where.sessionDate,
          [Op.lte]: moment(filters.toDate).toDate()
        };
      }
      
      const sessions = await Session.findAll({
        where,
        order: [['sessionDate', 'ASC']]
      });
      
      return sessions;
    } catch (error) {
      throw new Error(`Error fetching child sessions: ${error.message}`);
    }
  }
  
  /**
   * Add exception to recurring pattern
   */
  async addException(parentId, exceptionDate, reason = '') {
    try {
      const parentSession = await Session.findByPk(parentId);
      
      if (!parentSession || !parentSession.isRecurring) {
        throw new Error('Parent session not found or not a recurring session');
      }
      
      // Find and cancel the child session for that date
      const childSession = await Session.findOne({
        where: {
          parentSessionId: parentId,
          sessionDate: moment(exceptionDate).toDate()
        }
      });
      
      if (childSession) {
        await childSession.update({
          status: 'cancelled',
          cancellationReason: reason
        });
      }
      
      // Update parent session's exception list
      const exceptions = parentSession.recurringPattern.exceptions || [];
      exceptions.push({ date: exceptionDate, reason });
      
      await parentSession.update({
        recurringPattern: {
          ...parentSession.recurringPattern,
          exceptions
        }
      });
      
      return parentSession;
    } catch (error) {
      throw new Error(`Error adding exception: ${error.message}`);
    }
  }
}

module.exports = new RecurringSessionService();
