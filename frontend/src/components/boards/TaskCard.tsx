import React from 'react';
import type { Task } from '../../types';
import UserAvatar from '../social/UserAvatar';
import { format } from 'date-fns';
import { CalendarIcon, ClockIcon, FlagIcon } from '@heroicons/react/24/outline';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  isDragging = false,
  onEdit, 
  onDelete 
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-green-500 bg-green-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(task);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(task.id.toString());
  };

  return (
    <div
      className={clsx(
        'p-4 rounded-lg border-l-4 shadow-sm hover:shadow-md transition-all duration-200',
        getPriorityColor(task.priority),
        isDragging && 'opacity-50 cursor-grabbing',
        !isDragging && 'cursor-grab hover:cursor-grab'
      )}
    >
      {/* Header with title and actions */}
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-medium text-gray-900 flex-1 pr-2">
          {task.title}
        </h4>
        <div className="flex gap-1">
          <button
            onClick={handleEdit}
            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
            title="Edit task"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-gray-500 hover:text-red-600 transition-colors"
            title="Delete task"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Priority Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(task.priority)}`}>
          <FlagIcon className="h-3 w-3 mr-1" />
          {task.priority}
        </span>
      </div>

      {/* Task Meta Information */}
      <div className="space-y-2 text-xs text-gray-500">
        {/* Due Date */}
        {task.dueDate && (
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
          </div>
        )}

        {/* Created Date */}
        <div className="flex items-center gap-1">
          <ClockIcon className="h-3.5 w-3.5" />
          <span>Created: {format(new Date(task.createdAt), 'MMM d')}</span>
        </div>
      </div>

      {/* Assigned User */}
      {task.assignedTo && task.assignedTo.length > 0 && task.creator && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <UserAvatar 
              user={{
                id: task.creator.id,
                name: `${task.creator.firstName} ${task.creator.lastName}`,
                email: task.creator.email,
                avatar: task.creator.profilePicture
              }} 
              size="sm"
              showTooltip
            />
            <span className="text-xs text-gray-600">
              {task.creator.firstName} {task.creator.lastName}
            </span>
          </div>
        </div>
      )}

      {/* Task Stats */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {task.commentCount > 0 && (
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {task.commentCount}
            </span>
          )}
          {task.attachmentCount > 0 && (
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {task.attachmentCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};


export default TaskCard;
