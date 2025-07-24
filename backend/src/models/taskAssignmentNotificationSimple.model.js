const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { sendEmail } = require('../utils/email');
const { renderTaskAssignmentNotification } = require('../utils/renderTaskAssignmentEmail');
const { emitToUser } = require('../utils/socketEmitter');
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
  timestamps: true
});

// Simple notification creation
TaskAssignmentNotification.createSimpleNotification = async function(taskId, assignedUserIds, type = 'task_assigned') {
  try {
    // Get task details
    const Task = require('./task.model');
    const User = require('./user.model');
    
    const task = await Task.findByPk(taskId, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { 
          model: require('./taskList.model'), 
          as: 'list',
          include: [{ 
            model: require('./board.model'), 
            as: 'board',
            include: [{ model: require('./project.model'), as: 'project' }]
          }]
        }
      ]
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Get recipient users
    const recipients = [];
    for (const userId of assignedUserIds) {
      const user = await User.findByPk(userId, {
        attributes: ['id', 'email', 'firstName', 'lastName']
      });
      
      if (user && user.id !== task.createdBy) {
        recipients.push({
          id: user.id,
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
        });
      }
    }

    if (recipients.length === 0) {
      logger.info('No recipients for notification (excluding task creator)');
      return null;
    }

    // Create notification content
    const content = {
      taskId: task.id,
      taskTitle: task.title,
      taskDescription: task.description,
      projectName: task.list?.board?.project?.name || 'Unknown Project',
      boardName: task.list?.board?.name || 'Unknown Board',
      creatorName: `${task.creator?.firstName || ''} ${task.creator?.lastName || ''}`.trim(),
      priority: task.priority,
      type: type,
      title: 'New Task Assignment',
      message: `You have been assigned to task "${task.title}"`,
      taskUrl: `/tasks/${task.id}`,
      boardUrl: task.list?.board?.id ? `/boards/${task.list.board.id}` : null
    };

    // Create the notification
    const notification = await this.create({
      taskId: taskId,
      notificationType: type,
      priority: task.priority === 'urgent' ? 'high' : 'normal',
      recipients: recipients,
      channels: ['inApp', 'email'],
      content: content,
      status: 'pending'
    });

    // Process notification
    await notification.processSimple();
    
    return notification;
  } catch (error) {
    logger.error('Error creating task assignment notification:', error);
    throw error;
  }
};

// Simple processing
TaskAssignmentNotification.prototype.processSimple = async function() {
  try {
    // Create in-app notifications
    const Notification = require('./notification.model');
    
    for (const recipient of this.recipients) {
      try {
        const inAppNotif = await Notification.create({
          userId: recipient.id,
          type: 'task_assignment',
          title: this.content.title,
          message: this.content.message,
          data: {
            ...this.content,
            url: this.content.taskUrl
          },
          url: this.content.taskUrl,
          read: false
        });
        
        // Emit socket event to user for real-time notification
        console.log('Emitting task assignment notification to user:', recipient.id);
        console.log('Notification data:', {
          notification: inAppNotif.toJSON(),
          type: 'task_assignment'
        });
        
        emitToUser(recipient.id, 'dependency:notification', {
          notification: {
            id: inAppNotif.id,
            type: 'task_assignment',
            content: {
              subject: this.content.title,
              body: this.content.message,
              data: this.content
            },
            url: this.content.taskUrl,
            taskId: this.content.taskId,
            createdAt: inAppNotif.createdAt,
            isRead: false
          }
        });
        
        // Send email with rendered template
        const emailHtml = renderTaskAssignmentNotification({
          recipientName: recipient.name,
          taskId: this.content.taskId,
          ...this.content
        });
        
        await sendEmail({
          to: recipient.email,
          subject: `${this.content.title} - ${this.content.projectName}`,
          html: emailHtml
        });
        
      } catch (error) {
        logger.error(`Failed to notify user ${recipient.id}:`, error);
      }
    }
    
    this.status = 'sent';
    this.sentAt = new Date();
    await this.save();
    
  } catch (error) {
    logger.error('Error processing notification:', error);
    this.status = 'failed';
    this.error = error.message;
    await this.save();
  }
};

module.exports = TaskAssignmentNotification;
