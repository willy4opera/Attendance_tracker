import React from 'react';
import type { Activity } from '../types';
import { FaHistory, FaEdit, FaPlus, FaCheck, FaTimes } from 'react-icons/fa';

interface ActivityListProps {
  activities: Activity[];
}

const ActivityList: React.FC<ActivityListProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created': return <FaPlus className="text-green-600" />;
      case 'updated': return <FaEdit className="text-blue-600" />;
      case 'completed': return <FaCheck className="text-green-600" />;
      case 'cancelled': return <FaTimes className="text-red-600" />;
      default: return <FaHistory className="text-gray-600" />;
    }
  };

  const formatActivityMessage = (activity: Activity) => {
    const { details, activityType } = activity;
    
    if (details.field === 'status') {
      return (
        <span>
          Changed status from <span className="font-medium">{details.oldValue}</span> to{' '}
          <span className="font-medium">{details.newValue}</span>
        </span>
      );
    }
    
    return details.message || activityType;
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No activities found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Recent Task Activities</h2>
      
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {getActivityIcon(activity.activityType)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="font-medium text-gray-900">
                      {activity.user.firstName} {activity.user.lastName}
                    </span>
                    <span className="mx-2 text-gray-500">•</span>
                    <span className="text-gray-600">
                      {formatActivityMessage(activity)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(activity.createdAt).toLocaleString()}
                  </span>
                </div>
                
                {activity.task && (
                  <div className="mt-1">
                    <span className="text-sm text-gray-500">Task: </span>
                    <span className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                      {activity.task.title}
                    </span>
                  </div>
                )}
                
                {activity.details.field && (
                  <div className="mt-2 bg-gray-50 rounded px-3 py-2 text-sm">
                    <span className="text-gray-600">Field: </span>
                    <span className="font-medium">{activity.details.field}</span>
                    {activity.details.oldValue && activity.details.newValue && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-gray-600">From: </span>
                        <span className="font-medium">{activity.details.oldValue}</span>
                        <span className="mx-2">→</span>
                        <span className="text-gray-600">To: </span>
                        <span className="font-medium">{activity.details.newValue}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {activities.length >= 20 && (
        <div className="text-center pt-4">
          <p className="text-sm text-gray-500">Showing last 20 activities</p>
        </div>
      )}
    </div>
  );
};

export default ActivityList;
