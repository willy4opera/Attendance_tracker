import React, { useState } from 'react';
import { FaBell } from 'react-icons/fa';
import { useNotificationContext } from '../../contexts/NotificationProvider'
import { useUnreadCount } from '../../hooks/useNotifications';
import NotificationCenter from './NotificationCenter';

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  try {
    const { unreadCount } = useNotificationContext();
    console.log("NotificationBell unreadCount:", unreadCount);
    
    return (
      <>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-2 text-gray-600 hover:text-gray-900 transition-colors ${className}`}
          title="Notifications"
        >
          <FaBell className="h-5 w-5" />
          
          {/* Unread Count Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Center */}
        <NotificationCenter
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
  } catch (error) {
    console.error("NotificationBell: Error accessing NotificationContext", error);
    // Fallback - show no notifications
    const unreadCount = 0;
    
    
    
    return (
      <>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-2 text-gray-600 hover:text-gray-900 transition-colors ${className}`}
          title="Notifications"
        >
          <FaBell className="h-5 w-5" />
          
          {/* Unread Count Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Center */}
        <NotificationCenter
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
  }
};

export default NotificationBell;
