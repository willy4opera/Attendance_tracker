const socketManager = require('../config/socket.config');
const { Notification } = require('../models');

class NotificationService {
  constructor() {
    this.socketManager = socketManager;
  }

  // Create and emit notification
  async createNotification(userId, data) {
    try {
      // Store notification in database
      const notification = await Notification.create({
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {},
        read: false
      });

      // Emit via socket if user is online
      if (this.socketManager.isUserOnline(userId)) {
        this.socketManager.sendNotification(userId, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          createdAt: notification.createdAt
        });
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Bulk create notifications
  async createBulkNotifications(userIds, data) {
    const notifications = await Promise.all(
      userIds.map(userId => this.createNotification(userId, data))
    );
    return notifications;
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId }
    });

    if (notification) {
      notification.read = true;
      notification.readAt = new Date();
      await notification.save();

      // Emit read status update
      this.socketManager.emitToUser(userId, 'notification-read', {
        notificationId,
        readAt: notification.readAt
      });
    }

    return notification;
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    await Notification.update(
      { read: true, readAt: new Date() },
      { where: { userId, read: false } }
    );

    // Emit update
    this.socketManager.emitToUser(userId, 'all-notifications-read', {
      timestamp: new Date()
    });
  }

  // Get unread count for user
  async getUnreadCount(userId) {
    const count = await Notification.count({
      where: { userId, read: false }
    });

    // Emit count update
    this.socketManager.emitToUser(userId, 'unread-count', { count });

    return count;
  }

  // System-wide announcements
  async broadcastAnnouncement(data) {
    const announcement = {
      type: 'announcement',
      title: data.title,
      message: data.message,
      priority: data.priority || 'normal',
      timestamp: new Date()
    };

    // Emit to all connected users
    this.socketManager.broadcast('system-announcement', announcement);

    // Store for users who are offline
    // This would typically create notifications for all users
    return announcement;
  }

  // Session-specific notifications
  async notifySessionParticipants(sessionId, data) {
    this.socketManager.emitToSession(sessionId, 'session-notification', {
      sessionId,
      ...data,
      timestamp: new Date()
    });
  }

  // Role-based notifications
  async notifyByRole(role, data) {
    this.socketManager.emitToRole(role, 'role-notification', {
      role,
      ...data,
      timestamp: new Date()
    });
  }
}

module.exports = new NotificationService();
