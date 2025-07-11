import React from 'react';
import { useNotifications, useUnreadCount } from '../../hooks/useNotifications';
import { useAuth } from '../../contexts/useAuth';
import NotificationBell from '../../components/notifications/NotificationBell';

const NotificationTestPage: React.FC = () => {
  const { user } = useAuth();
  const { notifications, isLoading, error, markAsRead, markAllAsRead } = useNotifications();
  const unreadCountQuery = useUnreadCount();
  
  const unreadCount = unreadCountQuery.data?.data?.unreadCount || 0;

  if (!user) {
    return <div className="p-8">Please log in to view notifications</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Notification System Test</h1>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">Notification Bell:</span>
            <NotificationBell />
          </div>
          <div className="text-sm text-gray-600">
            Unread Count: <span className="font-bold text-red-600">{unreadCount}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Your Notifications</h2>
          <button
            onClick={() => markAllAsRead()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Mark All as Read
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading notifications...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h3 className="text-red-800 font-semibold mb-2">Error loading notifications:</h3>
            <p className="text-red-600">{error.message}</p>
          </div>
        )}

        {!isLoading && !error && notifications.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No notifications yet. Create some using the API!</p>
          </div>
        )}

        {!isLoading && !error && notifications.length > 0 && (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  notification.read
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        notification.type === 'error' ? 'bg-red-100 text-red-800' :
                        notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        notification.type === 'success' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {notification.type}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        notification.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        notification.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {notification.priority}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{notification.message}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{new Date(notification.createdAt).toLocaleString()}</span>
                      {notification.readAt && (
                        <span>Read: {new Date(notification.readAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                      >
                        Mark as Read
                      </button>
                    )}
                    <div className={`w-3 h-3 rounded-full ${
                      notification.read ? 'bg-gray-300' : 'bg-blue-500'
                    }`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Test API Endpoints:</h3>
        <div className="text-sm space-y-1">
          <p><strong>Create Notification:</strong> POST /api/v1/notifications</p>
          <p><strong>Get Notifications:</strong> GET /api/v1/notifications/user/{user.id}</p>
          <p><strong>Unread Count:</strong> GET /api/v1/notifications/user/{user.id}/unread-count</p>
          <p><strong>Mark as Read:</strong> POST /api/v1/notifications/{id}/read</p>
          <p><strong>Mark All as Read:</strong> POST /api/v1/notifications/mark-all-read</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationTestPage;
