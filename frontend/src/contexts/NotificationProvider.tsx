import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
import { useAuth } from './useAuth';
import notificationService from '../services/notificationService';
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
  const [unreadCount, setUnreadCount] = useState(0);
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
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    if (!user?.id) return;
    
    try {
      const response = await notificationService.getUserNotifications(user.id, {
        limit: 50,
        page: 1,
      });
      setNotifications(response.data.data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadUnreadCount = async () => {
    if (!user?.id) return;
    
    try {
      const response = await notificationService.getUnreadCount(user.id);
      setUnreadCount(response.data.count);
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
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Notify other clients via WebSocket
      sendMessage({
        type: 'notification_read',
        notificationId,
        userId: user?.id,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    
    try {
      await notificationService.markAllAsRead(user.id);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      
      setUnreadCount(0);
      
      // Notify other clients via WebSocket
      sendMessage({
        type: 'notifications_read_all',
        userId: user.id,
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }

    // Show browser notification
    showNotification(notification.title, notification.message, {
      tag: `notification-${notification.id}`,
      data: notification.data,
    });
  };

  // Listen for real-time notification events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
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
              setUnreadCount(prev => Math.max(0, prev - 1));
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
