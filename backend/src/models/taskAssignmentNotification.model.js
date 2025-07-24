const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./user.model');
const Task = require('./task.model');
const Department = require('./department.model');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');

const TaskAssignmentNotification = sequelize.define('TaskAssignmentNotification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  taskId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Tasks',
      key: 'id'
    }
  },
  notificationType: {
    type: DataTypes.ENUM(
      'task_assigned',
      'task_reassigned',
      'department_assigned',
      'assignment_removed'
    ),
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal'
  },
  recipients: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  channels: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: ['inApp']
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'failed', 'cancelled'),
    defaultValue: 'pending'
  },
  content: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  sentAt: {
    type: DataTypes.DATE
  },
  error: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'task_assignment_notifications',
  timestamps: true,
  
  indexes: [
    {
      fields: ['taskId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['notificationType']
    }
  ]
});

// Static method to create a notification
TaskAssignmentNotification.createNotification = async function(data) {
  const {
    task,
    type,
    recipients,
    channels = ['inApp', 'email'],
    priority = 'normal',
    content = {}
  } = data;
  
  // Build notification content
  const notificationContent = await this.buildContent(task, type, content);
  
  // Get recipients with their preferences
  const recipientsWithPrefs = await this.getRecipientsWithPreferences(recipients, task);
  
  return await this.create({
    taskId: task.id,
    notificationType: type,
    priority,
    recipients: recipientsWithPrefs,
    channels,
    content: notificationContent,
    status: 'pending'
  });
};

// Build notification content based on type
TaskAssignmentNotification.buildContent = async function(task, type, additionalContent = {}) {
  const taskWithDetails = await Task.findByPk(task.id, {
    include: [
      { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: require('./taskList.model'), as: 'list', 
        include: [{ 
          model: require('./board.model'), 
          as: 'board',
          include: [{ model: require('./project.model'), as: 'project' }]
        }]
      }
    ]
  });

  const baseContent = {
    taskId: task.id,
    taskTitle: taskWithDetails.title,
    taskDescription: taskWithDetails.description,
    projectName: taskWithDetails.list?.board?.project?.name || 'Unknown Project',
    boardName: taskWithDetails.list?.board?.name || 'Unknown Board',
    creatorName: `${taskWithDetails.creator?.firstName || ''} ${taskWithDetails.creator?.lastName || ''}`.trim(),
    dueDate: taskWithDetails.dueDate,
    priority: taskWithDetails.priority,
    ...additionalContent
  };

  let title, message;
  
  switch(type) {
    case 'task_assigned':
      title = 'New Task Assignment';
      message = `You have been assigned to task "${baseContent.taskTitle}" in ${baseContent.projectName}`;
      break;
    case 'task_reassigned':
      title = 'Task Reassignment';
      message = `Task "${baseContent.taskTitle}" has been reassigned to you`;
      break;
    case 'department_assigned':
      title = 'Department Task Assignment';
      message = `Your department has been assigned to task "${baseContent.taskTitle}"`;
      break;
    case 'assignment_removed':
      title = 'Task Assignment Removed';
      message = `You have been removed from task "${baseContent.taskTitle}"`;
      break;
    default:
      title = 'Task Assignment Update';
      message = `Task assignment updated for "${baseContent.taskTitle}"`;
  }

  return {
    ...baseContent,
    title,
    message,
    type
  };
};

// Get recipients with their notification preferences
TaskAssignmentNotification.getRecipientsWithPreferences = async function(recipients, task) {
  const recipientsWithPrefs = [];
  
  for (const recipient of recipients) {
    const user = await User.findByPk(recipient.id || recipient, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'preferences']
    });
    
    if (user) {
      recipientsWithPrefs.push({
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        preferences: user.preferences?.notifications || {
          email: true,
          inApp: true
        }
      });
    }
  }
  
  return recipientsWithPrefs;
};

// Process and send the notification
TaskAssignmentNotification.prototype.process = async function() {
  try {
    const results = {
      email: { sent: [], failed: [] },
      inApp: { sent: [], failed: [] }
    };

    for (const recipient of this.recipients) {
      // Send in-app notification
      if (this.channels.includes('inApp') && recipient.preferences?.inApp !== false) {
        try {
          await this.createInAppNotification(recipient);
          results.inApp.sent.push(recipient.id);
        } catch (error) {
          logger.error(`Failed to create in-app notification for user ${recipient.id}:`, error);
          results.inApp.failed.push(recipient.id);
        }
      }

      // Send email notification
      if (this.channels.includes('email') && recipient.preferences?.email !== false) {
        try {
          await this.sendEmailNotification(recipient);
          results.email.sent.push(recipient.id);
        } catch (error) {
          logger.error(`Failed to send email notification to ${recipient.email}:`, error);
          results.email.failed.push(recipient.id);
        }
      }
    }

    // Update notification status
    const hasFailures = results.email.failed.length > 0 || results.inApp.failed.length > 0;
    this.status = hasFailures ? 'failed' : 'sent';
    this.sentAt = new Date();
    this.error = hasFailures ? JSON.stringify(results) : null;
    await this.save();

    return results;
  } catch (error) {
    logger.error('Error processing task assignment notification:', error);
    this.status = 'failed';
    this.error = error.message;
    await this.save();
    throw error;
  }
};

// Create in-app notification
TaskAssignmentNotification.prototype.createInAppNotification = async function(recipient) {
  const Notification = require('./notification.model');
  
  return await Notification.create({
    userId: recipient.id,
    type: 'task_assignment',
    title: this.content.title,
    message: this.content.message,
    data: {
      taskId: this.taskId,
      notificationType: this.notificationType,
      ...this.content
    },
    read: false
  });
};

// Send email notification
TaskAssignmentNotification.prototype.sendEmailNotification = async function(recipient) {
  const emailContent = {
    to: recipient.email,
    subject: `${this.content.title} - ${this.content.projectName}`,
    template: 'task-assignment-notification',
    context: {
      recipientName: recipient.name,
      ...this.content,
      year: new Date().getFullYear()
    }
  };

  return await sendEmail(emailContent);
};

// Associations
TaskAssignmentNotification.associate = function(models) {
  TaskAssignmentNotification.belongsTo(models.Task, {
    foreignKey: 'taskId',
    as: 'task'
  });
};

module.exports = TaskAssignmentNotification;
