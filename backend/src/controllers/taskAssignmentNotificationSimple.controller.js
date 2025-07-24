const TaskAssignmentNotification = require('../models/taskAssignmentNotificationSimple.model');
const logger = require('../utils/logger');

// Simple handler for task assignment
exports.handleTaskAssignment = async (task, assignedUsers = [], assignedDepartments = [], type = 'task_assigned') => {
  try {
    logger.info(`Handling task assignment for task ${task.id}`);
    
    if (assignedUsers.length === 0 && assignedDepartments.length === 0) {
      logger.info('No users or departments assigned');
      return null;
    }
    
    // For now, just handle direct user assignments
    if (assignedUsers.length > 0) {
      const notification = await TaskAssignmentNotification.createSimpleNotification(
        task.id,
        assignedUsers,
        type
      );
      
      logger.info(`Created notification: ${notification?.id}`);
      return notification;
    }
    
    return null;
  } catch (error) {
    logger.error('Error in handleTaskAssignment:', error);
    // Don't throw - we don't want to break task creation
    return null;
  }
};

module.exports = exports;
