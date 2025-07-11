import React from 'react';
import { FaCheckCircle, FaComment, FaHeart, FaEdit, FaPlus } from 'react-icons/fa';
import type { ActivityResponse } from '../../types';

interface ActivityItemProps {
  activity: ActivityResponse;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const { user, activityType, details, createdAt, task, board } = activity;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <FaPlus className="h-4 w-4 text-green-500" />;
      case 'updated':
        return <FaEdit className="h-4 w-4 text-blue-500" />;
      case 'commented':
        return <FaComment className="h-4 w-4 text-purple-500" />;
      case 'liked':
        return <FaHeart className="h-4 w-4 text-red-500" />;
      default:
        return <FaCheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex items-start space-x-3 bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
      {/* User Avatar */}
      <div className="bg-gray-500 rounded-full h-8 w-8 flex items-center justify-center text-white text-sm font-medium">
        {user.firstName.charAt(0)}
      </div>

      {/* Activity Content */}
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          {getActivityIcon(activityType)}
          <span className="font-medium text-gray-900">
            {user.firstName} {user.lastName}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(createdAt)}
          </span>
        </div>

        <p className="text-gray-800 text-sm mb-2">
          {details.message}
        </p>

        {/* Task/Board Context */}
        {task && (
          <div className="text-xs text-gray-500">
            Task: <span className="font-medium">{task.title}</span>
            {task.list?.board && (
              <span> in {task.list.board.name}</span>
            )}
          </div>
        )}

        {board && !task && (
          <div className="text-xs text-gray-500">
            Board: <span className="font-medium">{board.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityItem;
