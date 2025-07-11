import React from 'react';
import { FaComment } from 'react-icons/fa';
import CommentList from '../comments/CommentList';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';

interface TaskCommentsProps {
  taskId: number;
  isOpen: boolean;
  onToggle: () => void;
  commentCount?: number;
}

const TaskComments: React.FC<TaskCommentsProps> = ({
  taskId,
  isOpen,
  onToggle,
  commentCount = 0,
}) => {
  // Enable real-time updates for this task
  useRealTimeUpdates({ taskId, enabled: isOpen });

  return (
    <div className="border-t border-gray-200 pt-4">
      {/* Comments Header */}
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full sm:w-auto space-x-2 text-gray-700 hover:text-gray-900 mb-4 p-2 sm:p-0 hover:bg-gray-50 sm:hover:bg-transparent rounded-lg sm:rounded-none"
      >
        <div className="flex items-center space-x-2">
          <FaComment className="h-4 w-4" />
          <span className="font-medium text-sm sm:text-base">
            Comments ({commentCount})
          </span>
        </div>
        <span className="text-gray-500 text-lg sm:text-base">
          {isOpen ? '▼' : '▶'}
        </span>
      </button>

      {/* Comments List */}
      {isOpen && (
        <div className="mt-4">
          <CommentList taskId={taskId} />
        </div>
      )}
    </div>
  );
};

export default TaskComments;
