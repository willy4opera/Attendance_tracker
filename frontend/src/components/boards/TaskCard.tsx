import React, { useState } from 'react';
import { FaComment, FaHeart, FaUser, FaClock } from 'react-icons/fa';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import TaskComments from '../tasks/TaskComments';
import TaskActivityFeed from '../tasks/TaskActivityFeed';
import UserAvatar from '../social/UserAvatar';
import type { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onUpdate?: (taskId: string, data: any) => void;
  onDelete?: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate, onDelete }) => {
  const [showComments, setShowComments] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Enable real-time updates for this task
  useRealTimeUpdates({ 
    taskId: task.id, 
    boardId: task.boardId,
    enabled: isExpanded 
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      {/* Task Header */}
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <h4 
            className="font-medium text-gray-900 cursor-pointer hover:text-blue-600"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {task.title}
          </h4>
          <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
        </div>

        {task.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Task Meta */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          {task.dueDate && (
            <div className="flex items-center space-x-1">
              <FaClock className="h-3 w-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
          
          {task.assignedTo && task.assignedTo.length > 0 && (
            <div className="flex items-center space-x-1">
              <FaUser className="h-3 w-3" />
              <span>{task.assignedTo.length}</span>
            </div>
          )}
        </div>

        {/* Social Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 text-xs"
            >
              <FaComment className="h-3 w-3" />
              <span>{task.commentCount || 0}</span>
            </button>
            
            <div className="flex items-center space-x-1 text-gray-500 text-xs">
              <FaHeart className="h-3 w-3" />
              <span>{task.likeCount || 0}</span>
            </div>
          </div>

          {/* Assigned Users */}
          {task.creator && (
            <UserAvatar user={task.creator} size="sm" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-3 space-y-3">
          {/* Task Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                task.status === 'done' ? 'bg-green-100 text-green-800' :
                task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {task.status}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Priority:</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                task.priority === 'high' ? 'bg-red-100 text-red-800' :
                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {task.priority}
              </span>
            </div>
          </div>

          {/* Comments Section */}
          <TaskComments
            taskId={task.id}
            isOpen={showComments}
            onToggle={() => setShowComments(!showComments)}
            commentCount={task.commentCount}
          />

          {/* Activity Section */}
          <TaskActivityFeed
            taskId={task.id}
            boardId={task.boardId}
            isOpen={showActivity}
            onToggle={() => setShowActivity(!showActivity)}
          />
        </div>
      )}
    </div>
  );
};

export default TaskCard;
