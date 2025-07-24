const { Op } = require('sequelize');
const {
  DependencyNotification,
  DependencyNotificationPreference,
  DependencyNotificationLog,
  Notification,
  TaskDependency,
  Task,
  User,
  sequelize
} = require('../../models');
const AppError = require('../../utils/AppError');
const catchAsync = require('../../utils/catchAsync');
const logger = require('../../utils/logger');
const { debugLog } = require('../../utils/debugLogger');
const { sendEmail } = require('../../utils/email');
const { renderDependencyNotification } = require('../../utils/renderDependencyEmail');
const { renderCompactDependencyNotification } = require('../../utils/renderCompactDependencyEmail');
const { emitSocketEvent, emitToUser } = require('../../utils/socketEmitter');
const { redisHelpers } = require('../../config/redis');

// Create manual notification
exports.createNotification = catchAsync(async (req, res, next) => {
  const { dependencyId } = req.params;
  const {
    type = 'dependency_updated',
    recipients,
    channels = ['inApp', 'email'],
    priority = 'normal',
    content
  } = req.body;

  const dependency = await TaskDependency.findByPk(dependencyId, {
    include: [
      { model: Task, as: 'predecessorTask' },
      { model: Task, as: 'successorTask' }
    ]
  });

  if (!dependency) {
    return next(new AppError('Dependency not found', 404));
  }

  const notification = await DependencyNotification.createNotification({
    dependency,
    type,
    recipients: recipients || await exports.getUsersToNotify(
      dependency.predecessorTask,
      dependency.successorTask
    ),
    channels,
    priority,
    content
  });

  // Process notification immediately if high priority
  if (priority === 'high' || priority === 'critical') {
    await exports.processNotification(notification);
  }

  res.status(201).json({
    success: true,
    data: notification,
    message: 'Notification created successfully'
  });
});

// Process a single notification
exports.processNotification = async (notification) => {
  debugLog('processNotification called', { 
    notificationId: notification.id,
    channels: notification.channels,
    recipientCount: notification.recipients?.length 
  });
  try {
    await notification.markAsSent();

    for (const recipient of notification.recipients) {
      const user = await User.findByPk(recipient.userId);
      if (!user) continue;

      // Check preferences
      const prefs = recipient.preferences || DependencyNotification.getDefaultPreferences();
      
      for (const channel of notification.channels) {
        if (!prefs.channels[channel]) continue;

        try {
          switch (channel) {
            case 'email':
              debugLog('Processing email notification', {
                userId: user.id,
                userEmail: user.email,
                userName: user.name,
                notificationData: notification.content.data
              });
              // Use compact email template to avoid Gmail trimming
              const html = renderCompactDependencyNotification({
                user: user.name,
                dependency: notification.content.data.dependency,
                predecessorTask: notification.content.data.predecessorTask,
                successorTask: notification.content.data.successorTask,
                actionType: notification.type || "updated",
                notificationId: notification.id,
                dashboardUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard`
              });
              debugLog('Email HTML rendered', { 
                htmlLength: html.length,
                htmlPreview: html.substring(0, 200) 
              });
              debugLog('Sending email', {
                to: user.email,
                subject: notification.content.subject
              });
              await sendEmail({
                to: user.email,
                subject: notification.content.subject,
                html: html
              });
              debugLog('Email sent successfully');
              break;

            case 'inApp':
              // Create entry in main Notification table
              await Notification.create({
                userId: user.id,
                type: 'dependency',
                title: notification.content.title || 'Dependency Notification',
                message: notification.content.text || notification.content.html || 'You have a new dependency notification',
                data: {
                  dependencyId: notification.dependencyId,
                  notificationType: notification.notificationType,
                  dependency: notification.content.data.dependency,
                  dependencyNotificationId: notification.id
                },
                priority: notification.priority || 'normal',
                read: false
              });
              
              // Emit socket event
              emitToUser(user.id, 'dependency:notification', {
                notification: notification.toJSON(),
                dependency: notification.content.data.dependency
              });
              break;
          }

          // Log successful delivery
          await DependencyNotificationLog.logDelivery(
            notification.id,
            user.id,
            channel,
            'delivered'
          );
        } catch (error) {
          logger.error(`Failed to send ${channel} notification:`, error);
          
          // Log failed delivery
          await DependencyNotificationLog.logDelivery(
            notification.id,
            user.id,
            channel,
            'failed',
            { error: error.message }
          );
        }
      }
    }

    await notification.markAsDelivered();
  } catch (error) {
    logger.error('Error processing notification:', error);
    await notification.markAsFailed(error.message);
  }
};

// Get notification history for a dependency
exports.getNotificationHistory = catchAsync(async (req, res, next) => {
  const { dependencyId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  const notifications = await DependencyNotification.findAndCountAll({
    where: { dependencyId },
    include: [{
      model: DependencyNotificationLog,
      as: 'logs',
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }]
    }],
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.status(200).json({
    success: true,
    data: notifications.rows,
    total: notifications.count,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
});

// Update user notification preferences
exports.updatePreferences = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { projectId } = req.params;
  const preferences = req.body;

  const updated = await DependencyNotificationPreference.updatePreferences(
    userId,
    projectId || null,
    preferences
  );

  // Clear cache
  await redisHelpers.del(`notification:prefs:${userId}:${projectId || 'global'}`);

  res.status(200).json({
    success: true,
    data: updated,
    message: 'Notification preferences updated successfully'
  });
});

// Get user notification preferences
exports.getPreferences = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { projectId } = req.query;

  // Check cache
  const cacheKey = `notification:prefs:${userId}:${projectId || 'global'}`;
  const cached = await redisHelpers.get(cacheKey);
  if (cached) {
    return res.status(200).json({
      success: true,
      data: cached,
      fromCache: true
    });
  }

  const preferences = await DependencyNotificationPreference.getOrCreateDefault(
    userId,
    projectId || null
  );

  // Cache for 1 hour
  await redisHelpers.setEx(cacheKey, preferences, 3600);

  res.status(200).json({
    success: true,
    data: preferences
  });
});

// Get notification analytics
exports.getAnalytics = catchAsync(async (req, res, next) => {
  const { startDate, endDate, dependencyId, userId } = req.query;

  const where = {};
  if (startDate && endDate) {
    where.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }
  if (dependencyId) {
    where.dependencyId = dependencyId;
  }

  // Get notification stats
  const notifications = await DependencyNotification.findAll({
    where,
    attributes: [
      'status',
      'notificationType',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['status', 'notificationType']
  });

  // Get delivery stats
  const deliveryStats = await DependencyNotificationLog.findAll({
    where: userId ? { userId } : {},
    attributes: [
      'channel',
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['channel', 'status']
  });

  res.status(200).json({
    success: true,
    data: {
      notifications,
      deliveryStats
    }
  });
});

// Test notification delivery
exports.testNotification = catchAsync(async (req, res, next) => {
  const { dependencyId } = req.params;
  const { type = 'dependency_created', channel = 'email' } = req.body;
  const userId = req.user.id;

  const dependency = await TaskDependency.findByPk(dependencyId, {
    include: [
      { model: Task, as: 'predecessorTask' },
      { model: Task, as: 'successorTask' }
    ]
  });

  if (!dependency) {
    return next(new AppError('Dependency not found', 404));
  }

  // Create test notification
  const notification = await DependencyNotification.createNotification({
    dependency,
    type,
    recipients: [userId],
    channels: [channel],
    priority: 'low',
    content: {
      subject: `[TEST] ${type} notification`,
      body: 'This is a test notification for dependency tracking.'
    }
  });

  // Process immediately
  await exports.processNotification(notification);

  res.status(200).json({
    success: true,
    message: 'Test notification sent successfully',
    notification
  });
});

// Mark notification as read
exports.markAsRead = catchAsync(async (req, res, next) => {
  const { notificationId } = req.params;
  const userId = req.user.id;

  const log = await DependencyNotificationLog.findOne({
    where: {
      notificationId,
      userId,
      channel: 'inApp'
    }
  });

  if (!log) {
    return next(new AppError('Notification not found', 404));
  }

  await log.markAsOpened();

  res.status(200).json({
    success: true,
    message: 'Notification marked as read'
  });
});

// Get user notifications
exports.getUserNotifications = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { 
    limit = 20, 
    offset = 0, 
    unreadOnly = false,
    channel = 'inApp' 
  } = req.query;

  const history = await DependencyNotificationLog.getUserNotificationHistory(userId, {
    limit: parseInt(limit),
    offset: parseInt(offset),
    channel,
    status: unreadOnly ? 'delivered' : null
  });

  res.status(200).json({
    success: true,
    data: history.rows,
    total: history.count,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
});

module.exports = exports;
