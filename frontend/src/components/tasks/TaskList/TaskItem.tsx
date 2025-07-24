import { getPriorityColor, getStatusColor, formatStatusDisplay } from './taskUtils';
import React from 'react';
import { Link } from 'react-router-dom';
import {
  AiOutlineCalendar,
  AiOutlineMessage,
  AiOutlineEye,
  AiOutlineTags,
  AiOutlineProject,
  AiOutlineUnorderedList
} from 'react-icons/ai';
import theme from '../../../config/theme';
import type { Task } from '../../../types';

interface TaskItemProps {
  task: Task;
  viewMode: 'list' | 'grid';
  getPriorityIcon: (priority: string) => React.ReactNode;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  viewMode,
  getPriorityIcon,
  getPriorityColor,
  getStatusColor,
}) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  
  return (
    <div
      className={`group shadow-sm border rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md ${
        viewMode === 'grid'
          ? 'p-2.5 sm:p-3 md:p-4'
          : 'p-3 sm:p-4 md:p-5 lg:p-6'
      }`}
      style={{ 
        backgroundColor: `${theme.colors.primary}03`,
        borderColor: `${theme.colors.text.secondary}20`,
      }}
    >
      <div className={`${viewMode === 'grid' ? 'space-y-2 md:space-y-3' : 'space-y-3'}`}>
        {/* Title Row with Priority Icon */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className="flex-shrink-0">
              {getPriorityIcon(task.priority)}
            </div>
            <Link
              to={`/tasks/${task.id}`}
              className="text-sm md:text-base lg:text-lg font-semibold transition-colors truncate hover:opacity-80 block"
              style={{ 
                color: theme.colors.text.primary,
              }}
            >
              {task.title}
            </Link>
          </div>
        </div>
        
        {/* Status and Priority Badges */}
        <div className="flex flex-wrap gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
            {formatStatusDisplay(task.status)}
          </span>
        </div>
        
        {/* Description */}
        {task.description && (
          <p 
            className="text-xs md:text-sm lg:text-base line-clamp-2"
            style={{ color: theme.colors.text.secondary }}
          >
            {task.description}
          </p>
        )}
        
        {/* Meta Information */}
        <div className="flex flex-wrap gap-2 text-xs md:text-sm"
          style={{ color: theme.colors.text.secondary }}
        >
          {/* Board Info */}
          {task.list?.board && (
            <div className="flex items-center space-x-1">
              <AiOutlineProject className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              <Link
                to={`/boards/${task.list.board.id}`}
                className="font-medium transition-colors hover:opacity-80"
                style={{ color: theme.colors.info }}
              >
                {task.list.board.name}
              </Link>
            </div>
          )}
          
          {/* List Info */}
          {task.list && (
            <div className="flex items-center space-x-1">
              <AiOutlineUnorderedList className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              <span className="font-medium" style={{ color: theme.colors.text.primary }}>
                {task.list.name}
              </span>
            </div>
          )}
          
          {/* Due Date */}
          {task.dueDate && (
            <div className="flex items-center space-x-1">
              <AiOutlineCalendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              <span 
                className="font-medium"
                style={{
                  color: isOverdue ? theme.colors.error : theme.colors.text.primary
                }}
              >
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            </div>
          )}
          
          {/* Stats */}
          {(task.commentCount > 0 || task.watcherCount > 0) && (
            <div className="flex items-center space-x-3">
              {task.commentCount > 0 && (
                <div className="flex items-center space-x-1">
                  <AiOutlineMessage className="w-3 h-3 md:w-4 md:h-4" />
                  <span>{task.commentCount}</span>
                </div>
              )}
              {task.watcherCount > 0 && (
                <div className="flex items-center space-x-1">
                  <AiOutlineEye className="w-3 h-3 md:w-4 md:h-4" />
                  <span>{task.watcherCount}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Labels */}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {task.labels.slice(0, viewMode === 'grid' ? 2 : 3).map((label, index) => (
              <span
                key={index}
                className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs"
                style={{ 
                  backgroundColor: `${theme.colors.primary}20`,
                  color: theme.colors.text.primary,
                  border: `1px solid ${theme.colors.primary}30`
                }}
              >
                <AiOutlineTags className="w-2 h-2 md:w-3 md:h-3" />
                <span className="truncate max-w-[80px] sm:max-w-[120px] md:max-w-none">{label}</span>
              </span>
            ))}
            {task.labels.length > (viewMode === 'grid' ? 2 : 3) && (
              <span 
                className="px-2 py-1 rounded-full text-xs"
                style={{ 
                  backgroundColor: `${theme.colors.text.secondary}20`,
                  color: theme.colors.text.secondary
                }}
              >
                +{task.labels.length - (viewMode === 'grid' ? 2 : 3)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;
