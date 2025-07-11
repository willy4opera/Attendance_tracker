const { Notification, User } = require('../models');
const { Op } = require('sequelize');
const notificationService = require('../services/notification.service');

class NotificationController {
  // GET /api/v1/notifications/user/:userId
  async getUserNotifications(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 50, page = 1, type, unread } = req.query;
      
      // Check if user is requesting their own notifications or has permission
      if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }

      const offset = (page - 1) * limit;
      const whereClause = { userId };

      // Filter by type if specified
      if (type) {
        whereClause.type = type;
      }

      // Filter by read status if specified
      if (unread === 'true') {
        whereClause.read = false;
      }

      const { count, rows: notifications } = await Notification.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        status: 'success',
        data: {
          notifications,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch notifications'
      });
    }
  }

  // GET /api/v1/notifications/user/:userId/unread-count
  async getUnreadCount(req, res) {
    try {
      const { userId } = req.params;
      
      // Check if user is requesting their own count or has permission
      if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }

      const unreadCount = await Notification.count({
        where: { 
          userId: parseInt(userId), 
          read: false 
        }
      });

      res.json({
        status: 'success',
        data: {
          unreadCount
        }
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch unread count'
      });
    }
  }

  // POST /api/v1/notifications/:notificationId/read
  async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      const notification = await Notification.findOne({
        where: { 
          id: notificationId, 
          userId: userId 
        }
      });

      if (!notification) {
        return res.status(404).json({
          status: 'error',
          message: 'Notification not found'
        });
      }

      if (!notification.read) {
        notification.read = true;
        notification.readAt = new Date();
        await notification.save();

        // Emit real-time update if socket is available
        const io = req.app.get('io');
        if (io) {
          io.to(`user_${userId}`).emit('notification_read', {
            notificationId,
            readAt: notification.readAt
          });
        }
      }

      res.json({
        status: 'success',
        message: 'Notification marked as read',
        data: notification
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to mark notification as read'
      });
    }
  }

  // POST /api/v1/notifications/mark-all-read
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      await Notification.update(
        { 
          read: true, 
          readAt: new Date() 
        },
        { 
          where: { 
            userId: userId, 
            read: false 
          } 
        }
      );

      // Emit real-time update if socket is available
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${userId}`).emit('all_notifications_read', {
          timestamp: new Date()
        });
      }

      res.json({
        status: 'success',
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to mark all notifications as read'
      });
    }
  }

  // POST /api/v1/notifications - Create notification (admin only)
  async createNotification(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }

      const { userId, type, title, message, data, priority } = req.body;

      const notification = await Notification.create({
        userId,
        type: type || 'info',
        title,
        message,
        data: data || {},
        priority: priority || 'normal',
        read: false
      });

      // Emit real-time update if socket is available
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${userId}`).emit('notification_received', {
          notification: {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            priority: notification.priority,
            createdAt: notification.createdAt
          }
        });
      }

      res.status(201).json({
        status: 'success',
        message: 'Notification created successfully',
        data: notification
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create notification'
      });
    }
  }

  // DELETE /api/v1/notifications/:notificationId
  async deleteNotification(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      const notification = await Notification.findOne({
        where: { 
          id: notificationId, 
          userId: userId 
        }
      });

      if (!notification) {
        return res.status(404).json({
          status: 'error',
          message: 'Notification not found'
        });
      }

      await notification.destroy();

      res.json({
        status: 'success',
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete notification'
      });
    }
  }
}

module.exports = new NotificationController();
