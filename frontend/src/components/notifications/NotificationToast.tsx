import React, { useEffect, useState } from 'react';
import { FaTimes, FaCheck, FaExclamation, FaInfo, FaHeart, FaComment, FaUser } from 'react-icons/fa';
import UserAvatar from '../social/UserAvatar';
import type { Notification } from '../../types/notification';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  onMarkAsRead: () => void;
  autoClose?: boolean;
  duration?: number;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onMarkAsRead,
  autoClose = true,
  duration = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (autoClose) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 100));
          if (newProgress <= 0) {
            setIsVisible(false);
            setTimeout(onClose, 300); // Allow animation to complete
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [autoClose, duration, onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'comment':
        return <FaComment className="h-5 w-5 text-blue-500" />;
      case 'mention':
        return <FaUser className="h-5 w-5 text-purple-500" />;
      case 'like':
        return <FaHeart className="h-5 w-5 text-red-500" />;
      case 'task_assigned':
        return <FaCheck className="h-5 w-5 text-green-500" />;
      case 'task_updated':
        return <FaInfo className="h-5 w-5 text-blue-500" />;
      default:
        return <FaInfo className="h-5 w-5 text-gray-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'comment':
        return 'bg-blue-50 border-blue-200';
      case 'mention':
        return 'bg-purple-50 border-purple-200';
      case 'like':
        return 'bg-red-50 border-red-200';
      case 'task_assigned':
        return 'bg-green-50 border-green-200';
      case 'task_updated':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead();
    }
    
    // Navigate to relevant page
    const { data } = notification;
    if (data.taskId) {
      window.location.href = `/tasks/${data.taskId}`;
    } else if (data.boardId) {
      window.location.href = `/boards/${data.boardId}`;
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div
        className={`max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 ${getBackgroundColor()} cursor-pointer`}
        onClick={handleClick}
      >
        {/* Progress bar */}
        {autoClose && (
          <div className="h-1 bg-gray-200 rounded-t-lg overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-1">
              {getIcon()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {notification.title}
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {notification.message}
              </p>

              {/* User info for mentions */}
              {notification.data.mentionedBy && (
                <div className="flex items-center space-x-2 mt-2">
                  <UserAvatar 
                    user={notification.data.mentionedBy}
                    size="sm"
                  />
                  <span className="text-xs text-gray-500">
                    by {notification.data.mentionedBy.firstName} {notification.data.mentionedBy.lastName}
                  </span>
                </div>
              )}

              {/* Task/Board context */}
              {notification.data.task && (
                <div className="mt-2 text-xs text-gray-500">
                  in <span className="font-medium">{notification.data.task.title}</span>
                </div>
              )}

              {notification.data.board && (
                <div className="mt-2 text-xs text-gray-500">
                  in <span className="font-medium">{notification.data.board.name}</span>
                </div>
              )}

              {/* Time */}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {new Date(notification.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
