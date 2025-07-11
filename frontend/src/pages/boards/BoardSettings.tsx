import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaCog } from 'react-icons/fa';
import NotificationSettings from '../../components/notifications/NotificationSettings';

const BoardSettings: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Link 
          to={`/boards/${id}`}
          className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
        >
          <FaArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Board Settings</h1>
          <p className="text-gray-600">Manage your board preferences and notifications</p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <FaCog className="h-5 w-5" />
              <span>Notification Settings</span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure how you want to be notified about board activities
            </p>
          </div>
          <div className="p-4">
            <NotificationSettings />
          </div>
        </div>

        {/* Board Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Board Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Board ID
              </label>
              <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                {id}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Board URL
              </label>
              <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                {window.location.origin}/boards/{id}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardSettings;
