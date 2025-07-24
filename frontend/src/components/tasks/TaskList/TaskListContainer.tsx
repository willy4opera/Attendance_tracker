import React from 'react';
import theme from '../../../config/theme';
import TaskItem from './TaskItem';
import EmptyTaskList from './EmptyTaskList';
import type { Task } from '../../../types';

interface TaskListContainerProps {
  tasks: Task[];
  viewMode: 'list' | 'grid';
  searchTerm: string;
  statusFilter: string;
  priorityFilter: string;
  getPriorityIcon: (priority: string) => React.ReactNode;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}

const TaskListContainer: React.FC<TaskListContainerProps> = ({
  tasks,
  viewMode,
  searchTerm,
  statusFilter,
  priorityFilter,
  getPriorityIcon,
  getPriorityColor,
  getStatusColor,
}) => {
  return (
    <div 
      className="rounded-lg shadow-sm border overflow-hidden"
      style={{ 
        backgroundColor: `${theme.colors.primary}05`,
        borderColor: `${theme.colors.primary}20`,
        boxShadow: `0 1px 3px ${theme.colors.primary}15`
      }}
    >
      {tasks && tasks.length === 0 ? (
        <EmptyTaskList 
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
        />
      ) : (
        <div 
          className={`
            ${viewMode === 'grid' 
              ? 'grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6' 
              : 'space-y-3 md:space-y-4'
            } 
            p-3 md:p-4 lg:p-6
            overflow-x-hidden
            overflow-y-auto
            max-h-[calc(100vh-300px)]
            scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100
          `}
        >
          {tasks?.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              viewMode={viewMode}
              getPriorityIcon={getPriorityIcon}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
            />
          ))}
        </div>
      )}
      
      {/* Mobile-friendly scroll indicator for long lists */}
      {tasks && tasks.length > 5 && (
        <div 
          className="md:hidden sticky bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent py-2 text-center"
          style={{ backgroundColor: `${theme.colors.primary}05` }}
        >
          <span 
            className="text-xs"
            style={{ color: theme.colors.text.secondary }}
          >
            Scroll for more tasks
          </span>
        </div>
      )}
    </div>
  );
};

export default TaskListContainer;
