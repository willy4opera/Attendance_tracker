const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');

const DependencyNotification = sequelize.define('DependencyNotification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dependencyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'dependency_id',
    references: {
      model: 'task_dependencies',
      key: 'id'
    }
  },
  notificationType: {
    type: DataTypes.ENUM(
      'dependency_created',
      'dependency_updated',
      'dependency_removed',
      'dependency_violation',
      'dependency_warning',
      'dependency_resolved',
      'predecessor_started',
      'predecessor_completed',
      'successor_blocked',
      'successor_unblocked',
      'dependency_deadline_approaching',
      'critical_path_change'
    ),
    allowNull: false,
    field: 'notification_type'
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'critical'),
    defaultValue: 'normal'
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'delivered', 'failed', 'cancelled'),
    defaultValue: 'pending'
  },
  scheduledAt: {
    type: DataTypes.DATE,
    field: 'scheduled_at'
  },
  sentAt: {
    type: DataTypes.DATE,
    field: 'sent_at'
  },
  content: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Notification content including subject, body, and data'
  },
  recipients: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of recipient objects with userId, role, and channels'
  },
  channels: {
    type: DataTypes.JSONB,
    defaultValue: ['inApp'],
    comment: 'Array of notification channels: email, inApp, push'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional metadata including retry count, failure reason, etc.'
  }
}, {
  tableName: 'dependency_notifications',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['dependency_id']
    },
    {
      fields: ['notification_type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['scheduled_at']
    },
    {
      fields: ['priority', 'status']
    }
  ]
});

// Instance methods
DependencyNotification.prototype.markAsSent = async function() {
  this.status = 'sent';
  this.sentAt = new Date();
  return await this.save();
};

DependencyNotification.prototype.markAsDelivered = async function() {
  this.status = 'delivered';
  return await this.save();
};

DependencyNotification.prototype.markAsFailed = async function(reason) {
  this.status = 'failed';
  this.metadata = {
    ...this.metadata,
    failureReason: reason,
    failedAt: new Date()
  };
  return await this.save();
};

DependencyNotification.prototype.retry = async function() {
  const retryCount = this.metadata.retryCount || 0;
  this.metadata = {
    ...this.metadata,
    retryCount: retryCount + 1,
    lastRetryAt: new Date()
  };
  this.status = 'pending';
  return await this.save();
};

// Class methods
DependencyNotification.createNotification = async function(data) {
  const {
    dependency,
    type,
    recipients,
    channels = ['inApp'],
    priority = 'normal',
    scheduledAt = null,
    content = {}
  } = data;
  
  // Build notification content
  const notificationContent = await this.buildContent(dependency, type, content);
  
  // Get recipients with their preferences
  const recipientsWithPrefs = await this.getRecipientsWithPreferences(recipients, dependency);
  
  return await this.create({
    dependencyId: dependency.id,
    notificationType: type,
    priority,
    scheduledAt,
    content: notificationContent,
    recipients: recipientsWithPrefs,
    channels
  });
};

DependencyNotification.buildContent = async function(dependency, type, customContent = {}) {
  const Task = sequelize.models.Task;
  
  // Get tasks information
  const [predecessorTask, successorTask] = await Promise.all([
    Task.findByPk(dependency.predecessorTaskId),
    Task.findByPk(dependency.successorTaskId)
  ]);
  
  const templates = {
    dependency_created: {
      subject: 'New Task Dependency Created',
      body: `A new ${dependency.dependencyType} dependency has been created between "${predecessorTask.title}" and "${successorTask.title}".`
    },
    dependency_violation: {
      subject: 'Task Dependency Violation',
      body: `The dependency between "${predecessorTask.title}" and "${successorTask.title}" has been violated.`
    },
    predecessor_completed: {
      subject: 'Predecessor Task Completed',
      body: `Task "${predecessorTask.title}" has been completed. You can now proceed with "${successorTask.title}".`
    },
    dependency_deadline_approaching: {
      subject: 'Dependency Deadline Warning',
      body: `The deadline for task "${predecessorTask.title}" is approaching, which may affect "${successorTask.title}".`
    }
    // Add more templates as needed
  };
  
  const template = templates[type] || { subject: 'Task Dependency Update', body: 'A task dependency has been updated.' };
  
  return {
    subject: customContent.subject || template.subject,
    body: customContent.body || template.body,
    data: {
      dependency: {
        id: dependency.id,
        type: dependency.dependencyType,
        lagTime: dependency.lagTime
      },
      predecessorTask: {
        id: predecessorTask.id,
        title: predecessorTask.title,
        status: predecessorTask.status
      },
      successorTask: {
        id: successorTask.id,
        title: successorTask.title,
        status: successorTask.status
      },
      ...customContent.data
    }
  };
};

DependencyNotification.getRecipientsWithPreferences = async function(recipientIds, dependency) {
  const User = sequelize.models.User;
  const DependencyNotificationPreference = sequelize.models.DependencyNotificationPreference;
  const Task = sequelize.models.Task;
  const TaskList = sequelize.models.TaskList;
  const Board = sequelize.models.Board;
  
  // Get task with full hierarchy to find project
  const successorTask = await Task.findByPk(dependency.successorTaskId, {
    include: [{
      model: TaskList,
      as: 'list',
      include: [{
        model: Board,
        as: 'board',
        attributes: ['id', 'projectId']
      }]
    }]
  });
  
  const projectId = successorTask?.list?.board?.projectId;
  const recipients = [];
  
  for (const userId of recipientIds) {
    const user = await User.findByPk(userId);
    if (!user) continue;
    
    // Get user preferences - try project-specific first, then global
    let preferences = null;
    
    if (projectId) {
      preferences = await DependencyNotificationPreference.findOne({
        where: {
          userId: userId,
          projectId: projectId
        }
      });
    }
    
    if (!preferences) {
      preferences = await DependencyNotificationPreference.findOne({
        where: {
          userId: userId,
          projectId: null
        }
      });
    }
    
    recipients.push({
      userId: user.id,
      email: user.email,
      name: user.firstName + ' ' + user.lastName,
      preferences: preferences ? preferences.toJSON() : this.getDefaultPreferences()
    });
  }
  
  return recipients;
};

DependencyNotification.getDefaultPreferences = function() {
  return {
    enabled: true,
    channels: {
      email: true,
      inApp: true,
      push: false
    },
    events: {
      created: true,
      updated: true,
      violated: true,
      resolved: true,
      deadlineWarning: true,
      criticalPath: true
    },
    frequency: {
      immediate: true,
      daily: false,
      weekly: false
    },
    thresholds: {
      warningDays: 3,
      criticalHours: 24
    }
  };
};

DependencyNotification.getPendingNotifications = async function(limit = 100) {
  return await this.findAll({
    where: {
      status: 'pending',
      [Op.or]: [
        { scheduledAt: null },
        { scheduledAt: { [Op.lte]: new Date() } }
      ]
    },
    order: [
      ['priority', 'DESC'],
      ['created_at', 'ASC']
    ],
    limit
  });
};

module.exports = DependencyNotification;
