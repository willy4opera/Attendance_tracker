import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
import { useAuth } from './useAuth';
import notificationService from '../services/notificationService';
import api from '../services/api';
import socketService from '../services/socket.service';
import type { Notification } from '../types/notification';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  showNotification: (title: string, message: string, options?: NotificationOptions) => void;
  markAsRead: (notificationId: number) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Notification) => void;
  isNotificationCenterOpen: boolean;
  setIsNotificationCenterOpen: (open: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  // Enable real-time updates for notifications
  const { sendMessage } = useRealTimeUpdates({
    userId: user?.id,
    enabled: !!user?.id,
  });

  // Initialize notifications
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      loadUnreadCount();
      
      // Connect to socket
      socketService.connect();
      
      // Listen for notifications
      const handleNotification = (data: any) => {
        console.log('Socket notification received:', data);
        
        // Handle dependency notifications
        if (data.event === 'dependency:notification' && data.data) {
          const notification = data.data.notification;
          if (notification) {
            console.log("Adding notification to state:", notification);
            // Ensure notification has isRead property
            const notificationWithReadStatus = { ...notification, isRead: false };
            addNotification(notificationWithReadStatus);
            showNotification(
              notification.content?.subject || 'New Dependency Update',
              notification.content?.body || 'You have a new dependency notification'
            );
          }
        }
      };
      
      socketService.on('notification', handleNotification);
      
      // Cleanup
      return () => {
        socketService.off('notification', handleNotification);
      };
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    if (!user?.id) return;
    
    try {
      const response = await notificationService.getUserNotifications(user.id, {
        limit: 50,
        page: 1,
      });
      // Map API response to match frontend expectations
      const mappedNotifications = (response.data.notifications || []).map(notification => ({
        ...notification,
        isRead: notification.read || false,
        content: {
          subject: notification.title,
          body: notification.message,
          data: notification.data
        },
        notificationType: notification.type,
        // Handle different URL formats
        url: notification.url || notification.data?.url || notification.data?.taskUrl || 
             (notification.data?.taskId ? `/tasks/${notification.data.taskId}` : null)
      }));
      
      setNotifications(mappedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadUnreadCount = async () => {
    if (!user?.id) return;
    
    try {
      const response = await notificationService.getUnreadCount(user.id);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const showNotification = (title: string, message: string, options?: NotificationOptions) => {
    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      notificationService.showBrowserNotification(title, {
        body: message,
        icon: '/favicon.ico',
        ...options,
      });
    }

    // Show toast notification
    // You can integrate with your existing toast system here
    console.log('Notification:', { title, message });
  };

  const markAsRead = async (notificationId: number) => {
    try {
      // Check if this is a dependency notification
      const notification = notifications.find(n => n.id === notificationId);
      // Always use the regular notification endpoint
      await notificationService.markAsRead(notificationId.toString());
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, (prev || 0) - 1));
      
      // Send real-time update
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      
      // Still update the UI even if backend fails
      // This provides better UX - the notification appears read to the user
      setNotifications(prev => 
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, (prev || 0) - 1));
      
      // Optional: Show a subtle error message without disrupting UX
      if (error.response?.status === 500) {
        console.warn('Server error when marking notification as read. The notification will appear read locally.');
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      
      // Send real-time update
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const addNotification = (notification: Notification) => {
    console.log("addNotification called with:", notification);
    console.log("Current notifications before add:", notifications);
    setNotifications(prev => [notification, ...(Array.isArray(prev) ? prev : [])]);
    if (!notification.isRead) {
      console.log("Updating unread count. Current:", unreadCount);
      setUnreadCount(prev => (prev || 0) + 1);
    console.log("New unread count set to:", unreadCount + 1);
    console.log("New notifications array:", notifications);
    }
  };

  // Listen for real-time updates
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        // Check if data is already an object or needs parsing
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // Skip OAuth callback messages - they're handled by useSocialLogin
        if (data.type === 'oauth-callback') {
          return;
        }
        
        switch (data.type) {
          case 'notification_new':
            if (data.userId === user?.id) {
              addNotification(data.notification);
            }
            break;
            
          case 'notification_read':
            if (data.userId === user?.id) {
              setNotifications(prev => 
                prev.map(notification =>
                  notification.id === data.notificationId
                    ? { ...notification, isRead: true }
                    : notification
                )
              );
              setUnreadCount(prev => Math.max(0, (prev || 0) - 1));
            }
            break;
            
          case 'notifications_read_all':
            if (data.userId === user?.id) {
              setNotifications(prev => 
                prev.map(notification => ({ ...notification, isRead: true }))
              );
              setUnreadCount(0);
            }
            break;
        }
      } catch (error) {
        console.error('Error handling notification message:', error);
      }
    };

    // This would typically be connected to your WebSocket implementation
    // For now, we'll just set up the handler
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [user?.id]);

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    showNotification,
    markAsRead,
    markAllAsRead,
    addNotification,
    isNotificationCenterOpen,
    setIsNotificationCenterOpen,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
