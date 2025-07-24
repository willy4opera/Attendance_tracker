import React from 'react';
import { Link } from 'react-router-dom';
import { AiOutlinePlus, AiOutlineAppstore, AiOutlineUnorderedList } from 'react-icons/ai';
import theme from '../../../config/theme';

interface TaskListHeaderProps {
  totalTasks: number;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
}

const TaskListHeader: React.FC<TaskListHeaderProps> = ({ totalTasks, viewMode, onViewModeChange }) => {
  return (
    <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
      <div className="space-y-1">
        <h1 
          className="text-xl sm:text-2xl lg:text-3xl font-bold"
          style={{ color: theme.colors.text.primary }}
        >
          All Tasks
        </h1>
        <p 
          className="text-xs sm:text-sm lg:text-base"
          style={{ color: theme.colors.text.secondary }}
        >
          Manage and track all your tasks ({totalTasks} total)
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/tasks/create"
          className="flex items-center justify-center space-x-2 px-4 py-2.5 text-white rounded-lg transition-all duration-200 hover:opacity-90 focus:ring-2 focus:ring-offset-2 text-sm md:text-base w-full sm:w-auto"
          style={{ 
            backgroundColor: theme.colors.primary,
            color: '#FFFFFF'
          }}
        >
          <AiOutlinePlus className="w-4 h-4 md:w-5 md:h-5" />
          <span>New Task</span>
        </Link>
        
        <div 
          className="flex rounded-lg p-1"
          style={{ backgroundColor: `${theme.colors.primary}05` }}
        >
          <button
            onClick={() => onViewModeChange('list')}
            className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors flex-1 sm:flex-none ${
              viewMode === 'list' ? 'shadow-sm' : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor: viewMode === 'list' ? theme.colors.primary : 'transparent',
              color: viewMode === 'list' ? '#FFFFFF' : theme.colors.text.secondary
            }}
          >
            <AiOutlineUnorderedList className="w-4 h-4" />
            <span className="hidden sm:inline">List</span>
          </button>
          <button
            onClick={() => onViewModeChange('grid')}
            className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors flex-1 sm:flex-none ${
              viewMode === 'grid' ? 'shadow-sm' : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor: viewMode === 'grid' ? theme.colors.primary : 'transparent',
              color: viewMode === 'grid' ? '#FFFFFF' : theme.colors.text.secondary
            }}
          >
            <AiOutlineAppstore className="w-4 h-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskListHeader;
