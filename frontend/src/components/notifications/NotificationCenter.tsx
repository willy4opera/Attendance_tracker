import React from 'react';
import { FaBell, FaTimes, FaComment, FaHeart, FaUser, FaCheck } from 'react-icons/fa';
import { useNotifications, useUnreadCount } from '../../hooks/useNotifications';
import UserAvatar from '../social/UserAvatar';
import type { Notification } from '../../types/notification';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({ refetchInterval: 60000 }); // Refresh every minute

  const unreadCountQuery = useUnreadCount();
  const unreadCount = unreadCountQuery.data?.data?.count || 0;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <FaComment className="h-4 w-4 text-blue-500" />;
      case 'mention':
        return <FaUser className="h-4 w-4 text-purple-500" />;
      case 'like':
        return <FaHeart className="h-4 w-4 text-red-500" />;
      case 'task_assigned':
        return <FaCheck className="h-4 w-4 text-green-500" />;
      default:
        return <FaBell className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Navigate to relevant page based on notification data
    const { data } = notification;
    if (data.taskId) {
      // Navigate to task
      window.location.href = `/tasks/${data.taskId}`;
    } else if (data.boardId) {
      // Navigate to board
      window.location.href = `/boards/${data.boardId}`;
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={onClose}
        />
      )}

      {/* Notification Panel */}
      <div
        className={`fixed top-0 right-0 w-full md:w-96 h-full bg-white shadow-xl z-50 transition-transform transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Notifications
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="border-b p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => markAllAsRead()}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Mark all as read
            </button>
            <span className="text-sm text-gray-600">
              {unreadCount} unread
            </span>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FaBell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    {/* Notification Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>

                      {/* User Avatar for mentions */}
                      {notification.data.mentionedBy && (
                        <div className="flex items-center space-x-2 mt-2">
                          <UserAvatar 
                            user={notification.data.mentionedBy}
                            size="sm"
                          />
                          <span className="text-xs text-gray-500">
                            {notification.data.mentionedBy.firstName} {notification.data.mentionedBy.lastName}
                          </span>
                        </div>
                      )}

                      {/* Task/Board Context */}
                      {notification.data.task && (
                        <div className="mt-2 text-xs text-gray-500">
                          Task: <span className="font-medium">{notification.data.task.title}</span>
                        </div>
                      )}

                      {notification.data.board && (
                        <div className="mt-2 text-xs text-gray-500">
                          Board: <span className="font-medium">{notification.data.board.name}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationCenter;
