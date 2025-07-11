import React from 'react';
import { FaHistory } from 'react-icons/fa';
import ActivityFeed from '../activities/ActivityFeed';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';

interface TaskActivityFeedProps {
  taskId: number;
  boardId: number;
  isOpen: boolean;
  onToggle: () => void;
}

const TaskActivityFeed: React.FC<TaskActivityFeedProps> = ({
  taskId,
  boardId,
  isOpen,
  onToggle,
}) => {
  // Enable real-time updates for this task
  useRealTimeUpdates({ taskId, boardId, enabled: isOpen });

  return (
    <div className="border-t border-gray-200 pt-4">
      {/* Activity Header */}
      <button
        onClick={onToggle}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 mb-4"
      >
        <FaHistory className="h-4 w-4" />
        <span className="font-medium">Activity</span>
        <span className="text-gray-500">
          {isOpen ? '▼' : '▶'}
        </span>
      </button>

      {/* Activity Feed */}
      {isOpen && (
        <div className="mt-4">
          <ActivityFeed boardId={boardId} />
        </div>
      )}
    </div>
  );
};

export default TaskActivityFeed;
