import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaTimes, FaComment, FaHeart, FaUser, FaCheck } from 'react-icons/fa';
import { useNotificationContext } from '../../contexts/NotificationProvider';
import UserAvatar from '../social/UserAvatar';
import type { Notification } from '../../types/notification';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotificationContext();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <FaComment className="text-blue-500" />;
      case 'like':
        return <FaHeart className="text-red-500" />;
      case 'follow':
        return <FaUser className="text-green-500" />;
      case 'dependency_created':
      case 'dependency_updated':
      case 'dependency_resolved':
      case 'dependency_violated':
        return <FaBell className="text-yellow-500" />;
      case 'task_assignment':
        return <FaBell className="text-purple-500" />;
      case 'dependency':
        return <FaBell className="text-orange-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return notificationDate.toLocaleDateString();
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Handle navigation based on notification type
    let navigateTo: string | null = null;
    
    // Check for URL in various locations
    if (notification.url) {
      navigateTo = notification.url;
    } else if (notification.data?.url) {
      navigateTo = notification.data.url;
    } else if (notification.data?.taskId) {
      navigateTo = `/tasks/${notification.data.taskId}`;
    } else if (notification.taskId) {
      navigateTo = `/tasks/${notification.taskId}`;
    }
    
    // Navigate and close the notification center
    if (navigateTo) {
      navigate(navigateTo);
      onClose();
    }
    } catch (error) {
      console.error('Error in notification click handler:', error);
      // Continue with navigation even if marking as read fails
      
      // Extract navigation URL again in case of error
      let navigateTo: string | null = null;
      if (notification.url) {
        navigateTo = notification.url;
      } else if (notification.data?.url) {
        navigateTo = notification.data.url;
      } else if (notification.data?.taskId) {
        navigateTo = `/tasks/${notification.data.taskId}`;
      } else if (notification.taskId) {
        navigateTo = `/tasks/${notification.taskId}`;
      }
      
      if (navigateTo) {
        navigate(navigateTo);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-16 px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Notification Panel */}
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl z-10 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                ({unreadCount} unread)
              </span>
            )}
          </h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.notificationType || notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.content?.subject || 'Notification'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.content?.body || 'No content'}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="flex-shrink-0 ml-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
