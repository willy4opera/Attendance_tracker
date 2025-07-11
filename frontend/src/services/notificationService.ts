import api from './api';
import type { ApiResponse, PaginatedResponse } from '../types';
import type { Notification, NotificationSettings, NotificationPreferences } from '../types/notification';

export interface NotificationFilters {
  page?: number;
  limit?: number;
  type?: string;
  isRead?: boolean;
}

export interface CreateNotificationData {
  userId: number;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder' | 'announcement';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

class NotificationService {
  // Get user notifications
  async getUserNotifications(
    userId: number,
    filters: NotificationFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    const response = await api.get(`/notifications/user/${userId}`, {
      params: filters,
    });
    return response.data;
  }

  // Get unread notification count
  async getUnreadCount(userId: number): Promise<ApiResponse<{ unreadCount: number }>> {
    const response = await api.get(`/notifications/user/${userId}/unread-count`);
    return response.data;
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<ApiResponse<void>> {
    const response = await api.post(`/notifications/${notificationId}/read`);
    return response.data;
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<ApiResponse<void>> {
    const response = await api.post('/notifications/mark-all-read');
    return response.data;
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  }

  // Create notification (usually called by system, admin only)
  async createNotification(data: CreateNotificationData): Promise<ApiResponse<Notification>> {
    const response = await api.post('/notifications', data);
    return response.data;
  }

  // Get notification settings (mock implementation)
  async getNotificationSettings(userId: number): Promise<ApiResponse<NotificationSettings>> {
    // Mock implementation - in real app, this would be an API call
    return {
      status: 'success',
      data: {
        userId,
        preferences: {
          email: true,
          push: true,
          inApp: true,
          sound: true,
          types: {
            comments: true,
            mentions: true,
            likes: true,
            tasks: true,
            reminders: true,
            announcements: true,
          },
        },
      },
    };
  }

  // Update notification settings (mock implementation)
  async updateNotificationSettings(
    userId: number,
    preferences: Partial<NotificationPreferences>
  ): Promise<ApiResponse<NotificationSettings>> {
    // Mock implementation - in real app, this would be an API call
    return {
      status: 'success',
      data: {
        userId,
        preferences: {
          email: true,
          push: true,
          inApp: true,
          sound: true,
          types: {
            comments: true,
            mentions: true,
            likes: true,
            tasks: true,
            reminders: true,
            announcements: true,
          },
          ...preferences,
        },
      },
    };
  }

  // Request permission for push notifications
  async requestPushPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support push notifications');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Show browser notification
  showBrowserNotification(title: string, options: NotificationOptions = {}) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    }
  }

  // Subscribe to push notifications (mock implementation)
  async subscribeToPush(userId: number): Promise<ApiResponse<void>> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications not supported');
    }

    // Mock implementation - in real app, this would register with push service
    return {
      status: 'success',
      data: undefined,
    };
  }
}

export default new NotificationService();
