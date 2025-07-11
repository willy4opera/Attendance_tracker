import React from 'react';
import { useActivities } from '../../hooks/useActivities';
import ActivityItem from './ActivityItem';
import ActivityFilters from './ActivityFilters';

interface ActivityFeedProps {
  userId?: number;
  boardId?: number;
  className?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  userId, 
  boardId, 
  className = '' 
}) => {
  const [filters, setFilters] = React.useState({
    activityType: '',
    page: 1,
    limit: 20,
  });

  const {
    activities,
    total,
    isLoading,
    error,
    refetch,
  } = useActivities({ 
    userId, 
    boardId, 
    ...filters 
  });

  if (isLoading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-600 p-4 bg-red-50 rounded-lg ${className}`}>
        Error loading activities: {error.message}
        <button 
          onClick={() => refetch()}
          className="ml-2 text-blue-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters */}
      <ActivityFilters 
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Activity List */}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No activities found
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-4">
              {total} activit{total !== 1 ? 'ies' : 'y'}
            </div>
            {activities.map((activity) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
