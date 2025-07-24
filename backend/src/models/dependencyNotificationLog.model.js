const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');

const DependencyNotificationLog = sequelize.define('DependencyNotificationLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  notificationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'notification_id',
    references: {
      model: 'dependency_notifications',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  channel: {
    type: DataTypes.ENUM('email', 'inApp', 'push'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('sent', 'delivered', 'opened', 'clicked', 'failed', 'bounced'),
    allowNull: false
  },
  deliveredAt: {
    type: DataTypes.DATE,
    field: 'delivered_at'
  },
  openedAt: {
    type: DataTypes.DATE,
    field: 'opened_at'
  },
  clickedAt: {
    type: DataTypes.DATE,
    field: 'clicked_at'
  },
  failureReason: {
    type: DataTypes.TEXT,
    field: 'failure_reason'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'dependency_notification_logs',
  timestamps: false,
  underscored: true,
  indexes: [
    {
      fields: ['notification_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['channel']
    },
    {
      fields: ['status']
    }
  ],
  createdAt: 'created_at'
});

// Instance methods
DependencyNotificationLog.prototype.markAsDelivered = async function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return await this.save();
};

DependencyNotificationLog.prototype.markAsOpened = async function() {
  this.status = 'opened';
  this.openedAt = new Date();
  return await this.save();
};

DependencyNotificationLog.prototype.markAsClicked = async function() {
  this.status = 'clicked';
  this.clickedAt = new Date();
  return await this.save();
};

DependencyNotificationLog.prototype.markAsFailed = async function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  return await this.save();
};

// Class methods
DependencyNotificationLog.logDelivery = async function(notificationId, userId, channel, status, metadata = {}) {
  const logData = {
    notificationId,
    userId,
    channel,
    status,
    metadata
  };
  
  if (status === 'delivered') {
    logData.deliveredAt = new Date();
  }
  
  return await this.create(logData);
};

DependencyNotificationLog.getDeliveryStats = async function(notificationId) {
  const logs = await this.findAll({
    where: { notificationId },
    attributes: [
      'channel',
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['channel', 'status']
  });
  
  const stats = {
    total: 0,
    byChannel: {},
    byStatus: {}
  };
  
  logs.forEach(log => {
    const count = parseInt(log.get('count'));
    stats.total += count;
    
    if (!stats.byChannel[log.channel]) {
      stats.byChannel[log.channel] = {};
    }
    stats.byChannel[log.channel][log.status] = count;
    
    if (!stats.byStatus[log.status]) {
      stats.byStatus[log.status] = 0;
    }
    stats.byStatus[log.status] += count;
  });
  
  return stats;
};

DependencyNotificationLog.getUserNotificationHistory = async function(userId, options = {}) {
  const {
    limit = 50,
    offset = 0,
    startDate = null,
    endDate = null,
    channel = null,
    status = null
  } = options;
  
  const where = { userId };
  
  if (startDate) {
    where.createdAt = { [Op.gte]: startDate };
  }
  if (endDate) {
    where.createdAt = { ...where.createdAt, [Op.lte]: endDate };
  }
  if (channel) {
    where.channel = channel;
  }
  if (status) {
    where.status = status;
  }
  
  return await this.findAndCountAll({
    where,
    include: [{
      model: sequelize.models.DependencyNotification,
      as: 'notification',
      include: [{
        model: sequelize.models.TaskDependency,
        as: 'dependency'
      }]
    }],
    order: [['created_at', 'DESC']],
    limit,
    offset
  });
};

module.exports = DependencyNotificationLog;
