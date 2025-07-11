import React from 'react';
import { FaBell, FaEnvelope, FaMobile, FaCheck, FaTimes } from 'react-icons/fa';
import { useNotificationSettings, useNotificationPermission } from '../../hooks/useNotifications';
import type { NotificationPreferences } from '../../types/notification';

interface NotificationSettingsProps {
  onClose?: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const { settings, isLoading, updateSettings } = useNotificationSettings();
  const { permission, requestPermission } = useNotificationPermission();

  const handleToggleSetting = (key: keyof NotificationPreferences) => {
    if (settings?.preferences) {
      updateSettings({
        ...settings.preferences,
        [key]: !settings.preferences[key],
      });
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      updateSettings({
        ...settings?.preferences,
        push: true,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading notification settings...</p>
      </div>
    );
  }

  const preferences = settings?.preferences || {};

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Notification Settings
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Settings */}
      <div className="p-6 space-y-6">
        {/* Notification Channels */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Notification Channels
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FaBell className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-700">In-App Notifications</span>
              </div>
              <button
                onClick={() => handleToggleSetting('inApp')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.inApp ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.inApp ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FaEnvelope className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">Email Notifications</span>
              </div>
              <button
                onClick={() => handleToggleSetting('email')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.email ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.email ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FaMobile className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-gray-700">Push Notifications</span>
              </div>
              <div className="flex items-center space-x-2">
                {permission === 'granted' ? (
                  <button
                    onClick={() => handleToggleSetting('push')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.push ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.push ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                ) : (
                  <button
                    onClick={handleRequestPermission}
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700"
                  >
                    Enable
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Notification Types
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Mentions</span>
              <button
                onClick={() => handleToggleSetting('mentions')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.mentions ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.mentions ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Comments</span>
              <button
                onClick={() => handleToggleSetting('comments')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.comments ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.comments ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Likes</span>
              <button
                onClick={() => handleToggleSetting('likes')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.likes ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.likes ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Task Assignments</span>
              <button
                onClick={() => handleToggleSetting('taskAssignments')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.taskAssignments ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.taskAssignments ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Task Updates</span>
              <button
                onClick={() => handleToggleSetting('taskUpdates')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.taskUpdates ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.taskUpdates ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Activity Updates</span>
              <button
                onClick={() => handleToggleSetting('activityUpdates')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.activityUpdates ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.activityUpdates ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
