const { Task, User, Department, TaskList, Board, Project } = require('../models');
const TaskAssignmentNotification = require('../models/taskAssignmentNotification.model');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Process a notification (send emails and create in-app notifications)
exports.processNotification = async (notification) => {
  try {
    return await notification.process();
  } catch (error) {
    logger.error('Error processing task assignment notification:', error);
    throw error;
  }
};

// Create and send assignment notifications when a task is created or updated
exports.handleTaskAssignment = async (task, assignedUsers = [], assignedDepartments = [], type = 'task_assigned') => {
  try {
    const recipients = new Set();
    
    // Add directly assigned users
    assignedUsers.forEach(userId => recipients.add(userId));
    
    // Add users from assigned departments
    if (assignedDepartments.length > 0) {
      const departmentUsers = await User.findAll({
        where: {
          departmentId: {
            [Op.in]: assignedDepartments
          },
          isActive: true
        },
        attributes: ['id']
      });
      
      departmentUsers.forEach(user => recipients.add(user.id));
    }
    
    // Remove the task creator from recipients (don't notify them of their own assignment)
    recipients.delete(task.createdBy);
    
    if (recipients.size === 0) {
      logger.info('No recipients for task assignment notification');
      return null;
    }
    
    // Create notification
    const notification = await TaskAssignmentNotification.createNotification({
      task,
      type,
      recipients: Array.from(recipients),
      channels: ['inApp', 'email'],
      priority: task.priority === 'urgent' ? 'high' : 'normal'
    });
    
    // Process notification immediately
    const results = await this.processNotification(notification);
    logger.info(`Task assignment notifications sent for task ${task.id}:`, results);
    
    return notification;
  } catch (error) {
    logger.error('Error handling task assignment notification:', error);
    // Don't throw - we don't want notification errors to break task creation
    return null;
  }
};

// Handle task reassignment
exports.handleTaskReassignment = async (task, oldAssignedUsers = [], newAssignedUsers = [], oldAssignedDepartments = [], newAssignedDepartments = []) => {
  try {
    const notifications = [];
    
    // Find users who were removed
    const removedUsers = oldAssignedUsers.filter(userId => !newAssignedUsers.includes(userId));
    
    // Find users who were added
    const addedUsers = newAssignedUsers.filter(userId => !oldAssignedUsers.includes(userId));
    
    // Handle removed departments
    const removedDepartments = oldAssignedDepartments.filter(deptId => !newAssignedDepartments.includes(deptId));
    const addedDepartments = newAssignedDepartments.filter(deptId => !oldAssignedDepartments.includes(deptId));
    
    // Get users from removed departments
    if (removedDepartments.length > 0) {
      const departmentUsers = await User.findAll({
        where: {
          departmentId: {
            [Op.in]: removedDepartments
          },
          isActive: true
        },
        attributes: ['id']
      });
      
      departmentUsers.forEach(user => {
        if (!newAssignedUsers.includes(user.id)) {
          removedUsers.push(user.id);
        }
      });
    }
    
    // Notify removed users
    if (removedUsers.length > 0) {
      const notification = await this.handleTaskAssignment(
        task,
        removedUsers,
        [],
        'assignment_removed'
      );
      if (notification) notifications.push(notification);
    }
    
    // Notify added users
    if (addedUsers.length > 0 || addedDepartments.length > 0) {
      const notification = await this.handleTaskAssignment(
        task,
        addedUsers,
        addedDepartments,
        'task_reassigned'
      );
      if (notification) notifications.push(notification);
    }
    
    return notifications;
  } catch (error) {
    logger.error('Error handling task reassignment notification:', error);
    return [];
  }
};

// Get notification history for a task
exports.getTaskNotifications = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const notifications = await TaskAssignmentNotification.findAndCountAll({
      where: { taskId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      success: true,
      data: {
        notifications: notifications.rows,
        total: notifications.count,
        page: parseInt(page),
        totalPages: Math.ceil(notifications.count / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching task notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task notifications'
    });
  }
};

// Cancel pending notifications
exports.cancelPendingNotifications = async (taskId) => {
  try {
    const result = await TaskAssignmentNotification.update(
      { status: 'cancelled' },
      {
        where: {
          taskId,
          status: 'pending'
        }
      }
    );
    
    logger.info(`Cancelled ${result[0]} pending notifications for task ${taskId}`);
    return result[0];
  } catch (error) {
    logger.error('Error cancelling notifications:', error);
    throw error;
  }
};

module.exports = exports;
